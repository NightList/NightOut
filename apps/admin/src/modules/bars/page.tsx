import { PageContainer } from '@ant-design/pro-components';
import { Star } from '@phosphor-icons/react';
import type { Db } from '@nightout/types';
import { Input, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PAGE_SIZE } from '@/configs/constants';
import { LoadError } from '@/ui/components/LoadError';
import { StatusTag } from '@/ui/components/StatusTag';
import { date } from '@/ui/utils/format';
import { BAR_STATUS } from '@/ui/utils/labels';
import { ShowSwitch } from './components/showSwitch';
import { useBars } from './api';

/** ร้านทั้งหมด — เปิด/ปิดการแสดงบนเว็บ · ป้าย "แนะนำ" (โฆษณา) ดูอย่างเดียว จัดการที่ /promotions */
export function BarsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading, error, refetch } = useBars();
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data ?? []).filter((b) => !k || b.name.toLowerCase().includes(k) || b.slug.includes(k));
  }, [data, q]);

  return (
    <PageContainer
      title="จัดการร้าน"
      extra={<Input.Search placeholder="ค้นหาชื่อร้าน…" allowClear onSearch={setQ} className="w-64" />}
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminBar>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 1000 }}
        columns={[
          {
            title: 'ร้าน',
            dataIndex: 'name',
            render: (name: string, b) => (
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate">{name}</span>
                {b.is_promoted && (
                  <Link to="/promotions" title="ร้านซื้อแพ็กเกจโปรโมท — จัดการที่หน้าโปรโมท">
                    <Tag color="gold" className="!m-0">
                      แนะนำ{b.promoted_until ? ` ถึง ${date(b.promoted_until)}` : ''}
                    </Tag>
                  </Link>
                )}
              </span>
            ),
          },
          { title: 'ย่าน', key: 'district', render: (_, b) => b.district?.name_th ?? '-' },
          {
            title: 'ดาว',
            key: 'stars',
            width: 110,
            sorter: (a, b) => (a.current_stars ?? 0) - (b.current_stars ?? 0),
            // ตัวเลข + ดาวดวงเดียว — แคบและเทียบหลายแถวได้เร็วกว่าดาว 5 ดวง
            render: (_, b) =>
              b.is_new || !b.current_stars ? (
                <Tag>ร้านใหม่</Tag>
              ) : (
                <span className="inline-flex items-center gap-1 tabular-nums" aria-label={`${b.current_stars} ดาว`}>
                  {b.current_stars}
                  <Star size={14} weight="fill" className="text-(--gold-text)" aria-hidden />
                </span>
              ),
          },
          {
            title: 'คะแนน',
            dataIndex: 'score',
            sorter: (a, b) => (a.score ?? 0) - (b.score ?? 0),
            render: (v: number | null) => v ?? '-',
          },
          {
            title: 'สถานะ',
            dataIndex: 'status',
            filters: Object.entries(BAR_STATUS).map(([value, l]) => ({ text: l.text, value })),
            onFilter: (v, b) => b.status === v,
            render: (s: string) => <StatusTag map={BAR_STATUS} value={s} />,
          },
          {
            title: 'แสดง',
            key: 'show',
            width: 90,
            // ร่าง / รอตรวจ / ไม่อนุมัติ ยังไม่เคยขึ้นเว็บ — จัดการที่หน้า /merchants
            render: (_, b) => (b.status === 'APPROVED' || b.status === 'SUSPENDED' ? <ShowSwitch bar={b} /> : '-'),
          },
        ]}
      />
    </PageContainer>
  );
}
