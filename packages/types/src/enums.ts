import { z } from 'zod';

/** ชั้นบัญชี (ADR 0005) — ชื่อไทยกับลำดับอยู่ในตาราง roles */
export const UserRole = z.enum(['CUSTOMER', 'MERCHANT', 'STAFF', 'ADMIN', 'SUPER_ADMIN']);
export type UserRole = z.infer<typeof UserRole>;

/** ประเภทร้าน */
export const BarCategory = z.enum(['PUB_BAR', 'CHILL', 'RESTAURANT']);
export type BarCategory = z.infer<typeof BarCategory>;

/** สถานะการตรวจสอบร้าน */
export const BarStatus = z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED']);
export type BarStatus = z.infer<typeof BarStatus>;

/** สถานะการจอง (ดู state machine ใน @nightout/utils) */
export const BookingStatus = z.enum([
  'PENDING',
  'AWAITING_DEPOSIT',
  'DEPOSIT_SUBMITTED',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_MERCHANT',
  'CHECKED_IN',
  'COMPLETED',
  'NO_SHOW',
  'EXPIRED',
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

/** Tier ในหน้า Tier List (แปลงจากดาว) */
export const Tier = z.enum(['S', 'A', 'B', 'C']);
export type Tier = z.infer<typeof Tier>;

/** สถานะความแน่นของร้าน */
export const CrowdStatus = z.enum(['AVAILABLE', 'ALMOST_FULL', 'FULL']);
export type CrowdStatus = z.infer<typeof CrowdStatus>;

/** ธีมที่ผู้ใช้เลือก */
export const ThemeMode = z.enum(['LIGHT', 'DARK', 'SYSTEM']);
export type ThemeMode = z.infer<typeof ThemeMode>;

/** ประเภท billing event */
export const BillingEventType = z.enum(['CHECK_IN', 'NO_SHOW']);
export type BillingEventType = z.infer<typeof BillingEventType>;

/** วิธีคิดค่าคอมมิชชัน */
export const CommissionCalculation = z.enum(['PERCENTAGE', 'FIXED', 'FIXED_PER_PERSON']);
export type CommissionCalculation = z.infer<typeof CommissionCalculation>;
