import { Module } from '@nestjs/common';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { BarTeamMeController } from './bar-team.me.controller';
import { BarTeamMerchantController } from './bar-team.merchant.controller';

/** โดเมน bar-team — ทีมร้าน (bar_staff) · DB: bar_team, my_invites, app_invite_staff, app_remove_staff, app_respond_invite */
@Module({ controllers: [BarTeamMeController, BarTeamMerchantController], providers: [SupabaseJwtGuard] })
export class BarTeamModule {}
