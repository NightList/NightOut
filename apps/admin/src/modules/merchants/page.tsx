import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Button, Space, Table } from 'antd';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAction } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { RejectButton } from '@/ui/components/RejectButton';
import { StatusTag } from '@/ui/components/StatusTag';
import { dateTime } from '@/ui/utils/format';
import { BAR_STATUS, CATEGORY } from '@/ui/utils/labels';
import { usePendingBars, barStatusAction } from './api';

/** ร้านที่ส่งข้อมูลมาให้ตรวจ — อนุมัติแล้วร้านจะแสดงบนเว็บทันที */
export function MerchantsPage() {
  const { data, isLoading, error, refetch } = usePendingBars();
  const act = useAdminAction();
  const setStatus = (b: Db.AdminBar, status: 'APPROVED' | 'REJECTED', reason?: string) =>
    act.mutate({
      ...barStatusAction(b.id, { status, reason }),
      success: status === 'APPROVED' ? `อนุมัติ ${b.name} แล้ว` : `ไม่อนุมัติ ${b.name}`,
    });

  return (
    <PageContainer title="ร้านรออนุมัติ" content="ร้านที่อนุมัติแล้วจะแสดงบนเว็บทันที · ร้านสถานะร่างยังกรอกข้อมูลไม่ครบ">
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminBar>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 900 }}
        locale={{ emptyText: 'ไม่มีร้านรอตรวจ' }}
        columns={[
          { title: 'ร้าน', dataIndex: 'name' },
          { title: 'ประเภท', dataIndex: 'category', render: (c: Db.AdminBar['category']) => CATEGORY[c] },
          { title: 'ย่าน', key: 'district', render: (_, b) => b.district?.name_th ?? '-' },
          { title: 'เจ้าของ', key: 'owner', render: (_, b) => b.owner?.email ?? '-' },
          { title: 'ส่งเมื่อ', dataIndex: 'created_at', render: (v: string) => dateTime(v) },
          { title: 'สถานะ', dataIndex: 'status', render: (s: string) => <StatusTag map={BAR_STATUS} value={s} /> },
          {
            title: '',
            key: 'a',
            render: (_, b) => (
              <Space>
                <Button type="primary" loading={act.isPending} onClick={() => setStatus(b, 'APPROVED')}>
                  อนุมัติ
                </Button>
                <RejectButton
                  label="ไม่อนุมัติ"
                  title={`ไม่อนุมัติ ${b.name}?`}
                  loading={act.isPending}
                  onReject={(reason) => setStatus(b, 'REJECTED', reason)}
                />
              </Space>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
