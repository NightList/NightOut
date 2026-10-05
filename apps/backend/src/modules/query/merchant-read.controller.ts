import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { SupabaseJwtGuard, type AuthedRequest } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { SupabaseService } from '../../supabase/supabase.service';

const Bar = () => Param('barId', new ParseUUIDPipe());
const FORBIDDEN = 'ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ';

/** อ่านข้อมูลหลังร้าน (เดิมหน้าเว็บเรียก Supabase ตรง) — ฟังก์ชัน/RLS ใน DB ตรวจว่าเป็นทีมร้านนี้ */
@ApiTags('merchant')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant/bars/:barId')
export class MerchantReadController {
  constructor(private readonly db: SupabaseService) {}

  @Get('team')
  @ApiDoc({
    summary: 'สมาชิกทีมร้าน',
    description: 'รวมคนที่ถูกเชิญแต่ยังไม่ตอบรับ',
    returns: 'รายการ `user_id` · `display_name` · `email` · `role` · `invited_at` · `accepted_at`',
    forbidden: FORBIDDEN,
  })
  team(@Req() req: AuthedRequest, @Bar() barId: string) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'bar_team', { p_bar: barId });
  }

  @Get('bookings/:bookingId/table-options')
  @ApiDoc({
    summary: 'โซน/โต๊ะที่ย้ายการจองไปได้',
    description: 'ทุกโต๊ะ (และโซนที่จองแบบไม่ระบุโต๊ะได้) ของร้าน พร้อมสถานะว่าง ณ ช่วงเวลาของการจองนี้ — ใช้กับปุ่ม "ย้ายโต๊ะ"',
    returns:
      'รายการ `zone_id` · `zone_name` · `table_id` (null = ไม่ระบุโต๊ะ) · `table_name` · `seats` · `available` ย้ายไปได้ · `is_current` ที่นั่งปัจจุบัน · `zone_remaining_pax` ที่ว่างในโซน',
    forbidden: FORBIDDEN,
  })
  tableOptions(@Req() req: AuthedRequest, @Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'bar_booking_table_options', { p_booking: bookingId });
  }

  @Get('deposit-ledger')
  @ApiDoc({
    summary: 'สมุดมัดจำของร้าน',
    description: 'มัดจำของทุกการจองในร้าน พร้อมสถานะตรวจสลิปและการโอนให้ร้าน',
    returns:
      'รายการ `deposit_id` · `booking_id` · `booking_code` · `booking_datetime` · `customer_name` · `amount` · `status` · `settlement` · `verified_at` · `settled_at` · `created_at`',
    forbidden: FORBIDDEN,
  })
  ledger(@Req() req: AuthedRequest, @Bar() barId: string) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'bar_deposit_ledger', { p_bar: barId });
  }

  @Get('billing-events')
  @ApiDoc({
    summary: 'ค่าบริการของร้าน',
    description: 'ค่าคอมต่อการเช็กอิน / ไม่มาตามนัด',
    returns:
      'รายการ `id` · `event_type` · `base_amount` · `amount` · `status` · `period` · `created_at` · `booking` { `code`, `booking_datetime` }',
    forbidden: FORBIDDEN,
  })
  billing(@Req() req: AuthedRequest, @Bar() barId: string) {
    return this.db.selectAs<unknown[]>(
      bearerOf(req),
      `billing_events?select=id,event_type,base_amount,amount,status,period,created_at,booking:bookings!billing_events_booking_id_fkey(code,booking_datetime)&bar_id=eq.${barId}&order=created_at.desc`,
    );
  }
}
