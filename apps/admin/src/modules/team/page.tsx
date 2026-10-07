import { PageContainer } from '@ant-design/pro-components';
import { DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowSquareOut, PencilSimple, Plus, Trash, UserCircle } from '@phosphor-icons/react';
import type { Db } from '@nightout/types';
import { Avatar, Button, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { useAdminAuth } from '@/services/adminAuth';
import { useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { DragHandle, SortableDisabledContext, SortableRow } from './components/sortableRow';
import { TeamMemberDrawer } from './form/teamMemberDrawer';
import { contactCount, isOwnMember } from './utils/contacts';
import { photoSrc } from './utils/photo';
import { useTeamOrder } from './utils/useTeamOrder';

/** หน้าเกี่ยวกับเราบนเว็บลูกค้า (deploy: โดเมนเดียวกัน · dev: คนละ port) */
const ABOUT_URL = import.meta.env.DEV ? 'http://localhost:5173/about' : '/about';

/**
 * จัดการทีมงาน — คนที่แสดงในหน้า /about ของเว็บลูกค้า
 * เพิ่ม / ลบ / ลากเรียงลำดับ = ซูเปอร์แอดมิน (ลำดับในตาราง = ลำดับบนหน้าเว็บ)
 * แก้ / ซ่อน = ซูเปอร์แอดมินทุกแถว · แอดมินเฉพาะแถวที่อีเมลในช่องทางติดต่อตรงกับอีเมลบัญชี · ทุกการเปลี่ยนแปลงลง Audit Log
 */
export function TeamPage() {
  const { data, isLoading, error, refetch } = useAdminView('admin_team_members', {
    order: { column: 'sort_order', ascending: true },
  });
  const act = useAdminAction();
  const { isSuperAdmin, session } = useAdminAuth();
  const canEdit = (r: Db.AdminTeamMember) =>
    isSuperAdmin || isOwnMember(r.contacts, session?.user.email);
  const [editing, setEditing] = useState<Db.AdminTeamMember | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const rows = data ?? [];
  const shown = rows.filter((r) => r.active).length;

  const openDrawer = (m: Db.AdminTeamMember | null) => {
    setEditing(m);
    setDrawerOpen(true);
  };

  const order = useTeamOrder(rows);

  return (
    <PageContainer
      title="จัดการทีมงาน"
      subTitle={
        data
          ? `แสดงบนเว็บ ${shown} จาก ${rows.length} คน${isSuperAdmin ? '' : ' · แอดมินแก้/ซ่อนได้เฉพาะแถวของตัวเอง'}`
          : undefined
      }
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
          {isSuperAdmin && (
            <Button
              type="primary"
              icon={<Plus size={16} weight="bold" />}
              onClick={() => openDrawer(null)}
            >
              เพิ่มทีมงาน
            </Button>
          )}
        </Space>
      }
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      {/* ลากเรียงลำดับ — เฉพาะซูเปอร์แอดมิน (API ตอบ SUPER_ADMIN_REQUIRED ถ้าไม่ใช่) · ระหว่างบันทึกล็อกไว้ */}
      <DndContext
        sensors={order.sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={order.onDragEnd}
      >
        <SortableContext
          items={order.ordered.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <SortableDisabledContext.Provider value={!isSuperAdmin || order.saving}>
            <Table<Db.AdminTeamMember>
              rowKey="id"
              loading={isLoading}
              dataSource={order.ordered}
              components={{ body: { row: SortableRow } }}
              pagination={false}
              scroll={{ x: 880 }}
              rowClassName={(r) => (r.active ? '' : 'opacity-60')}
              locale={{ emptyText: 'ยังไม่มีทีมงาน — กด "เพิ่มทีมงาน" เพื่อเริ่ม' }}
              columns={[
                ...(!isSuperAdmin
                  ? []
                  : [
                      {
                        title: 'ลำดับ',
                        key: 'order',
                        width: 64,
                        align: 'center' as const,
                        render: (_: unknown, r: Db.AdminTeamMember) => (
                          <Tooltip title="ลากเพื่อจัดลำดับ">
                            <DragHandle label={`ลากเพื่อจัดลำดับ ${r.nickname}`} />
                          </Tooltip>
                        ),
                      },
                    ]),
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
                      disabled={!canEdit(r)}
                      loading={act.isPending && act.variables?.path === `team-members/${r.id}`}
                      aria-label={`แสดง ${r.nickname} บนหน้าเกี่ยวกับเรา`}
                      onChange={(next) =>
                        act.mutate({
                          method: 'PATCH',
                          path: `team-members/${r.id}`,
                          body: { active: next },
                          success: next
                            ? `แสดง${r.nickname}บนเว็บแล้ว`
                            : `ซ่อน${r.nickname}จากเว็บแล้ว`,
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
                      <Tooltip
                        title={canEdit(r) ? 'แก้ข้อมูล' : 'แก้ได้เฉพาะแถวที่อีเมลตรงกับบัญชีของคุณ'}
                      >
                        <Button
                          icon={<PencilSimple size={16} />}
                          aria-label={`แก้ข้อมูล ${r.nickname}`}
                          disabled={!canEdit(r)}
                          onClick={() => openDrawer(r)}
                        />
                      </Tooltip>
                      {isSuperAdmin && (
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
                            <Button
                              danger
                              icon={<Trash size={16} />}
                              aria-label={`ลบ ${r.nickname}`}
                            />
                          </Tooltip>
                        </Popconfirm>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
          </SortableDisabledContext.Provider>
        </SortableContext>
      </DndContext>
      <TeamMemberDrawer
        open={drawerOpen}
        member={editing}
        lockEmail={!isSuperAdmin}
        onClose={() => setDrawerOpen(false)}
      />
    </PageContainer>
  );
}
