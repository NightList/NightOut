import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiDoc } from '../../common/api-doc';
import { clientInfo } from '../../common/client-info';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  AddReviewDto,
  CancelBookingDto,
  CreateBookingDto,
  MarkReadDto,
  MerchantJoinDto,
  ReportReviewDto,
  RespondInviteDto,
  SubmitDepositDto,
  UpdateProfileDto,
} from './customer.dto';

const Id = (name = 'id') => Param(name, new ParseUUIDPipe());

/**
 * งานเขียนฝั่งลูกค้า — ทุก endpoint เรียกฟังก์ชัน app_* ใน DB (ตรวจสิทธิ์ซ้ำ + ทำทั้งหมดในธุรกรรมเดียว)
 * ไฟล์ (สลิป / รูปรีวิว) หน้าเว็บอัปโหลดเข้า Supabase Storage เองตาม policy แล้วส่งแค่ path มา
 */
@ApiTags('customer')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller()
export class CustomerController {
  constructor(private readonly db: SupabaseService) {}

  @Post('bookings')
  @ApiDoc({
    summary: "จองโต๊ะ",
    description: "ลูกค้าสร้างการจองโต๊ะ (เฉพาะโต๊ะ + เลือกโปรของร้านได้ 1 อย่าง) · DB ตรวจโซนว่าง เวลา และเงื่อนไขโปรในธุรกรรมเดียว · ทุกการจองต้องมัดจำ → สถานะเริ่มที่ AWAITING_DEPOSIT (หรือ PENDING ถ้าร้านไม่เก็บมัดจำ) · ต้องมี `contact_phone` และ `deposit_terms.accepted = true` — DB เก็บหลักฐานการยอมรับเงื่อนไขริบมัดจำ (ข้อความ + IP + User-Agent + เวลา) แก้ไม่ได้ · บัญชี/เบอร์ที่ถูกแบน (สลิปปลอม 2 ครั้ง) → 403",
    returns: "`id` รหัสการจอง · `code` รหัสเช็กอิน · `status` สถานะการจอง · `deposit_required` ยอดมัดจำที่ต้องโอน (บาท)",
    status: 201,
  })
  createBooking(@CurrentUser() me: AuthUser, @Body() b: CreateBookingDto, @Req() req: Request) {
    return this.db.rpc('app_create_booking', {
      p_actor: me.id,
      p_bar: b.bar_id,
      p_zone: b.zone_id,
      p_datetime: b.datetime,
      p_pax: b.pax,
      p_promotion: b.promotion_id ?? null,
      p_note: b.note ?? null,
      p_contact_phone: b.contact_phone,
      p_consent: b.deposit_terms ? { ...b.deposit_terms, ...clientInfo(req) } : null,
    });
  }

  @Post('bookings/:id/deposit')
  @HttpCode(200)
  @ApiDoc({
    summary: "ส่งสลิปมัดจำ",
    description: "หลังโอนมัดจำเข้า PromptPay ของ NightOut ให้อัปโหลดสลิปเข้า Storage `slips/<user_id>/<booking_id>.jpg` เองก่อน แล้วส่ง `slip_path` มาที่เส้นนี้ · ใช้ได้เฉพาะการจองของตัวเองที่ยังรอมัดจำ",
    returns: "`id` รหัสมัดจำ · `booking_id` · `status` = SUBMITTED (รอแอดมินตรวจ)",
  })
  submitDeposit(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SubmitDepositDto) {
    return this.db.rpc('app_submit_deposit', { p_actor: me.id, p_booking: id, p_slip_path: b.slip_path, p_slip_ref: b.slip_ref ?? null });
  }

  @Post('bookings/:id/cancel')
  @HttpCode(200)
  @ApiDoc({
    summary: "ยกเลิกการจอง",
    description: "ลูกค้ายกเลิกการจองของตัวเอง (ก่อนเช็กอิน) พร้อมเหตุผล (ไม่บังคับ)",
    returns: "`id` รหัสการจอง · `status` = CANCELLED_BY_CUSTOMER",
  })
  cancelBooking(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: CancelBookingDto) {
    return this.db.rpc('app_cancel_booking', { p_actor: me.id, p_booking: id, p_reason: b.reason ?? null });
  }

  @Post('bookings/:id/review')
  @ApiDoc({
    summary: "เขียนรีวิวร้าน",
    description: "รีวิวได้เฉพาะการจองที่เช็กอินแล้วและยังไม่เคยรีวิว · แนบรูป/วิดีโอได้สูงสุด 6 ไฟล์ (อัปโหลดเข้า bucket `review-media` เองก่อน แล้วส่ง path)",
    returns: "`id` รหัสรีวิว · `bar_id` ร้านที่รีวิว",
    status: 201,
  })
  addReview(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: AddReviewDto) {
    return this.db.rpc('app_add_review', {
      p_actor: me.id,
      p_booking: id,
      p_review_id: b.review_id,
      p_rating: b.rating,
      p_comment: b.comment,
      p_media: b.media,
    });
  }

