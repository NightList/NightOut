import { Module } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { AccountUsersService } from './account-users.service';
import { AccountAdminController } from './account.admin.controller';
import { AccountMeController } from './account.me.controller';

/**
 * โดเมน account — โปรไฟล์/ความชอบ/แจ้งเตือน/ร้านโปรด/ลบบัญชี (ฉัน) · ผู้ใช้/ชั้นบัญชี/แบน (Backoffice, ADR 0005)
 * DB: app_update_profile, app_mark_notifications_read, app_toggle_favorite, app_delete_account, admin_finish_new_user, admin_update_user_account,
 *     admin_delete_user, admin_set_user_role, admin_unban_user, apply_fake_slip_flag, booking_ban_check · ตาราง roles, user_flags, banned_phones
 */
@Module({ controllers: [AccountMeController, AccountAdminController], providers: [SupabaseJwtGuard, AdminGuard, AccountUsersService] })
export class AccountModule {}
