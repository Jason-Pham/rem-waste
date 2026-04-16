import { z } from 'zod';
import { test, expect } from '../fixtures/test-fixtures';
import { apiCall } from './_helpers';

const Ok = z.object({ ok: z.literal(true) });

function post(data: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  };
}

test.describe('POST /api/waste-types — contract', () => {
  test('general only — accepts heavyWaste=false, plasterboard=false', async ({ freshPage }) => {
    const res = await apiCall(
      freshPage,
      '/api/waste-types',
      post({ heavyWaste: false, plasterboard: false, plasterboardOption: null }),
    );
    expect(res.status).toBe(200);
    Ok.parse(res.body);
  });

  test('heavy + plasterboard with a handling option', async ({ freshPage }) => {
    const res = await apiCall(
      freshPage,
      '/api/waste-types',
      post({ heavyWaste: true, plasterboard: true, plasterboardOption: '10_to_25' }),
    );
    expect(res.status).toBe(200);
    Ok.parse(res.body);
  });

  test('plasterboard=true with no option is rejected', async ({ freshPage }) => {
    const res = await apiCall(
      freshPage,
      '/api/waste-types',
      post({ heavyWaste: false, plasterboard: true, plasterboardOption: null }),
    );
    expect(res.status).toBe(400);
  });

  test('invalid plasterboardOption value is rejected', async ({ freshPage }) => {
    const res = await apiCall(
      freshPage,
      '/api/waste-types',
      post({ heavyWaste: false, plasterboard: true, plasterboardOption: 'bogus' }),
    );
    expect(res.status).toBe(400);
  });
});
