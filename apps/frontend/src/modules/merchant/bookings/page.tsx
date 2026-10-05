import { barBookings, setBookingStatus, type Booking } from '@/services/data';
import type { BookingStatus } from '@nightout/types';
import { nextStatuses } from '@nightout/utils';
import { App, Button, Card, Drawer, Segmented, Space, Table, Timeline } from 'antd';
import { useState } from 'react';
import { BookingStatusTag } from '@/ui/components/bookingStatusTag';
import { DepositSummary } from '@/ui/components/depositCard';
import { PageHeader } from '@/ui/components/pageHeader';
import { BOOKING_STATUS, dateTime } from '@/ui/utils/format';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  CONFIRMED: 'ยืนยัน',
  REJECTED: 'ปฏิเสธ',
  CHECKED_IN: 'เช็กอิน',
  COMPLETED: 'ปิดโต๊ะ',
  CANCELLED_BY_MERCHANT: 'ยกเลิก',
  AWAITING_DEPOSIT: 'สลิปไม่ผ่าน',
};

export function MerchantBookingsPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // สิทธิ์ตามบทบาทในทีมร้าน (พนักงานยกเลิกแทนร้านไม่ได้)
  const actor = bar.staffRole === 'STAFF' ? 'STAFF' : 'MERCHANT';
  const rows = barBookings(bar.id).filter(
    (b) =>
      filter === 'all' ||
      ['PENDING', 'AWAITING_DEPOSIT', 'DEPOSIT_SUBMITTED', 'CONFIRMED', 'CHECKED_IN'].includes(
        b.status,
      ),
  );

  const open = openId ? (barBookings(bar.id).find((b) => b.id === openId) ?? null) : null;
  const setOpen = (b: Booking | null) => setOpenId(b?.id ?? null);

  const act = async (b: Booking, to: BookingStatus) => {
    setBusy(`${b.id}:${to}`);
    try {
      await setBookingStatus(b.id, to);
      message.success(`${ACTION_LABEL[to]}แล้ว`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const actions = (b: Booking) =>
    nextStatuses(b.status, actor)
      .filter((s) => ACTION_LABEL[s])
      .map((s) => (
        <Button
          key={s}

          type={s === 'CONFIRMED' || s === 'CHECKED_IN' ? 'primary' : 'default'}
          loading={busy === `${b.id}:${s}`}
          danger={s === 'REJECTED' || s === 'CANCELLED_BY_MERCHANT'}
          onClick={(e) => {
            e.stopPropagation();
            void act(b, s);
          }}
        >
          {ACTION_LABEL[s]}
        </Button>
      ));

  return (
    <div>
      <PageHeader
        title="การจอง"
        extra={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'ที่ต้องจัดการ', value: 'upcoming' },
              { label: 'ทั้งหมด', value: 'all' },
            ]}
          />
        }
      />
      <Card>
        <Table
          rowKey="id"
          dataSource={rows}
          scroll={{ x: 720 }}
          onRow={(r) => ({ onClick: () => setOpen(r), className: 'cursor-pointer' })}
          columns={[
            {
              title: 'เวลา',
              dataIndex: 'datetime',
              render: (v: string) => dateTime(v),
              sorter: (a, b) => a.datetime.localeCompare(b.datetime),
            },
            { title: 'รหัส', dataIndex: 'code' },
            { title: 'ลูกค้า', dataIndex: 'userName' },
            { title: 'คน', dataIndex: 'pax', width: 60 },
            {
              title: 'โซน',
              dataIndex: 'zoneId',
              render: (z: string) => bar.zones.find((x) => x.id === z)?.name,
            },
            {
              title: 'สถานะ',
              dataIndex: 'status',
              render: (s: BookingStatus) => <BookingStatusTag status={s} />,
            },
            { title: '', key: 'a', render: (_, b) => <Space wrap>{actions(b)}</Space> },
          ]}
        />
      </Card>
      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.code} · ${open.userName}` : ''}
        size="large"
        extra={open && <Space>{actions(open)}</Space>}
      >
        {open && (
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">วันเวลา</dt>
                <dd>{dateTime(open.datetime)}</dd>
              </div>
              <div>
                <dt className="text-muted">จำนวน</dt>
                <dd>{open.pax} คน</dd>
              </div>
              <div>
                <dt className="text-muted">โซน / โต๊ะ</dt>
                <dd>
                  {bar.zones.find((z) => z.id === open.zoneId)?.name} ·{' '}
                  {bar.zones.flatMap((z) => z.tables).find((t) => t.id === open.tableId)?.name ??
                    '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted">สถานะ</dt>
                <dd>
                  <BookingStatusTag status={open.status} />
                </dd>
              </div>
              {open.note && (
                <div className="col-span-2">
                  <dt className="text-muted">หมายเหตุ</dt>
                  <dd>{open.note}</dd>
                </div>
              )}
            </dl>
            {open.promotionTitle && (
              <Card title="โปรโมชันที่ลูกค้าเลือก">{open.promotionTitle}</Card>
            )}
            <Card title="มัดจำ">
              <DepositSummary booking={open} />
            </Card>
            <Timeline
              items={open.history.map((h) => ({
                content: `${BOOKING_STATUS[h.to].label} · ${h.by} · ${dateTime(h.at)}`,
              }))}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
