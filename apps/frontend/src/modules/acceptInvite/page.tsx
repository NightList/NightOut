import { App, Button, Empty, Spin } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { respondInvite, useMyInvites } from './api';
import { useAuth } from '@/services/auth';
import { AuthCard } from '@/ui/components/authCard';

const ROLE = { OWNER: 'เจ้าของร่วม', MANAGER: 'ผู้จัดการ', STAFF: 'พนักงาน' } as const;

/** /accept-invite — คำเชิญเข้าทีมร้าน (ร้านเชิญจากอีเมลของบัญชีที่สมัครแล้ว) */
export function AcceptInvitePage() {
  const { user, loading, reload } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const invites = useMyInvites(!!user);
  const [busy, setBusy] = useState<string | null>(null);

  const respond = async (barId: string, accept: boolean) => {
    setBusy(barId);
    try {
      await respondInvite(barId, accept);
      if (accept) {
        message.success('เข้าร่วมทีมร้านแล้ว');
        await reload();
        navigate('/merchant');
      } else {
        message.info('ปฏิเสธคำเชิญแล้ว');
        void invites.refetch();
      }
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Spin fullscreen />;
  if (!user)
    return (
      <AuthCard title="คำเชิญเข้าทีมร้าน" subtitle="เข้าสู่ระบบด้วยอีเมลที่ร้านเชิญ เพื่อดูคำเชิญ">
        <Link to="/login?next=/accept-invite">
          <Button type="primary" block>
            เข้าสู่ระบบ
          </Button>
        </Link>
        <p className="mt-4 text-center text-xs text-white/80">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="font-bold !text-[#c4a6ff]">
            สมัครสมาชิก
          </Link>{' '}
          แล้วแจ้งร้านให้เชิญอีเมลนี้
        </p>
      </AuthCard>
    );

  return (
    <AuthCard title="คำเชิญเข้าทีมร้าน" subtitle={user.email}>
      {invites.isLoading && <Spin />}
      {!invites.isLoading && !invites.data?.length && <Empty description="ยังไม่มีคำเชิญที่รอตอบ" />}
      <div className="space-y-3">
        {invites.data?.map((i) => (
          <div key={i.bar_id} className="rounded-xl border border-white/15 p-4">
            <p className="font-semibold">{i.bar_name}</p>
            <p className="text-sm text-white/70">
              ตำแหน่ง {ROLE[i.role]}
              {i.invited_by ? ` · เชิญโดย ${i.invited_by}` : ''}
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="primary" loading={busy === i.bar_id} onClick={() => void respond(i.bar_id, true)}>
                เข้าร่วมทีม
              </Button>
              <Button disabled={busy === i.bar_id} onClick={() => void respond(i.bar_id, false)}>
                ปฏิเสธ
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AuthCard>
  );
}
