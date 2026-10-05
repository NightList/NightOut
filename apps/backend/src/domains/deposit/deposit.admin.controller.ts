import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN, Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { ReviewDepositDto, SettleDepositDto } from './deposit.dto';

/** deposit · Backoffice — ตรวจสลิป ปิดยอด (rpc admin_review_deposit, admin_settle_deposit · audit log ในธุรกรรมเดียว) */
@ApiTags('deposit')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class DepositAdminController {
  constructor(private readonly db: SupabaseService) {}

  @Post('deposits/:id/review')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ตรวจสลิปมัดจำ',
    description:
      'อนุมัติ (การจองยืนยัน) หรือปฏิเสธสลิปพร้อม `reason_code` (FAKE_SLIP · AMOUNT_MISMATCH · WRONG_ACCOUNT · UNREADABLE · DUPLICATE · OTHER) · ' +
      'FAKE_SLIP ติดธงที่ลูกค้า — ธงครบ 2 ครั้ง (นับทั้งบัญชีและเบอร์โทร) แบนบัญชีและทุกเบอร์ที่บัญชีนั้นเคยใช้ จองไม่ได้อีก · ' +
      'ถ้าลูกค้ายกเลิกระหว่างรอตรวจ อนุมัติแล้วมัดจำจะอยู่ในคิวรอคืนลูกค้า',
    returns: '`id` รหัสมัดจำ · `status` VERIFIED / REJECTED · `reject_code` · (FAKE_SLIP) `fake_slip_count` จำนวนธง · `banned` แบนแล้วหรือยัง',
    forbidden: ADMIN_FORBIDDEN,
  })
  review(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ReviewDepositDto) {
    return this.db.rpc('admin_review_deposit', {
      p_actor: me.id,
      p_deposit: id,
      p_approve: b.approve,
      p_reason: b.reason || null,
      p_reason_code: b.approve ? null : (b.reason_code ?? null),
    });
  }

  @Post('deposits/:id/settle')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ปิดยอดมัดจำ',
    description: 'หลังลูกค้าเช็กอิน/ไม่มา: โอนให้ร้าน (PAID_OUT) · เก็บเป็นเครดิตร้าน (CREDIT) · คืนลูกค้า (REFUNDED)',
    returns: '`id` รหัสมัดจำ · `settlement` วิธีที่ปิดยอด',
    forbidden: ADMIN_FORBIDDEN,
  })
  settle(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SettleDepositDto) {
    return this.db.rpc('admin_settle_deposit', { p_actor: me.id, p_deposit: id, p_how: b.how });
  }
}
