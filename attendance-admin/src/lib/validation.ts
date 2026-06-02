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
  organization: z.string().optional(),
  roleName: z.string().trim().min(1, "Role is required.").optional(),
});

export const roleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required."),
  description: z.string().optional(),
  permissions: z
    .array(z.string().regex(/^[a-z-]+:[a-z-]+$/i))
    .min(1, "At least one permission is required."),
});

export const chairpersonSchema = z.object({
  honorificTitleEn: z.string().trim().min(1, "English honorific is required."),
  honorificTitleKm: z.string().trim().min(1, "Khmer honorific is required."),
  firstNameEn: z.string().trim().min(1, "English first name is required."),
  firstNameKm: z.string().trim().min(1, "Khmer first name is required."),
  lastNameEn: z.string().trim().min(1, "English last name is required."),
  lastNameKm: z.string().trim().min(1, "Khmer last name is required."),
  position: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
});

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Choose a valid time.");

const coordinateValueSchema = z
  .union([z.number(), z.string()])
  .nullable()
  .optional();

export const placeSchema = z
  .object({
    name: z.string().trim().min(1, "Place name is required."),
    description: z.string().optional().nullable(),
    requireLocation: z.boolean().optional(),
    locationName: z.string().optional().nullable(),
    latitude: coordinateValueSchema,
    longitude: coordinateValueSchema,
    radiusMeters: z.number().min(0).max(5000).optional(),
  })
  .refine(
    (value) =>
      !value.requireLocation ||
      Boolean(value.locationName?.trim()) ||
      Boolean(value.name.trim()),
    {
      message: "Location name is required when location check-in is enabled.",
      path: ["locationName"],
    },
  );

const registrationModeSchema = z.enum([
  "BULK_REGISTRATION",
  "OPEN_REGISTRATION",
  "PRE_REGISTRATION",
]);

export const eventSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required."),
    description: z.string().optional(),
    mode: registrationModeSchema,
    separateQrByPlace: z.boolean().optional(),
    requireLocation: z.boolean().optional(),
    locationName: z.string().optional(),
    latitude: z.number().min(-85).max(85).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radiusMeters: z.number().min(0).max(5000).optional(),
    places: z
      .array(
        z.object({
          id: z.string().optional(),
          catalogPlaceId: z.string().nullable().optional(),
          name: z.string().trim().min(1, "Place name is required."),
          description: z.string().nullable().optional(),
          requireLocation: z.boolean().optional(),
          locationName: z.string().nullable().optional(),
          latitude: coordinateValueSchema,
          longitude: coordinateValueSchema,
          radiusMeters: z.number().min(0).max(5000).optional(),
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

const meetingHostSchema = z.object({
  id: z.string().optional(),
  catalogChairpersonId: z.string().nullable().optional(),
  honorificTitleEn: z.string().trim().min(1, "English honorific is required."),
  honorificTitleKm: z.string().trim().min(1, "Khmer honorific is required."),
  firstNameEn: z.string().trim().min(1, "English first name is required."),
  firstNameKm: z.string().trim().min(1, "Khmer first name is required."),
  lastNameEn: z.string().trim().min(1, "English last name is required."),
  lastNameKm: z.string().trim().min(1, "Khmer last name is required."),
  position: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
});

const meetingParticipantSchema = z.object({
  id: z.string().optional(),
  fullNameEn: z.string().trim().min(1, "English full name is required."),
  fullNameKm: z.string().nullable().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
  position: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal(""))
    .nullable()
    .optional(),
  status: z.enum(["INVITED", "JOINED", "CANCELLED"]).optional(),
});

export const meetingSchema = z
  .object({
    name: z.string().trim().min(1, "Meeting name is required."),
    description: z.string().optional(),
    mode: registrationModeSchema,
    separateQrByPlace: z.boolean().optional(),
    requireLocation: z.boolean().optional(),
    locationName: z.string().optional(),
    latitude: z.number().min(-85).max(85).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radiusMeters: z.number().min(0).max(5000).optional(),
    startsAt: dateOnlySchema,
    endsAt: dateOnlySchema,
    chairpersons: z
      .array(meetingHostSchema)
      .min(1, "At least one meeting chairperson is required."),
    places: z
      .array(
        z.object({
          id: z.string().optional(),
          catalogPlaceId: z.string().nullable().optional(),
          name: z.string().trim().min(1, "Place name is required."),
          description: z.string().nullable().optional(),
          requireLocation: z.boolean().optional(),
          locationName: z.string().nullable().optional(),
          latitude: coordinateValueSchema,
          longitude: coordinateValueSchema,
          radiusMeters: z.number().min(0).max(5000).optional(),
        }),
      )
      .optional(),
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
    participants: z.array(meetingParticipantSchema).optional(),
  })
  .refine((value) => value.endsAt >= value.startsAt, {
    message: "End date must be on or after the start date.",
    path: ["endsAt"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type UserValues = z.infer<typeof userSchema>;
export type RoleValues = z.infer<typeof roleSchema>;
export type PlaceValues = z.infer<typeof placeSchema>;
export type ChairpersonValues = z.infer<typeof chairpersonSchema>;
export type EventValues = z.infer<typeof eventSchema>;
export type MeetingValues = z.infer<typeof meetingSchema>;
