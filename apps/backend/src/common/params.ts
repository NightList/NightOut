import { Param, ParseUUIDPipe } from '@nestjs/common';

/** path param ที่ต้องเป็น UUID (ไม่ใช่ → 400 ก่อนถึง Supabase) */
export const Id = (name = 'id') => Param(name, new ParseUUIDPipe());
export const BarId = () => Id('barId');
export const BookingId = () => Id('bookingId');

/** ข้อความ forbidden มาตรฐานของ endpoint ทีมร้าน */
export const TEAM_FORBIDDEN = 'ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)';
export const ADMIN_FORBIDDEN = 'ไม่ใช่ ADMIN หรือยังไม่ผ่าน MFA';
