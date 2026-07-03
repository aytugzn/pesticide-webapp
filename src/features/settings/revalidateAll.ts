"use server";

import "server-only";

import { updateTag } from "next/cache";
import type { ActionResponse } from "@/types";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { AUTH_ERRORS } from "@/features/auth/types";

export const revalidateAll = async (): Promise<ActionResponse<void, string>> => {
    if (!(await requireAdmin())) {
        return { success: false, error: AUTH_ERRORS.UNAUTHORIZED };
    }

    updateTag("global-data");
    updateTag("home-data");
    updateTag("layout-settings");
    updateTag("all-combinations");

    return { success: true };
};