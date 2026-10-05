import { BillingEventType } from '@nightout/types';
import { z } from 'zod';

/** โดเมน billing — ค่าคอมต่อการเช็กอิน / ไม่มาตามนัด (ร้านอ่านของตัวเอง · แอดมินผ่าน view admin_billing_events) */

export const BillingStatus = z.enum(['PENDING', 'INVOICED', 'PAID', 'WAIVED']);
export type BillingStatus = z.infer<typeof BillingStatus>;

/** GET /merchant/bars/:barId/billing-events */
export interface BillingEventRow {
  id: string;
  event_type: BillingEventType;
  base_amount: number;
  amount: number;
  status: BillingStatus;
  period: string;
  created_at: string;
  booking: { code: string; booking_datetime: string } | null;
}
