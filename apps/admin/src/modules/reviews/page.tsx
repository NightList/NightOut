import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Button, Popconfirm, Rate, Space, Table, Tabs, Tag } from 'antd';
import { useMemo } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { StatusTag } from '@/ui/components/StatusTag';
import { dateTime } from '@/ui/utils/format';
import { REPORT_REASON, REVIEW_STATUS } from '@/ui/utils/labels';

type Row = Db.AdminReview;
type Action = 'KEEP' | 'HIDE' | 'REMOVE' | 'RESTORE';
const DONE: Record<Action, string> = {
  KEEP: 'เก็บรีวิวไว้ และปิดรายงานแล้ว',
  HIDE: 'ซ่อนรีวิวแล้ว',
  REMOVE: 'ลบรีวิวแล้ว',
  RESTORE: 'แสดงรีวิวอีกครั้งแล้ว',
};

/** รีวิวที่ลูกค้ารายงาน — เก็บไว้ / ซ่อน / ลบ · และรีวิวที่ถูกซ่อนหรือลบไปแล้ว (คืนได้) */
export function ReviewsPage() {
  const { data, isLoading, error, refetch } = useAdminView('admin_reviews', {
    order: { column: 'created_at', ascending: false },
  });
  const act = useAdminAction();
  const moderate = (r: Row, action: Action) =>
    act.mutate({ method: 'POST', path: `reviews/${r.id}/moderate`, body: { action }, success: DONE[action] });

  const reported = useMemo(() => (data ?? []).filter((r) => r.open_report_count > 0), [data]);
  const hidden = useMemo(() => (data ?? []).filter((r) => r.status !== 'PUBLISHED'), [data]);

  const columns = (withActions: 'reported' | 'hidden') => [
    { title: 'ร้าน', key: 'bar', render: (_: unknown, r: Row) => r.bar.name },
    { title: 'ผู้รีวิว', dataIndex: 'author_name', render: (v: string | null) => v ?? 'บัญชีถูกลบ' },
    { title: 'คะแนน', dataIndex: 'rating', render: (v: number) => <Rate disabled value={v} className="!text-sm" /> },
    { title: 'ความเห็น', dataIndex: 'comment', render: (v: string | null) => v ?? '-' },
    {
      title: 'ถูกรายงาน',
      key: 'reports',
      render: (_: unknown, r: Row) => (
        <Space size={[4, 4]} wrap>
          {r.reports
            .filter((x) => x.status === 'OPEN')
            .map((x) => (
              <Tag key={x.created_at} color="red" title={x.detail ?? undefined}>
                {REPORT_REASON[x.reason] ?? x.reason}
              </Tag>
            ))}
        </Space>
      ),
    },
    { title: 'สถานะ', dataIndex: 'status', render: (s: string) => <StatusTag map={REVIEW_STATUS} value={s} /> },
    { title: 'เมื่อ', dataIndex: 'created_at', render: (v: string) => dateTime(v) },
    {
      title: '',
      key: 'a',
      render: (_: unknown, r: Row) =>
        withActions === 'reported' ? (
          <Space>
            <Button loading={act.isPending} onClick={() => moderate(r, 'KEEP')}>
              เก็บไว้
            </Button>
            <Button loading={act.isPending} onClick={() => moderate(r, 'HIDE')}>
              ซ่อน
            </Button>
            <Popconfirm title="ลบรีวิวนี้?" okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }} onConfirm={() => moderate(r, 'REMOVE')}>
              <Button danger loading={act.isPending}>
                ลบ
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Button loading={act.isPending} onClick={() => moderate(r, 'RESTORE')}>
            แสดงอีกครั้ง
          </Button>
        ),
    },
  ];

  return (
    <PageContainer title="รีวิวที่ถูกรายงาน">
      <LoadError error={error} onRetry={() => void refetch()} />
      <Tabs
        items={[
          {
            key: 'reported',
            label: `รอตัดสิน (${reported.length})`,
            children: (
              <Table<Row>
                rowKey="id"
                loading={isLoading}
                dataSource={reported}
                pagination={{ pageSize: PAGE_SIZE }}
                scroll={{ x: 1100 }}
                locale={{ emptyText: 'ไม่มีรีวิวที่ถูกรายงาน' }}
                columns={columns('reported')}
              />
            ),
          },
          {
            key: 'hidden',
            label: `ซ่อน / ลบแล้ว (${hidden.length})`,
            children: (
              <Table<Row>
                rowKey="id"
                loading={isLoading}
                dataSource={hidden}
                pagination={{ pageSize: PAGE_SIZE }}
                scroll={{ x: 1100 }}
                locale={{ emptyText: 'ไม่มีรีวิวที่ถูกซ่อน' }}
                columns={columns('hidden')}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
