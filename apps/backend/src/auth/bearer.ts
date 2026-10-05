import type { Request } from 'express';

/**
 * อ่าน access token จาก header แบบไม่บังคับ (endpoint สาธารณะ)
 * ไม่ต้อง verify ที่นี่ — ส่งต่อให้ Supabase (PostgREST/Storage) ตรวจลายเซ็นเองก่อนใช้สิทธิ์ใดๆ
 * token ปลอม = Supabase ตอบ 401 → ผู้เรียกไม่ได้สิทธิ์เพิ่ม
 */
export function bearerOf(req: Request): string | null {
  const t = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  return t ? t : null;
}
