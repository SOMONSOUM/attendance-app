import { z } from "zod";

export const openRegistrationSchema = z.object({
  fullNameEn: z.string().trim().min(1, "English full name is required."),
  fullNameKm: z.string().trim().min(1, "Khmer full name is required."),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  position: z.string().trim().min(1, "Position is required."),
  organization: z.string().trim().min(1, "Organization is required."),
  phoneNumber: z.string().trim().min(1, "Phone number is required."),
});

export type OpenRegistrationValues = z.infer<typeof openRegistrationSchema>;
