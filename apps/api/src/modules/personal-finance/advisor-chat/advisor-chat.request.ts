import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const advisorChatBodySchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  /** Recent conversation turns sent by the client for context continuity (max 20). */
  history: z.array(chatMessageSchema).max(20).optional().default([]),
});

export type AdvisorChatBody = z.infer<typeof advisorChatBodySchema>;
export type AdvisorChatHistoryEntry = z.infer<typeof chatMessageSchema>;
