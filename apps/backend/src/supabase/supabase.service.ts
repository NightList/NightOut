import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PostgrestError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * เรียก Supabase ด้วย Secret key (service_role) — ข้าม RLS ได้ ใช้ในหลังบ้านเท่านั้น
 * ใช้ fetch ตรง (PostgREST / Auth) ไม่ต้องพึ่ง SDK
 */
@Injectable()
export class SupabaseService {
  private readonly log = new Logger('Supabase');
  private readonly url: string;
  /** deploy จริง (Vercel / NODE_ENV=production) แต่ SUPABASE_URL ยังเป็นค่า local → ทุก request ล้มแน่ บอกให้ชัดแทน 500 */
  private readonly urlMissing: boolean;
  private readonly key: string | undefined;
  private readonly anonKey: string | undefined;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    this.key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.anonKey = config.get<string>('SUPABASE_ANON_KEY') || config.get<string>('VITE_SUPABASE_ANON_KEY') || undefined;
    const deployed = !!process.env.VERCEL || config.get<string>('NODE_ENV') === 'production';
    this.urlMissing = deployed && /\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(this.url);
    if (this.urlMissing) this.log.error(`SUPABASE_URL ยังเป็น ${this.url} — ตั้ง SUPABASE_URL ใน Environment Variables ของ deploy แล้ว Redeploy`);
  }

  /** ตั้งค่าครบแค่ไหน (ไม่เปิดเผยค่า) — ใช้ใน /api/health */
  get status() {
    return {
      supabase_url: !this.urlMissing,
      supabase_host: this.url.replace(/^https?:\/\//, ''),
      anon_key: !!this.anonKey,
      service_role_key: !!this.key,
    };
  }

  /** ping PostgREST ด้วย anon key — /api/health?deep=1 */
  async ping(): Promise<{ ok: boolean; status?: number; error?: string }> {
    try {
      const res = await this.call(`${this.url}/rest/v1/`, { headers: this.callerHeaders(null) });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, error: e instanceof HttpException ? String((e.getResponse() as { message?: string }).message ?? e.message) : String(e) };
    }
  }

  /**
   * fetch ไป Supabase — ต่อไม่ติด (DNS / ปฏิเสธการเชื่อมต่อ / timeout) → 503 SUPABASE_UNREACHABLE พร้อมสาเหตุ
   * (เดิมหลุดเป็น 500 "Internal server error" เฉยๆ ไล่ไม่ได้ว่าพังที่ไหน)
   */
  private async call(url: string, init?: RequestInit): Promise<Response> {
    if (this.urlMissing) throw new ServiceUnavailableException('SUPABASE_URL_NOT_CONFIGURED');
    try {
      return await fetch(url, init);
    } catch (e) {
      const err = e as Error & { cause?: { code?: string; message?: string } };
      const reason = err.cause?.code ?? err.cause?.message ?? err.message;
      const where = new URL(url).pathname;
      this.log.error(`ติดต่อ Supabase ไม่ได้ ${where}: ${reason}`);
      throw new ServiceUnavailableException(`SUPABASE_UNREACHABLE: ${reason}`);
    }
  }

  /** มี Secret key แล้วหรือยัง */
  get configured(): boolean {
    return !!this.key;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    if (!this.key) throw new ServiceUnavailableException('SUPABASE_SERVICE_ROLE_KEY is not configured');
    return { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', ...extra };
  }

  /** เรียกฟังก์ชันใน DB (POST /rest/v1/rpc/<fn>) */
  async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const res = await this.call(`${this.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(args),
    });
    return this.parse<T>(res);
  }

  /** อ่านตาราง/วิว (GET /rest/v1/<path>) เช่น `users?select=role&id=eq.<uuid>` */
  async select<T>(path: string): Promise<T> {
    const res = await this.call(`${this.url}/rest/v1/${path}`, { headers: this.headers() });
    return this.parse<T>(res);
  }

  // -------------------------------------------------------------------
  // อ่านข้อมูล "ในนามผู้เรียก" — แทนที่หน้าเว็บเคยเรียก Supabase ตรง
  // ใช้ anon key + access token ของผู้ใช้ (หรือ anon ถ้าไม่ล็อกอิน) → RLS / auth.uid() ทำงานเหมือนเดิมทุกอย่าง
  // ห้ามใช้ service_role ตรงนี้ ไม่งั้นข้าม RLS
  // -------------------------------------------------------------------
  private callerHeaders(token: string | null, extra: Record<string, string> = {}): Record<string, string> {
    if (!this.anonKey) throw new ServiceUnavailableException('SUPABASE_ANON_KEY is not configured');
    return { apikey: this.anonKey, Authorization: `Bearer ${token ?? this.anonKey}`, 'Content-Type': 'application/json', ...extra };
  }

  /** GET /rest/v1/<path> ตามสิทธิ์ของผู้เรียก */
  async selectAs<T>(token: string | null, path: string): Promise<T> {
    const res = await this.call(`${this.url}/rest/v1/${path}`, { headers: this.callerHeaders(token) });
    return this.parse<T>(res);
  }

  /** POST /rest/v1/rpc/<fn> ตามสิทธิ์ของผู้เรียก (ฟังก์ชันอ่าน เช่น zone_availability, bar_team) */
  async rpcAs<T>(token: string | null, fn: string, args: Record<string, unknown>): Promise<T> {
    const res = await this.call(`${this.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: this.callerHeaders(token),
      body: JSON.stringify(args),
    });
    return this.parse<T>(res);
  }

  /** URL ชั่วคราวของไฟล์ใน Storage (ตาม policy ของผู้เรียก) — คืน { path → url } เฉพาะไฟล์ที่ขอได้ */
  async signUrlsAs(token: string | null, bucket: string, paths: string[], expiresIn: number): Promise<Record<string, string>> {
    const res = await this.call(`${this.url}/storage/v1/object/sign/${encodeURIComponent(bucket)}`, {
      method: 'POST',
      headers: this.callerHeaders(token),
      body: JSON.stringify({ expiresIn, paths }),
    });
    const rows = await this.parse<{ path: string | null; signedURL: string | null; error: string | null }[]>(res);
    const out: Record<string, string> = {};
    for (const r of rows ?? []) if (r.path && r.signedURL) out[r.path] = `${this.url}/storage/v1${r.signedURL}`;
    return out;
  }

  /** URL สำหรับอัปโหลดไฟล์ 1 ไฟล์ (PUT ตรงเข้า Storage) — policy ของ bucket ตรวจสิทธิ์ผู้เรียกตอนสร้าง URL */
  async signedUploadUrlAs(token: string, bucket: string, path: string): Promise<string> {
    const objectPath = path.split('/').map(encodeURIComponent).join('/');
    const res = await this.call(`${this.url}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${objectPath}`, {
      method: 'POST',
      headers: this.callerHeaders(token),
      body: '{}',
    });
    const body = await this.parse<{ url: string }>(res);
    return `${this.url}/storage/v1${body.url}`;
  }

  /** URL ถาวรของไฟล์ใน bucket public */
  publicUrl(bucket: string, path: string): string {
    return `${this.url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
  }

  /**
   * สร้างบัญชีใน Supabase Auth (ยืนยันอีเมลให้เลย) — trigger handle_new_auth_user สร้าง public.users (CUSTOMER)
   * คืน null ถ้าอีเมลนี้มีบัญชีแล้ว
   */
  async createAuthUser(input: { email: string; password: string; metadata: Record<string, unknown> }): Promise<{ id: string } | null> {
    const res = await this.call(`${this.url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email: input.email, password: input.password, email_confirm: true, user_metadata: input.metadata }),
    });
    const text = await res.text();
    const body = (text ? JSON.parse(text) : null) as { id?: string; code?: string; error_code?: string; msg?: string; message?: string } | null;
    if (res.ok && body?.id) return { id: body.id };
    const reason = `${body?.error_code ?? body?.code ?? ''} ${body?.msg ?? body?.message ?? ''}`;
    if (res.status === 422 && /exists|already been registered/i.test(reason)) return null;
    if (/AGE_UNDER_20/.test(reason)) throw new BadRequestException('AGE_UNDER_20');
    if (res.status === 422 || res.status === 400) throw new BadRequestException(reason.trim() || 'INVALID_ACCOUNT');
    throw new InternalServerErrorException(`create auth user failed: ${res.status} ${reason}`.trim());
  }

  /** ลบบัญชีใน Auth (ใช้ย้อนกลับเมื่อสร้างไม่ครบขั้นตอน — public.users ถูกลบตาม FK) */
  async deleteAuthUser(id: string): Promise<void> {
    await this.call(`${this.url}/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers: this.headers() });
  }

  async updateAuthUser(id: string, input: { email?: string; password?: string }): Promise<void> {
    const res = await this.call(`${this.url}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 422 && /exists|already been registered/i.test(body)) throw new ConflictException('EMAIL_EXISTS');
      throw new ConflictException('INVALID_ACCOUNT');
    }
  }

  /** ปิดการเข้าสู่ระบบของบัญชี (ลบบัญชี) — ห้ามลบจริงเพราะการจองยังอ้างถึง */
  async banUser(id: string): Promise<void> {
    const res = await this.call(`${this.url}/auth/v1/admin/users/${id}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ ban_duration: '876000h' }),
    });
    if (!res.ok) throw new InternalServerErrorException(`ban user failed: ${res.status}`);
  }

  /** ตรวจ access token กับ Supabase Auth (ใช้ตอน verify JWKS ไม่ได้ เช่นโปรเจกต์ที่ยังใช้ HS256) */
  async getUser(accessToken: string): Promise<{ id: string; email?: string } | null> {
    const res = await this.call(`${this.url}/auth/v1/user`, {
      headers: { apikey: this.key ?? '', Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string; email?: string };
  }

  private async parse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        // ไม่ใช่ JSON = ไม่ได้มาจาก PostgREST (โปรเจ็กต์ถูกพัก/เกินโควตา, URL ผิด, gateway ล่ม) — เดิมกลายเป็น 500 เงียบๆ
        const snippet = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
        this.log.error(`Supabase ตอบไม่ใช่ JSON ${new URL(res.url || this.url).pathname} → ${res.status}: ${snippet}`);
        throw new BadGatewayException(`SUPABASE_BAD_RESPONSE: ${res.status} ${snippet}`.trim());
      }
    }
    if (res.ok) return body as T;
    if (res.status >= 500) this.log.error(`Supabase ${res.status} ${new URL(res.url || this.url).pathname}: ${text.slice(0, 300)}`);
    throw this.toHttpError(res.status, body as PostgrestError | null);
  }

  /** แปลง error ของ Postgres/PostgREST เป็น HTTP error ที่หน้าบ้านเข้าใจ (ข้อความ = รหัส เช่น DEPOSIT_ALREADY_REVIEWED) */
  private toHttpError(status: number, err: PostgrestError | null): HttpException {
    const message = err?.message ?? `Supabase error ${status}`;
    switch (err?.code) {
      case 'P0002':
        return new NotFoundException(message);
      case 'P0001':
      case '23505':
      case '23P01':
        return new ConflictException(message);
      case '42501':
        return new ForbiddenException(message);
      case '22023':
      case '22P02':
      case '23514':
        return new BadRequestException(message);
      default:
        return status >= 500 ? new InternalServerErrorException(message) : new BadRequestException(message);
    }
  }
}
