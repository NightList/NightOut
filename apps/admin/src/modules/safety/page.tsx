import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Button, Table, Tag } from 'antd';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAction, useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { SlipImage } from '@/ui/components/SlipImage';
import { dateTime } from '@/ui/utils/format';

/** มาตรการที่ร้านแจ้งว่า "มี" แต่ทีมยังไม่ได้ตรวจหลักฐาน — ยืนยันแล้วคะแนน Safety ของร้านคำนวณใหม่ทันที */
export function SafetyPage() {
  const { data, isLoading, error, refetch } = useAdminView('admin_safety_queue', {
    filters: [
      ['source', 'SELF_DECLARED'],
      ['value', 'YES'],
    ],
    order: { column: 'updated_at', ascending: true },
  });
  const act = useAdminAction();
  return (
    <PageContainer title="ยืนยัน Safety" content="รายการที่ร้านแจ้งว่า “มี” แต่ทีมยังไม่ได้ตรวจหลักฐาน">
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminSafetyItem>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: PAGE_SIZE }}
        locale={{ emptyText: 'ตรวจครบทุกรายการแล้ว' }}
        columns={[
          { title: 'ร้าน', key: 'bar', render: (_, r) => r.bar.name },
          { title: 'มาตรการ', dataIndex: 'name_th' },
          { title: 'หมายเหตุจากร้าน', dataIndex: 'note', render: (v: string | null) => v ?? '-' },
          {
            title: 'หลักฐาน',
            dataIndex: 'evidence_path',
            render: (p: string | null) => (p ? <SlipImage bucket="bar-verifications" path={p} /> : <span className="text-xs text-muted">ยังไม่แนบ</span>),
          },
          {
            title: 'ลูกค้าแจ้งว่าไม่จริง',
            dataIndex: 'open_inaccurate_reports',
            render: (n: number) => (n > 0 ? <Tag color="red">{n} ครั้ง</Tag> : '-'),
          },
          { title: 'แจ้งเมื่อ', dataIndex: 'updated_at', render: (v: string) => dateTime(v) },
          {
            title: '',
            key: 'a',
            render: (_, r) => (
              <Button
                type="primary"
                loading={act.isPending && act.variables?.path === `safety/${r.id}/verify`}
                onClick={() =>
                  act.mutate({ method: 'POST', path: `safety/${r.id}/verify`, success: `ยืนยัน ${r.name_th} ของ ${r.bar.name} แล้ว` })
                }
              >
                ยืนยันแล้ว
              </Button>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
