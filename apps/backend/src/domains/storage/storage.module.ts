import { Module } from '@nestjs/common';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { StorageController } from './storage.controller';

/** โดเมน storage — bucket: deposit-slips, review-media, promo-slips, bar-verifications, team-photos (policy ใน …000800 / …20261003000100) */
@Module({ controllers: [StorageController], providers: [SupabaseJwtGuard] })
export class StorageModule {}
