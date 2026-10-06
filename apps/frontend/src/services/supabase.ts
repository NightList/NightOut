import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * ใช้เฉพาะ Supabase Auth (เข้าสู่ระบบ / สมัคร / OAuth / ลืมรหัสผ่าน / ต่ออายุ token) — ADR 0002
 * ห้ามใช้ .from() / .rpc() / .storage ที่นี่ → อ่าน/เขียนข้อมูลผ่าน Rest (@nightout/utils/rest) เท่านั้น
 * anon key เป็น publishable key (ไม่ใช่ความลับ) · ห้ามใส่ service_role / secret key ใน VITE_* เด็ดขาด
 * null เมื่อยังไม่ได้ตั้งค่า .env
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true } }) : null;

export const isSupabaseConfigured = supabase !== null;
