import { useBillingEvents } from './api';
import { Alert, Card, Statistic, Table, Tag } from 'antd';
import { PageHeader } from '@/ui/components/pageHeader';
import { baht, dateTime } from '@/ui/utils/format';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'รอออกบิล', color: 'gold' },
  INVOICED: { label: 'ออกบิลแล้ว', color: 'blue' },
  PAID: { label: 'ชำระแล้ว', color: 'green' },
  WAIVED: { label: 'ยกเว้น', color: 'default' },
};

/** /merchant/billing — ค่าคอมมิชชันจากการจองที่ลูกค้ามาจริง (billing_events ใน Supabase) */
export function MerchantBillingPage() {
  const bar = useMerchantBar();
  const { data = [], isLoading, error } = useBillingEvents(bar.id);
  const outstanding = data.filter((r) => r.status === 'PENDING' || r.status === 'INVOICED').reduce((s, r) => s + Number(r.amount), 0);
  return (
    <div>
      <PageHeader title="ค่าคอมมิชชัน" />
      <Alert
        className="!mb-6"
        type="info"
        showIcon
        title="ค่าคอมเกิดเมื่อลูกค้าเช็กอินสำเร็จเท่านั้น (คิดจากยอดประเมินต่อหัว × จำนวนคน) · ไม่มาตามนัดไม่คิดค่าคอม"
      />
      {error && <Alert className="!mb-6" type="error" showIcon title="โหลดค่าคอมไม่สำเร็จ" description={(error as Error).message} />}
      <Card className="!mb-6">
        <Statistic title="ยอดค้างชำระ" value={outstanding} formatter={(v) => baht(Number(v))} loading={isLoading} />
      </Card>
      <Card>
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data}
          locale={{ emptyText: 'ยังไม่มีค่าคอม — เกิดขึ้นเมื่อลูกค้าเช็กอินที่ร้าน' }}
          scroll={{ x: 720 }}
          columns={[
            { title: 'เวลา', dataIndex: 'created_at', render: (v: string) => dateTime(v) },
            { title: 'รหัสจอง', key: 'code', render: (_, r) => r.booking?.code ?? '-' },
            {
              title: 'เหตุการณ์',
              dataIndex: 'event_type',
              render: (t: string) => (t === 'CHECK_IN' ? <Tag color="green">เช็กอิน</Tag> : <Tag>ไม่มาตามนัด</Tag>),
            },
            { title: 'ยอดฐาน', dataIndex: 'base_amount', align: 'right', render: (v: number) => baht(Number(v)) },
            { title: 'ค่าคอม', dataIndex: 'amount', align: 'right', render: (v: number) => baht(Number(v)) },
            {
              title: 'สถานะ',
              dataIndex: 'status',
              render: (s: string) => <Tag color={STATUS[s]?.color}>{STATUS[s]?.label ?? s}</Tag>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
