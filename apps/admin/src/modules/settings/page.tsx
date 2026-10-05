import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Card, Space, Table, Tag } from 'antd';
import { useMasterTable } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';

/** ข้อมูลตั้งต้นของระบบ (อ่านอย่างเดียว — แก้ผ่าน migration/seed) */
export function SettingsPage() {
  const styles = useMasterTable<Db.Tables<'styles'>>('styles', 'sort_order');
  const safety = useMasterTable<Db.Tables<'safety_features'>>('safety_features', 'sort_order');
  const settings = useMasterTable<Db.Tables<'platform_settings'>>('platform_settings', 'key');
  return (
    <PageContainer title="ตั้งค่าระบบ" content="ข้อมูลในหน้านี้แก้ผ่าน migration / seed ของทีม (ยังไม่เปิดให้แก้จากหน้านี้)">
      <Space orientation="vertical" size="large" className="w-full">
        <Card title="สไตล์ร้าน">
          <LoadError error={styles.error} onRetry={() => void styles.refetch()} />
          <Space size={[8, 8]} wrap>
            {(styles.data ?? []).map((s) => (
              <Tag key={s.id} color={s.active ? 'gold' : 'default'}>
                {s.name_th}
              </Tag>
            ))}
          </Space>
        </Card>
        <Card title="มาตรการ Safety และน้ำหนักคะแนน">
          <LoadError error={safety.error} onRetry={() => void safety.refetch()} />
          <Table<Db.Tables<'safety_features'>>
            rowKey="id"
            size="small"
            pagination={false}
            loading={safety.isLoading}
            dataSource={safety.data}
            columns={[
              { title: 'มาตรการ', dataIndex: 'name_th' },
              { title: 'น้ำหนัก', dataIndex: 'weight' },
            ]}
          />
        </Card>
        <Card title="ค่าระบบ">
          <LoadError error={settings.error} onRetry={() => void settings.refetch()} />
          <Table<Db.Tables<'platform_settings'>>
            rowKey="id"
            size="small"
            pagination={false}
            loading={settings.isLoading}
            dataSource={settings.data}
            columns={[
              { title: 'ชื่อ', dataIndex: 'key' },
              {
                title: 'ค่า',
                dataIndex: 'value',
                render: (v: unknown) => <code className="text-xs break-all">{JSON.stringify(v)}</code>,
              },
            ]}
          />
        </Card>
      </Space>
    </PageContainer>
  );
}
