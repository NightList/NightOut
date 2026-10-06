import { Minus, Plus } from '@phosphor-icons/react';
import type { BarWithTier } from '@/services/data';
import { estimatePrice } from '@nightout/utils';
import { Button, InputNumber, Radio, Space } from 'antd';
import { useMemo } from 'react';
import { baht } from '@/ui/utils/format';
import { PriceSummary } from './priceSummary';

export interface EstimatorValue {
  pax: number;
  packageId?: string;
  qty: Record<string, number>;
}

/** ตัวประเมินราคา: แพ็กเกจ + รายการเพิ่ม + service charge + VAT */
export function PriceEstimator({
  bar,
  value,
  onChange,
}: {
  bar: BarWithTier;
  value: EstimatorValue;
  onChange: (v: EstimatorValue) => void;
}) {
  const estimate = useMemo(() => {
    const pkg = bar.packages.find((p) => p.id === value.packageId);
    const items = [
      ...(pkg ? [{ name: pkg.name, quantity: 1, unitPrice: pkg.totalPrice }] : []),
      ...bar.menu
        .filter((m) => (value.qty[m.id] ?? 0) > 0)
        .map((m) => ({ name: m.name, quantity: value.qty[m.id]!, unitPrice: m.price })),
    ];
    return estimatePrice({ items, fees: bar.fees, pax: value.pax });
  }, [bar, value]);

  const step = (id: string, d: number) =>
    onChange({ ...value, qty: { ...value.qty, [id]: Math.max(0, (value.qty[id] ?? 0) + d) } });
  const categories = [...new Set(bar.menu.map((m) => m.category))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span>จำนวนคน</span>
        <InputNumber
          min={1}
          max={30}
          value={value.pax}
          onChange={(v) => onChange({ ...value, pax: v ?? 1 })}
          suffix="คน"
        />
      </div>

      <div>
        <p className="mb-2 font-semibold">แพ็กเกจโต๊ะ</p>
        <Radio.Group
          value={value.packageId ?? ''}
          onChange={(e) => onChange({ ...value, packageId: e.target.value || undefined })}
          className="w-full"
        >
          <Space orientation="vertical" className="w-full">
            <Radio value="">ไม่เลือกแพ็กเกจ (สั่งเอง)</Radio>
            {bar.packages.map((p) => (
              <Radio key={p.id} value={p.id}>
                {p.name} ·{' '}
                <span className="font-semibold text-gold-text">{baht(p.totalPrice)}</span>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      {categories.map((c) => (
        <div key={c}>
          <p className="mb-2 font-semibold">{c}</p>
          <ul className="space-y-2">
            {bar.menu
              .filter((m) => m.category === c && m.available)
              .map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm">{m.name}</span>
                  <span className="w-16 text-right text-sm text-muted">{baht(m.price)}</span>
                  <Space.Compact>
                    <Button
                      icon={<Minus />}
                      aria-label={`ลด ${m.name}`}
                      onClick={() => step(m.id, -1)}
                    />
                    <span className="grid w-8 place-items-center border-y border-border text-sm">
                      {value.qty[m.id] ?? 0}
                    </span>
                    <Button
                      icon={<Plus />}
                      aria-label={`เพิ่ม ${m.name}`}
                      onClick={() => step(m.id, 1)}
                    />
                  </Space.Compact>
                </li>
              ))}
          </ul>
        </div>
      ))}

      <div className="rounded-xl border border-border bg-background/50 p-4">
        <PriceSummary estimate={estimate} rates={bar.fees} />
      </div>
    </div>
  );
}
