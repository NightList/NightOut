import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { canCreateRole } from '@nightout/contracts';
import type { UserRole } from '@nightout/types';
import { AdminGuard, SuperAdminGuard } from '../../auth/admin.guard';
import { bearerOf } from '../../auth/bearer';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthedRequest, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN, Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { AccountUsersService } from './account-users.service';
import { CreateUserDto, SetUserRoleDto, UnbanUserDto, UpdateUserAccountDto } from './account.dto';

/** account · Backoffice — ผู้ใช้ ชั้นบัญชี (ADR 0005) แบน/ปลดแบน · audit log ในธุรกรรมเดียว */
@ApiTags('account')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class AccountAdminController {
  constructor(
    private readonly db: SupabaseService,
    private readonly users: AccountUsersService,
  ) {}

  @Get('roles')
  @ApiDoc({
    summary: 'รายการชั้นบัญชี',
    description:
      'ห้าชั้นจากตาราง roles เรียงตาม sort_order พร้อมสิทธิ์ของผู้เรียก — แอดมินสร้างบัญชีได้แค่ลูกค้า / ร้านค้า / พนักงาน · แก้ชั้นของบัญชีที่มีอยู่ได้เฉพาะ SUPER_ADMIN',
    returns:
      'รายการ `code` · `label_th` · `sort_order` · `can_enter_backoffice` · `can_create` ผู้เรียกเลือกชั้นนี้ตอนสร้างบัญชีได้ · `can_assign` ผู้เรียกแก้บัญชีอื่นเป็นชั้นนี้ได้',
    forbidden: ADMIN_FORBIDDEN,
    validates: false,
  })
  async roles(@Req() req: AuthedRequest) {
    const rows = await this.db.selectAs<{ code: UserRole; label_th: string; sort_order: number; can_enter_backoffice: boolean }[]>(
      bearerOf(req),
      'roles?select=code,label_th,sort_order,can_enter_backoffice&order=sort_order',
    );
    const actor = req.user?.role;
    return rows.map((r) => ({ ...r, can_create: canCreateRole(actor, r.code), can_assign: actor === 'SUPER_ADMIN' }));
  }

  @Post('users')
  @ApiDoc({
    summary: 'เพิ่มผู้ใช้',
    description:
      'สร้างบัญชีที่ยืนยันอีเมลแล้ว ใช้เข้าสู่ระบบได้ทันที · เลือกประเภทบัญชี: ลูกค้า / เจ้าของร้าน / ผู้จัดการร้าน / พนักงานร้าน (3 แบบนี้ต้องเลือกร้าน) / แอดมิน / ซูเปอร์แอดมิน (2 แบบหลังเฉพาะ SUPER_ADMIN) · ไม่ใส่รหัสผ่าน = ระบบสุ่มให้ · Supabase Auth admin → rpc admin_finish_new_user (พลาด = ลบบัญชีทิ้ง) · บันทึก audit log',
    returns: '`id` · `email` · `display_name` · `role` · `bar_id` · `bar_role` · `password` (เฉพาะเมื่อระบบสุ่มให้ — แสดงครั้งเดียว ไม่ถูกเก็บ)',
    status: 201,
    forbidden: 'ไม่ใช่ ADMIN · `SUPER_ADMIN_REQUIRED` เมื่อสร้างแอดมิน / ซูเปอร์แอดมิน โดยไม่ใช่ SUPER_ADMIN',
  })
  createUser(@CurrentUser() me: AuthUser, @Body() b: CreateUserDto) {
    return this.users.create(me.id, me.role, b);
  }

  @Patch('users/:id')
  @ApiDoc({
    summary: 'แก้ข้อมูลบัญชี',
    description: 'SUPER_ADMIN แก้ได้ทุกบัญชี · ADMIN แก้ได้เฉพาะบัญชีตัวเอง · เปลี่ยนอีเมล/รหัสผ่านใน Supabase Auth และชื่อ/เบอร์ใน public.users (rpc admin_update_user_account)',
    returns: '`id` · `email` · `display_name` · `phone_e164`',
    forbidden: 'ADMIN แก้ได้เฉพาะบัญชีตัวเอง (`SELF_ONLY`)',
  })
  updateUser(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: UpdateUserAccountDto) {
    return this.users.update(me.id, me.role, id, b);
  }

  @Delete('users/:id')
  @UseGuards(SuperAdminGuard)
  @HttpCode(200)
  @ApiDoc({
    summary: 'ลบบัญชีผู้ใช้',
    description: 'เฉพาะ SUPER_ADMIN ปิดบัญชีและระงับการเข้าสู่ระบบ โดยไม่ลบข้อมูลอ้างอิงการจอง (rpc admin_delete_user + ban ใน Auth)',
    returns: '`id` · `deleted` = true',
    forbidden: 'ไม่ใช่ SUPER_ADMIN',
  })
  async deleteUser(@CurrentUser() me: AuthUser, @Id() id: string) {
    const result = await this.db.rpc<{ id: string; deleted: boolean }>('admin_delete_user', { p_actor: me.id, p_user: id });
    await this.db.banUser(id);
    return result;
  }

  @Patch('users/:id/role')
  @UseGuards(SuperAdminGuard)
  @ApiDoc({
    summary: 'แก้ชั้นบัญชี',
    description:
      'เฉพาะ SUPER_ADMIN ใช้แก้บัญชีที่สร้างผิด · ตั้งเป็น CUSTOMER / MERCHANT / STAFF / ADMIN / SUPER_ADMIN · ' +
      'ชั้นใหม่เป็น CUSTOMER / ADMIN / SUPER_ADMIN → หลุดจากทุกร้าน (เลิกเป็นเจ้าของ + ถอนจากทีม) · ' +
      'ห้ามเหลือ SUPER_ADMIN เป็นศูนย์ (`LAST_SUPER_ADMIN`) · บันทึก audit log (rpc admin_set_user_role)',
    returns: '`id` รหัสผู้ใช้ · `role` · `bars_detached` จำนวนร้านที่หลุด',
    forbidden: 'ไม่ใช่ SUPER_ADMIN (`SUPER_ADMIN_REQUIRED`)',
  })
  setUserRole(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SetUserRoleDto) {
    return this.db.rpc('admin_set_user_role', { p_actor: me.id, p_user: id, p_role: b.role });
  }

  @Post('users/:id/unban')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ปลดแบนผู้ใช้',
    description: 'ปลดแบนบัญชีที่โดนแบนจากสลิปปลอม + ปลดเบอร์โทรที่โดนแบนเพราะบัญชีนี้ + ล้างธงสลิปปลอมที่นับอยู่ (rpc admin_unban_user · audit log)',
    returns: '`id` · `banned` = false · `phones_unbanned` จำนวนเบอร์ที่ปลด · `flags_cleared` จำนวนธงที่ล้าง',
    forbidden: ADMIN_FORBIDDEN,
  })
  unban(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: UnbanUserDto) {
    return this.db.rpc('admin_unban_user', { p_actor: me.id, p_user: id, p_reason: b.reason || null });
  }
}
