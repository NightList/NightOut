/**
 * log ใน DevTools Console — ดูได้ว่าเว็บต่อ Supabase / API จริงแล้วหรือยัง
 * เปิด DevTools (F12) → Console → พิมพ์ "NightOut" ในช่องกรอง
 */
const TAG = '%c NightOut ';
const STYLE = {
  ok: 'background:#16a34a;color:#fff;border-radius:4px;font-weight:600',
  info: 'background:#7c3aed;color:#fff;border-radius:4px;font-weight:600',
  warn: 'background:#d97706;color:#fff;border-radius:4px;font-weight:600',
  error: 'background:#dc2626;color:#fff;border-radius:4px;font-weight:600',
};

export const log = {
  ok: (msg: string, ...data: unknown[]) => console.info(`${TAG} ✅ ${msg}`, STYLE.ok, ...data),
  info: (msg: string, ...data: unknown[]) => console.info(`${TAG} ${msg}`, STYLE.info, ...data),
  warn: (msg: string, ...data: unknown[]) => console.warn(`${TAG} ⚠️ ${msg}`, STYLE.warn, ...data),
  error: (msg: string, ...data: unknown[]) => console.error(`${TAG} ❌ ${msg}`, STYLE.error, ...data),
};

/** จับเวลาเป็น ms */
export const since = (t0: number) => `${Math.round(performance.now() - t0)}ms`;
