import { z } from "zod";
import type { updateMessageStatusSchema } from "./schemas";
import { MUTATION_POLICY_ERROR } from "@/constants/mutationPolicy";

export const MESSAGE_ERRORS = {
  [MUTATION_POLICY_ERROR]: MUTATION_POLICY_ERROR,
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UPDATE_FAILED: "UPDATE_FAILED",
  DELETE_FAILED: "DELETE_FAILED",
} as const;

export type MessageErrorCode = keyof typeof MESSAGE_ERRORS;

export type UpdateMessageStatusInput = z.infer<
  typeof updateMessageStatusSchema
>;

export type AdminMessageRow = {
  id: string;
  name: string;
  phone: string;
  service: string;
  region: string;
  status: string;
  createdAt: number | null;
};

export type DeleteOverdueMessagesResult = {
  deletedCount: number;
  overduePendingCount: number;
  partialFailure?: true;
};
