import { Module } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { SiteTeamAdminController } from './site-team.admin.controller';
import { SiteTeamPublicController } from './site-team.public.controller';

/** โดเมน site-team — ทีมงาน NightOut (ตาราง team_members · view public_team / admin_team_members · bucket team-photos) */
@Module({ controllers: [SiteTeamPublicController, SiteTeamAdminController], providers: [SupabaseJwtGuard, AdminGuard] })
export class SiteTeamModule {}
