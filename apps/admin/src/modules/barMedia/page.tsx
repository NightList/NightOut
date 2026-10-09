import { PageContainer } from '@ant-design/pro-components';
import { ImageSquare } from '@phosphor-icons/react';
import { BAR_GALLERY_MAX } from '@nightout/contracts';
import type { Db } from '@nightout/types';
import { Button, Input, Segmented, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PAGE_SIZE } from '@/configs/constants';
import { LoadError } from '@/ui/components/LoadError';
import { StatusTag } from '@/ui/components/StatusTag';
import { BAR_STATUS } from '@/ui/utils/labels';
import { BarMediaDrawer } from './components/barMediaDrawer';
import { useBarMedia } from './api';
import { mediaUrl, coverPathOf } from './utils/media';

type Filter = 'all' | 'no-cover' | 'has-photos';

/** /bar-media — รูปร้านทุกร้าน: ดู / ลบรูปไม่เหมาะสม / อัปโหลดแทนร้าน (ปก + แกลเลอรี + รูปเมนู) · ?bar=<id> เปิดร้านนั้นเลย */
export function BarMediaPage() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [params, setParams] = useSearchParams();
  const { data, isLoading, error, refetch } = useBarMedia();
  const openId = params.get('bar');
  const open = (data ?? []).find((b) => b.id === openId) ?? null;

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data ?? []).filter(
      (b) =>
        (!k || b.name.toLowerCase().includes(k) || b.slug.includes(k)) &&
        (filter === 'all' ||
          (filter === 'no-cover' ? !coverPathOf(b) : b.media_count + b.menu_image_count > 0)),
    );
  }, [data, q, filter]);

  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('bar', id);
    else next.delete('bar');
    setParams(next, { replace: true });
  };

  return (
    <PageContainer
      title="รูปร้าน"
      extra={
        <Input.Search placeholder="ค้นหาชื่อร้าน…" allowClear onSearch={setQ} className="w-64" />
      }
    >
      <LoadError error={error} onRetry={() => void refetch()} />
      <Typography.Paragraph type="secondary" className="!mb-4">
        ปก แกลเลอรี และรูปเมนูของทุกร้าน — ลบรูปไม่เหมาะสม หรืออัปโหลดแทนร้าน
        (ทีมร้านได้รับแจ้งเตือนทุกครั้ง)
      </Typography.Paragraph>
      <Segmented<Filter>
        className="!mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { label: 'ทั้งหมด', value: 'all' },
          { label: 'ยังไม่มีปก', value: 'no-cover' },
          { label: 'มีรูปแล้ว', value: 'has-photos' },
        ]}
      />
      <Table<Db.AdminBarMedia>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 680 }}
        onRow={(b) => ({ onClick: () => select(b.id), className: 'cursor-pointer' })}
        columns={[
          {
            title: 'ปก',
            key: 'cover',
            width: 112,
            render: (_, b) => {
              const cover = coverPathOf(b);
              return cover ? (
                <img
                  src={mediaUrl(cover)}
                  alt=""
                  loading="lazy"
                  className="h-12 w-20 rounded-md object-cover"
                />
              ) : (
                <span
                  className="grid h-12 w-20 place-items-center rounded-md border border-dashed border-black/20 opacity-60 dark:border-white/20"
                  title="ยังไม่มีรูปปก"
                >
                  <ImageSquare size={18} aria-hidden />
                </span>
              );
            },
          },
          {
            title: 'ร้าน',
            dataIndex: 'name',
            render: (n: string) => <span className="font-medium">{n}</span>,
          },
          {
            title: 'สถานะ',
            dataIndex: 'status',
            width: 110,
            filters: Object.entries(BAR_STATUS).map(([value, l]) => ({ text: l.text, value })),
            onFilter: (v, b) => b.status === v,
            render: (s: string) => <StatusTag map={BAR_STATUS} value={s} />,
          },
          {
            title: 'แกลเลอรี',
            dataIndex: 'media_count',
            width: 100,
            sorter: (a, b) => a.media_count - b.media_count,
            render: (n: number) => (
              <span className="tabular-nums">
                {n}/{BAR_GALLERY_MAX}
              </span>
            ),
          },
          {
            title: 'รูปเมนู',
            key: 'menu',
            width: 100,
            sorter: (a, b) => a.menu_image_count - b.menu_image_count,
            render: (_, b) => (
              <span className="tabular-nums">
                {b.menu_image_count}/{b.menu.length}
              </span>
            ),
          },
          {
            title: '',
            key: 'action',
            width: 110,
            render: (_, b) => (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  select(b.id);
                }}
              >
                จัดการรูป
              </Button>
            ),
          },
        ]}
      />
      <BarMediaDrawer bar={open} onClose={() => select(null)} />
    </PageContainer>
  );
}
