import { PageContainer } from '@ant-design/pro-components';
import {
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  PencilSimple,
  Plus,
  Trash,
  UserCircle,
} from '@phosphor-icons/react';
import type { Db } from '@nightout/types';
import { Avatar, Button, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { TeamMemberDrawer } from './form/teamMemberDrawer';
import { contactCount } from './utils/contacts';
import { photoSrc } from './utils/photo';

/** หน้าเกี่ยวกับเราบนเว็บลูกค้า (deploy: โดเมนเดียวกัน · dev: คนละ port) */
const ABOUT_URL = import.meta.env.DEV ? 'http://localhost:5173/about' : '/about';

/**
 * จัดการทีมงาน — คนที่แสดงในหน้า /about ของเว็บลูกค้า
 * เพิ่ม / แก้ / ซ่อน / ลบ / เลื่อนลำดับ (ลำดับในตาราง = ลำดับบนหน้าเว็บ) · ทุกการเปลี่ยนแปลงลง Audit Log
 */
export function TeamPage() {
  const { data, isLoading, error, refetch } = useAdminView('admin_team_members', {
    order: { column: 'sort_order', ascending: true },
  });
  const act = useAdminAction();
  const [editing, setEditing] = useState<Db.AdminTeamMember | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const rows = data ?? [];
  const shown = rows.filter((r) => r.active).length;

  const openDrawer = (m: Db.AdminTeamMember | null) => {
    setEditing(m);
    setDrawerOpen(true);
  };

  const move = (index: number, dir: -1 | 1) => {
    const ids = rows.map((r) => r.id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + dir, 0, id!);
    act.mutate({
      method: 'PUT',
      path: 'team-members/order',
      body: { ids },
      success: 'เปลี่ยนลำดับแล้ว',
    });
  };

  return (
    <PageContainer
      title="จัดการทีมงาน"
      subTitle={data ? `แสดงบนเว็บ ${shown} จาก ${rows.length} คน` : undefined}
      extra={
        <Space>
          <Button
            href={ABOUT_URL}
            target="_blank"
            rel="noreferrer"
            icon={<ArrowSquareOut size={16} />}
          >
            ดูหน้าเกี่ยวกับเรา
          </Button>
          <Button
            type="primary"
            icon={<Plus size={16} weight="bold" />}
            onClick={() => openDrawer(null)}
          >
            เพิ่มทีมงาน
          </Button>
        </Space>
      }
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminTeamMember>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 880 }}
        rowClassName={(r) => (r.active ? '' : 'opacity-60')}
        locale={{ emptyText: 'ยังไม่มีทีมงาน — กด "เพิ่มทีมงาน" เพื่อเริ่ม' }}
        columns={[
          {
            title: 'ลำดับ',
            key: 'order',
            width: 96,
            render: (_, r, i) => (
              <Space size={2}>
                <Tooltip title="เลื่อนขึ้น">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUp size={16} />}
                    aria-label={`เลื่อน ${r.nickname} ขึ้น`}
                    disabled={i === 0 || act.isPending}
                    onClick={() => move(i, -1)}
                  />
                </Tooltip>
                <Tooltip title="เลื่อนลง">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDown size={16} />}
                    aria-label={`เลื่อน ${r.nickname} ลง`}
                    disabled={i === rows.length - 1 || act.isPending}
                    onClick={() => move(i, 1)}
                  />
                </Tooltip>
              </Space>
            ),
          },
          {
            title: 'ทีมงาน',
            key: 'member',
            render: (_, r) => (
              <div className="flex items-center gap-3">
                <Avatar
                  size={48}
                  src={photoSrc(r.photo_url)}
                  icon={<UserCircle size={32} weight="thin" />}
                  alt=""
                />
                <div className="min-w-0">
                  <div className="font-semibold">{r.nickname}</div>
                  {r.full_name && (
                    <Typography.Text type="secondary" className="text-xs">
                      {r.full_name}
                    </Typography.Text>
                  )}
                </div>
              </div>
            ),
          },
          {
            title: 'ตำแหน่ง',
            dataIndex: 'roles',
            render: (roles: string[]) =>
              roles.length ? (
                <Space size={[4, 4]} wrap>
                  {roles.map((role, i) => (
                    <Tag key={role} color={i === 0 ? 'gold' : undefined}>
                      {role}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">ยังไม่ระบุ</Typography.Text>
              ),
          },
          {
            title: 'ข้อมูล',
            key: 'completeness',
            width: 150,
            render: (_, r) => {
              const n = contactCount(r.contacts);
              return (
                <Typography.Text type="secondary" className="text-xs">
                  {r.bio ? 'มีแนะนำตัว' : 'ไม่มีแนะนำตัว'}
                  <br />
                  {n ? `ช่องทางติดต่อ ${n}` : 'ไม่มีช่องทางติดต่อ'}
                </Typography.Text>
              );
            },
          },
          {
            title: 'แสดงบนเว็บ',
            dataIndex: 'active',
            width: 110,
            render: (active: boolean, r) => (
              <Switch
                checked={active}
                loading={act.isPending && act.variables?.path === `team-members/${r.id}`}
                aria-label={`แสดง ${r.nickname} บนหน้าเกี่ยวกับเรา`}
                onChange={(next) =>
                  act.mutate({
                    method: 'PATCH',
                    path: `team-members/${r.id}`,
                    body: { active: next },
                    success: next ? `แสดง${r.nickname}บนเว็บแล้ว` : `ซ่อน${r.nickname}จากเว็บแล้ว`,
                  })
                }
              />
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 120,
            align: 'right',
            render: (_, r) => (
              <Space size={4}>
                <Tooltip title="แก้ข้อมูล">
                  <Button
                    icon={<PencilSimple size={16} />}
                    aria-label={`แก้ข้อมูล ${r.nickname}`}
                    onClick={() => openDrawer(r)}
                  />
                </Tooltip>
                <Popconfirm
                  title={`ลบ ${r.nickname} ออกจากทีม?`}
                  description="ลบแล้วกู้คืนไม่ได้ ถ้าแค่ไม่อยากให้แสดง ให้ปิด “แสดงบนเว็บ” แทน"
                  okText="ลบ"
                  okButtonProps={{ danger: true }}
                  cancelText="ยกเลิก"
                  onConfirm={() =>
                    act.mutateAsync({
                      method: 'DELETE',
                      path: `team-members/${r.id}`,
                      success: `ลบ${r.nickname}แล้ว`,
                    })
                  }
                >
                  <Tooltip title="ลบ">
                    <Button danger icon={<Trash size={16} />} aria-label={`ลบ ${r.nickname}`} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <TeamMemberDrawer open={drawerOpen} member={editing} onClose={() => setDrawerOpen(false)} />
    </PageContainer>
  );
}
