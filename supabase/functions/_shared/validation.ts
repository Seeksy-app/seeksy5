import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Common validation schemas

export const uuidSchema = z.string().uuid('Invalid user ID format');

export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .trim();

export const nameSchema = z.string()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be less than 100 characters')
  .trim();

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(500, 'URL must be less than 500 characters')
  .optional();

export const dateSchema = z.string()
  .refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  );

// Event registration validation
export const eventRegistrationSchema = z.object({
  userId: uuidSchema,
  eventId: uuidSchema,
  attendeeName: nameSchema,
  attendeeEmail: emailSchema,
  eventTitle: z.string().min(1).max(200).trim(),
  eventDate: dateSchema,
  eventLocation: z.string().min(1).max(500).trim(),
  eventDescription: z.string().max(5000).optional(),
  token: z.string().optional(), // For signed token validation
});

// Meeting confirmation validation
export const meetingConfirmationSchema = z.object({
  userId: uuidSchema,
  meetingId: uuidSchema,
  attendeeName: nameSchema,
  attendeeEmail: emailSchema,
  meetingTitle: z.string().min(1).max(200).trim(),
  startTime: dateSchema,
  endTime: dateSchema,
  locationType: z.enum(['phone', 'zoom', 'teams', 'meet', 'in-person', 'custom', 'seeksy_studio']),
  locationDetails: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  token: z.string().optional(),
});

// Signup confirmation validation
export const signupConfirmationSchema = z.object({
  userId: uuidSchema,
  sheetId: uuidSchema,
  volunteerName: nameSchema,
  volunteerEmail: emailSchema,
  sheetTitle: z.string().min(1).max(200).trim(),
  slotStart: dateSchema,
  slotEnd: dateSchema,
  location: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  token: z.string().optional(),
});

// Calendar availability check validation
export const calendarAvailabilitySchema = z.object({
  userId: uuidSchema,
  date: dateSchema,
  token: z.string().optional(),
});

// Zoom meeting creation validation
export const zoomMeetingSchema = z.object({
  userId: uuidSchema,
  title: z.string().min(1).max(200).trim(),
  startTime: dateSchema,
  duration: z.number().min(15).max(480), // 15 min to 8 hours
  description: z.string().max(2000).optional(),
  token: z.string().optional(),
});

/**
 * Validate and sanitize input data
 * Returns validated data or throws ZodError
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate input and return result object instead of throwing
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    );
    return { success: false, errors };
  }
}
