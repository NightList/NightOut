import { useBarLedger, type DepositLedgerRow } from './api';
import { Alert, Card, Col, Row, Statistic, Table, Tag } from 'antd';
import { PageHeader } from '@/ui/components/pageHeader';
import { baht, dateTime } from '@/ui/utils/format';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const SETTLEMENT: Record<DepositLedgerRow['settlement'], { label: string; color: string }> = {
  NONE: { label: 'รอ NightOut ตรวจสลิป', color: 'default' },
  HELD: { label: 'NightOut ถือไว้', color: 'blue' },
  PAYOUT_PENDING: { label: 'รอโอนให้ร้าน', color: 'gold' },
  PAID_OUT: { label: 'โอนให้ร้านแล้ว', color: 'green' },
  CREDIT: { label: 'เก็บเป็นเครดิตร้าน', color: 'purple' },
  REFUND_PENDING: { label: 'รอคืนลูกค้า', color: 'orange' },
  REFUNDED: { label: 'คืนลูกค้าแล้ว', color: 'default' },
};

/**
 * /merchant/deposits — เงินมัดจำของร้าน (ไม่เห็นสลิปของลูกค้า)
 * ลูกค้าโอนเข้า NightOut · แพลตฟอร์มตรวจสลิปและถือเงินไว้ · ลูกค้าเช็กอิน/ไม่มา → เงินเป็นของร้าน
 * แล้ว NightOut โอนเข้าบัญชีร้าน หรือเก็บเป็นเครดิตร้านตามที่ตกลง
 */
export function MerchantDepositsPage() {
  const bar = useMerchantBar();
  const { data = [], isLoading, error } = useBarLedger(bar.id);
  const rows = data.filter((r) => r.status !== 'REJECTED');
  const sum = (k: DepositLedgerRow['settlement']) =>
    rows.filter((r) => r.settlement === k).reduce((a, r) => a + Number(r.amount), 0);
  return (
    <div>
      <PageHeader
        title="เงินมัดจำ"
        subtitle={
          bar.payout.accountNo
            ? `โอนเข้า ${bar.payout.bankName} ${bar.payout.accountNo} (${bar.payout.accountName}) · แก้ได้ที่ตั้งค่าการจอง`
            : 'ยังไม่ได้ตั้งบัญชีรับเงิน — ตั้งได้ที่ตั้งค่าการจอง'
        }
      />
      {error && (
        <Alert
          className="!mb-6"
          type="error"
          showIcon
          title="โหลดมัดจำไม่สำเร็จ"
          description={(error as Error).message}
        />
      )}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="NightOut ถือไว้ (ยังไม่เช็กอิน)"
              value={sum('HELD')}
              prefix="฿"
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="รอโอนให้ร้าน"
              value={sum('PAYOUT_PENDING')}
              prefix="฿"
              loading={isLoading}
              styles={{ content: { color: 'var(--gold-text)' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="โอนแล้ว" value={sum('PAID_OUT')} prefix="฿" loading={isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="เครดิตในร้าน" value={sum('CREDIT')} prefix="฿" loading={isLoading} />
          </Card>
        </Col>
      </Row>
      <Table<DepositLedgerRow>
        rowKey="deposit_id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        dataSource={rows}
        locale={{ emptyText: 'ยังไม่มีมัดจำ' }}
        scroll={{ x: 760 }}
        columns={[
          { title: 'รหัสจอง', dataIndex: 'booking_code', width: 120 },
          { title: 'ลูกค้า', dataIndex: 'customer_name', render: (v: string | null) => v ?? '-' },
          { title: 'วันที่จอง', dataIndex: 'booking_datetime', render: (v: string) => dateTime(v) },
          {
            title: 'ยอด',
            dataIndex: 'amount',
            align: 'right',
            render: (v: number) => baht(Number(v)),
          },
          {
            title: 'สถานะเงิน',
            dataIndex: 'settlement',
            render: (s: DepositLedgerRow['settlement']) => (
              <Tag color={SETTLEMENT[s]?.color}>{SETTLEMENT[s]?.label ?? s}</Tag>
            ),
          },
          {
            title: 'อัปเดต',
            key: 'at',
            render: (_, r) => dateTime(r.settled_at ?? r.verified_at ?? r.created_at),
          },
        ]}
      />
    </div>
  );
}
