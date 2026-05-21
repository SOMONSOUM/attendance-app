import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const userSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().optional(),
  fullNameEn: z.string().trim().min(1, "Full name is required."),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  roleName: z.string().trim().min(1, "Role is required.").optional(),
});

export const roleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required."),
  description: z.string().optional(),
  permissions: z
    .string()
    .trim()
    .min(1, "At least one permission is required.")
    .refine(
      (value) =>
        value
          .split(",")
          .map((permission) => permission.trim())
          .filter(Boolean)
          .every((permission) => /^[a-z-]+:[a-z-]+$/i.test(permission)),
      "Use comma-separated resource:action permissions.",
    ),
});

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Choose a valid time.");

export const eventSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required."),
    description: z.string().optional(),
    mode: z.enum(["PRE_REGISTERED", "OPEN_REGISTRATION"]),
    separateQrByPlace: z.boolean().optional(),
    places: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().trim().min(1, "Place name is required."),
          description: z.string().nullable().optional(),
          locationName: z.string().nullable().optional(),
        }),
      )
      .optional(),
    startsAt: dateOnlySchema,
    endsAt: dateOnlySchema,
    shifts: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().trim().min(1, "Shift name is required."),
          startTime: timeSchema,
          endTime: timeSchema,
        }),
      )
      .optional(),
    theme: z.object({
      primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Use a hex color."),
      backgroundColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Use a hex color."),
      backgroundImageUrl: z.string().optional().nullable(),
      fontFamily: z.string().trim().min(1, "Font family is required."),
      fontSize: z.number().min(12).max(22),
      radius: z.number().min(0).max(24),
      appearance: z.enum(["light", "dark", "system"]),
    }),
  })
  .refine((value) => value.endsAt >= value.startsAt, {
    message: "End date must be on or after the start date.",
    path: ["endsAt"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type UserValues = z.infer<typeof userSchema>;
export type RoleValues = z.infer<typeof roleSchema>;
export type EventValues = z.infer<typeof eventSchema>;
