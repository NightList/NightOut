import { Module } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { BackofficeAdminController } from './backoffice.admin.controller';

/** โดเมน backoffice — การอ่านของหน้าแอดมิน: rpc admin_dashboard · view admin_* · ตาราง master (migration …001600_admin) */
@Module({ controllers: [BackofficeAdminController], providers: [SupabaseJwtGuard, AdminGuard] })
export class BackofficeModule {}
