import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN, Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { ReviewPromotionDto } from './promotion.dto';

/** promotion · Backoffice — ตรวจคำสั่งซื้อโปรโมท (rpc admin_review_promotion) */
@ApiTags('promotion')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class PromotionAdminController {
  constructor(private readonly db: SupabaseService) {}

  @Post('promotions/:id/review')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ตรวจคำสั่งซื้อโปรโมทร้าน',
    description: 'อนุมัติ (เริ่มแสดงโฆษณา) หรือปฏิเสธพร้อมเหตุผล',
    returns: '`id` · `status` ACTIVE / REJECTED',
    forbidden: ADMIN_FORBIDDEN,
  })
  review(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ReviewPromotionDto) {
    return this.db.rpc('admin_review_promotion', { p_actor: me.id, p_listing: id, p_approve: b.approve, p_reason: b.reason ?? null });
  }
}
