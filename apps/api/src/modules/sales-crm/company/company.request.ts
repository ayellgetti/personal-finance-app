import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max);

const logoSchema = z
  .string()
  .trim()
  .max(1_400_000)
  .regex(
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\r\n]+$/i,
    "Logo must be a PNG, JPEG, WebP, or GIF image",
  );

export const updateCompanyBodySchema = z.object({
  name: optionalText(160),
  details: optionalText(2000),
  contactName: optionalText(120),
  contactMobile: optionalText(20),
  logo: logoSchema.nullable().optional(),
});

export type UpdateCompanyBody = z.infer<typeof updateCompanyBodySchema>;
