import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Table, Tag } from 'antd';
import { PAGE_SIZE } from '@/configs/constants';
import { LoadError } from '@/ui/components/LoadError';
import { StatusTag } from '@/ui/components/StatusTag';
import { baht, dateTime } from '@/ui/utils/format';
import { BILLING_STATUS } from '@/ui/utils/labels';
import { useBillingEvents } from './api';

/** ค่าคอมมิชชันที่เกิดจากการจอง (เช็กอิน = คิดค่าคอม · ไม่มาตามนัด = ยกเว้น) */
export function BillingPage() {
  const { data, isLoading, error, refetch } = useBillingEvents();
  const total = (data ?? []).filter((r) => r.status !== 'WAIVED').reduce((s, r) => s + r.amount, 0);
  return (
    <PageContainer title="ค่าคอม" content={`ยอดค่าคอมที่ยังไม่ยกเว้นทั้งหมด ${baht(total)}`}>
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminBillingEvent>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 900 }}
        locale={{ emptyText: 'ยังไม่มีค่าคอม — จะเกิดขึ้นเมื่อลูกค้าเช็กอินที่ร้าน' }}
        columns={[
          { title: 'ร้าน', key: 'bar', render: (_, r) => r.bar.name },
          { title: 'รหัสจอง', dataIndex: 'booking_code' },
          {
            title: 'เหตุการณ์',
            dataIndex: 'event_type',
            render: (t: string) =>
              t === 'CHECK_IN' ? <Tag color="green">เช็กอิน</Tag> : <Tag>ไม่มาตามนัด</Tag>,
          },
          { title: 'ยอดฐาน', dataIndex: 'base_amount', align: 'right', render: (v: number) => baht(v) },
          { title: 'ค่าคอม', dataIndex: 'amount', align: 'right', render: (v: number) => baht(v) },
          { title: 'รอบบิล', dataIndex: 'period', render: (v: string | null) => v ?? '-' },
          { title: 'สถานะ', dataIndex: 'status', render: (s: string) => <StatusTag map={BILLING_STATUS} value={s} /> },
          { title: 'เวลา', dataIndex: 'created_at', render: (v: string) => dateTime(v) },
        ]}
      />
    </PageContainer>
  );
}
