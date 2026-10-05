import { Module } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { ReviewAdminController } from './review.admin.controller';
import { ReviewMeController } from './review.me.controller';

/** โดเมน review — รีวิว รายงาน moderation · DB: app_add_review, app_report_review, admin_moderate_review · อ่าน: public_reviews, my_reviews (ใน catalog / account overview) */
@Module({ controllers: [ReviewMeController, ReviewAdminController], providers: [SupabaseJwtGuard, AdminGuard] })
export class ReviewModule {}
