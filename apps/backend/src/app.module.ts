import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { validateEnv } from './config/env';
import { AccountModule } from './domains/account/account.module';
import { BackofficeModule } from './domains/backoffice/backoffice.module';
import { BarTeamModule } from './domains/bar-team/bar-team.module';
import { BarModule } from './domains/bar/bar.module';
import { BillingModule } from './domains/billing/billing.module';
import { BookingModule } from './domains/booking/booking.module';
import { CatalogModule } from './domains/catalog/catalog.module';
import { DepositModule } from './domains/deposit/deposit.module';
import { PricingModule } from './domains/pricing/pricing.module';
import { PromotionModule } from './domains/promotion/promotion.module';
import { ReviewModule } from './domains/review/review.module';
import { SiteTeamModule } from './domains/site-team/site-team.module';
import { StorageModule } from './domains/storage/storage.module';
import { HealthController } from './health/health.controller';
import { JobsController } from './jobs/jobs.controller';
import { LocalJobsScheduler } from './jobs/local-jobs.scheduler';
import { SupabaseModule } from './supabase/supabase.module';

/**
 * 1 โดเมน = 1 module ใน src/domains/<domain>/ (ADR 0006) · ภายในโดเมนแยก controller ตามคนเรียก (public / me / merchant / admin)
 * URL ของทุก endpoint คงเดิมจากโครงเก่า (modules/customer|merchant|admin|query)
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    SupabaseModule,
    CatalogModule,
    BookingModule,
    DepositModule,
    ReviewModule,
    BarModule,
    BarTeamModule,
    AccountModule,
    PromotionModule,
    BillingModule,
    SiteTeamModule,
    StorageModule,
    PricingModule,
    BackofficeModule,
  ],
  controllers: [HealthController, JobsController],
  providers: [
    LocalJobsScheduler,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
