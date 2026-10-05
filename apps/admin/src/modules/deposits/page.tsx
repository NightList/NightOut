import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Button, Popconfirm, Space, Statistic, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { RejectButton } from '@/ui/components/RejectButton';
import { SlipImage } from '@/ui/components/SlipImage';
import { StatusTag } from '@/ui/components/StatusTag';
import { baht, dateTime } from '@/ui/utils/format';
import { BOOKING_STATUS, SETTLEMENT } from '@/ui/utils/labels';

type Row = Db.AdminDeposit;

/**
 * /deposits — เงินมัดจำทั้งระบบ (เงินเข้า NightOut)
 * 1) ตรวจสลิปที่ลูกค้าโอนเข้า PromptPay ของเรา → ยืนยันโต๊ะ
 * 2) หลังลูกค้าเช็กอิน/ไม่มา → โอนให้ร้านตามบัญชีที่ร้านตั้งไว้ หรือเก็บเป็นเครดิตร้าน · ยกเลิกทันเวลา → คืนลูกค้า
 */
export function DepositsPage() {
  const { data, isLoading, error, refetch } = useAdminView('admin_deposits', {
    order: { column: 'created_at', ascending: true },
  });
  const act = useAdminAction();

  const g = useMemo(() => {
    const all = data ?? [];
    return {
      toVerify: all.filter((d) => d.status === 'SUBMITTED'),
      toPayout: all.filter((d) => d.status === 'VERIFIED' && d.settlement === 'PAYOUT_PENDING'),
      toRefund: all.filter((d) => d.status === 'VERIFIED' && d.settlement === 'REFUND_PENDING'),
      held: all.filter((d) => d.status === 'VERIFIED' && d.settlement === 'HELD'),
      settled: all
        .filter((d) => ['PAID_OUT', 'CREDIT', 'REFUNDED'].includes(d.settlement) || d.status === 'REJECTED')
        .reverse(),
    };
  }, [data]);
  const sum = (rows: Row[]) => rows.reduce((a, b) => a + b.amount, 0);

  const settle = (d: Row, how: 'PAID_OUT' | 'CREDIT' | 'REFUNDED', success: string) =>
    act.mutate({ method: 'POST', path: `deposits/${d.id}/settle`, body: { how }, success });

  const base: ColumnsType<Row> = [
    { title: 'รหัสจอง', key: 'code', width: 110, render: (_, d) => d.booking.code },
    { title: 'ร้าน', key: 'bar', render: (_, d) => d.bar.name },
    { title: 'ลูกค้า', key: 'customer', render: (_, d) => d.customer?.display_name ?? 'บัญชีถูกลบ' },
    { title: 'วันที่จอง', key: 'at', render: (_, d) => dateTime(d.booking.booking_datetime) },
    { title: 'ยอด', dataIndex: 'amount', align: 'right', render: (v: number) => baht(v) },
  ];
  const table = (rows: Row[], extra: ColumnsType<Row>, empty: string) => (
    <Table<Row>
      rowKey="id"
      loading={isLoading}
      dataSource={rows}
      pagination={{ pageSize: PAGE_SIZE }}
      scroll={{ x: 1000 }}
      locale={{ emptyText: empty }}
      columns={[...base, ...extra]}
    />
  );
  const payoutAccount: ColumnsType<Row>[number] = {
    title: 'บัญชีร้าน',
    key: 'acct',
    render: (_, d) =>
      d.payout_account
        ? `${d.payout_account.bank_code} ••••${d.payout_account.account_no_last4} (${d.payout_account.account_name})`
        : <Tag color="red">ร้านยังไม่ตั้งบัญชี</Tag>,
  };

  return (
    <PageContainer
      title="เงินมัดจำ"
      subTitle="ลูกค้าโอนเข้า PromptPay ของ NightOut · เราถือไว้จนเช็กอิน แล้วส่งต่อให้ร้าน"
      extra={
        <Space size="large">
          <Statistic title="รอตรวจสลิป" value={g.toVerify.length} suffix="รายการ" />
          <Statistic title="ถือไว้" value={sum(g.held)} prefix="฿" />
          <Statistic title="รอโอนให้ร้าน" value={sum(g.toPayout)} prefix="฿" />
        </Space>
      }
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Tabs
        items={[
          {
            key: 'verify',
            label: `ตรวจสลิป (${g.toVerify.length})`,
            children: table(
              g.toVerify,
              [
                { title: 'สลิป', key: 'slip', render: (_, d) => <SlipImage bucket="deposit-slips" path={d.slip_path} /> },
                { title: 'เลขอ้างอิง', dataIndex: 'slip_ref', render: (v: string | null) => v ?? '-' },
                { title: 'ส่งเมื่อ', dataIndex: 'created_at', render: (v: string) => dateTime(v) },
                {
                  title: '',
                  key: 'a',
                  render: (_, d) => (
                    <Space>
                      <Button
                        type="primary"
                        loading={act.isPending}
                        onClick={() =>
                          act.mutate({
                            method: 'POST',
                            path: `deposits/${d.id}/review`,
                            body: { approve: true },
                            success: `ยืนยันโต๊ะ ${d.booking.code} ให้ลูกค้าแล้ว`,
                          })
                        }
                      >
                        สลิปผ่าน
                      </Button>
                      <RejectButton
                        label="ไม่ผ่าน"
                        title="สลิปไม่ผ่าน? ลูกค้าจะต้องส่งสลิปใหม่"
                        loading={act.isPending}
                        onReject={(reason) =>
                          act.mutate({
                            method: 'POST',
                            path: `deposits/${d.id}/review`,
                            body: { approve: false, reason },
                            success: 'แจ้งลูกค้าให้ส่งสลิปใหม่แล้ว',
                          })
                        }
                      />
                    </Space>
                  ),
                },
              ],
              'ไม่มีสลิปรอตรวจ',
            ),
          },
          {
            key: 'payout',
            label: `รอโอนให้ร้าน (${g.toPayout.length})`,
            children: table(
              g.toPayout,
              [
                payoutAccount,
                {
                  title: 'ผล',
                  key: 'result',
                  render: (_, d) => <StatusTag map={BOOKING_STATUS} value={d.booking.status} />,
                },
                {
                  title: '',
                  key: 'a',
                  render: (_, d) => (
                    <Space>
                      <Popconfirm
                        title={`โอน ${baht(d.amount)} ให้ ${d.bar.name} แล้ว?`}
                        okText="บันทึกว่าโอนแล้ว"
                        cancelText="ยกเลิก"
                        onConfirm={() => settle(d, 'PAID_OUT', 'บันทึกว่าโอนให้ร้านแล้ว')}
                      >
                        <Button type="primary" loading={act.isPending}>
                          โอนให้ร้านแล้ว
                        </Button>
                      </Popconfirm>
                      <Button loading={act.isPending} onClick={() => settle(d, 'CREDIT', 'เก็บเป็นเครดิตร้านแล้ว')}>
                        เก็บเป็นเครดิต
                      </Button>
                    </Space>
                  ),
                },
              ],
              'ไม่มียอดรอโอน',
            ),
          },
          {
            key: 'refund',
            label: `รอคืนลูกค้า (${g.toRefund.length})`,
            children: table(
              g.toRefund,
              [
                { title: 'ผล', key: 'result', render: (_, d) => <StatusTag map={BOOKING_STATUS} value={d.booking.status} /> },
                {
                  title: '',
                  key: 'a',
                  render: (_, d) => (
                    <Popconfirm
                      title={`คืน ${baht(d.amount)} ให้ลูกค้าแล้ว?`}
                      okText="บันทึกว่าคืนแล้ว"
                      cancelText="ยกเลิก"
                      onConfirm={() => settle(d, 'REFUNDED', 'บันทึกว่าคืนเงินลูกค้าแล้ว')}
                    >
                      <Button type="primary" loading={act.isPending}>
                        คืนเงินแล้ว
                      </Button>
                    </Popconfirm>
                  ),
                },
              ],
              'ไม่มียอดรอคืน',
            ),
          },
          {
            key: 'held',
            label: `ถือไว้ (${g.held.length})`,
            children: table(
              g.held,
              [{ title: 'ตรวจเมื่อ', key: 'v', render: (_, d) => (d.verified_at ? dateTime(d.verified_at) : '-') }],
              'ไม่มียอดที่ถือไว้',
            ),
          },
          {
            key: 'settled',
            label: `จบแล้ว (${g.settled.length})`,
            children: table(
              g.settled,
              [
                {
                  title: 'สถานะ',
                  key: 's',
                  render: (_, d) =>
                    d.status === 'REJECTED' ? (
                      <Tag color="red">สลิปไม่ผ่าน</Tag>
                    ) : (
                      <StatusTag map={SETTLEMENT} value={d.settlement} />
                    ),
                },
                { title: 'เหตุผล', dataIndex: 'reject_reason', render: (v: string | null) => v ?? '-' },
                { title: 'เมื่อ', key: 'at2', render: (_, d) => dateTime(d.settled_at ?? d.verified_at ?? d.created_at) },
              ],
              'ยังไม่มีรายการที่จบแล้ว',
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
