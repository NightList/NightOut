import type { PriceEstimate, PriceEstimateInput } from '@nightout/types';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * ตัวประเมินราคา: Items × Qty + Service Charge + VAT + Other Fees
 * VAT คิดจาก (subtotal + service charge) ตามแนวปฏิบัติร้านอาหารในไทย
 * ผลลัพธ์เป็น "ราคาโดยประมาณ" เสมอ
 */
export function estimatePrice({ items, fees, pax }: PriceEstimateInput): PriceEstimate {
  const subtotal = round2(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
  const serviceCharge = round2((subtotal * fees.serviceChargeRate) / 100);
  const vat = round2(((subtotal + serviceCharge) * fees.vatRate) / 100);
  const otherFees = round2(fees.otherFees);
  const estimatedTotal = round2(subtotal + serviceCharge + vat + otherFees);
  return {
    subtotal,
    serviceCharge,
    vat,
    otherFees,
    estimatedTotal,
    perPerson: round2(estimatedTotal / Math.max(1, pax)),
  };
}
