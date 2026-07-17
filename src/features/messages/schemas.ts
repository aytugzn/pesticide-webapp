import { z } from "zod";

export const messageStatusSchema = z.enum(["pending", "resolved"]);

export const updateMessageStatusSchema = z
  .object({
    id: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
    status: messageStatusSchema,
  })
  .strict();
