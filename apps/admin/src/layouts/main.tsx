import { MoonStars, SignOut } from '@phosphor-icons/react';
import { ProLayout } from '@ant-design/pro-components';
import { ThemeToggle } from '@nightout/ui';
import { Button, Spin, Tooltip } from 'antd';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { ADMIN_ROUTES } from '@/configs/menu';
import { useAdminAuth } from '@/services/adminAuth';

/** Layout หลักของ Backoffice — เข้าได้เฉพาะ ADMIN ที่ยืนยัน MFA แล้ว (Supabase AAL2) */
export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAdminAuth();
  if (auth.loading) return <Spin fullscreen />;
  if (!auth.canEnter) return <Navigate to="/login" replace />;
  return (
    <ProLayout
      title="NightOut Admin"
      logo={<MoonStars size={28} weight="fill" color="#E8B64C" />}
      layout="mix"
      fixSiderbar
      location={{ pathname: location.pathname }}
      route={{ path: '/', routes: ADMIN_ROUTES }}
      menuItemRender={(item, dom) => <Link to={item.path ?? '/'}>{dom}</Link>}
      actionsRender={() => [
        <ThemeToggle key="theme" />,
        <Tooltip key="out" title="ออกจากระบบ">
          <Button
            type="text"
            shape="circle"
            aria-label="ออกจากระบบ"
            icon={<SignOut size={18} />}
            onClick={() => {
              void auth.signOut().then(() => navigate('/login'));
            }}
          />
        </Tooltip>,
      ]}
    >
      <Outlet />
    </ProLayout>
  );
}
