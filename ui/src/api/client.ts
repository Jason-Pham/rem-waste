import {
  PostcodeLookupResponse,
  WasteTypesResponse,
  SkipsResponse,
  BookingConfirmResponse,
  type PostcodeLookupResponse as TPostcodeLookupResponse,
  type WasteTypesRequest,
  type SkipsResponse as TSkipsResponse,
  type BookingConfirmRequest,
  type BookingConfirmResponse as TBookingConfirmResponse,
} from './schemas';

export class ApiError extends Error {
  constructor(public status: number, public body?: unknown) {
    super(`API error: ${status}`);
    this.name = 'ApiError';
  }
}

async function parseJson<T>(res: Response, schema: { parse: (x: unknown) => T }): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(res.status, text);
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return schema.parse(data);
}

export const api = {
  async lookupPostcode(postcode: string, signal?: AbortSignal): Promise<TPostcodeLookupResponse> {
    const res = await fetch('/api/postcode/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postcode }),
      signal,
    });
    return parseJson(res, PostcodeLookupResponse);
  },

  async submitWasteTypes(payload: WasteTypesRequest, signal?: AbortSignal): Promise<void> {
    const res = await fetch('/api/waste-types', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    await parseJson(res, WasteTypesResponse);
  },

  async listSkips(postcode: string, heavyWaste: boolean, signal?: AbortSignal): Promise<TSkipsResponse> {
    // §5 example shows postcode without the internal space ("SW1A1AA"); we
    // send the compact form in the query string for a clean URL.
    const compact = postcode.replace(/\s+/g, '');
    const url = `/api/skips?postcode=${encodeURIComponent(compact)}&heavyWaste=${heavyWaste}`;
    const res = await fetch(url, { signal });
    return parseJson(res, SkipsResponse);
  },

  async confirmBooking(
    payload: BookingConfirmRequest,
    opts: { idempotencyKey: string; signal?: AbortSignal },
  ): Promise<TBookingConfirmResponse> {
    const res = await fetch('/api/booking/confirm', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': opts.idempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: opts.signal,
    });
    return parseJson(res, BookingConfirmResponse);
  },
};
