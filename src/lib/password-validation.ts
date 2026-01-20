import { z } from "zod";

/**
 * Password validation schema matching Supabase Auth requirements
 * - Minimum 10 characters
 * - Must contain uppercase letter
 * - Must contain lowercase letter
 * - Must contain number
 * - Must contain special character
 */
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
    "Password must contain at least one special character"
  );

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Validates password strength and returns user-friendly feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("Password must be at least 10 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Must contain uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Must contain lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Must contain number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push("Must contain special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
