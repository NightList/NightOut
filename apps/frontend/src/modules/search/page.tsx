import { MagnifyingGlass, MapTrifold, SquaresFour } from '@phosphor-icons/react';
import { CATEGORY_LABELS, DISTRICTS, listBars, STYLES, type BarFilter } from '@/services/data';
import type { BarCategory, CrowdStatus } from '@nightout/types';
import { Checkbox, Empty, Input, Segmented, Select, Slider } from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { BarCard } from '@/ui/components/barCard';
import { PageHeader } from '@/ui/components/pageHeader';
import { BarMap } from '@/ui/components/barMap';
import { useDemo } from '@/hooks/useDemo';
import { baht } from '@/ui/utils/format';

/** /search — ค้นหา + ตัวกรอง */
export function SearchPage() {
  useDemo();
  const [params] = useSearchParams();
  const [f, setF] = useState<BarFilter>({
    q: params.get('q') ?? '',
    // ลิงก์จากการ์ดหมวดหมู่หน้าแรก: ?category=PUB_BAR หรือ ?style=Rooftop
    category: (params.get('category') as BarFilter['category']) ?? 'ALL',
    styles: params.getAll('style'),
    // ลิงก์จากช่องค้นหาหน้าแรก (เลือกย่าน)
    district: params.get('district') ?? undefined,
    crowd: [],
    sort: 'relevance',
  });
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const set = (patch: Partial<BarFilter>) => setF((prev) => ({ ...prev, ...patch }));
  const bars = listBars(f);

  return (
    <div>
      <PageHeader title="ค้นหาร้าน" subtitle={`พบ ${bars.length} ร้าน`} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <Input
            size="large"
            allowClear
            prefix={<MagnifyingGlass />}
            placeholder="ชื่อร้าน ย่าน หรือสไตล์"
            value={f.q}
            onChange={(e) => set({ q: e.target.value })}
          />
          <div>
            <p className="mb-2 text-sm text-muted">ประเภทร้าน</p>
            <Segmented
              block
              orientation="vertical"
              value={f.category}
              onChange={(v) => set({ category: v as BarCategory | 'ALL' })}
              options={[
                { label: 'ทั้งหมด', value: 'ALL' },
                ...(['PUB_BAR', 'CHILL', 'RESTAURANT'] as const).map((c) => ({
                  label: CATEGORY_LABELS[c],
                  value: c,
                })),
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">ย่าน</p>
            <Select
              allowClear
              className="w-full"
              placeholder="ทุกย่าน"
              value={f.district}
              onChange={(v) => set({ district: v })}
              options={DISTRICTS.map((d) => ({ label: d, value: d }))}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">
              งบต่อหัวไม่เกิน {f.maxBudget ? baht(f.maxBudget) : 'ไม่จำกัด'}
            </p>
            <Slider
              min={300}
              max={2000}
              step={100}
              value={f.maxBudget ?? 2000}
              onChange={(v) => set({ maxBudget: v >= 2000 ? undefined : v })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">สไตล์</p>
            <Select
              mode="multiple"
              className="w-full"
              placeholder="เลือกได้หลายอย่าง"
              value={f.styles}
              onChange={(v) => set({ styles: v })}
              options={STYLES.map((s) => ({ label: s, value: s }))}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">ความแน่นตอนนี้</p>
            <Checkbox.Group
              value={f.crowd}
              onChange={(v) => set({ crowd: v as CrowdStatus[] })}
              options={[
                { label: '🟢 ว่าง', value: 'AVAILABLE' },
                { label: '🟡 ใกล้เต็ม', value: 'ALMOST_FULL' },
                { label: '🔴 เต็ม', value: 'FULL' },
              ]}
            />
          </div>
          <div>
            <Checkbox
              checked={!!f.hasPR}
              onChange={(e) => set({ hasPR: e.target.checked || undefined })}
            >
              เฉพาะร้านที่มี PR
            </Checkbox>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Safety Score ขั้นต่ำ {f.minSafety ?? 0}</p>
            <Slider
              min={0}
              max={100}
              step={10}
              value={f.minSafety ?? 0}
              onChange={(v) => set({ minSafety: v || undefined })}
            />
          </div>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'grid' | 'map')}
              options={[
                { value: 'grid', icon: <SquaresFour />, label: 'รายการ' },
                { value: 'map', icon: <MapTrifold />, label: 'แผนที่' },
              ]}
            />
            <Select
              value={f.sort}
              onChange={(v) => set({ sort: v })}
              className="w-44"
              options={[
                { label: 'แนะนำ', value: 'relevance' },
                { label: 'คะแนนสูงสุด', value: 'rating' },
                { label: 'ราคาต่ำสุด', value: 'price' },
                { label: 'ปลอดภัยที่สุด', value: 'safety' },
              ]}
            />
          </div>
          {bars.length === 0 ? (
            <Empty description="ไม่พบร้านตามตัวกรอง ลองลดเงื่อนไขดู" />
          ) : view === 'map' ? (
            <BarMap bars={bars} className="h-[70dvh]" expandable />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {bars.map((b) => (
                <BarCard key={b.id} bar={b} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
