import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthedRequest } from './supabase-jwt.guard';

/**
 * ต้องใช้คู่กับ SupabaseJwtGuard: ชั้นบัญชีเข้าหลังบ้านได้ (roles.can_enter_backoffice — ADMIN / SUPER_ADMIN) + ผ่าน MFA แล้ว (aal2)
 * ตั้ง req.user.role ให้ guard / controller ถัดไปใช้
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user) throw new ForbiddenException('NOT_AUTHENTICATED');
    if (req.user.aal !== 'aal2') throw new ForbiddenException('MFA_REQUIRED');
    const rows = await this.supabase.select<{ role: string; roles: { can_enter_backoffice: boolean } | null }[]>(
      `users?select=role,roles(can_enter_backoffice)&deleted_at=is.null&id=eq.${encodeURIComponent(req.user.id)}`,
    );
    if (!rows[0]?.roles?.can_enter_backoffice) throw new ForbiddenException('NOT_ADMIN');
    req.user.role = rows[0].role;
    return true;
  }
}

/** ต้องอยู่หลัง AdminGuard: เฉพาะ SUPER_ADMIN (แก้ชั้นของบัญชีที่มีอยู่แล้ว) — DB ตรวจซ้ำใน super_admin_assert */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (req.user?.role !== 'SUPER_ADMIN') throw new ForbiddenException('SUPER_ADMIN_REQUIRED');
    return true;
  }
}
