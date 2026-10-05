import type { UserRole } from '@nightout/types';
import { Button, Result, Spin } from 'antd';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/services/auth';

/** Layout route: ต้องล็อกอินก่อน ไม่งั้นส่งไป /login?next=... */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spin fullscreen />;
  if (!user)
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return <Outlet />;
}

/** Layout route: จำกัด role */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="ไม่มีสิทธิ์เข้าหน้านี้"
        subTitle="หน้านี้สำหรับเจ้าของร้านและพนักงานเท่านั้น"
        extra={
          <Link to="/merchant/join">
            <Button type="primary">สมัครเป็นร้านค้า</Button>
          </Link>
        }
      />
    );
  }
  return <Outlet />;
}
