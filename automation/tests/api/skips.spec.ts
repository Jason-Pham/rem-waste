import { z } from 'zod';
import { test, expect } from '../fixtures/test-fixtures';
import { apiCall } from './_helpers';

const Skip = z.object({
  size: z.string(),
  price: z.number().nonnegative(),
  disabled: z.boolean(),
  reason: z.string().optional(),
});
const SkipsResponse = z.object({ skips: z.array(Skip) });

test.describe('GET /api/skips — contract', () => {
  test('general waste: all 8 skips returned, none disabled', async ({ freshPage }) => {
    const res = await apiCall(freshPage, '/api/skips?postcode=SW1A1AA&heavyWaste=false');
    expect(res.status).toBe(200);
    const body = SkipsResponse.parse(res.body);
    expect(body.skips.length).toBeGreaterThanOrEqual(8);
    expect(body.skips.every((s) => !s.disabled)).toBe(true);
  });

  test('heavy waste: ≥2 skips disabled with a reason', async ({ freshPage }) => {
    const res = await apiCall(freshPage, '/api/skips?postcode=SW1A1AA&heavyWaste=true');
    expect(res.status).toBe(200);
    const body = SkipsResponse.parse(res.body);
    const disabled = body.skips.filter((s) => s.disabled);
    expect(disabled.length).toBeGreaterThanOrEqual(2);
    expect(disabled.every((s) => typeof s.reason === 'string' && s.reason.length > 0)).toBe(true);
  });

  test('missing postcode returns 400', async ({ freshPage }) => {
    const res = await apiCall(freshPage, '/api/skips?heavyWaste=false');
    expect(res.status).toBe(400);
  });
});
