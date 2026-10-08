import type { AxiosAdapter } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiBaseUrlFromEnv, Rest, RETRY_DELAYS_MS } from './rest';

/** adapter ปลอม — จับ request แล้วตอบตามที่กำหนด (ไม่ยิงเน็ตจริง) */
function fakeAdapter(status: number, data: unknown, seen: { url?: string; auth?: string; method?: string }[] = []): AxiosAdapter {
  return async (config) => {
    seen.push({ url: `${config.baseURL}${config.url}`, auth: config.headers.get('Authorization') as string | undefined, method: config.method });
    const res = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      const { AxiosError } = await import('axios');
      throw new AxiosError('fail', 'ERR', config, null, res);
    }
    return res;
  };
}

function configure(adapter: AxiosAdapter, extra: Partial<Parameters<typeof Rest.configure>[0]> = {}) {
  Rest.configure({ baseURL: 'http://api.test/api/', getAccessToken: async () => 'tok-1', errorMessages: { ZONE_FULL: 'โซนนี้เต็มแล้ว' }, ...extra });
  // ใส่ adapter ปลอมให้ instance ที่เพิ่งสร้าง
  (Rest as unknown as { instance: { defaults: { adapter: AxiosAdapter } } }).instance.defaults.adapter = adapter;
}

afterEach(() => vi.restoreAllMocks());

describe('Rest (HTTP client กลาง)', () => {
  it('attaches the bearer token and returns typed body', async () => {
    const seen: { url?: string; auth?: string; method?: string }[] = [];
    configure(fakeAdapter(200, [{ id: 1 }], seen));
    const rows = await Rest.get<{ id: number }[]>('/public/catalog');
    expect(rows[0]?.id).toBe(1);
    expect(seen[0]).toMatchObject({ url: 'http://api.test/api/public/catalog', auth: 'Bearer tok-1', method: 'get' });
    expect(Rest.baseURL).toBe('http://api.test/api');
  });

  it('keeps an explicit Authorization header', async () => {
    const seen: { auth?: string }[] = [];
    configure(fakeAdapter(200, {}, seen));
    await Rest.get('/me/profile', { headers: { Authorization: 'Bearer other' } });
    expect(seen[0]?.auth).toBe('Bearer other');
  });

  it('maps API errors to ApiError with Thai message', async () => {
    configure(fakeAdapter(409, { message: 'ZONE_FULL' }));
    const err = await Rest.post('/bookings', {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: 'ZONE_FULL' });
    expect((err as Error).message).toContain('โซนนี้เต็มแล้ว');
  });

  describe('ApiResponse envelope ({ status, status_code, data, code, err_msg })', () => {
    const ok = (data: unknown, status_code = 200) => ({ status: 'ok', status_code, data, code: null, err_msg: null });
    const no = (status_code: number, code: string, err_msg: string) => ({ status: 'no', status_code, data: null, code, err_msg });

    it('unwraps data so callers get the payload directly', async () => {
      configure(fakeAdapter(201, ok({ id: 'b1' }, 201)));
      await expect(Rest.post<{ id: string }>('/bookings', {})).resolves.toEqual({ id: 'b1' });
    });

    it('error envelope → ApiError with code + err_msg from the API', async () => {
      configure(fakeAdapter(409, no(409, 'BOOKING_FULL', 'โต๊ะเต็มแล้ว')));
      await expect(Rest.post('/bookings', {})).rejects.toMatchObject({ status: 409, code: 'BOOKING_FULL', message: 'โต๊ะเต็มแล้ว' });
    });

    it('status "no" with HTTP 2xx still throws (and skips afterWrite)', async () => {
      const afterWrite = vi.fn();
      configure(fakeAdapter(200, no(400, 'ZONE_FULL', '')), { afterWrite });
      await expect(Rest.post('/bookings', {})).rejects.toMatchObject({ status: 400, code: 'ZONE_FULL', message: 'โซนนี้เต็มแล้ว' });
      expect(afterWrite).not.toHaveBeenCalled();
    });

    it('unauthorizedCode wins over err_msg on 401', async () => {
      configure(fakeAdapter(401, no(401, 'Invalid token', 'token หมดอายุ')), { unauthorizedCode: 'MFA_REQUIRED', errorMessages: { MFA_REQUIRED: 'ยืนยัน MFA' } });
      await expect(Rest.get('/admin/x')).rejects.toMatchObject({ code: 'MFA_REQUIRED', message: 'ยืนยัน MFA' });
    });
  });

  it('uses unauthorizedCode for 401 when configured', async () => {
    configure(fakeAdapter(401, { message: 'Invalid token' }), { unauthorizedCode: 'MFA_REQUIRED' });
    await expect(Rest.patch('/admin/x', {})).rejects.toMatchObject({ status: 401, code: 'MFA_REQUIRED' });
  });

  describe('retry on ERR_NETWORK', () => {
    /** ต่อไม่ติด failures ครั้งแรก แล้วค่อยตอบ 200 */
    function flaky(failures: number, seen: string[]): AxiosAdapter {
      return async (config) => {
        seen.push(config.method ?? '');
        if (seen.length <= failures) {
          const { AxiosError } = await import('axios');
          throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
        }
        return { data: { ok: true }, status: 200, statusText: '', headers: {}, config };
      };
    }

    afterEach(() => vi.useRealTimers());

    it('retries idempotent methods until the backend is back (e.g. dev restart)', async () => {
      vi.useFakeTimers();
      for (const call of [() => Rest.put('/admin/team-members/order', { ids: [] }), () => Rest.delete('/x/1'), () => Rest.get('/x')]) {
        const seen: string[] = [];
        configure(flaky(RETRY_DELAYS_MS.length, seen));
        const p = call();
        await vi.runAllTimersAsync();
        await expect(p).resolves.toEqual({ ok: true });
        expect(seen).toHaveLength(RETRY_DELAYS_MS.length + 1);
      }
    });

    it('gives up after the last delay with a Thai connection error', async () => {
      vi.useFakeTimers();
      const seen: string[] = [];
      configure(flaky(99, seen));
      const p = Rest.put('/x', {}).catch((e: unknown) => e);
      await vi.runAllTimersAsync();
      expect(await p).toMatchObject({ status: 0 });
      expect(seen).toHaveLength(RETRY_DELAYS_MS.length + 1);
    });

    it('does not retry POST / PATCH unless marked retryable', async () => {
      vi.useFakeTimers();
      for (const call of [() => Rest.post('/bookings', {}), () => Rest.patch('/x', {})]) {
        const seen: string[] = [];
        configure(flaky(1, seen));
        await expect(call()).rejects.toMatchObject({ status: 0 });
        expect(seen).toHaveLength(1);
      }

      const seen2: string[] = [];
      configure(flaky(1, seen2));
      const p = Rest.post('/storage/upload-url', {}, { retryable: true });
      await vi.runAllTimersAsync();
      await expect(p).resolves.toEqual({ ok: true });
      expect(seen2).toEqual(['post', 'post']);
    });
  });

  it('resolves base URL from Vite env', () => {
    expect(apiBaseUrlFromEnv({ VITE_API_BASE_URL: 'https://x/api/' })).toBe('https://x/api');
    expect(apiBaseUrlFromEnv({ VITE_API_URL: 'https://old/api' })).toBe('https://old/api');
    expect(apiBaseUrlFromEnv({ DEV: true })).toBe('http://localhost:3000/api');
    expect(apiBaseUrlFromEnv({ DEV: false })).toBe('/api');
  });
});

