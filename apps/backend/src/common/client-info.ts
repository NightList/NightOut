import { isIP } from 'node:net';
import type { Request } from 'express';

/**
 * IP / User-Agent ของผู้เรียก (เก็บเป็นหลักฐาน เช่น การยอมรับเงื่อนไขมัดจำ)
 * บน Vercel ค่า x-forwarded-for ถูกตั้งโดย edge (ตัวแรก = IP ลูกค้า) · local ใช้ IP ของ socket
 */
export function clientInfo(req: Request): { ip: string | null; user_agent: string | null } {
  const fwd = req.headers['x-vercel-forwarded-for'] ?? req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  const raw = first || req.socket?.remoteAddress || null;
  const ip = raw?.replace(/^::ffff:/, '') ?? null;
  const ua = req.headers['user-agent'];
  return { ip: ip && isIP(ip) ? ip : null, user_agent: typeof ua === 'string' ? ua.slice(0, 500) : null };
}
