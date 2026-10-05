import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { ApiDoc } from '../../common/api-doc';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { SupabaseService } from '../../supabase/supabase.service';
import { AdminUsersService } from './admin-users.service';
import {
  CreateTeamMemberDto,
  CreateUserDto,
  ModerateReviewDto,
  ReorderTeamDto,
  ReviewDepositDto,
  ReviewDto,
  SetBarStatusDto,
  SetEditorPickDto,
  SetUserRoleDto,
  SettleDepositDto,
  UnbanUserDto,
  UpdateTeamMemberDto,
} from './admin.dto';

const Id = () => Param('id', new ParseUUIDPipe());

/**
 * งานเขียนของ Backoffice — ทุก endpoint เรียกฟังก์ชัน admin_* ใน DB (ตรวจ ADMIN ซ้ำ + บันทึก audit_logs ในธุรกรรมเดียวกัน)
 * การอ่านข้อมูลหน้าแอดมิน ใช้วิว admin_* ผ่าน Supabase ตรง (RLS: ADMIN + MFA)
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly db: SupabaseService,
    private readonly users: AdminUsersService,
  ) {}

  @Patch('bars/:id/status')
  @ApiDoc({
    summary: "อนุมัติ/ระงับร้าน",
    description: "เปลี่ยนสถานะร้าน (APPROVED = ขึ้นหน้าเว็บ, REJECTED/SUSPENDED = ซ่อน) พร้อมเหตุผล · บันทึก audit log",
    returns: "`id` รหัสร้าน · `status` สถานะใหม่",
    forbidden: "ไม่ใช่ ADMIN",
  })
  setBarStatus(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SetBarStatusDto) {
    return this.db.rpc('admin_set_bar_status', { p_actor: me.id, p_bar: id, p_status: b.status, p_reason: b.reason ?? null });
  }

  @Patch('bars/:id/editor-pick')
  @ApiDoc({
    summary: "ตั้ง/ยกเลิก Editor's Pick",
    description: "ติดป้ายร้านแนะนำโดยทีมงาน",
    returns: "`id` รหัสร้าน · `is_editor_pick`",
    forbidden: "ไม่ใช่ ADMIN",
  })
  setEditorPick(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SetEditorPickDto) {
    return this.db.rpc('admin_set_editor_pick', { p_actor: me.id, p_bar: id, p_value: b.value });
  }

  @Post('safety/:id/verify')
  @HttpCode(200)
  @ApiDoc({
    summary: "ยืนยันข้อมูลความปลอดภัย",
    description: "แอดมินตรวจหลักฐานแล้วยืนยันข้อความปลอดภัย 1 ข้อของร้าน",
    returns: "`id` รหัสรายการ · `source` = ADMIN_VERIFIED",
    forbidden: "ไม่ใช่ ADMIN",
  })
  verifySafety(@CurrentUser() me: AuthUser, @Id() id: string) {
    return this.db.rpc('admin_verify_safety', { p_actor: me.id, p_feature: id });
  }

  @Post('deposits/:id/review')
  @HttpCode(200)
  @ApiDoc({
    summary: "ตรวจสลิปมัดจำ",
    description:
      "อนุมัติ (การจองยืนยัน) หรือปฏิเสธสลิปพร้อม `reason_code` (FAKE_SLIP · AMOUNT_MISMATCH · WRONG_ACCOUNT · UNREADABLE · DUPLICATE · OTHER) · " +
      "FAKE_SLIP ติดธงที่ลูกค้า — ธงครบ 2 ครั้ง (นับทั้งบัญชีและเบอร์โทร) แบนบัญชีและทุกเบอร์ที่บัญชีนั้นเคยใช้ จองไม่ได้อีก · " +
      "ถ้าลูกค้ายกเลิกระหว่างรอตรวจ อนุมัติแล้วมัดจำจะอยู่ในคิวรอคืนลูกค้า",
    returns: "`id` รหัสมัดจำ · `status` VERIFIED / REJECTED · `reject_code` · (FAKE_SLIP) `fake_slip_count` จำนวนธง · `banned` แบนแล้วหรือยัง",
    forbidden: "ไม่ใช่ ADMIN",
  })
  reviewDeposit(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ReviewDepositDto) {
    return this.db.rpc('admin_review_deposit', {
      p_actor: me.id,
      p_deposit: id,
      p_approve: b.approve,
      p_reason: b.reason || null,
      p_reason_code: b.approve ? null : (b.reason_code ?? null),
    });
  }

  @Post('deposits/:id/settle')
  @HttpCode(200)
  @ApiDoc({
    summary: "ปิดยอดมัดจำ",
    description: "หลังลูกค้าเช็กอิน/ไม่มา: โอนให้ร้าน (PAID_OUT) · เก็บเป็นเครดิตร้าน (CREDIT) · คืนลูกค้า (REFUNDED)",
    returns: "`id` รหัสมัดจำ · `settlement` วิธีที่ปิดยอด",
    forbidden: "ไม่ใช่ ADMIN",
  })
  settleDeposit(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SettleDepositDto) {
    return this.db.rpc('admin_settle_deposit', { p_actor: me.id, p_deposit: id, p_how: b.how });
  }

  @Post('reviews/:id/moderate')
  @HttpCode(200)
  @ApiDoc({
    summary: "จัดการรีวิว",
    description: "คงไว้ / ซ่อน / ลบ / กู้คืน รีวิวที่ถูกรายงาน",
    returns: "`id` รหัสรีวิว · `status` สถานะใหม่",
    forbidden: "ไม่ใช่ ADMIN",
  })
  moderateReview(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ModerateReviewDto) {
    return this.db.rpc('admin_moderate_review', { p_actor: me.id, p_review: id, p_action: b.action, p_reason: b.reason ?? null });
  }

  @Post('promotions/:id/review')
  @HttpCode(200)
  @ApiDoc({
    summary: "ตรวจคำสั่งซื้อโปรโมทร้าน",
    description: "อนุมัติ (เริ่มแสดงโฆษณา) หรือปฏิเสธพร้อมเหตุผล",
    returns: "`id` · `status` ACTIVE / REJECTED",
    forbidden: "ไม่ใช่ ADMIN",
  })
  reviewPromotion(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ReviewDto) {
    return this.db.rpc('admin_review_promotion', { p_actor: me.id, p_listing: id, p_approve: b.approve, p_reason: b.reason ?? null });
  }

  @Post('bar-promotions/:id/moderate')
  @HttpCode(200)
  @ApiDoc({
    summary: "ตรวจโปรโมชันของร้าน",
    description: "อนุมัติหรือปฏิเสธโปรที่ร้านตั้ง ก่อนแสดงให้ลูกค้าเห็น",
    returns: "`id` รหัสโปร · `moderation_status` APPROVED / REJECTED",
    forbidden: "ไม่ใช่ ADMIN",
  })
  moderateBarPromotion(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ReviewDto) {
    return this.db.rpc('admin_moderate_bar_promotion', { p_actor: me.id, p_promotion: id, p_approve: b.approve, p_reason: b.reason ?? null });
  }

  @Post('users')
  @ApiDoc({
    summary: 'เพิ่มผู้ใช้',
    description:
      'สร้างบัญชีที่ยืนยันอีเมลแล้ว ใช้เข้าสู่ระบบได้ทันที · เลือกประเภทบัญชี: ลูกค้า / แอดมิน / เจ้าของร้าน / ผู้จัดการร้าน / พนักงานร้าน (3 แบบหลังต้องเลือกร้าน) · ไม่ใส่รหัสผ่าน = ระบบสุ่มให้ · บันทึก audit log',
    returns: '`id` · `email` · `display_name` · `role` · `bar_id` · `bar_role` · `password` (เฉพาะเมื่อระบบสุ่มให้ — แสดงครั้งเดียว ไม่ถูกเก็บ)',
    status: 201,
    forbidden: 'ไม่ใช่ ADMIN',
  })
  createUser(@CurrentUser() me: AuthUser, @Body() b: CreateUserDto) {
    return this.users.create(me.id, b);
  }

  @Post('users/:id/unban')
  @HttpCode(200)
  @ApiDoc({
    summary: "ปลดแบนผู้ใช้",
    description: "ปลดแบนบัญชีที่โดนแบนจากสลิปปลอม + ปลดเบอร์โทรที่โดนแบนเพราะบัญชีนี้ + ล้างธงสลิปปลอมที่นับอยู่ (บันทึก audit log)",
    returns: "`id` · `banned` = false · `phones_unbanned` จำนวนเบอร์ที่ปลด · `flags_cleared` จำนวนธงที่ล้าง",
    forbidden: "ไม่ใช่ ADMIN",
  })
  unbanUser(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: UnbanUserDto) {
    return this.db.rpc('admin_unban_user', { p_actor: me.id, p_user: id, p_reason: b.reason || null });
  }

  @Patch('users/:id/role')
  @ApiDoc({
    summary: "เปลี่ยนบทบาทผู้ใช้",
    description: "ตั้งเป็น CUSTOMER / MERCHANT / STAFF / ADMIN · บันทึก audit log",
    returns: "`id` รหัสผู้ใช้ · `role`",
    forbidden: "ไม่ใช่ ADMIN",
  })
  setUserRole(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SetUserRoleDto) {
    return this.db.rpc('admin_set_user_role', { p_actor: me.id, p_user: id, p_role: b.role });
  }

  // ----------------------------- ทีมงานหน้า /about -----------------------------
  @Post('team-members')
  @ApiDoc({
    summary: 'เพิ่มทีมงาน',
    description: 'เพิ่มคนในหน้าเกี่ยวกับเรา (ต่อท้ายลำดับ) · รูปอัปโหลดเข้า bucket team-photos ก่อนด้วย POST /storage/upload-url แล้วส่ง URL มา · บันทึก audit log',
    returns: '`id` · `nickname` · `active` · `sort_order`',
    status: 201,
    forbidden: 'ไม่ใช่ ADMIN',
  })
  createTeamMember(@CurrentUser() me: AuthUser, @Body() b: CreateTeamMemberDto) {
    return this.db.rpc('admin_save_team_member', { p_actor: me.id, p_id: null, p: b });
  }

  @Patch('team-members/:id')
  @ApiDoc({
    summary: 'แก้ข้อมูลทีมงาน',
    description: 'ส่งเฉพาะ field ที่ต้องการแก้ เช่น `{ "active": false }` = ซ่อนจากหน้าเว็บ · บันทึก audit log (ก่อน/หลัง)',
    returns: '`id` · `nickname` · `active` · `sort_order`',
    forbidden: 'ไม่ใช่ ADMIN',
  })
  updateTeamMember(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: UpdateTeamMemberDto) {
    return this.db.rpc('admin_save_team_member', { p_actor: me.id, p_id: id, p: b });
  }

  @Delete('team-members/:id')
  @ApiDoc({
    summary: 'ลบทีมงาน',
    description: 'ลบถาวร (ถ้าแค่ไม่อยากให้แสดง ใช้ PATCH active=false) · บันทึก audit log',
    returns: '`id` · `deleted` = true',
    forbidden: 'ไม่ใช่ ADMIN',
  })
  deleteTeamMember(@CurrentUser() me: AuthUser, @Id() id: string) {
    return this.db.rpc('admin_delete_team_member', { p_actor: me.id, p_id: id });
  }

  @Put('team-members/order')
  @ApiDoc({
    summary: 'เรียงลำดับทีมงาน',
    description: 'ส่ง id ทั้งหมดเรียงจากบนลงล่าง → sort_order 10, 20, 30, … (ลำดับเดียวกับหน้าเกี่ยวกับเรา)',
    returns: '`updated` จำนวนแถวที่เปลี่ยนลำดับ',
    forbidden: 'ไม่ใช่ ADMIN',
  })
  reorderTeam(@CurrentUser() me: AuthUser, @Body() b: ReorderTeamDto) {
    return this.db.rpc('admin_reorder_team_members', { p_actor: me.id, p_ids: b.ids });
  }
}
