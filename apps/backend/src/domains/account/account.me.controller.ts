import { Body, Controller, Get, HttpCode, NotFoundException, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthedRequest, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { MarkReadDto, UpdateProfileDto } from './account.dto';

const inList = (ids: string[]) => `in.(${ids.map(encodeURIComponent).join(',')})`;

/**
 * account · ฉัน — โปรไฟล์ ความชอบ ข้อมูลรวมหลังล็อกอิน แจ้งเตือน ร้านโปรด ลบบัญชี
 * อ่านด้วย token ของผู้ใช้ (RLS) · เขียนผ่าน rpc app_update_profile, app_mark_notifications_read, app_toggle_favorite, app_delete_account
 */
@ApiTags('account')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('me')
export class AccountMeController {
  constructor(private readonly db: SupabaseService) {}

  @Get('profile')
  @ApiDoc({
    summary: 'โปรไฟล์ของฉัน',
    description: 'แถวของผู้ใช้ใน public.users — ชั้นบัญชีอ่านจาก DB (ไม่ใช่ user_metadata) พร้อมชื่อไทยจากตาราง roles · เปลี่ยนชั้นตัวเองไม่ได้',
    returns:
      '`id` · `display_name` · `role` รหัสชั้นบัญชี · `role_label` ชื่อไทยของชั้น · `can_enter_backoffice` เข้าหลังบ้านได้ไหม (ยังต้องผ่าน MFA) · `phone_e164` เบอร์ล่าสุดที่ใช้จอง (หน้า Checkout เติมให้) · `banned_at` ถูกระงับการจองเมื่อ (null = ปกติ)',
    validates: false,
  })
  async profile(@Req() req: AuthedRequest, @CurrentUser() me: AuthUser) {
    const rows = await this.db.selectAs<
      {
        id: string;
        display_name: string;
        role: string;
        phone_e164: string | null;
        banned_at: string | null;
        roles: { label_th: string; can_enter_backoffice: boolean } | null;
      }[]
    >(bearerOf(req), `users?select=id,display_name,role,phone_e164,banned_at,roles(label_th,can_enter_backoffice)&id=eq.${me.id}`);
    if (!rows[0]) throw new NotFoundException('USER_NOT_FOUND');
    const { roles, ...u } = rows[0];
    return { ...u, role_label: roles?.label_th ?? u.role, can_enter_backoffice: roles?.can_enter_backoffice ?? false };
  }

  @Patch('profile')
  @ApiDoc({
    summary: 'แก้โปรไฟล์และความชอบ',
    description: 'แก้ชื่อที่แสดง สไตล์ร้าน/ย่านที่ชอบ งบต่อคน จำนวนคนที่ไปบ่อย ธีม และสถานะ onboarding · ส่งเฉพาะ field ที่ต้องการแก้ (rpc app_update_profile)',
    returns: '`id` รหัสผู้ใช้',
  })
  updateProfile(@CurrentUser() me: AuthUser, @Body() b: UpdateProfileDto) {
    return this.db.rpc('app_update_profile', { p_actor: me.id, p: b });
  }

  @Get('overview')
  @ApiDoc({
    summary: 'ข้อมูลทั้งหมดของฉัน',
    description:
      'การจอง · แจ้งเตือน 100 รายการล่าสุด · ร้านโปรด · รีวิวของฉัน · ความชอบ · ร้านที่ฉันอยู่ในทีม (ทุกสถานะ) + การจองของร้าน + ประวัติโปรโมท · รีวิวที่ฉันรายงาน — หน้าเว็บโหลดหลังล็อกอินและทุก 60 วิ (view booking_detail, my_favorites, my_reviews, my_bar_detail)',
    returns:
      '`bookings` · `notifications` · `favorites` · `reviews` · `preferences` (หรือ null) · `bars` · `team_bookings` · `listings` · `review_reports` (แถวจาก view ของ DB)',
    validates: false,
  })
  async overview(@Req() req: AuthedRequest, @CurrentUser() me: AuthUser) {
    const t = bearerOf(req);
    const [bookings, notifications, favorites, reviews, prefs, bars, reviewReports] = await Promise.all([
      this.db.selectAs<unknown[]>(t, `booking_detail?select=*&user_id=eq.${me.id}&order=booking_datetime.desc`),
      this.db.selectAs<unknown[]>(t, 'notifications?select=id,user_id,title,body,payload,read_at,created_at&order=created_at.desc&limit=100'),
      this.db.selectAs<unknown[]>(t, 'my_favorites?select=id'),
      this.db.selectAs<unknown[]>(t, 'my_reviews?select=*&order=created_at.desc'),
      this.db.selectAs<unknown[]>(t, `user_preferences?select=*&user_id=eq.${me.id}&limit=1`),
      this.db.selectAs<{ id: string }[]>(t, 'my_bar_detail?select=*&order=created_at'),
      this.db.selectAs<unknown[]>(t, 'review_reports?select=review_id'),
    ]);
    const barIds = bars.map((b) => b.id);
    const [teamBookings, listings] = barIds.length
      ? await Promise.all([
          this.db.selectAs<unknown[]>(t, `booking_detail?select=*&bar->>id=${inList(barIds)}&order=booking_datetime.desc&limit=1000`),
          this.db.selectAs<unknown[]>(
            t,
            `promoted_listings?select=id,bar_id,placement,price_paid,status,created_at,promotion_packages(name,duration_days)&bar_id=${inList(barIds)}&order=created_at.desc`,
          ),
        ])
      : [[], []];
    return { bookings, notifications, favorites, reviews, preferences: prefs[0] ?? null, bars, team_bookings: teamBookings, listings, review_reports: reviewReports };
  }

  @Post('favorites/:barId/toggle')
  @HttpCode(200)
  @ApiDoc({
    summary: 'บันทึก/เอาออกร้านโปรด',
    description: 'กดครั้งแรกบันทึกเป็นร้านโปรด กดอีกครั้งเอาออก (rpc app_toggle_favorite)',
    returns: '`bar_id` · `favorite` สถานะหลังกด (true = เป็นร้านโปรด)',
  })
  toggleFavorite(@CurrentUser() me: AuthUser, @Id('barId') barId: string) {
    return this.db.rpc('app_toggle_favorite', { p_actor: me.id, p_bar: barId });
  }

  @Post('notifications/read')
  @HttpCode(200)
  @ApiDoc({
    summary: 'อ่านแจ้งเตือนแล้ว',
    description: 'ทำเครื่องหมายแจ้งเตือนว่าอ่านแล้ว · ส่ง `ids` = เฉพาะรายการนั้น · ไม่ส่ง = อ่านทั้งหมด (rpc app_mark_notifications_read)',
    returns: '`updated` จำนวนแจ้งเตือนที่อัปเดต',
  })
  markRead(@CurrentUser() me: AuthUser, @Body() b: MarkReadDto) {
    return this.db.rpc('app_mark_notifications_read', { p_actor: me.id, p_ids: b.ids ?? null });
  }

  /** ลบบัญชี: ปิดบัญชีใน DB + ระงับการเข้าสู่ระบบ (ข้อมูลส่วนตัวถูกล้างตามรอบ retention) */
  @Post('delete')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ลบบัญชี',
    description: 'ปิดบัญชีใน DB และระงับการเข้าสู่ระบบทันที · ต้องไม่มีการจองที่ยังไม่จบ · ซูเปอร์แอดมินคนสุดท้ายลบไม่ได้ · ข้อมูลส่วนตัวถูกล้างตามรอบ retention (rpc app_delete_account + ban ใน Auth)',
    returns: '`id` รหัสผู้ใช้ · `deleted` = true',
  })
  async deleteAccount(@CurrentUser() me: AuthUser) {
    const r = await this.db.rpc('app_delete_account', { p_actor: me.id });
    await this.db.banUser(me.id);
    return r;
  }
}
