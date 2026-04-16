import { z } from 'zod';
import { test, expect } from '../fixtures/test-fixtures';
import { apiCall } from './_helpers';

const Address = z.object({
  id: z.string(),
  line1: z.string(),
  city: z.string(),
});
const LookupResponse = z.object({
  postcode: z.string(),
  addresses: z.array(Address),
});

/**
 * Contract tests — run in-browser against MSW.  Asserts shape per §5 and §4
 * fixture behaviour.
 */
test.describe('POST /api/postcode/lookup — contract', () => {
  test('SW1A 1AA returns ≥12 addresses matching the §5 shape', async ({ freshPage }) => {
    const res = await apiCall(freshPage, '/api/postcode/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postcode: 'SW1A 1AA' }),
    });
    expect(res.status).toBe(200);
    const body = LookupResponse.parse(res.body);
    expect(body.postcode).toBe('SW1A 1AA');
    expect(body.addresses.length).toBeGreaterThanOrEqual(12);
  });

  test('EC1A 1BB returns 0 addresses (empty state)', async ({ freshPage }) => {
    const res = await apiCall(freshPage, '/api/postcode/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postcode: 'EC1A 1BB' }),
    });
    expect(res.status).toBe(200);
    const body = LookupResponse.parse(res.body);
    expect(body.addresses).toEqual([]);
  });

  test('BS1 4DJ: 500 on first call, 200 on retry', async ({ freshPage }) => {
    const first = await apiCall(freshPage, '/api/postcode/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postcode: 'BS1 4DJ' }),
    });
    expect(first.status).toBe(500);
    const second = await apiCall(freshPage, '/api/postcode/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postcode: 'BS1 4DJ' }),
    });
    expect(second.status).toBe(200);
    const body = LookupResponse.parse(second.body);
    expect(body.addresses.length).toBeGreaterThan(0);
  });

  test('invalid postcode returns 400', async ({ freshPage }) => {
    const res = await apiCall(freshPage, '/api/postcode/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postcode: 'NOT A CODE' }),
    });
    expect(res.status).toBe(400);
  });
});
