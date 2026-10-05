/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** URL ของ NestJS API — ว่าง: dev = localhost:3000/api, deploy = /api */
  readonly VITE_API_BASE_URL?: string;
  /** @deprecated ใช้ VITE_API_BASE_URL — ยังอ่านเป็นค่าสำรอง */
  readonly VITE_API_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
