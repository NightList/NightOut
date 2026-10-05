import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { AddReviewDto, ReportReviewDto } from './review.dto';

/** review · ลูกค้า — เขียนรีวิว รายงานรีวิว (rpc app_add_review, app_report_review) */
@ApiTags('review')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller()
export class ReviewMeController {
  constructor(private readonly db: SupabaseService) {}

  @Post('bookings/:id/review')
  @ApiDoc({
    summary: 'เขียนรีวิวร้าน',
    description: 'รีวิวได้เฉพาะการจองที่เช็กอินแล้วและยังไม่เคยรีวิว · แนบรูป/วิดีโอได้สูงสุด 6 ไฟล์ (อัปโหลดเข้า bucket `review-media` เองก่อน แล้วส่ง path)',
    returns: '`id` รหัสรีวิว · `bar_id` ร้านที่รีวิว',
    status: 201,
  })
  add(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: AddReviewDto) {
    return this.db.rpc('app_add_review', {
      p_actor: me.id,
      p_booking: id,
      p_review_id: b.review_id,
      p_rating: b.rating,
      p_comment: b.comment,
      p_media: b.media,
    });
  }

  @Post('reviews/:id/report')
  @HttpCode(200)
  @ApiDoc({
    summary: 'รายงานรีวิวไม่เหมาะสม',
    description: 'แจ้งรีวิวที่เป็นสแปม/หยาบคาย/ปลอม/ละเมิดความเป็นส่วนตัว ให้แอดมินตรวจ · 1 คนรายงานรีวิวเดิมได้ครั้งเดียว',
    returns: '`review_id` · `reported` = true',
  })
  report(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ReportReviewDto) {
    return this.db.rpc('app_report_review', { p_actor: me.id, p_review: id, p_reason: b.reason, p_detail: b.detail ?? null });
  }
}
