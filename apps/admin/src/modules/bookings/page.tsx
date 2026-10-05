import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Input, Table, Timeline } from 'antd';
import { useMemo, useState } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { StatusTag } from '@/ui/components/StatusTag';
import { baht, dateTime } from '@/ui/utils/format';
import { BOOKING_STATUS } from '@/ui/utils/labels';

/** การจองทั้งระบบ — ค้นด้วยรหัสจองหรือชื่อ/อีเมลลูกค้า · กดแถวเพื่อดูประวัติสถานะ */
export function BookingsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading, error, refetch } = useAdminView('admin_bookings', {
    order: { column: 'booking_datetime', ascending: false },
  });
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data ?? []).filter(
      (b) =>
        !k ||
        b.code.toLowerCase().includes(k) ||
        b.customer?.display_name.toLowerCase().includes(k) ||
        b.customer?.email.toLowerCase().includes(k),
    );
  }, [data, q]);

  return (
    <PageContainer
      title="การจอง"
      extra={<Input.Search placeholder="รหัสจอง / ชื่อ / อีเมลลูกค้า" allowClear onSearch={setQ} className="w-72" />}
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminBooking>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 1000 }}
        expandable={{
          expandedRowRender: (b) => (
            <Timeline
              className="!mt-2"
              items={b.status_history.map((h) => ({
                content: (
                  <span className="text-sm">
                    {dateTime(h.created_at)} · {h.from_status ? `${BOOKING_STATUS[h.from_status].text} → ` : ''}
                    {BOOKING_STATUS[h.to_status].text} · {h.changed_by ?? 'ระบบ'}
                    {h.reason && h.reason !== 'created' ? ` · ${h.reason}` : ''}
                  </span>
                ),
              }))}
            />
          ),
        }}
        columns={[
          { title: 'รหัส', dataIndex: 'code' },
          { title: 'ร้าน', key: 'bar', render: (_, b) => b.bar.name },
          { title: 'ลูกค้า', key: 'customer', render: (_, b) => b.customer?.display_name ?? 'บัญชีถูกลบ' },
          { title: 'เวลา', dataIndex: 'booking_datetime', render: (v: string) => dateTime(v) },
          { title: 'คน', dataIndex: 'pax' },
          { title: 'โซน / โต๊ะ', key: 'zone', render: (_, b) => [b.zone_name, b.table_name].filter(Boolean).join(' · ') || '-' },
          { title: 'มัดจำ', dataIndex: 'deposit_required', align: 'right', render: (v: number) => (v ? baht(v) : '-') },
          {
            title: 'สถานะ',
            dataIndex: 'status',
            filters: Object.entries(BOOKING_STATUS).map(([value, l]) => ({ text: l.text, value })),
            onFilter: (v, b) => b.status === v,
            render: (s: string) => <StatusTag map={BOOKING_STATUS} value={s} />,
          },
        ]}
      />
    </PageContainer>
  );
}
