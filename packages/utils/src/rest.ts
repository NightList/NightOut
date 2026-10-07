import axios, { AxiosError, AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';

/**
 * Rest — HTTP client กลางของทุกแอปหน้าบ้าน (apps/frontend, apps/admin) ตาม ADR 0002/0003
 *   Component → TanStack Query hook → Rest (class นี้) → Axios → Backend API (NestJS)
 *
 * ตั้งค่าครั้งเดียวที่ main.tsx ของแต่ละแอป แล้วเรียกใช้ได้ทุกที่:
 *   Rest.configure({ baseURL, getAccessToken: async () => session?.access_token ?? null, logger: log })
 *   const bars = await Rest.get<Bar[]>('/public/catalog')
 *
 * - แนบ `Authorization: Bearer <token>` ให้อัตโนมัติ (ถ้า getAccessToken คืนค่า และ request ไม่ได้ใส่เอง)
 * - error ทุกแบบ → ApiError(status, code) พร้อมข้อความภาษาไทย (errorMessages ที่ส่งตอน configure — ERROR_MESSAGES จาก @nightout/contracts)
 * - log ทุก request ผ่าน logger ของแอป (ป้าย NightOut ใน Console)
 * แยก entry `@nightout/utils/rest` จาก index — backend ที่ใช้ @nightout/utils จะไม่ต้องโหลด axios
 */

/**
 * ข้อความภาษาไทยของรหัส error — ตั้งผ่าน Rest.configure({ errorMessages }) (ชุดเต็มอยู่ที่ @nightout/contracts ERROR_MESSAGES
 * ซึ่ง utils import ไม่ได้เพราะ contracts พึ่ง utils) · ค่าเริ่มต้นมีแค่รหัสระดับ transport
 */
let errorMessages: Readonly<Record<string, string>> = {};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(errorMessages[code] ?? Object.entries(errorMessages).find(([k]) => code.includes(k))?.[1] ?? code);
    this.name = 'ApiError';
  }
}

export interface RestLogger {
  info: (msg: string, ...data: unknown[]) => void;
  warn: (msg: string, ...data: unknown[]) => void;
  error: (msg: string, ...data: unknown[]) => void;
}

export interface RestConfig {
  /** เช่น http://localhost:3000/api หรือ /api (same-origin) — ตัด / ท้ายให้เอง */
  baseURL: string;
  /** access token ปัจจุบัน (Supabase Auth) — null = ไม่แนบ */
  getAccessToken?: () => Promise<string | null>;
  logger?: RestLogger;
  /** รหัสที่ใช้แทนเมื่อ API ตอบ 401 (เช่น Backoffice ใช้ 'MFA_REQUIRED') — ไม่ตั้ง = ใช้ข้อความจาก API */
  unauthorizedCode?: string;
  /** ms (ค่าเริ่มต้น 30 วินาที) */
  timeout?: number;
  /** รหัส error → ข้อความไทย (ส่ง ERROR_MESSAGES จาก @nightout/contracts) */
  errorMessages?: Readonly<Record<string, string>>;
}

/**
 * baseURL จาก env ของ Vite: VITE_API_BASE_URL → VITE_API_URL (ชื่อเดิม) → dev `http://localhost:3000/api` / deploy `/api` (same-origin)
 *   Rest.configure({ baseURL: apiBaseUrlFromEnv(import.meta.env), … })
 */
export function apiBaseUrlFromEnv(env: { VITE_API_BASE_URL?: string; VITE_API_URL?: string; DEV?: boolean }): string {
  return (env.VITE_API_BASE_URL || env.VITE_API_URL || (env.DEV ? 'http://localhost:3000/api' : '/api')).replace(/\/$/, '');
}

/** config ต่อ request ของ Rest — `retryable` = ส่งซ้ำได้โดยไม่เกิดผลซ้ำ (GET/HEAD ถือว่าได้อยู่แล้ว) */
export type RestRequestConfig = AxiosRequestConfig & { retryable?: boolean };

type Timed = RestRequestConfig & { metadata?: { t0: number }; retried?: boolean };

/**
 * ต่อไม่ติดแบบที่ลองใหม่แล้วมักผ่าน — เช่นกลับมาที่แท็บหลังทิ้งไว้นาน เบราว์เซอร์หยิบ connection เก่าที่ server ปิดไปแล้วมาใช้
 * ลองซ้ำ 1 ครั้งเฉพาะ request ที่ส่งซ้ำได้ (POST ที่เขียนข้อมูลไม่ลองซ้ำ กันบันทึกซ้ำ)
 */