describe('afterWrite', () => {
  it('runs after a successful write (and waits for it) but not after reads or failures', async () => {
    const calls: string[] = [];
    const afterWrite = async ({ method, url }: { method: string; url: string }) => {
      await new Promise((r) => setTimeout(r, 5));
      calls.push(`${method} ${url}`);
    };
    configure(fakeAdapter(200, { id: 1 }), { afterWrite });
    await Rest.get('/me/profile');
    await Rest.post('/bookings', {});
    expect(calls).toEqual(['POST /bookings']); // POST คืนผลหลัง afterWrite เสร็จแล้ว
    await Rest.patch('/me/profile', {});
    await Rest.delete('/merchant/bars/x/staff/y');
    expect(calls).toEqual(['POST /bookings', 'PATCH /me/profile', 'DELETE /merchant/bars/x/staff/y']);

    configure(fakeAdapter(409, { message: 'ZONE_FULL' }), { afterWrite });
    await expect(Rest.post('/bookings', {})).rejects.toMatchObject({ code: 'ZONE_FULL' });
    expect(calls).toHaveLength(3);
  });

  it('a failing afterWrite does not fail the write', async () => {
    configure(fakeAdapter(200, { id: 1 }), {
      afterWrite: () => {
        throw new Error('overview down');
      },
    });
    await expect(Rest.post<{ id: number }>('/bookings', {})).resolves.toEqual({ id: 1 });
  });
});
