import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuthModal } from '@/ui/components/authModal';

/** /register — ไม่มีหน้าสมัครแยกแล้ว: กลับหน้าหลักแล้วเปิด modal สมัครสมาชิก (ลิงก์เก่า) */
export function RegisterPage() {
  const { openRegister } = useAuthModal();

  useEffect(() => {
    openRegister();
  }, [openRegister]);

  return <Navigate to="/" replace />;
}
