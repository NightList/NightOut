import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { clientInfo } from '../../common/client-info';
import { Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { CancelBookingDto, CreateBookingDto } from './booking.dto';

/** booking · ลูกค้า — จอง / ยกเลิก (rpc app_create_booking, app_cancel_booking) */
@ApiTags('booking')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller()
export class BookingMeController {
  constructor(private readonly db: SupabaseService) {}

  @Post('bookings')
  @ApiDoc({
    summary: 'จองโต๊ะ',
    description:
      'ลูกค้าสร้างการจองโต๊ะ (เฉพาะโต๊ะ + เลือกโปรของร้านได้ 1 อย่าง) · DB ตรวจโซนว่าง เวลา และเงื่อนไขโปรในธุรกรรมเดียว · ทุกการจองต้องมัดจำ → สถานะเริ่มที่ AWAITING_DEPOSIT (หรือ PENDING ถ้าร้านไม่เก็บมัดจำ) · ต้องมี `contact_phone` และ `deposit_terms.accepted = true` — DB เก็บหลักฐานการยอมรับเงื่อนไขริบมัดจำ (ข้อความ + IP + User-Agent + เวลา) แก้ไม่ได้ · บัญชี/เบอร์ที่ถูกแบน (สลิปปลอม 2 ครั้ง) → 403',
    returns: '`id` รหัสการจอง · `code` รหัสเช็กอิน · `status` สถานะการจอง · `deposit_required` ยอดมัดจำที่ต้องโอน (บาท)',
    status: 201,
  })
  create(@CurrentUser() me: AuthUser, @Body() b: CreateBookingDto, @Req() req: Request) {
    return this.db.rpc('app_create_booking', {
      p_actor: me.id,
      p_bar: b.bar_id,
      p_zone: b.zone_id,
      p_datetime: b.datetime,
      p_pax: b.pax,
      p_promotion: b.promotion_id ?? null,
      p_note: b.note ?? null,
      p_contact_phone: b.contact_phone,
      p_consent: b.deposit_terms ? { ...b.deposit_terms, ...clientInfo(req) } : null,
    });
  }

  @Post('bookings/:id/cancel')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ยกเลิกการจอง',
    description: 'ลูกค้ายกเลิกการจองของตัวเอง (ก่อนเช็กอิน) พร้อมเหตุผล (ไม่บังคับ) · มัดจำ: trigger ตัดสินว่าคืนลูกค้าหรือเป็นของร้านตาม refund_before_hours',
    returns: '`id` รหัสการจอง · `status` = CANCELLED_BY_CUSTOMER',
  })
  cancel(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: CancelBookingDto) {
    return this.db.rpc('app_cancel_booking', { p_actor: me.id, p_booking: id, p_reason: b.reason ?? null });
  }
}
