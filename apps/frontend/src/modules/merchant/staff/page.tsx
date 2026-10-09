import { Trash, UserPlus } from '@phosphor-icons/react';
import { App, Drawer, Empty, Form, Input, Popconfirm, Segmented, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useAuth } from '@/services/auth';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Tile } from '@/ui/components/merchantUi';
import { inviteStaff, removeStaff, useBarTeam, type BarTeamMember } from './api';

const ROLE = {
  OWNER: { label: 'เจ้าของ', cls: 'border-gold/40 text-gold-text' },
  MANAGER: { label: 'ผู้จัดการร้าน', cls: 'border-link/40 text-link' },
  STAFF: { label: 'Staff', cls: 'border-[#13a8a8]/40 text-[#13a8a8]' },
} as const;

type InviteForm = { email: string; role: 'MANAGER' | 'STAFF' };

/** /merchant/staff — สมาชิกทีม (ซ้าย) · เชิญพนักงาน + คำเชิญที่รอตอบรับ (ขวา) · เชิญด้วยอีเมลบัญชี NightOut */
export function MerchantStaffPage() {
  const bar = useMerchantBar();
  const { user } = useAuth();
  const { message } = App.useApp();
  const team = useBarTeam(bar.id);
  const [form] = Form.useForm<InviteForm>();
  const [sending, setSending] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const members = (team.data ?? []).filter((m) => m.accepted_at);
  const pending = (team.data ?? []).filter((m) => !m.accepted_at);

  const canRemove = (m: BarTeamMember) => m.user_id !== user?.id && (m.role !== 'OWNER' || bar.staffRole === 'OWNER');
  const remove = async (m: BarTeamMember, done: string) => {
    try {
      await removeStaff(bar.id, m.user_id);
      message.success(done);
      void team.refetch();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const inviteForm = (
    <Form<InviteForm>
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{ role: 'STAFF' }}
      onFinish={async ({ email, role }) => {
        setSending(true);
        try {
          await inviteStaff(bar.id, email, role);
          message.success(`ส่งคำเชิญถึง ${email} แล้ว`);
          form.resetFields();
          setInviteOpen(false);
          void team.refetch();
        } catch (e) {
          message.error((e as Error).message);
        } finally {
          setSending(false);
        }
      }}
    >
      <Form.Item
        name="email"
        label="อีเมล"
        extra="ให้พนักงานสมัคร NightOut ด้วยอีเมลนี้ก่อน แล้วตอบรับจากแจ้งเตือน"
        rules={[{ required: true, type: 'email', message: 'กรอกอีเมลให้ถูกต้อง' }]}
      >
        <Input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" placeholder="name@email.com" />
      </Form.Item>
      <Form.Item name="role" label="บทบาท">
        <Segmented
          block
          options={[
            { value: 'STAFF', label: 'Staff' },
            { value: 'MANAGER', label: 'ผู้จัดการร้าน' },
          ]}
        />
      </Form.Item>
      <button
        type="submit"
        disabled={sending}
        className="merchant-pill flex h-[42px] w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-on-gold disabled:opacity-60"
      >
        {sending ? 'กำลังส่ง…' : 'ส่งคำเชิญ'}
      </button>
    </Form>
  );

  const memberRow = (m: BarTeamMember) => (
    <li key={m.user_id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 lg:gap-3.5 lg:rounded-none lg:border-0 lg:border-b lg:border-border/60 lg:bg-transparent lg:px-5 lg:py-4 lg:last:border-b-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-border font-semibold lg:size-[42px]">
        {m.display_name.slice(0, 1)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-sm">
        <b className="truncate font-medium">
          {m.display_name}
          {m.user_id === user?.id && <span className="font-normal text-muted"> (คุณ)</span>}
        </b>
        <span className="truncate text-xs text-muted">{m.email}</span>
      </span>
      <span className="hidden w-32 text-xs text-muted lg:block">เข้าทีม {dayjs(m.accepted_at).format('D MMM YY')}</span>
      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs lg:rounded-[10px] lg:px-3 lg:py-1.5 lg:text-[13px] ${ROLE[m.role].cls}`}>
        {ROLE[m.role].label}
      </span>
      {canRemove(m) ? (
        <Popconfirm
          title={`นำ ${m.display_name} ออกจากทีม?`}
          okText="นำออก"
          cancelText="ยกเลิก"
          okButtonProps={{ danger: true }}
          onConfirm={() => remove(m, 'นำออกจากทีมแล้ว')}
        >
          <button type="button" aria-label={`นำ ${m.display_name} ออกจากทีม`} className="grid size-8 shrink-0 place-items-center text-lg text-muted hover:text-(--crowd-full)">
            <Trash />
          </button>
        </Popconfirm>
      ) : (
        <span className="hidden w-8 lg:block" />
      )}
    </li>
  );

  const pendingList =
    pending.length === 0 ? (
      <p className="text-sm text-muted">ไม่มีคำเชิญค้าง</p>
    ) : (
      <ul className="m-0 list-none p-0">
        {pending.map((m) => (
          <li key={m.user_id} className="flex items-center gap-2.5 border-t border-border/60 py-2 text-sm first:border-t-0 lg:first:border-t">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{m.email}</span>
              <span className="text-xs text-muted">
                {ROLE[m.role].label} · ส่งเมื่อ {dayjs(m.invited_at).format('D MMM')}
              </span>
            </span>
            <Popconfirm
              title={`ยกเลิกคำเชิญ ${m.email}?`}
              okText="ยกเลิกคำเชิญ"
              cancelText="ไม่"
              okButtonProps={{ danger: true }}
              onConfirm={() => remove(m, 'ยกเลิกคำเชิญแล้ว')}
            >
              <button type="button" className="text-[13px] text-(--crowd-full)">
                ยกเลิก
              </button>
            </Popconfirm>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">พนักงาน</h1>
          <p className="mt-1 hidden text-sm text-muted lg:block">
            {members.length} คน · Staff เห็นเฉพาะ คืนนี้ + การจอง · ผู้จัดการแก้ข้อมูลร้านได้
          </p>
        </div>
        <button type="button" aria-label="เชิญพนักงาน" onClick={() => setInviteOpen(true)} className="grid size-10 place-items-center text-xl text-gold lg:hidden">
          <UserPlus />
        </button>
      </div>

      {team.isLoading ? (
        <Skeleton active />
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ul className="m-0 flex list-none flex-col gap-2.5 self-start p-0 lg:gap-0 lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-border lg:bg-card">
            {members.length ? members.map(memberRow) : <Empty className="!my-10" description="ยังไม่มีสมาชิก" />}
          </ul>
          <div className="flex flex-col gap-4">
            <div className="hidden flex-col gap-3 rounded-[20px] border border-gold/35 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--gold)_14%,var(--card)),var(--card))] p-[22px] lg:flex">
              <span className="flex items-center gap-2.5 font-semibold">
                <UserPlus size={20} className="text-gold" /> เชิญพนักงาน
              </span>
              {!inviteOpen && inviteForm}
            </div>
            <Tile className="flex flex-col gap-2.5">
              <b className="text-sm font-semibold">คำเชิญที่ยังไม่ตอบรับ ({pending.length})</b>
              {pendingList}
            </Tile>
          </div>
        </div>
      )}

      <Drawer placement="bottom" size="auto" open={inviteOpen} onClose={() => setInviteOpen(false)} title="เชิญพนักงาน">
        {inviteOpen && inviteForm}
      </Drawer>
    </div>
  );
}
