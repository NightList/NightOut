import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const uuid = z.uuid();
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export class TeamBookingStatusDto extends createZodDto(
  z.object({
    to: z.enum(['CONFIRMED', 'REJECTED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED_BY_MERCHANT']),
    reason: z.string().trim().max(200).nullish(),
  }),
) {}

export class MoveBookingDto extends createZodDto(
  z.object({
    zone_id: uuid.describe('โซนปลายทาง'),
    table_id: uuid.nullish().describe('โต๊ะปลายทาง (null = ไม่ระบุโต๊ะ ใช้ได้เฉพาะโซนที่ไม่มีโต๊ะ/เปิดจองแบบไม่ระบุโต๊ะ)'),
    reason: z.string().trim().max(200).nullish().describe('เหตุผล (บันทึกใน audit log)'),
  }),
) {}

export class RefundDepositDto extends createZodDto(
  z.object({ reason: z.string().trim().min(3).max(300).describe('เหตุผลที่คืนมัดจำ เช่น ไม่มีโต๊ะให้ลูกค้า') }),
) {}

export class CheckInDto extends createZodDto(z.object({ code: z.string().trim().min(3).max(120) })) {}

export class CrowdDto extends createZodDto(z.object({ status: z.enum(['AVAILABLE', 'ALMOST_FULL', 'FULL']) })) {}

export class BarInfoDto extends createZodDto(
  z
    .object({
      name: z.string().trim().min(1).max(80),
      description: z.string().trim().max(400).nullable(),
      address: z.string().trim().min(3).max(300),
      phone: z.string().trim().max(30).nullable(),
      district_id: uuid.nullable(),
      style_keys: z.array(z.string().max(40)).max(20),
      hours: z
        .array(
          z.object({
            day_of_week: z.number().int().min(0).max(6),
            open_time: hhmm.nullable(),
            close_time: hhmm.nullable(),
            is_closed: z.boolean(),
          }),
        )
        .max(7),
      links: z
        .array(
          z.object({
            type: z.enum(['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'LINE_OA', 'WEBSITE', 'REVIEW_CLIP']),
            url: z.url().startsWith('https://'),
          }),
        )
        .max(10),
    })
    .partial(),
) {}

export class MenuDto extends createZodDto(
  z.object({
    items: z
      .array(
        z.object({
          id: z.string().max(80).nullish(),
          category: z.string().trim().max(40),
          name: z.string().trim().min(1).max(80),
          price: z.number().min(0).max(1_000_000),
          available: z.boolean(),
        }),
      )
      .max(500),
  }),
) {}

export class BarPromotionsDto extends createZodDto(
  z.object({
    items: z
      .array(
        z.object({
          id: z.string().max(80).nullish(),
          title: z.string().trim().min(1).max(60),
          description: z.string().trim().max(160).nullish(),
          cutoff_time: hhmm.nullish(),
          days: z.array(z.number().int().min(0).max(6)).max(7).nullish(),
          active: z.boolean(),
        }),
      )
      .max(30),
  }),
) {}

export class FeesDto extends createZodDto(
  z.object({
    service_charge: z.number().min(0).max(30),
    vat: z.number().min(0).max(10),
    other: z.number().min(0).max(100_000),
  }),
) {}

export class ZonesDto extends createZodDto(
  z.object({
    zones: z
      .array(
        z.object({
          id: z.string().max(80).nullish(),
          name: z.string().trim().min(1).max(60),
          capacity_pax: z.number().int().min(1).max(2000),
          default_duration_minutes: z.number().int().min(30).max(720),
          tables: z
            .array(z.object({ id: z.string().max(80).nullish(), name: z.string().trim().min(1).max(30), seats: z.number().int().min(1).max(50) }))
            .max(200),
        }),
      )
      .max(30),
  }),
) {}

export class EvidenceDto extends createZodDto(z.object({ path: z.string().min(3).max(300) })) {}

export class SafetyDto extends createZodDto(z.object({ value: z.enum(['YES', 'NO', 'UNKNOWN']) })) {}

export class BookingSettingsDto extends createZodDto(
  z
    .object({
      deposit_amount: z.number().min(0).max(100_000),
      deposit_unit: z.enum(['PER_TABLE', 'PER_PERSON']),
      deposit_policy: z.string().trim().max(500),
      grace_minutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
      pr_male: z.number().int().min(0).max(99),
      pr_female: z.number().int().min(0).max(99),
      pr_lgbtq: z.number().int().min(0).max(99),
    })
    .partial(),
) {}

export class PayoutAccountDto extends createZodDto(
  z.object({
    bank_code: z.string().trim().min(2).max(40),
    account_name: z.string().trim().min(1).max(120),
    account_no: z.string().regex(/^\d{10,15}$/),
  }),
) {}

export class OrderPromotionDto extends createZodDto(z.object({ package_id: uuid, slip_path: z.string().min(3).max(300) })) {}

export class InviteStaffDto extends createZodDto(
  z.object({ email: z.email(), role: z.enum(['OWNER', 'MANAGER', 'STAFF']).default('STAFF') }),
) {}
