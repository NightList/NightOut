import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { TierStars } from '@nightout/ui';
import { Button, Input, Switch, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { RejectButton } from '@/ui/components/RejectButton';
import { StatusTag } from '@/ui/components/StatusTag';
import { BAR_STATUS } from '@/ui/utils/labels';

/** ร้านทั้งหมด — ระงับ/เปิดใช้งาน และเลือก Editor's Pick */
export function BarsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading, error, refetch } = useAdminView('admin_bars', { order: { column: 'name', ascending: true } });
  const act = useAdminAction();
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data ?? []).filter((b) => !k || b.name.toLowerCase().includes(k) || b.slug.includes(k));
  }, [data, q]);

  return (
    <PageContainer
      title="จัดการร้าน"
      extra={<Input.Search placeholder="ค้นหาชื่อร้าน" allowClear onSearch={setQ} className="w-64" />}
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminBar>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 1000 }}
        columns={[
          { title: 'ร้าน', dataIndex: 'name' },
          { title: 'ย่าน', key: 'district', render: (_, b) => b.district?.name_th ?? '-' },
          {
            title: 'ดาว',
            key: 'stars',
            render: (_, b) => (b.is_new || !b.current_stars ? <Tag>ร้านใหม่</Tag> : <TierStars stars={b.current_stars} />),
          },
          {
            title: 'คะแนน',
            dataIndex: 'score',
            sorter: (a, b) => (a.score ?? 0) - (b.score ?? 0),
            render: (v: number | null) => v ?? '-',
          },
          {
            title: 'สถานะ',
            dataIndex: 'status',
            filters: Object.entries(BAR_STATUS).map(([value, l]) => ({ text: l.text, value })),
            onFilter: (v, b) => b.status === v,
            render: (s: string) => <StatusTag map={BAR_STATUS} value={s} />,
          },
          {
            title: "Editor's Pick",
            dataIndex: 'is_editor_pick',
            render: (v: boolean, b) => (
              <Switch
                checked={v}
                aria-label={`Editor's Pick ${b.name}`}
                loading={act.isPending && act.variables?.path === `bars/${b.id}/editor-pick`}
                onChange={(value) =>
                  act.mutate({
                    method: 'PATCH',
                    path: `bars/${b.id}/editor-pick`,
                    body: { value },
                    success: value ? `เลือก ${b.name} เป็น Editor's Pick` : `เอา ${b.name} ออกจาก Editor's Pick`,
                  })
                }
              />
            ),
          },
          {
            title: '',
            key: 'a',
            render: (_, b) =>
              b.status === 'SUSPENDED' ? (
                <Button
                  loading={act.isPending}
                  onClick={() =>
                    act.mutate({
                      method: 'PATCH',
                      path: `bars/${b.id}/status`,
                      body: { status: 'APPROVED' },
                      success: `เปิดใช้งาน ${b.name} แล้ว`,
                    })
                  }
                >
                  เปิดใช้งาน
                </Button>
              ) : b.status === 'APPROVED' ? (
                <RejectButton
                  label="ระงับ"
                  title={`ระงับ ${b.name}? ร้านจะหายจากเว็บทันที`}
                  loading={act.isPending}
                  onReject={(reason) =>
                    act.mutate({
                      method: 'PATCH',
                      path: `bars/${b.id}/status`,
                      body: { status: 'SUSPENDED', reason },
                      success: `ระงับ ${b.name} แล้ว`,
                    })
                  }
                />
              ) : null,
          },
        ]}
      />
    </PageContainer>
  );
}
