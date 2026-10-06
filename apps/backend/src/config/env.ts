import { z } from 'zod';

/** ตรวจ environment variables ตอนเริ่มแอป */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
  SUPABASE_URL: z.url().default('http://127.0.0.1:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  /** Publishable (anon) key — ใช้อ่านข้อมูลแทนหน้าเว็บโดยให้ RLS ทำงานตามสิทธิ์ของผู้เรียก (ว่าง = ใช้ VITE_SUPABASE_ANON_KEY) */
  SUPABASE_ANON_KEY: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  JOB_SECRET: z.string().min(8).default('change-me-local'),
  QR_SIGNING_KEY: z.string().optional(),
  /** เข้ารหัสเลขบัญชีร้าน (AES-256-GCM) — ห้ามเปลี่ยนหลังมีข้อมูลแล้ว */
  PAYOUT_ENCRYPTION_KEY: z.string().min(16).optional(),
  /** dev: รัน job หมดเวลา/ไม่มาตามนัด ทุกกี่ ms ในเครื่อง (0 = ปิด · production ใช้ pg_cron) */
  JOBS_LOCAL_INTERVAL_MS: z.coerce.number().int().min(0).default(60_000),
});
export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  // ตัดช่องว่าง/ขึ้นบรรทัดที่ติดมาตอน paste ค่าใน Vercel (เช่น SUPABASE_URL ท้ายมี \n → z.url() ไม่ผ่าน บูตล้มทั้งแอป)
  const trimmed = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
  const parsed = EnvSchema.safeParse(trimmed);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
