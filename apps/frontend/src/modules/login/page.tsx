import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { useLoginModal } from '@/ui/components/loginModal';

/**
 * /login — ไม่มีหน้าเข้าสู่ระบบแล้ว: กลับหน้าหลักแล้วเปิด modal (ลิงก์เก่า / route guard ที่ส่ง ?next=...)
 */
export function LoginPage() {
  const [params] = useSearchParams();
  const { open } = useLoginModal();
  const next = params.get('next') ?? undefined;

  useEffect(() => {
    open(next);
  }, [open, next]);

  return <Navigate to="/" replace />;
}
