import { z } from "zod";

export const addDeviceBodySchema = z.object({
  device: z.string().trim().min(1).max(120),
  deviceType: z.string().trim().min(1).max(40),
  os: z.string().trim().min(1).max(40).optional(),
  version: z.string().trim().min(1).max(40).optional(),
  token: z.string().trim().min(1).max(512).optional(),
  data: z.record(z.string(), z.json()).default({}),
});

export const removeDeviceBodySchema = z.object({
  id: z.string().uuid(),
});

export type AddDeviceBody = z.infer<typeof addDeviceBodySchema>;
export type RemoveDeviceBody = z.infer<typeof removeDeviceBodySchema>;
