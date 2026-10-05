import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthedRequest, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { BarId, BookingId, TEAM_FORBIDDEN } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { CheckInDto, MoveBookingDto, TeamBookingStatusDto } from './booking.dto';

/** booking · ทีมร้าน — เปลี่ยนสถานะ เช็กอิน ย้ายโต๊ะ (ฟังก์ชันใน DB ตรวจ bar_staff + บทบาท) */
@ApiTags('booking')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant')
export class BookingMerchantController {
  constructor(private readonly db: SupabaseService) {}

  @Post('bookings/:bookingId/status')
  @HttpCode(200)
  @ApiDoc({
    summary: 'เปลี่ยนสถานะการจอง (ฝั่งร้าน)',
    description: 'ทีมร้านยืนยัน/ปฏิเสธ/เช็กอิน/ปิดงาน/ยกเลิกการจอง · DB ตรวจว่าเปลี่ยนสถานะได้ตาม state machine (rpc app_team_set_booking_status)',
    returns: '`id` รหัสการจอง · `status` สถานะใหม่',
    forbidden: TEAM_FORBIDDEN,
  })
  setStatus(@CurrentUser() me: AuthUser, @BookingId() id: string, @Body() b: TeamBookingStatusDto) {
    return this.db.rpc('app_team_set_booking_status', { p_actor: me.id, p_booking: id, p_to: b.to, p_reason: b.reason ?? null });
  }

  @Post('bookings/:bookingId/move')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ย้ายโต๊ะ',
    description:
      'ทีมร้านทุกบทบาท (รวม PR/STAFF) ย้ายการจองที่ยังถือโต๊ะอยู่ (รอยืนยัน → เช็กอินแล้ว) ไปโซน/โต๊ะอื่น ช่วงเวลาเดิม · ' +
      'โต๊ะปลายทางต้องว่าง (TABLE_TAKEN) · ข้ามโซนต้องมีที่ว่างพอ (ZONE_FULL) · แจ้งลูกค้า + บันทึก audit log · ดูโต๊ะที่ว่างได้จาก GET merchant/bars/:barId/bookings/:bookingId/table-options (rpc app_team_move_booking)',
    returns: '`id` · `zone_id` · `zone_name` · `table_id` · `table_name`',
    forbidden: 'ไม่ใช่ทีมของร้านนี้',
  })
  move(@CurrentUser() me: AuthUser, @BookingId() id: string, @Body() b: MoveBookingDto) {
    return this.db.rpc('app_team_move_booking', {
      p_actor: me.id,
      p_booking: id,
      p_zone: b.zone_id,
      p_table: b.table_id ?? null,
      p_reason: b.reason ?? null,
    });
  }

  @Get('bars/:barId/bookings/:bookingId/table-options')
  @ApiDoc({
    summary: 'โซน/โต๊ะที่ย้ายการจองไปได้',
    description: 'ทุกโต๊ะ (และโซนที่จองแบบไม่ระบุโต๊ะได้) ของร้าน พร้อมสถานะว่าง ณ ช่วงเวลาของการจองนี้ — ใช้กับปุ่ม "ย้ายโต๊ะ" (rpc bar_booking_table_options)',
    returns:
      'รายการ `zone_id` · `zone_name` · `table_id` (null = ไม่ระบุโต๊ะ) · `table_name` · `seats` · `available` ย้ายไปได้ · `is_current` ที่นั่งปัจจุบัน · `zone_remaining_pax` ที่ว่างในโซน',
    forbidden: TEAM_FORBIDDEN,
  })
  tableOptions(@Req() req: AuthedRequest, @BookingId() bookingId: string) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'bar_booking_table_options', { p_booking: bookingId });
  }

  @Post('bars/:barId/check-in')
  @HttpCode(200)
  @ApiDoc({
    summary: 'เช็กอินลูกค้าด้วยรหัส/QR',
    description: 'สแกน QR หรือพิมพ์รหัสการจองที่หน้าร้าน · ผ่านแล้วนับเป็น 1 โหวตในหน้าจัดอันดับ (rpc app_check_in — รับ NL-XXXXXX, NIGHTOUT:<id> และ QR เก่า)',
    returns: '`id` · `code` · `pax` จำนวนคน · `zone_name` โซน · `customer_name` ชื่อลูกค้า',
    forbidden: TEAM_FORBIDDEN,
  })
  checkIn(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: CheckInDto) {
    return this.db.rpc('app_check_in', { p_actor: me.id, p_bar: bar, p_code: b.code });
  }
}
