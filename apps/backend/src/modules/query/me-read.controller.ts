import { Body, Controller, Get, HttpCode, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthedRequest, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { SupabaseService } from '../../supabase/supabase.service';
import { PUBLIC_BUCKETS, UploadUrlDto } from './query.dto';

const inList = (ids: string[]) => `in.(${ids.map(encodeURIComponent).join(',')})`;

/** อ่านข้อมูลของผู้ใช้ที่ล็อกอิน (เดิมหน้าเว็บ query Supabase ตรง) — ทุก query วิ่งด้วย token ของผู้ใช้ (RLS) */
@ApiTags('me')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller()
export class MeReadController {
  constructor(private readonly db: SupabaseService) {}

  @Get('me/profile')
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

  @Get('me/overview')
  @ApiDoc({
    summary: 'ข้อมูลทั้งหมดของฉัน',
    description:
      'การจอง · แจ้งเตือน 100 รายการล่าสุด · ร้านโปรด · รีวิวของฉัน · ความชอบ · ร้านที่ฉันอยู่ในทีม (ทุกสถานะ) + การจองของร้าน + ประวัติโปรโมท · รีวิวที่ฉันรายงาน — หน้าเว็บโหลดหลังล็อกอินและทุก 60 วิ',
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
    return {
      bookings,
      notifications,
      favorites,
      reviews,
      preferences: prefs[0] ?? null,
      bars,
      team_bookings: teamBookings,
      listings,
      review_reports: reviewReports,
    };
  }

  @Get('me/invites')
  @ApiDoc({
    summary: 'คำเชิญเข้าทีมร้านของฉัน',
    description: 'คำเชิญที่ยังไม่ได้ตอบ',
    returns: 'รายการ `bar_id` · `bar_name` · `role` · `invited_at` · `invited_by`',
    validates: false,
  })
  invites(@Req() req: AuthedRequest) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'my_invites', {});
  }

  @Post('storage/upload-url')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ขอ URL อัปโหลดไฟล์',
    description:
      'สลิปมัดจำ / รูป-วิดีโอรีวิว / สลิปโปรโมท / หลักฐานความปลอดภัย — หน้าเว็บ PUT ไฟล์ตรงเข้า URL นี้ (ไฟล์ใหญ่ไม่ผ่าน API) · Storage policy ตรวจว่าโฟลเดอร์แรกเป็นของผู้เรียก',
    returns: '`upload_url` URL สำหรับ PUT ไฟล์ (ใช้ได้ครั้งเดียว ~2 ชม.) · `path` path ที่จะได้ · `public_url` URL ถาวร (เฉพาะ bucket public เช่น team-photos)',
    forbidden: 'อัปโหลดลงโฟลเดอร์ของคนอื่นไม่ได้',
  })
  async uploadUrl(@Req() req: AuthedRequest, @Body() b: UploadUrlDto) {
    const upload_url = await this.db.signedUploadUrlAs(bearerOf(req)!, b.bucket, b.path);
    return { upload_url, path: b.path, public_url: PUBLIC_BUCKETS.includes(b.bucket) ? this.db.publicUrl(b.bucket, b.path) : null };
  }
}
