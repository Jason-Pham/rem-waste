import { z } from 'zod';

// UK postcode: accepts case-insensitive input with optional internal space.
// Canonical form (after normalization) has one space before the final 3 chars.
export const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

/** Normalize user-entered postcode: trim, uppercase, collapse spaces to single internal space. */
export function normalizePostcode(input: string): string {
  const compact = input.trim().toUpperCase().replace(/\s+/g, '');
  if (compact.length < 5) return compact;
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}

// ---- POST /api/postcode/lookup ----

export const PostcodeLookupRequest = z.object({
  postcode: z.string().regex(postcodeRegex, 'Enter a valid UK postcode'),
});

export const Address = z.object({
  id: z.string(),
  line1: z.string(),
  city: z.string(),
});
export type Address = z.infer<typeof Address>;

export const PostcodeLookupResponse = z.object({
  postcode: z.string(),
  addresses: z.array(Address),
});
export type PostcodeLookupResponse = z.infer<typeof PostcodeLookupResponse>;

// ---- POST /api/waste-types ----

export const WasteTypesRequest = z.object({
  heavyWaste: z.boolean(),
  plasterboard: z.boolean(),
  plasterboardOption: z.enum(['under_10', '10_to_25', 'over_25']).nullable(),
});
export type WasteTypesRequest = z.infer<typeof WasteTypesRequest>;

export const WasteTypesResponse = z.object({ ok: z.literal(true) });

// ---- GET /api/skips ----

export const Skip = z.object({
  size: z.string(),          // e.g. "4-yard"
  price: z.number().nonnegative(),
  disabled: z.boolean(),
  reason: z.string().optional(),
});
export type Skip = z.infer<typeof Skip>;

export const SkipsResponse = z.object({ skips: z.array(Skip) });
export type SkipsResponse = z.infer<typeof SkipsResponse>;

// ---- POST /api/booking/confirm ----

export const BookingConfirmRequest = z.object({
  postcode: z.string(),
  addressId: z.string(),
  heavyWaste: z.boolean(),
  plasterboard: z.boolean(),
  skipSize: z.string(),
  price: z.number().nonnegative(),
});
export type BookingConfirmRequest = z.infer<typeof BookingConfirmRequest>;

export const BookingConfirmResponse = z.object({
  status: z.literal('success'),
  bookingId: z.string(),
});
export type BookingConfirmResponse = z.infer<typeof BookingConfirmResponse>;
