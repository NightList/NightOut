import { ImageSquare } from '@phosphor-icons/react';
import { Image, Table } from 'antd';
import type { BarWithTier } from '@/services/data';
import { baht } from '@/ui/utils/format';

/** เมนูและราคา — แสดงเพื่อประเมินงบเท่านั้น (ไม่มีสั่งล่วงหน้า) · รูปเมนูกดดูเต็มได้ (มีคอลัมน์รูปเมื่อร้านใส่รูปอย่างน้อย 1 รายการ) */
export function MenuTable({ menu }: { menu: BarWithTier['menu'] }) {
  const hasPhotos = menu.some((m) => m.imageUrl);
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">ราคาอ้างอิงสำหรับประเมินงบ — สั่งที่ร้านตอนไปถึง (ไม่มีสั่งล่วงหน้า)</p>
      <Image.PreviewGroup>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={menu}
          columns={[
            ...(hasPhotos
              ? [
                  {
                    title: 'รูป',
                    key: 'photo',
                    width: 72,
                    render: (_: unknown, m: BarWithTier['menu'][number]) =>
                      m.imageUrl ? (
                        <Image src={m.imageUrl} alt={m.name} width={48} height={48} className="rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-12 place-items-center rounded-lg bg-card text-muted" aria-hidden>
                          <ImageSquare size={18} />
                        </span>
                      ),
                  },
                ]
              : []),
            { title: 'หมวด', dataIndex: 'category', width: 110 },
            { title: 'รายการ', dataIndex: 'name' },
            { title: 'ราคา', dataIndex: 'price', align: 'right' as const, render: (v: number) => baht(v) },
          ]}
        />
      </Image.PreviewGroup>
    </div>
  );
}
