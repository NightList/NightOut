import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN, Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { ModerateReviewDto } from './review.dto';

/** review · Backoffice — จัดการรีวิวที่ถูกรายงาน (rpc admin_moderate_review) */
@ApiTags('review')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class ReviewAdminController {
  constructor(private readonly db: SupabaseService) {}

  @Post('reviews/:id/moderate')
  @HttpCode(200)
  @ApiDoc({
    summary: 'จัดการรีวิว',
    description: 'คงไว้ / ซ่อน / ลบ / กู้คืน รีวิวที่ถูกรายงาน (+ review_moderation_logs)',
    returns: '`id` รหัสรีวิว · `status` สถานะใหม่',
    forbidden: ADMIN_FORBIDDEN,
  })
  moderate(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ModerateReviewDto) {
    return this.db.rpc('admin_moderate_review', { p_actor: me.id, p_review: id, p_action: b.action, p_reason: b.reason ?? null });
  }
}
