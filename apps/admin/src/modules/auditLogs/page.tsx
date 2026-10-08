import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Table, Tag } from 'antd';
import { PAGE_SIZE } from '@/configs/constants';
import { LoadError } from '@/ui/components/LoadError';
import { dateTime } from '@/ui/utils/format';
import { AUDIT_ACTION } from '@/ui/utils/labels';
import { useAuditLogs } from './api';

const json = (v: unknown) => (v == null ? '-' : JSON.stringify(v, null, 2));

/** ทุกการกระทำของแอดมิน/ระบบ (500 รายการล่าสุด) · กดแถวเพื่อดูค่าก่อน–หลัง */
export function AuditLogsPage() {
  const { data, isLoading, error, refetch } = useAuditLogs();
  return (
    <PageContainer title="Audit Log">
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminAuditLog>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 900 }}
        expandable={{
          expandedRowRender: (a) => (
            <div className="grid gap-4 text-xs md:grid-cols-2">
              <div>
                <div className="mb-1 font-semibold">ก่อน</div>
                <pre className="m-0 whitespace-pre-wrap">{json(a.before)}</pre>
              </div>
              <div>
                <div className="mb-1 font-semibold">หลัง</div>
                <pre className="m-0 whitespace-pre-wrap">{json(a.after)}</pre>
              </div>
            </div>
          ),
        }}
        columns={[
          { title: 'เวลา', dataIndex: 'created_at', render: (v: string) => dateTime(v) },
          { title: 'ผู้ทำ', key: 'actor', render: (_, a) => a.actor?.email ?? 'ระบบ' },
          {
            title: 'การกระทำ',
            dataIndex: 'action',
            filters: Object.entries(AUDIT_ACTION).map(([value, text]) => ({ text, value })),
            onFilter: (v, a) => a.action === v,
            render: (a: string) => <Tag>{AUDIT_ACTION[a] ?? a}</Tag>,
          },
          { title: 'ตาราง', dataIndex: 'entity_type' },
          { title: 'รหัส', dataIndex: 'entity_id', render: (v: string | null) => (v ? <code className="text-xs">{v.slice(0, 8)}</code> : '-') },
        ]}
      />
    </PageContainer>
  );
}