const shouldRetry = (err: AxiosError) => {
  const c = err.config as Timed | undefined;
  if (!c || c.retried || err.code !== AxiosError.ERR_NETWORK) return false;
  const method = (c.method ?? 'get').toLowerCase();
  return c.retryable === true || method === 'get' || method === 'head';
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const elapsed = (t0?: number) => `${Math.round(now() - (t0 ?? now()))}ms`;
const describe = (c?: AxiosRequestConfig) => `${(c?.method ?? 'get').toUpperCase()} ${c?.url ?? ''}`;
const silent: RestLogger = { info: () => {}, warn: () => {}, error: () => {} };

/** HTTP client กลาง (static) — ต้องเรียก Rest.configure() ก่อนใช้ */
export class Rest {
  private static instance: AxiosInstance | null = null;
  private static config: RestConfig | null = null;

  /** ตั้งค่า (เรียกซ้ำได้ — สร้าง axios instance ใหม่) */
  static configure(config: RestConfig): void {
    const cfg: RestConfig = { ...config, baseURL: config.baseURL.replace(/\/$/, '') };
    const log = cfg.logger ?? silent;
    if (cfg.errorMessages) errorMessages = cfg.errorMessages;
    const client = axios.create({
      baseURL: cfg.baseURL,
      timeout: cfg.timeout ?? 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    client.interceptors.request.use(async (req) => {
      const headers = AxiosHeaders.from(req.headers);
      if (!headers.has('Authorization')) {
        const token = cfg.getAccessToken ? await cfg.getAccessToken() : null;
        if (token) headers.set('Authorization', `Bearer ${token}`);
      }
      req.headers = headers;
      (req as Timed).metadata = { t0: now() };
      return req;
    });

    client.interceptors.response.use(
      (res) => {
        const rows = Array.isArray(res.data) ? ` · ${res.data.length} แถว` : '';
        log.info(`API ${describe(res.config)} → ${res.status}${rows} · ${elapsed((res.config as Timed).metadata?.t0)}`);
        return res;
      },
      (err: unknown) => {
        if (!(err instanceof AxiosError)) return Promise.reject(err);
        const t0 = (err.config as Timed | undefined)?.metadata?.t0;
        if (!err.response && shouldRetry(err)) {
          const retry = { ...(err.config as Timed), retried: true };
          log.warn(`API ${describe(retry)} ต่อไม่ติด (${err.code}) — ลองใหม่อีกครั้ง`);
          return new Promise((r) => setTimeout(r, 300)).then(() => client.request(retry));
        }
        if (!err.response) {
          // code บอกสาเหตุ: ERR_NETWORK = ต่อไม่ติด/CORS · ECONNABORTED = เกิน timeout · ERR_CANCELED = ถูกยกเลิก
          log.error(`ติดต่อ API ไม่ได้ ${describe(err.config)} (${cfg.baseURL}) · ${err.code ?? err.message} · ${elapsed(t0)}`);
          return Promise.reject(new ApiError(0, `ติดต่อเซิร์ฟเวอร์ไม่ได้ (${cfg.baseURL}) — เปิดหลังบ้านด้วย pnpm dev แล้วลองใหม่`));
        }
        const { status, data } = err.response;
        const msg = typeof data === 'object' && data ? (data as { message?: string | string[] }).message : undefined;
        const code =
          status === 401 && cfg.unauthorizedCode
            ? cfg.unauthorizedCode
            : Array.isArray(msg)
              ? msg.join(', ')
              : (msg ?? `HTTP ${status}`);
        log.warn(`API ${describe(err.config)} → ${status} ${code} · ${elapsed(t0)}`);
        return Promise.reject(new ApiError(status, code));
      },
    );

    Rest.instance = client;
    Rest.config = cfg;
  }

  /** baseURL ที่ใช้อยู่ (เช่นไว้แสดงใน log) */
  static get baseURL(): string {
    return Rest.config?.baseURL ?? '';
  }

  private static get client(): AxiosInstance {
    if (!Rest.instance) throw new Error('Rest ยังไม่ได้ตั้งค่า — เรียก Rest.configure({ baseURL, … }) ใน main.tsx ก่อน');
    return Rest.instance;
  }

  static async get<T>(url: string, config?: RestRequestConfig): Promise<T> {
    return (await Rest.client.get<T>(url, config)).data;
  }

  static async post<T = unknown>(url: string, body?: unknown, config?: RestRequestConfig): Promise<T> {
    return (await Rest.client.post<T>(url, body, config)).data;
  }

  static async put<T = unknown>(url: string, body?: unknown, config?: RestRequestConfig): Promise<T> {
    return (await Rest.client.put<T>(url, body, config)).data;
  }

  static async patch<T = unknown>(url: string, body?: unknown, config?: RestRequestConfig): Promise<T> {
    return (await Rest.client.patch<T>(url, body, config)).data;
  }

  static async delete<T = unknown>(url: string, config?: RestRequestConfig): Promise<T> {
    return (await Rest.client.delete<T>(url, config)).data;
  }

  /**
   * PUT ไฟล์ตรงเข้า URL เต็ม (เช่น signed upload URL ของ Storage ที่ได้จาก POST /storage/upload-url)
   * ไม่ผ่าน baseURL / ไม่แนบ Bearer ของ API — token อยู่ใน URL แล้ว
   */
  static async upload(url: string, file: Blob, headers: Record<string, string> = {}): Promise<void> {
    await axios.put(url, file, { headers: { 'Content-Type': file.type || 'application/octet-stream', ...headers } });
  }

  /** ตรวจว่า API เปิดอยู่ (GET /health) */
  static async ping(): Promise<boolean> {
    try {
      await Rest.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}
