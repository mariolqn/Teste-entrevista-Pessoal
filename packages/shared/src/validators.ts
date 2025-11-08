/**
 * Shared validation functions and schemas
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */

// Date range schema
export const dateRangeSchema = z.object({
  start: z.string().datetime({ message: 'Start date must be a valid ISO datetime' }),
  end: z.string().datetime({ message: 'End date must be a valid ISO datetime' }),
}).refine((data) => new Date(data.start) <= new Date(data.end), {
  message: 'Start date must be before or equal to end date',
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  search: z.string().min(1).max(100).optional(),
});

// ID schema
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

// Brazilian document validation
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  
  return checkDigit === parseInt(cleaned.charAt(10));
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validate check digits
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit !== parseInt(cleaned.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return checkDigit === parseInt(cleaned.charAt(13));
}

// Document schema with custom validation
export const documentSchema = z.string().refine(
  (val) => validateCPF(val) || validateCNPJ(val),
  { message: 'Invalid CPF or CNPJ' },
);

// Email schema
export const emailSchema = z.string().email({ message: 'Invalid email format' });

// Phone schema (Brazilian format)
export const phoneSchema = z.string().regex(
  /^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-.\s]?\d{4})$/,
  { message: 'Invalid phone number format' },
);

// Money/decimal schema
export const moneySchema = z.union([
  z.number(),
  z.string().regex(/^\d+\.?\d{0,2}$/, { message: 'Invalid currency format' }),
]).transform((val) => Number(val));

// Positive integer schema
export const positiveIntSchema = z.coerce.number().int().positive();

// URL schema
export const urlSchema = z.string().url({ message: 'Invalid URL format' });

// Color hex schema
export const hexColorSchema = z.string().regex(
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  { message: 'Invalid hex color format' },
);

/**
 * Validation helper functions
 */

export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function isValidDocument(doc: string): boolean {
  return documentSchema.safeParse(doc).success;
}

export function isValidUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

/**
 * Create a safe parser that returns null on error
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Create a parser that returns errors in a formatted way
 */
export function parseWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { data?: T; errors?: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { errors };
}
