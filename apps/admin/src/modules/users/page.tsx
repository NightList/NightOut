import { PageContainer } from '@ant-design/pro-components';
import { PencilSimple, Trash, UserPlus } from '@phosphor-icons/react';
import type { Db } from '@nightout/types';
import { App, Button, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAuth } from '@/services/adminAuth';
import { useAccountRoles, useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { formatThaiPhone } from '@nightout/utils';
import { dateTime } from '@/ui/utils/format';
import { STAFF_ROLE, USER_ROLE } from '@/ui/utils/labels';
import { CreateUserModal } from './modal/createUserModal';
import { EditUserModal } from './modal/editUserModal';

type Role = Db.Enums<'user_role'>;
/** ชั้นที่ไม่ผูกกับร้าน — แก้เป็นชั้นนี้แล้วหลุดจากทุกร้าน (admin_set_user_role) */
const LEAVES_BARS: Role[] = ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'];

/**
 * ผู้ใช้ทั้งหมด — เพิ่มผู้ใช้ (แอดมินสร้างได้แค่ลูกค้า / เจ้าของ / ผู้จัดการ / พนักงานร้าน)
 * แก้ชั้นบัญชีที่สร้างผิดได้เฉพาะซูเปอร์แอดมิน (ADR 0005 · ลงบันทึก audit)
 */
export function UsersPage() {
  const { modal } = App.useApp();
  const auth = useAdminAuth();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Db.AdminUser | null>(null);
  const { data, isLoading, error, refetch } = useAdminView('admin_users', {
    order: { column: 'created_at', ascending: false },
  });
  const roles = useAccountRoles();
  const act = useAdminAction();
  const roleText = (r: Role) =>
    roles.data?.find((o) => o.code === r)?.label_th ?? USER_ROLE[r].text;
  const roleOptions = useMemo(
    () =>
      (roles.data ?? [])
        .filter((o) => o.can_assign)
        .map((o) => ({ value: o.code, label: o.label_th })),
    [roles.data],
  );
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data ?? []).filter(
      (u) =>
        !k ||
        u.email.toLowerCase().includes(k) ||
        u.display_name.toLowerCase().includes(k) ||
        (!!u.phone_e164 &&
          k.replace(/\D/g, '').length >= 4 &&
          u.phone_e164.includes(k.replace(/\D/g, '').replace(/^0/, ''))),
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

  const changeRole = (u: Db.AdminUser, role: Role) => {
    const self = u.id === auth.session?.user.id;
    const notes = [
      role === 'ADMIN' && 'เข้าหลังบ้านได้ (ตั้ง MFA ตอนเข้าครั้งแรก) แต่แก้ชั้นบัญชีไม่ได้',
      role === 'SUPER_ADMIN' && 'เข้าหลังบ้านได้ และแก้ชั้นบัญชีของทุกคนได้',
      LEAVES_BARS.includes(role) &&
        u.bars.length > 0 &&
        `หลุดจากร้าน ${u.bars.map((b) => b.name).join(', ')} (เลิกเป็นเจ้าของและออกจากทีม)`,
      self &&
        u.role === 'SUPER_ADMIN' &&
        role !== 'SUPER_ADMIN' &&
        'นี่คือบัญชีของคุณ — หลังเปลี่ยน คุณจะแก้ชั้นบัญชีไม่ได้อีก',
    ].filter((n): n is string => !!n);
    modal.confirm({
      title: `แก้ชั้นบัญชีของ ${u.display_name}?`,
      content: (
        <div className="flex flex-col gap-1">
          <span>
            {roleText(u.role)} → {roleText(role)}
          </span>
          {notes.map((n) => (
            <Typography.Text key={n} type="secondary">
              {n}
            </Typography.Text>
          ))}
        </div>
      ),
      okText: 'แก้ชั้นบัญชี',
      okButtonProps: { danger: LEAVES_BARS.includes(role) && u.bars.length > 0 },
      cancelText: 'ยกเลิก',
      onOk: () =>
        act.mutateAsync({
          method: 'PATCH',
          path: `users/${u.id}/role`,
          body: { role },
          success: `${u.display_name} เป็น${roleText(role)}แล้ว`,
        }),
    });
  };

  return (
    <PageContainer
      title="ผู้ใช้"
      subTitle={auth.isSuperAdmin ? undefined : 'แก้ชั้นบัญชีได้เฉพาะซูเปอร์แอดมิน'}
      extra={
        <Space wrap>
          <Input.Search
            placeholder="ชื่อ / อีเมล / เบอร์"
            allowClear
            onSearch={setQ}
            className="w-64"
          />
          {auth.isSuperAdmin && (
            <Button
              type="primary"
              icon={<UserPlus size={16} weight="bold" />}
              onClick={() => setCreating(true)}
            >
              เพิ่มผู้ใช้
            </Button>
          )}
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
          {
            title: 'เบอร์',
            dataIndex: 'phone_e164',
            render: (v: string | null) => (v ? formatThaiPhone(v) : '-'),
          },
          {
            title: 'ชั้นบัญชี',
            dataIndex: 'role',
            filters: (roles.data ?? []).map((o) => ({ text: o.label_th, value: o.code })),
            onFilter: (v, u) => u.role === v,
            render: (role: Role, u) =>
              auth.isSuperAdmin && !u.deleted_at ? (
                <Select<Role>
                  className="w-40"
                  value={role}
                  options={roleOptions}
                  loading={roles.isLoading}
                  aria-label={`ชั้นบัญชีของ ${u.display_name}`}
                  onChange={(next) => changeRole(u, next)}
                />
              ) : (
                <Tag color={USER_ROLE[role].color}>{roleText(role)}</Tag>
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
          {
            title: 'จัดการ',
            key: 'actions',
            align: 'right',
            render: (_, u) => {
              const canEdit = auth.isSuperAdmin || u.id === auth.session?.user.id;
              if (!canEdit && !auth.isSuperAdmin) return null;
              return (
                <Space size={4}>
                  {canEdit && (
                    <Button
                      icon={<PencilSimple size={16} />}
                      aria-label={`แก้ไข ${u.display_name}`}
                      onClick={() => setEditing(u)}
                    ></Button>
                  )}
                  {auth.isSuperAdmin && !u.deleted_at && (
                    <Popconfirm
                      title={`ลบบัญชี ${u.display_name}?`}
                      description="บัญชีจะเข้าสู่สถานะลบและเข้าสู่ระบบไม่ได้"
                      okText="ลบ"
                      okButtonProps={{ danger: true }}
                      cancelText="ยกเลิก"
                      onConfirm={() =>
                        act.mutateAsync({
                          method: 'DELETE',
                          path: `users/${u.id}`,
                          success: `ลบบัญชี ${u.display_name} แล้ว`,
                        })
                      }
                    >
                      <Button
                        danger
                        icon={<Trash size={16} />}
                        aria-label={`ลบบัญชี ${u.display_name}`}
                      />
                    </Popconfirm>
                  )}
                </Space>
              );
            },
          },
        ]}
      />
      <CreateUserModal open={creating} onClose={() => setCreating(false)} />
      <EditUserModal user={editing} open={!!editing} onClose={() => setEditing(null)} />
    </PageContainer>
  );
}
