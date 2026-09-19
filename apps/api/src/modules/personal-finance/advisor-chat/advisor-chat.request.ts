import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const advisorChatBodySchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  conversationId: z.string().uuid().optional(),
  /** Used only when starting a new chat; saved chats load history from the database. */
  history: z.array(chatMessageSchema).max(20).optional().default([]),
});

export const listAdvisorChatsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const advisorChatIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const removeAdvisorChatBodySchema = z.object({
  id: z.string().uuid(),
});

export type AdvisorChatBody = z.infer<typeof advisorChatBodySchema>;
export type AdvisorChatHistoryEntry = z.infer<typeof chatMessageSchema>;
export type ListAdvisorChatsQuery = z.infer<typeof listAdvisorChatsQuerySchema>;
export type RemoveAdvisorChatBody = z.infer<typeof removeAdvisorChatBodySchema>;
