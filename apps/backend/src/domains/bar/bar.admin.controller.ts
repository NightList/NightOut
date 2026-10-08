import { Body, Controller, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN, Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { ApproveDto, SetBarStatusDto } from './bar.dto';

/** bar · Backoffice — อนุมัติ/ระงับร้าน · ยืนยัน Safety · ตรวจถ้อยคำโปรของร้าน (audit log ในธุรกรรมเดียว) */
@ApiTags('bar')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class BarAdminController {
  constructor(private readonly db: SupabaseService) {}

  @Patch('bars/:id/status')
  @ApiDoc({
    summary: 'อนุมัติ/ระงับร้าน',
    description: 'เปลี่ยนสถานะร้าน (APPROVED = ขึ้นหน้าเว็บ, REJECTED/SUSPENDED = ซ่อน) พร้อมเหตุผล · บันทึก audit log (rpc admin_set_bar_status)',
    returns: '`id` รหัสร้าน · `status` สถานะใหม่',
    forbidden: ADMIN_FORBIDDEN,
  })
  setStatus(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SetBarStatusDto) {
    return this.db.rpc('admin_set_bar_status', { p_actor: me.id, p_bar: id, p_status: b.status, p_reason: b.reason ?? null });
  }

  @Post('safety/:id/verify')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ยืนยันข้อมูลความปลอดภัย',
    description: 'แอดมินตรวจหลักฐานแล้วยืนยันข้อความปลอดภัย 1 ข้อของร้าน → ADMIN_VERIFIED + ปิดรายงาน + คำนวณคะแนน Safety ใหม่ (rpc admin_verify_safety)',
    returns: '`id` รหัสรายการ · `source` = ADMIN_VERIFIED',
    forbidden: ADMIN_FORBIDDEN,
  })
  verifySafety(@CurrentUser() me: AuthUser, @Id() id: string) {
    return this.db.rpc('admin_verify_safety', { p_actor: me.id, p_feature: id });
  }

  @Post('bar-promotions/:id/moderate')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ตรวจโปรโมชันของร้าน',
    description: 'อนุมัติหรือปฏิเสธโปรที่ร้านตั้ง ก่อนแสดงให้ลูกค้าเห็น (rpc admin_moderate_bar_promotion)',
    returns: '`id` รหัสโปร · `moderation_status` APPROVED / REJECTED',
    forbidden: ADMIN_FORBIDDEN,
  })
  moderatePromotion(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ApproveDto) {
    return this.db.rpc('admin_moderate_bar_promotion', { p_actor: me.id, p_promotion: id, p_approve: b.approve, p_reason: b.reason ?? null });
  }
}
