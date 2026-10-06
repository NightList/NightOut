import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ERROR_MESSAGES } from '@nightout/contracts';
import { ApiError, apiBaseUrlFromEnv, Rest } from '@nightout/utils/rest';
import { log } from './services/log';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { hydratePublicFromCache, loadPublic } from './services/sync';
import { BootError } from './ui/components/bootError';
import './styles/index.css';

// HTTP client กลาง (ADR 0002) — ตั้งค่าครั้งเดียว ทุก service เรียก Rest.get/post/… ได้เลย
Rest.configure({
  baseURL: apiBaseUrlFromEnv(import.meta.env),
  getAccessToken: async () => (supabase ? ((await supabase.auth.getSession()).data.session?.access_token ?? null) : null),
  logger: log,
  errorMessages: ERROR_MESSAGES,
});

/** log ว่า NestJS เปิดอยู่ไหม (ดูใน Console) */
const checkApi = async () =>
  (await Rest.ping())
    ? log.ok(`เชื่อมต่อ NestJS API สำเร็จ (${Rest.baseURL})`)
    : log.warn(`ติดต่อ NestJS API ไม่ได้ (${Rest.baseURL}) — เปิดด้วย pnpm dev · หน้าเว็บจะโหลดข้อมูล/บันทึกไม่ได้`);

const root = createRoot(document.getElementById('root')!);
const render = (node: ReactNode) => root.render(<StrictMode>{node}</StrictMode>);

/**
 * ข้อมูลทั้งหมดมาจาก NestJS API ผ่าน Rest (ADR 0002 — หน้าเว็บไม่ query DB ตรง) · Supabase ใช้เฉพาะ Auth
 * - เคยเปิดเว็บแล้ว (มี snapshot ในเครื่อง ≤ 24 ชม.) → render ทันที แล้วโหลดของใหม่เบื้องหลัง
 * - ครั้งแรก → รอโหลดข้อมูลสาธารณะเสร็จก่อน render (ระหว่างนั้นเห็นหน้าโหลดใน index.html)
 * ไม่มี .env → หน้าบอกวิธีตั้งค่า · โหลดไม่ได้ → หน้าแจ้ง error + ปุ่มลองใหม่
 * สถานะการเชื่อมต่อดูได้ใน DevTools → Console (กรองคำว่า NightOut)
 */
async function boot() {
  if (!isSupabaseConfigured) {
    log.error('ยังไม่ได้ตั้ง VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ใน .env (ใช้กับระบบเข้าสู่ระบบ)');
    render(<BootError kind="config" />);
    return;
  }
  if (hydratePublicFromCache()) {
    render(<App />);
    void checkApi();
    loadPublic().catch((e: Error) => log.warn('โหลดข้อมูลใหม่ไม่สำเร็จ — ใช้ข้อมูลในเครื่องไปก่อน', e.message));
    return;
  }
  try {
    await loadPublic();
    void checkApi();
    render(<App />);
  } catch (e) {
    log.error('โหลดข้อมูลจาก API ไม่สำเร็จ', e);
    // ข้อความไทยอยู่ในหน้าแล้ว — ใต้ปุ่มแสดงสาเหตุจริงจาก API (เช่น 503 SUPABASE_UNREACHABLE: ENOTFOUND) ไว้ส่งให้ทีม
    const detail = e instanceof ApiError ? `${e.status || 'เครือข่าย'} · ${e.code}` : e instanceof Error ? e.message : undefined;
    render(<BootError kind="load" onRetry={() => void boot()} detail={detail} />);
  }
}

void boot();
