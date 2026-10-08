import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { TierStars } from '@nightout/ui';
import { Table, Tag } from 'antd';
import { useMemo } from 'react';
import { PAGE_SIZE } from '@/configs/constants';
import { LoadError } from '@/ui/components/LoadError';
import { useRankedBars } from './api';

/** อันดับร้านที่เปิดแสดง เรียงตามคะแนนรวม — การโปรโมทไม่มีผลต่อดาว */
export function RankingPage() {
  const { data, isLoading, error, refetch } = useRankedBars();
  const rows = useMemo(() => (data ?? []).map((b, i) => ({ ...b, rank: i + 1 })), [data]);
  return (
    <PageContainer
      title="ดาว / อันดับ"
      content="คำนวณจากคะแนนรวม (รีวิวเช็กอินจริง · จำนวนเช็กอิน · Safety · ข้อมูลราคา) — การโปรโมทไม่มีผลต่อดาว"
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Table<Db.AdminBar & { rank: number }>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 800 }}
        columns={[
          { title: 'อันดับ', dataIndex: 'rank', width: 80 },
          { title: 'ร้าน', dataIndex: 'name' },
          { title: 'คะแนนรวม', dataIndex: 'score', render: (v: number | null) => v ?? '-' },
          {
            title: 'ดาว',
            key: 'stars',
            render: (_, b) => (b.is_new || !b.current_stars ? <Tag>ร้านใหม่</Tag> : <TierStars stars={b.current_stars} />),
          },
          { title: 'รีวิว', dataIndex: 'rating_count' },
          { title: 'เช็กอิน', dataIndex: 'checkin_count' },
          { title: 'Safety', dataIndex: 'safety_score', render: (v: number | null) => v ?? '-' },
          { title: 'โปรโมท', dataIndex: 'is_promoted', render: (v: boolean) => (v ? <Tag>โฆษณา</Tag> : '-') },
        ]}
      />
    </PageContainer>
  );
}
