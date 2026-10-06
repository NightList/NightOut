import { Module } from '@nestjs/common';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { BillingMerchantController } from './billing.merchant.controller';

/** โดเมน billing — commission_rules, billing_events, invoices (แอดมินอ่านผ่าน view admin_billing_events ใน backoffice) */
@Module({ controllers: [BillingMerchantController], providers: [SupabaseJwtGuard] })
export class BillingModule {}
