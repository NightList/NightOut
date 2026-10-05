import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthedRequest, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { BarId, BookingId, TEAM_FORBIDDEN } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { RefundDepositDto } from './deposit.dto';

/** deposit · ทีมร้าน — อนุมัติคืนมัดจำ (เคสหน้างาน) · สมุดมัดจำของร้าน (ไม่มี path สลิป) */
@ApiTags('deposit')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant')
export class DepositMerchantController {
  constructor(private readonly db: SupabaseService) {}

  @Post('bookings/:bookingId/refund')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ยืนยันการคืนเงินมัดจำ',
    description:
      'ทีมร้านทุกบทบาท (รวม PR/STAFF) อนุมัติให้คืนมัดจำลูกค้า (เคสหน้างาน เช่น ไม่มีโต๊ะให้) · การจองที่ยังไม่เช็กอิน → ยกเลิกฝั่งร้านและปล่อยโต๊ะ · ' +
      'เช็กอิน/ไม่มาแล้วแต่ยังไม่โอนให้ร้าน → สถานะการจองคงเดิม · มัดจำเข้าคิว "รอคืนลูกค้า" ให้ NightOut โอนคืน · แจ้งลูกค้าและแอดมิน (rpc app_team_refund_deposit)',
    returns: '`id` รหัสมัดจำ · `booking_id` · `settlement` = REFUND_PENDING · `amount` · `booking_status` สถานะการจองหลังทำรายการ',
    forbidden: 'ไม่ใช่ทีมของร้านนี้',
  })
  refund(@CurrentUser() me: AuthUser, @BookingId() id: string, @Body() b: RefundDepositDto) {
    return this.db.rpc('app_team_refund_deposit', { p_actor: me.id, p_booking: id, p_reason: b.reason });
  }

  @Get('bars/:barId/deposit-ledger')
  @ApiDoc({
    summary: 'สมุดมัดจำของร้าน',
    description: 'มัดจำของทุกการจองในร้าน พร้อมสถานะตรวจสลิปและการโอนให้ร้าน (rpc bar_deposit_ledger — ร้านไม่เห็นสลิป)',
    returns:
      'รายการ `deposit_id` · `booking_id` · `booking_code` · `booking_datetime` · `customer_name` · `amount` · `status` · `settlement` · `verified_at` · `settled_at` · `created_at`',
    forbidden: TEAM_FORBIDDEN,
  })
  ledger(@Req() req: AuthedRequest, @BarId() barId: string) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'bar_deposit_ledger', { p_bar: barId });
  }
}
