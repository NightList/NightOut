import { WarningCircle } from '@phosphor-icons/react';
import { ThemeProvider } from '@nightout/ui';
import { Result } from 'antd';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ERROR_MESSAGES } from '@nightout/contracts';
import { apiBaseUrlFromEnv, Rest } from '@nightout/utils/rest';
import { log } from './services/log';
import { isSupabaseConfigured, supabase } from './services/supabase';
import './styles/index.css';

/** Backoffice ต้องต่อ Supabase Auth เสมอ (เข้าสู่ระบบ + MFA) — ข้อมูลทั้งหมดอ่าน/เขียนผ่าน NestJS (ADR 0002) */
function ConfigMissing() {
  return (
    <ThemeProvider>
      <main className="grid min-h-dvh place-items-center bg-background p-6">
        <Result
          icon={<WarningCircle size={64} weight="duotone" className="mx-auto text-gold" />}
          title="ยังไม่ได้ตั้งค่า Supabase"
          subTitle="ใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env ที่ root ของโปรเจกต์ แล้วรัน pnpm dev ใหม่ (ดู docs/SUPABASE.md)"
        />
      </main>
    </ThemeProvider>
  );
}

// HTTP client กลาง (ADR 0003) — 401 = session หมด/ยังไม่ผ่าน MFA → ข้อความให้ยืนยันรหัสใหม่
Rest.configure({
  baseURL: apiBaseUrlFromEnv(import.meta.env),
  getAccessToken: async () => (supabase ? ((await supabase.auth.getSession()).data.session?.access_token ?? null) : null),
  logger: log,
  errorMessages: ERROR_MESSAGES,
  unauthorizedCode: 'MFA_REQUIRED',
});

const checkApi = async () =>
  (await Rest.ping())
    ? log.ok(`เชื่อมต่อ NestJS API สำเร็จ (${Rest.baseURL})`)
    : log.warn(`ติดต่อ NestJS API ไม่ได้ (${Rest.baseURL}) — เปิดด้วย pnpm dev · Backoffice จะโหลด/บันทึกข้อมูลไม่ได้`);

if (isSupabaseConfigured) {
  log.info(`Supabase: ${new URL(import.meta.env.VITE_SUPABASE_URL as string).host} · เข้าสู่ระบบ + MFA แล้วจะเห็นสถานะการโหลดแต่ละหน้า`);
  void checkApi();
} else {
  log.error('ยังไม่ได้ตั้ง VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ใน .env');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isSupabaseConfigured ? <App /> : <ConfigMissing />}</StrictMode>,
);
