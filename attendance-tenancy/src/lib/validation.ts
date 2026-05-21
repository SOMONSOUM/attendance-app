import { z } from "zod";

export const tenantRegistrationSchema = z.object({
  name: z.string().trim().min(1, "Tenant name is required."),
  ownerName: z.string().trim().min(1, "Owner name is required."),
  ownerEmail: z.string().trim().email("Enter a valid email."),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export type TenantRegistrationValues = z.infer<
  typeof tenantRegistrationSchema
>;
export type LoginValues = z.infer<typeof loginSchema>;
