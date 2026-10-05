import { PageContainer } from '@ant-design/pro-components';
import { UserPlus } from '@phosphor-icons/react';
import type { Db } from '@nightout/types';
import { App, Button, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAuth } from '@/services/adminAuth';
import { useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { formatThaiPhone } from '@nightout/utils';
import { dateTime } from '@/ui/utils/format';
import { STAFF_ROLE, USER_ROLE } from '@/ui/utils/labels';
import { CreateUserModal } from './modal/createUserModal';

type Role = Db.Enums<'user_role'>;
const ROLE_OPTIONS = (Object.keys(USER_ROLE) as Role[]).map((r) => ({
  value: r,
  label: USER_ROLE[r].text,
}));

/**
 * ผู้ใช้ทั้งหมด — เพิ่มผู้ใช้ (ลูกค้า / แอดมิน / เจ้าของ / ผู้จัดการ / พนักงานร้าน) · เปลี่ยนสิทธิ์ได้ (ลงบันทึก audit)
 */
export function UsersPage() {
  const { modal } = App.useApp();
  const auth = useAdminAuth();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const { data, isLoading, error, refetch } = useAdminView('admin_users', {
    order: { column: 'created_at', ascending: false },
  });
  const act = useAdminAction();
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data ?? []).filter(
      (u) =>
        !k ||
        u.email.toLowerCase().includes(k) ||
        u.display_name.toLowerCase().includes(k) ||
        (!!u.phone_e164 && k.replace(/\D/g, '').length >= 4 && u.phone_e164.includes(k.replace(/\D/g, '').replace(/^0/, ''))),
    );
  }, [data, q]);

  const unban = (u: Db.AdminUser) =>
    modal.confirm({
      title: `ปลดแบน ${u.display_name}?`,
      content: `จองโต๊ะได้อีกครั้ง · ปลดเบอร์ ${u.banned_phones.map(formatThaiPhone).join(', ') || '-'} · ล้างธงสลิปปลอม ${u.fake_slip_count} ครั้ง (บันทึกใน Audit Log)`,
      okText: 'ปลดแบน',
      cancelText: 'ยกเลิก',
      onOk: () =>
        act.mutateAsync({
          method: 'POST',
          path: `users/${u.id}/unban`,
          body: {},
          success: `${u.display_name} จองโต๊ะได้แล้ว`,
        }),
    });

  const changeRole = (u: Db.AdminUser, role: Role) =>
    modal.confirm({
      title: `เปลี่ยนสิทธิ์ ${u.display_name}?`,
      content: `${USER_ROLE[u.role].text} → ${USER_ROLE[role].text}${role === 'ADMIN' ? ' (เข้าหลังบ้านได้ทั้งหมด)' : ''}`,
      okText: 'เปลี่ยนสิทธิ์',
      cancelText: 'ยกเลิก',
      onOk: () =>
        act.mutateAsync({
          method: 'PATCH',
          path: `users/${u.id}/role`,
          body: { role },
          success: `${u.display_name} เป็น${USER_ROLE[role].text}แล้ว`,
        }),
    });

  return (
    <PageContainer
      title="ผู้ใช้"
      extra={
        <Space wrap>
          <Input.Search placeholder="ชื่อ / อีเมล / เบอร์" allowClear onSearch={setQ} className="w-64" />
          <Button type="primary" icon={<UserPlus size={16} weight="bold" />} onClick={() => setCreating(true)}>
            เพิ่มผู้ใช้
          </Button>
        </Space>
      }
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminUser>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 1100 }}
        columns={[
          { title: 'ชื่อ', dataIndex: 'display_name' },
          { title: 'อีเมล', dataIndex: 'email' },
          { title: 'เบอร์', dataIndex: 'phone_e164', render: (v: string | null) => (v ? formatThaiPhone(v) : '-') },
          {
            title: 'สิทธิ์',
            dataIndex: 'role',
            filters: ROLE_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
            onFilter: (v, u) => u.role === v,
            render: (role: Role, u) => (
              <Select<Role>
                className="w-36"
                value={role}
                options={ROLE_OPTIONS}
                disabled={u.id === auth.session?.user.id || !!u.deleted_at}
                aria-label={`สิทธิ์ของ ${u.display_name}`}
                onChange={(next) => changeRole(u, next)}
              />
            ),
          },
          {
            title: 'ร้าน',
            key: 'bars',
            render: (_, u) =>
              u.bars.length ? (
                <Space size={[4, 4]} wrap>
                  {u.bars.map((b) => (
                    <Tag key={b.id}>
                      {b.name} · {STAFF_ROLE[b.role]}
                    </Tag>
                  ))}
                </Space>
              ) : (
                '-'
              ),
          },
          {
            title: 'การจอง',
            key: 'ban',
            filters: [
              { text: 'ถูกแบน', value: 'banned' },
              { text: 'มีธงสลิปปลอม', value: 'flagged' },
            ],
            onFilter: (v, u) => (v === 'banned' ? !!u.banned_at : u.fake_slip_count > 0),
            render: (_, u) =>
              u.banned_at ? (
                <Space size={4} wrap>
                  <Tag color="red" title={u.ban_reason ?? undefined}>
                    ถูกแบน · {dateTime(u.banned_at)}
                  </Tag>
                  <Button size="small" onClick={() => unban(u)}>
                    ปลดแบน
                  </Button>
                </Space>
              ) : u.fake_slip_count > 0 ? (
                <Tag color="orange">สลิปปลอม {u.fake_slip_count} ครั้ง</Tag>
              ) : (
                <Typography.Text type="secondary">ปกติ</Typography.Text>
              ),
          },
          {
            title: 'สมัครเมื่อ',
            dataIndex: 'created_at',
            render: (v: string, u) => (u.deleted_at ? <Tag>ลบบัญชีแล้ว</Tag> : dateTime(v)),
          },
        ]}
      />
      <CreateUserModal open={creating} onClose={() => setCreating(false)} />
    </PageContainer>
  );
}
