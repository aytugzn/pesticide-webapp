"use server";

import "server-only";

import { refresh } from "next/cache";
import { requireAdminMutation } from "@/features/auth/requireAdminMutation";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ActionResponse } from "@/types";
import { updateMessageStatusSchema } from "./schemas";
import {
  type DeleteOverdueMessagesResult,
  MESSAGE_ERRORS,
  type MessageErrorCode,
  type UpdateMessageStatusInput,
} from "./types";
import {
  getOverdueMessageCutoffDay,
  isMessageOlderThanCutoff,
  parseCreatedAtMillis,
} from "./utils";

const DELETE_BATCH_SIZE = 400;

/**
 * Splits deletion candidates into transaction-safe groups.
 *
 * @param items - Firestore document references eligible for rechecking
 * @returns Groups capped below the Firestore 500-write limit
 */
const createDeleteChunks = <T,>(items: T[]): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += DELETE_BATCH_SIZE) {
    chunks.push(items.slice(index, index + DELETE_BATCH_SIZE));
  }
  return chunks;
};

/**
 * Updates one contact request between the existing pending and resolved states.
 *
 * @param input - Firestore document ID and the allowed target status
 * @returns A controlled authorization, validation, or persistence response
 */
export const updateMessageStatus = async (
  input: UpdateMessageStatusInput,
): Promise<ActionResponse<void, MessageErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "message-update-status",
    MESSAGE_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsed = updateMessageStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: MESSAGE_ERRORS.VALIDATION_FAILED };
  }

  try {
    await getAdminDb()
      .collection("messages")
      .doc(parsed.data.id)
      .update({ status: parsed.data.status });

    refresh();
    return { success: true };
  } catch {
    console.error("Failed to update message status", {
      reason: "database_update_failed",
    });
    return { success: false, error: MESSAGE_ERRORS.UPDATE_FAILED };
  }
};

/**
 * Deletes resolved requests older than seven Europe/Istanbul calendar days.
 * The server owns the current date and rechecks every candidate in a
 * transaction so pending, unknown-status, and invalid-date records survive.
 *
 * @returns Deleted count and the independently counted overdue pending rows
 */
export const deleteOverdueResolvedMessages = async (): Promise<
  ActionResponse<DeleteOverdueMessagesResult, MessageErrorCode>
> => {
  const guardFailure = await requireAdminMutation(
    "message-delete-overdue",
    MESSAGE_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const nowMs = Date.now();
  const cutoffDay = getOverdueMessageCutoffDay(nowMs);
  if (cutoffDay === null) {
    return { success: false, error: MESSAGE_ERRORS.DELETE_FAILED };
  }

  try {
    const db = getAdminDb();
    const messages = db.collection("messages");
    const [resolvedSnapshot, pendingSnapshot] = await Promise.all([
      messages.where("status", "==", "resolved").get(),
      messages.where("status", "==", "pending").get(),
    ]);

    const overduePendingCount = pendingSnapshot.docs.filter((doc) => {
      const data = doc.data();
      return (
        data.status === "pending" &&
        isMessageOlderThanCutoff(
          parseCreatedAtMillis(data.createdAt),
          cutoffDay,
        )
      );
    }).length;
    const candidateRefs = resolvedSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return (
          data.status === "resolved" &&
          isMessageOlderThanCutoff(
            parseCreatedAtMillis(data.createdAt),
            cutoffDay,
          )
        );
      })
      .map((doc) => doc.ref);
    let deletedCount = 0;

    for (const chunk of createDeleteChunks(candidateRefs)) {
      try {
        const chunkDeletedCount = await db.runTransaction(
          async (transaction) => {
            const currentDocuments = await transaction.getAll(...chunk);
            const deletableDocuments = currentDocuments.filter((doc) => {
              if (!doc.exists) return false;
              const data = doc.data();
              return (
                data?.status === "resolved" &&
                isMessageOlderThanCutoff(
                  parseCreatedAtMillis(data.createdAt),
                  cutoffDay,
                )
              );
            });

            deletableDocuments.forEach((doc) => transaction.delete(doc.ref));
            return deletableDocuments.length;
          },
        );

        deletedCount += chunkDeletedCount;
      } catch {
        console.error("Failed to complete an overdue message delete batch", {
          reason: "database_transaction_failed",
          completedDeleteCount: deletedCount,
        });

        if (deletedCount > 0) {
          refresh();
          return {
            success: true,
            data: {
              deletedCount,
              overduePendingCount,
              partialFailure: true,
            },
          };
        }

        return { success: false, error: MESSAGE_ERRORS.DELETE_FAILED };
      }
    }

    if (deletedCount > 0) refresh();
    return {
      success: true,
      data: {
        deletedCount,
        overduePendingCount,
      },
    };
  } catch {
    console.error("Failed to delete overdue resolved messages", {
      reason: "database_operation_failed",
    });
    return { success: false, error: MESSAGE_ERRORS.DELETE_FAILED };
  }
};