  @Post('reviews/:id/report')
  @HttpCode(200)
  @ApiDoc({
    summary: "รายงานรีวิวไม่เหมาะสม",
    description: "แจ้งรีวิวที่เป็นสแปม/หยาบคาย/ปลอม/ละเมิดความเป็นส่วนตัว ให้แอดมินตรวจ · 1 คนรายงานรีวิวเดิมได้ครั้งเดียว",
    returns: "`review_id` · `reported` = true",
  })
  reportReview(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ReportReviewDto) {
    return this.db.rpc('app_report_review', { p_actor: me.id, p_review: id, p_reason: b.reason, p_detail: b.detail ?? null });
  }

  @Post('me/favorites/:barId/toggle')
  @HttpCode(200)
  @ApiDoc({
    summary: "บันทึก/เอาออกร้านโปรด",
    description: "กดครั้งแรกบันทึกเป็นร้านโปรด กดอีกครั้งเอาออก",
    returns: "`bar_id` · `favorite` สถานะหลังกด (true = เป็นร้านโปรด)",
  })
  toggleFavorite(@CurrentUser() me: AuthUser, @Id('barId') barId: string) {
    return this.db.rpc('app_toggle_favorite', { p_actor: me.id, p_bar: barId });
  }

  @Post('me/notifications/read')
  @HttpCode(200)
  @ApiDoc({
    summary: "อ่านแจ้งเตือนแล้ว",
    description: "ทำเครื่องหมายแจ้งเตือนว่าอ่านแล้ว · ส่ง `ids` = เฉพาะรายการนั้น · ไม่ส่ง = อ่านทั้งหมด",
    returns: "`updated` จำนวนแจ้งเตือนที่อัปเดต",
  })
  markRead(@CurrentUser() me: AuthUser, @Body() b: MarkReadDto) {
    return this.db.rpc('app_mark_notifications_read', { p_actor: me.id, p_ids: b.ids ?? null });
  }

  @Patch('me/profile')
  @ApiDoc({
    summary: "แก้โปรไฟล์และความชอบ",
    description: "แก้ชื่อที่แสดง สไตล์ร้าน/ย่านที่ชอบ งบต่อคน จำนวนคนที่ไปบ่อย ธีม และสถานะ onboarding · ส่งเฉพาะ field ที่ต้องการแก้",
    returns: "`id` รหัสผู้ใช้",
  })
  updateProfile(@CurrentUser() me: AuthUser, @Body() b: UpdateProfileDto) {
    return this.db.rpc('app_update_profile', { p_actor: me.id, p: b });
  }

  /** ลบบัญชี: ปิดบัญชีใน DB + ระงับการเข้าสู่ระบบ (ข้อมูลส่วนตัวถูกล้างตามรอบ retention) */
  @Post('me/delete')
  @HttpCode(200)
  @ApiDoc({
    summary: "ลบบัญชี",
    description: "ปิดบัญชีใน DB และระงับการเข้าสู่ระบบทันที · ข้อมูลส่วนตัวถูกล้างตามรอบ retention",
    returns: "`id` รหัสผู้ใช้ · `deleted` = true",
  })
  async deleteAccount(@CurrentUser() me: AuthUser) {
    const r = await this.db.rpc('app_delete_account', { p_actor: me.id });
    await this.db.banUser(me.id);
    return r;
  }

  @Post('invites/:barId/respond')
  @HttpCode(200)
  @ApiDoc({
    summary: "ตอบรับ/ปฏิเสธคำเชิญเข้าทีมร้าน",
    description: "ผู้ใช้ที่ถูกเชิญเป็นพนักงานร้านกดรับหรือปฏิเสธ",
    returns: "`bar_id` · `accepted` ผลการตอบ · `role` บทบาทในร้าน (เมื่อรับ)",
  })
  respondInvite(@CurrentUser() me: AuthUser, @Id('barId') barId: string, @Body() b: RespondInviteDto) {
    return this.db.rpc('app_respond_invite', { p_actor: me.id, p_bar: barId, p_accept: b.accept });
  }

  @Post('merchant/join')
  @ApiDoc({
    summary: "สมัครลงร้าน",
    description: "เจ้าของร้านส่งข้อมูลร้านเพื่อขอลงในระบบ · ร้านจะอยู่สถานะ PENDING_REVIEW จนแอดมินอนุมัติ",
    returns: "`id` รหัสร้าน · `slug` · `status` = PENDING_REVIEW",
    status: 201,
  })
  merchantJoin(@CurrentUser() me: AuthUser, @Body() b: MerchantJoinDto) {
    return this.db.rpc('app_merchant_join', { p_actor: me.id, p: b });
  }
}
