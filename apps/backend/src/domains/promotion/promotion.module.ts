import { Module } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { PromotionAdminController } from './promotion.admin.controller';
import { PromotionMerchantController } from './promotion.merchant.controller';

/** โดเมน promotion — โปรโมทร้าน (promoted_listings + payments) · DB: app_order_promotion, admin_review_promotion, bar_is_promoted · อ่าน: promotion_packages (catalog), promoted_listings (account overview) */
@Module({ controllers: [PromotionMerchantController, PromotionAdminController], providers: [SupabaseJwtGuard, AdminGuard] })
export class PromotionModule {}
