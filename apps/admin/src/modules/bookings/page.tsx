import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { formatThaiPhone } from '@nightout/utils';
import { Input, Table, Timeline, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { StatusTag } from '@/ui/components/StatusTag';
import { baht, dateTime } from '@/ui/utils/format';
import { BOOKING_STATUS } from '@/ui/utils/labels';

/** หลักฐานที่ลูกค้าติ๊กยอมรับเงื่อนไขริบมัดจำตอน Checkout (แก้ไม่ได้ — ใช้ยืนยันเมื่อมีข้อพิพาท) */
function ConsentEvidence({ c }: { c: Db.AdminDepositConsent | null }) {
  if (!c)
    return (
      <Typography.Text type="secondary" className="text-sm">
        ไม่มีหลักฐานการยอมรับเงื่อนไขมัดจำ (การจองก่อนเปิดใช้ checkbox หรือไม่มีมัดจำ)
      </Typography.Text>
    );
  return (
    <div className="space-y-2 text-sm">
      <div className="font-medium">ลูกค้ายอมรับเงื่อนไขมัดจำแล้ว</div>
      <dl className="grid grid-cols-[96px_1fr] gap-y-1">
        <dt className="text-muted">เมื่อ</dt>
        <dd>{dateTime(c.accepted_at)}</dd>
        <dt className="text-muted">มัดจำ</dt>
        <dd>
          {baht(c.deposit_amount)} · คืนได้ถ้ายกเลิกก่อน {c.refund_before_hours} ชม. · มาสายได้ {c.grace_minutes} นาที
        </dd>
        <dt className="text-muted">IP</dt>
        <dd>{c.ip ?? '-'}</dd>
        <dt className="text-muted">อุปกรณ์</dt>
        <dd className="break-all">{c.user_agent ?? '-'}</dd>
        <dt className="text-muted">เวอร์ชัน</dt>
        <dd>{c.terms_version}</dd>
      </dl>
      <Typography.Paragraph className="!mb-0 whitespace-pre-line rounded border border-solid border-border p-2 text-xs">
        {c.terms_text}
      </Typography.Paragraph>
    </div>
  );
}

/** การจองทั้งระบบ — ค้นด้วยรหัสจอง ชื่อ/อีเมล หรือเบอร์ลูกค้า · กดแถวเพื่อดูประวัติสถานะและหลักฐานการยอมรับเงื่อนไขมัดจำ */
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
        b.customer?.email.toLowerCase().includes(k) ||
        (!!b.contact_phone && k.replace(/\D/g, '').length >= 4 && b.contact_phone.includes(k.replace(/\D/g, '').replace(/^0/, ''))),
    );
  }, [data, q]);

  return (
    <PageContainer
      title="การจอง"
      extra={<Input.Search placeholder="รหัสจอง / ชื่อ / อีเมล / เบอร์ลูกค้า" allowClear onSearch={setQ} className="w-72" />}
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
            <div className="grid gap-6 py-2 lg:grid-cols-2">
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
              <ConsentEvidence c={b.deposit_consent} />
            </div>
          ),
        }}
        columns={[
          { title: 'รหัส', dataIndex: 'code' },
          { title: 'ร้าน', key: 'bar', render: (_, b) => b.bar.name },
          { title: 'ลูกค้า', key: 'customer', render: (_, b) => b.customer?.display_name ?? 'บัญชีถูกลบ' },
          { title: 'เบอร์', dataIndex: 'contact_phone', render: (v: string | null) => (v ? formatThaiPhone(v) : '-') },
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
