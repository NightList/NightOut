import { z } from 'zod';

/** โดเมน pricing — ประเมินราคาก่อนไปร้าน (สาธารณะ ไม่บันทึก) · ตัวคำนวณอยู่ใน @nightout/utils (camelCase) */

/** POST /pricing/estimate */
export const PriceEstimateBody = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).describe('ชื่อรายการ เช่น "เบียร์ทาวเวอร์"'),
        qty: z.number().int().positive().max(999).describe('จำนวนที่สั่ง'),
        unit_price: z.number().nonnegative().describe('ราคาต่อหน่วย (บาท)'),
      }),
    )
    .describe('รายการเมนูที่เลือก'),
  fees: z
    .object({
      service_charge_rate: z.number().min(0).max(100).default(0).describe('ค่าบริการ (%)'),
      vat_rate: z.number().min(0).max(100).default(0).describe('VAT (%)'),
      other_fees: z.number().nonnegative().default(0).describe('ค่าอื่นๆ ต่อบิล (บาท)'),
    })
    .describe('ค่าธรรมเนียมของร้าน'),
  pax: z.number().int().positive().max(50).describe('จำนวนคน — ใช้หารยอดต่อคน'),
});
export type PriceEstimateBody = z.infer<typeof PriceEstimateBody>;

/** ผลประเมินราคา (บาท) */
export interface PriceEstimateResult {
  subtotal: number;
  service_charge: number;
  vat: number;
  other_fees: number;
  estimated_total: number;
  per_person: number;
}
