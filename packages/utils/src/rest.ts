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
 * - error ทุกแบบ → ApiError(status, code) พร้อมข้อความภาษาไทยจาก ERROR_MESSAGES
 * - log ทุก request ผ่าน logger ของแอป (ป้าย NightOut ใน Console)
 * แยก entry `@nightout/utils/rest` จาก index — backend ที่ใช้ @nightout/utils จะไม่ต้องโหลด axios
 */

/** ข้อความภาษาไทยของรหัส error จาก NestJS / ฟังก์ชันใน DB (ใช้ร่วมทุกแอป) */
export const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  USER_NOT_FOUND: 'ไม่พบบัญชีผู้ใช้ (อาจถูกลบไปแล้ว) ลองออกจากระบบแล้วเข้าใหม่',
  BAR_NOT_FOUND: 'ไม่พบร้านนี้ หรือร้านยังไม่เปิดให้จอง',
  ZONE_NOT_FOUND: 'ไม่พบโซนนี้',
  ZONE_FULL: 'โซนนี้เต็มแล้วในช่วงเวลานั้น ลองเลือกโซนหรือเวลาอื่น',
  PAX_OUT_OF_RANGE: 'จำนวนคนเกินที่ร้านรับต่อการจอง',
  BOOKING_TOO_SOON: 'ต้องจองล่วงหน้ามากกว่านี้ ลองเลือกเวลาที่ช้าลง',
  BOOKING_TOO_FAR: 'จองล่วงหน้าไกลเกินที่ร้านเปิดรับ',
  PROMOTION_NOT_AVAILABLE: 'โปรโมชันนี้ใช้กับวัน/เวลาที่เลือกไม่ได้',
  BOOKING_NOT_FOUND: 'ไม่พบการจองนี้',
  BOOKING_NOT_AWAITING_DEPOSIT: 'การจองนี้ไม่ต้องส่งสลิปแล้ว',
  NO_DEPOSIT_REQUIRED: 'การจองนี้ไม่ต้องจ่ายมัดจำ',
  INVALID_SLIP_PATH: 'อัปโหลดสลิปไม่สำเร็จ ลองเลือกไฟล์ใหม่',
  SLIP_ALREADY_USED: 'สลิปนี้ถูกใช้ไปแล้ว',
  INVALID_BOOKING_TRANSITION: 'เปลี่ยนสถานะการจองนี้ไม่ได้แล้ว (สถานะอาจเปลี่ยนไปแล้ว ลองรีเฟรช)',
  BOOKING_NOT_CONFIRMED: 'การจองนี้ยังไม่ได้ยืนยัน หรือเช็กอินไปแล้ว',
  REVIEW_REQUIRES_CHECKIN: 'รีวิวได้หลังเช็กอินที่ร้านแล้วเท่านั้น',
  REVIEW_EXISTS: 'คุณรีวิวการจองนี้แล้ว',
  INVALID_RATING: 'ให้คะแนน 1–5 ดาว',
  REVIEW_MEDIA_LIMIT: 'แนบไฟล์ได้สูงสุด 6 ไฟล์',
  INVALID_MEDIA_PATH: 'อัปโหลดไฟล์รีวิวไม่สำเร็จ',
  REVIEW_NOT_FOUND: 'ไม่พบรีวิวนี้',
  NOT_BAR_MEMBER: 'บัญชีนี้ไม่ได้อยู่ในทีมของร้านนี้',
  NOT_BAR_MANAGER: 'เฉพาะเจ้าของหรือผู้จัดการร้านเท่านั้น',
  NOT_BAR_OWNER: 'เฉพาะเจ้าของร้านเท่านั้น',
  INVALID_LINK: 'ลิงก์โซเชียลไม่ตรงกับแพลตฟอร์ม (ต้องขึ้นต้นด้วย https://)',
  INVALID_PROMOTION: 'ชื่อโปรต้องยาว 1–60 ตัวอักษร',
  INVALID_FEES: 'ค่าธรรมเนียมไม่ถูกต้อง',
  INVALID_PAYOUT_ACCOUNT: 'ข้อมูลบัญชีไม่ครบ',
  PACKAGE_NOT_FOUND: 'ไม่พบแพ็กเกจนี้',
  INVITEE_NOT_REGISTERED: 'อีเมลนี้ยังไม่ได้สมัคร NightOut — ให้พนักงานสมัครก่อนแล้วค่อยเชิญ',
  ALREADY_MEMBER: 'คนนี้อยู่ในทีมแล้ว',
  INVITE_NOT_FOUND: 'ไม่พบคำเชิญ (อาจถูกยกเลิกแล้ว)',
  CANNOT_REMOVE_SELF: 'นำตัวเองออกจากทีมไม่ได้',
  MEMBER_NOT_FOUND: 'ไม่พบสมาชิกนี้',
  APPLICATION_PENDING: 'คุณมีร้านที่รอตรวจอยู่แล้ว',
  INVALID_BAR_INFO: 'กรอกชื่อร้านและที่อยู่ให้ครบ',
  INVALID_DISPLAY_NAME: 'ชื่อที่แสดงต้องยาว 1–60 ตัวอักษร',
  SAFETY_FEATURE_NOT_FOUND: 'ไม่พบมาตรการนี้',
  PAYOUT_ENCRYPTION_KEY: 'หลังบ้านยังไม่ได้ตั้ง PAYOUT_ENCRYPTION_KEY',
  INVALID_EVIDENCE_PATH: 'อัปโหลดหลักฐานไม่สำเร็จ',
  HAS_ACTIVE_BOOKINGS: 'ยังมีการจองที่ยังไม่จบ — ยกเลิกหรือรอให้จบก่อนลบบัญชี',
  NOT_ADMIN: 'บัญชีนี้ไม่มีสิทธิ์แอดมิน',
  MFA_REQUIRED: 'ต้องยืนยันรหัส 6 หลักจากแอป Authenticator ใหม่อีกครั้ง',
  DEPOSIT_NOT_FOUND: 'ไม่พบรายการมัดจำนี้แล้ว',
  DEPOSIT_ALREADY_REVIEWED: 'สลิปนี้มีคนตรวจไปแล้ว',
  DEPOSIT_NOT_PAYOUT_PENDING: 'รายการนี้ยังไม่ถึงขั้นโอนให้ร้าน',
  DEPOSIT_NOT_REFUND_PENDING: 'รายการนี้ยังไม่ถึงขั้นคืนเงินลูกค้า',
  PROMOTION_NOT_FOUND: 'ไม่พบรายการโปรโมทนี้แล้ว',
  PROMOTION_NOT_AWAITING_REVIEW: 'รายการโปรโมทนี้ตรวจไปแล้ว',
  TEAM_MEMBER_NOT_FOUND: 'ไม่พบทีมงานคนนี้แล้ว (อาจถูกลบไปแล้ว)',
  INVALID_TEAM_MEMBER: 'ข้อมูลทีมงานไม่ครบหรือไม่ถูกต้อง (ชื่อเล่น 1–40 ตัว · รูปต้องเป็น URL หรือ path ที่ขึ้นต้นด้วย /)',
  INVALID_TEAM_ORDER: 'ลำดับทีมงานไม่ถูกต้อง — รีเฟรชหน้าแล้วลองใหม่',
  EMAIL_EXISTS: 'อีเมลนี้มีบัญชีอยู่แล้ว — เปลี่ยนสิทธิ์จากรายชื่อผู้ใช้แทน',
  INVALID_ACCOUNT_TYPE: 'ประเภทบัญชีกับร้านไม่ตรงกัน (เจ้าของ/ผู้จัดการ/พนักงานต้องเลือกร้าน)',
  AGE_UNDER_20: 'ผู้ใช้ต้องอายุ 20 ปีขึ้นไป',
  CANNOT_DEMOTE_SELF: 'ลดสิทธิ์แอดมินของตัวเองไม่ได้ ให้แอดมินคนอื่นทำแทน',
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(ERROR_MESSAGES[code] ?? Object.entries(ERROR_MESSAGES).find(([k]) => code.includes(k))?.[1] ?? code);
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
}

/**
 * baseURL จาก env ของ Vite: VITE_API_BASE_URL → VITE_API_URL (ชื่อเดิม) → dev `http://localhost:3000/api` / deploy `/api` (same-origin)
 *   Rest.configure({ baseURL: apiBaseUrlFromEnv(import.meta.env), … })
 */
export function apiBaseUrlFromEnv(env: { VITE_API_BASE_URL?: string; VITE_API_URL?: string; DEV?: boolean }): string {
  return (env.VITE_API_BASE_URL || env.VITE_API_URL || (env.DEV ? 'http://localhost:3000/api' : '/api')).replace(/\/$/, '');
}

type Timed = AxiosRequestConfig & { metadata?: { t0: number } };

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
        if (!err.response) {
          log.error(`ติดต่อ API ไม่ได้ ${describe(err.config)} (${cfg.baseURL})`);
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

  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await Rest.client.get<T>(url, config)).data;
  }

  static async post<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await Rest.client.post<T>(url, body, config)).data;
  }

  static async put<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await Rest.client.put<T>(url, body, config)).data;
  }

  static async patch<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await Rest.client.patch<T>(url, body, config)).data;
  }

  static async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
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
