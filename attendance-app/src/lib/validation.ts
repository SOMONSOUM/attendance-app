import { z } from "zod";

export const openRegistrationSchema = z.object({
  fullNameEn: z.string().trim().min(1, "Full name is required."),
  fullNameKm: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  position: z.string().optional(),
  department: z.string().optional(),
});

export type OpenRegistrationValues = z.infer<typeof openRegistrationSchema>;
