import { z } from "zod";

export const openRegistrationSchema = z
  .object({
    fullNameEn: z.string().trim().min(1, "English full name is required."),
    fullNameKm: z.string().trim().min(1, "Khmer full name is required."),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    title: z.string().trim().optional(),
    position: z.string().trim().min(1, "Position is required."),
    organization: z.string().trim().min(1, "Organization is required."),
    phoneNumber: z.string().trim().min(1, "Phone number is required."),
    email: z
      .string()
      .trim()
      .email("Email address is invalid.")
      .optional()
      .or(z.literal("")),
    deliveryMethod: z.enum(["download", "email", "telegram"]).optional(),
  })
  .superRefine((values, context) => {
    if (values.deliveryMethod === "email" && !values.email?.trim()) {
      context.addIssue({
        code: "custom",
        message: "Email address is required.",
        path: ["email"],
      });
    }
  });

export type OpenRegistrationValues = z.infer<typeof openRegistrationSchema>;
