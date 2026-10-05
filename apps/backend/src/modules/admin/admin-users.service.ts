import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { SupabaseService } from '../../supabase/supabase.service';
import { ACCOUNT_TYPES, canCreateRole, type CreateUserBody } from './admin.dto';
import type { z } from 'zod';

/**
 * เพิ่มผู้ใช้จาก Backoffice (เหมือน scripts/create-user.ts แต่ทำผ่านหน้าเว็บ + มีผู้ทำใน audit log)
 * 1) ตรวจชั้นที่ผู้เรียกสร้างได้ / อีเมลซ้ำ / ร้านมีจริง ก่อนสร้าง (กันบัญชีค้าง)
 * 2) สร้างใน Supabase Auth (ยืนยันอีเมลให้แล้ว) → trigger สร้าง public.users เป็น CUSTOMER
 * 3) admin_finish_new_user: ตั้งสิทธิ์ + ผูกร้าน + audit — ถ้าพลาด ลบบัญชีที่เพิ่งสร้างทิ้ง
 */
@Injectable()
export class AdminUsersService {
  constructor(private readonly db: SupabaseService) {}

  async create(actorId: string, actorRole: string | undefined, b: z.output<typeof CreateUserBody>) {
    const type = ACCOUNT_TYPES[b.account_type];
    if (!canCreateRole(actorRole, type.role)) throw new ForbiddenException('SUPER_ADMIN_REQUIRED');
    const dup = await this.db.select<{ id: string }[]>(`users?select=id&email=eq.${encodeURIComponent(b.email)}`);
    if (dup.length) throw new ConflictException('EMAIL_EXISTS');
    if (b.bar_id) {
      const bar = await this.db.select<{ id: string }[]>(`bars?select=id&id=eq.${b.bar_id}`);
      if (!bar.length) throw new NotFoundException('BAR_NOT_FOUND');
    }

    const generated = !b.password;
    const password = b.password ?? randomBytes(12).toString('base64url');
    const user = await this.db.createAuthUser({
      email: b.email,
      password,
      metadata: { display_name: b.display_name, birthdate: b.birthdate },
    });
    if (!user) throw new ConflictException('EMAIL_EXISTS');

    try {
      const r = await this.db.rpc<{ id: string; email: string; role: string; bar_id: string | null; bar_role: string | null }>(
        'admin_finish_new_user',
        { p_actor: actorId, p_user: user.id, p_role: type.role, p_bar: b.bar_id ?? null, p_bar_role: type.bar_role },
      );
      // รหัสที่ระบบสุ่ม ตอบกลับครั้งเดียว (ไม่เก็บ ไม่ log) — แอดมินส่งให้เจ้าของบัญชีเอง
      return { ...r, display_name: b.display_name, password: generated ? password : null };
    } catch (e) {
      await this.db.deleteAuthUser(user.id).catch(() => undefined);
      throw e;
    }
  }
}
