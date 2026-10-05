import type { PriceEstimate } from '@nightout/types';
import { Descriptions } from 'antd';
import { baht } from '@/ui/utils/format';

/** สรุปราคาโดยประมาณ (ไม่รับประกันราคาสุดท้าย) */
export function PriceSummary({
  estimate,
  rates,
}: {
  estimate: PriceEstimate;
  rates: { serviceChargeRate: number; vatRate: number };
}) {
  return (
    <div>
      <Descriptions
        column={1}

        items={[
          { key: 's', label: 'รวมรายการ', children: baht(estimate.subtotal) },
          {
            key: 'sc',
            label: `Service charge ${rates.serviceChargeRate}%`,
            children: baht(estimate.serviceCharge),
          },
          { key: 'v', label: `VAT ${rates.vatRate}%`, children: baht(estimate.vat) },
          ...(estimate.otherFees
            ? [
                {
                  key: 'o',
                  label: 'ค่าอื่นๆ (ค่าเปิดขวด/ค่าเข้า)',
                  children: baht(estimate.otherFees),
                },
              ]
            : []),
        ]}
      />
      <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
        <span className="text-muted">ราคาโดยประมาณ</span>
        <span className="text-right">
          <span className="block text-2xl font-bold text-gold-text">
            {baht(estimate.estimatedTotal)}
          </span>
          <span className="text-sm text-muted">≈ {baht(estimate.perPerson)} / คน</span>
        </span>
      </div>
      <p className="mt-2 text-xs text-muted">* ราคาโดยประมาณ อาจต่างจากบิลจริงตามที่สั่งเพิ่ม</p>
    </div>
  );
}
