import { createZodDto } from 'nestjs-zod';
import { DEPOSIT_TERMS_VERSION, toThaiE164 } from '@nightout/utils';
import { z } from 'zod';

const uuid = z.uuid();
const text = (max: number) => z.string().trim().max(max);

export class CreateBookingDto extends createZodDto(
  z.object({
    bar_id: uuid,
    zone_id: uuid,
    datetime: z.iso.datetime({ offset: true }),
    pax: z.number().int().min(1).max(50),
    promotion_id: uuid.nullish(),
    note: text(200).nullish(),
    contact_phone: z
      .string()
      .max(20)
      .transform((v, ctx) => {
        const e164 = toThaiE164(v);
        if (!e164) ctx.addIssue({ code: 'custom', message: 'INVALID_PHONE' });
        return e164 ?? v;
      })
      .describe('เบอร์โทรที่ติดต่อได้ (เบอร์ไทย เช่น 081-234-5678) — เก็บเป็น E.164 · เบอร์ที่โดนแบนจองไม่ได้'),
    deposit_terms: z
      .object({
        accepted: z.literal(true).describe('ลูกค้าติ๊กยอมรับเงื่อนไขริบมัดจำแล้ว'),
        terms_version: z.string().trim().min(1).max(40).describe(`เวอร์ชันของข้อความเงื่อนไข (ปัจจุบัน ${DEPOSIT_TERMS_VERSION})`),
        terms_text: z.string().trim().min(20).max(4000).describe('ข้อความเงื่อนไขที่แสดงข้าง checkbox (เก็บเป็นหลักฐาน)'),
      })
      .nullish()
      .describe('ต้องส่งเมื่อการจองมีมัดจำ (ทุกร้านเก็บมัดจำ) — ไม่ส่ง = DEPOSIT_TERMS_REQUIRED'),
  }),
) {}

export class SubmitDepositDto extends createZodDto(
  z.object({ slip_path: z.string().min(3).max(300), slip_ref: text(80).nullish() }),
) {}

export class CancelBookingDto extends createZodDto(z.object({ reason: text(200).nullish() })) {}

export class AddReviewDto extends createZodDto(
  z.object({
    review_id: uuid,
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(10).max(500),
    media: z
      .array(
        z.object({
          path: z.string().min(3).max(300),
          kind: z.enum(['IMAGE', 'VIDEO']),
          thumb_path: z.string().max(300).nullish(),
          duration_sec: z.number().int().min(0).max(60).nullish(),
          size_bytes: z.number().int().min(0).nullish(),
        }),
      )
      .max(6)
      .default([]),
  }),
) {}

export class MarkReadDto extends createZodDto(z.object({ ids: z.array(uuid).max(500).nullish() })) {}

export class UpdateProfileDto extends createZodDto(
  z
    .object({
      display_name: z.string().trim().min(1).max(60),
      style_ids: z.array(uuid).max(20),
      district_ids: z.array(uuid).max(20),
      budget_per_person: z.number().min(0).max(1_000_000).nullable(),
      usual_pax: z.number().int().min(1).max(50).nullable(),
      theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
      onboarded: z.boolean(),
    })
    .partial(),
) {}

export class ReportReviewDto extends createZodDto(
  z.object({ reason: z.enum(['SPAM', 'OFFENSIVE', 'FAKE', 'PRIVACY', 'OTHER']), detail: text(300).nullish() }),
) {}

export class RespondInviteDto extends createZodDto(z.object({ accept: z.boolean() })) {}

export class MerchantJoinDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(80),
    category: z.enum(['PUB_BAR', 'CHILL', 'RESTAURANT']),
    district_id: uuid.nullish(),
    address: z.string().trim().min(3).max(300),
    license: text(100).nullish(),
  }),
) {}
