import { Module } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { BarAdminController } from './bar.admin.controller';
import { BarMeController } from './bar.me.controller';
import { BarMerchantController } from './bar.merchant.controller';
import { PayoutCryptoService } from './payout-crypto.service';

/**
 * โดเมน bar — ร้าน: ข้อมูล เมนู โปร ค่าธรรมเนียม โซน/โต๊ะ ความปลอดภัย ตั้งค่าการจอง บัญชีรับเงิน ความแน่น · สมัครลงร้าน · แอดมินอนุมัติ/ระงับ
 * DB: app_merchant_join, app_update_bar_info, app_set_menu, app_set_bar_promotions, app_set_fees, app_set_zones, app_set_safety(_evidence),
 *     app_update_booking_settings, app_set_payout_account, app_set_crowd, admin_set_bar_status, admin_verify_safety, admin_moderate_bar_promotion
 * อ่าน: bar_detail / my_bar_detail (catalog · account overview)
 */
@Module({ controllers: [BarMeController, BarMerchantController, BarAdminController], providers: [SupabaseJwtGuard, AdminGuard, PayoutCryptoService] })
export class BarModule {}
