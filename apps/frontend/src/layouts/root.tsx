import { Outlet, ScrollRestoration } from 'react-router';
import { AuthModalProvider } from '@/ui/components/authModal';

/**
 * ครอบทุก route — คืนตำแหน่ง scroll ให้ถูก
 * - ไปหน้าใหม่ (กดลิงก์) → เริ่มที่บนสุดเสมอ
 * - กดย้อนกลับ/ไปข้างหน้า → กลับไปตำแหน่งเดิมของหน้านั้น
 */
export function RootLayout() {
  return (
    <AuthModalProvider>
      <Outlet />
      <ScrollRestoration />
    </AuthModalProvider>
  );
}
