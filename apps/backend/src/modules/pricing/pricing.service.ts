import { Injectable } from '@nestjs/common';
import { estimatePrice } from '@nightout/utils';
import type { PriceEstimateBody, PriceEstimateResult } from './pricing.dto';

/** แปลง snake_case ของ API ↔ ฟังก์ชันคำนวณกลาง (@nightout/utils ใช้ camelCase ร่วมกับหน้าเว็บ) */
@Injectable()
export class PricingService {
  estimate(b: PriceEstimateBody): PriceEstimateResult {
    const r = estimatePrice({
      items: b.items.map((i) => ({ name: i.name, quantity: i.qty, unitPrice: i.unit_price })),
      fees: {
        serviceChargeRate: b.fees.service_charge_rate,
        vatRate: b.fees.vat_rate,
        otherFees: b.fees.other_fees,
      },
      pax: b.pax,
    });
    return {
      subtotal: r.subtotal,
      service_charge: r.serviceCharge,
      vat: r.vat,
      other_fees: r.otherFees,
      estimated_total: r.estimatedTotal,
      per_person: r.perPerson,
    };
  }
}
