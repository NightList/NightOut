import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiDoc } from '../../common/api-doc';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  BarInfoDto,
  BarPromotionsDto,
  BookingSettingsDto,
  CheckInDto,
  CrowdDto,
  EvidenceDto,
  FeesDto,
  InviteStaffDto,
  MenuDto,
  MoveBookingDto,
  OrderPromotionDto,
  PayoutAccountDto,
  RefundDepositDto,
  SafetyDto,
  TeamBookingStatusDto,
  ZonesDto,
} from './merchant.dto';
import { PayoutCryptoService } from './payout-crypto.service';

const Id = (name: string) => Param(name, new ParseUUIDPipe());

/**
 * งานเขียนฝั่งร้าน — ฟังก์ชันใน DB ตรวจว่าเป็นทีมร้านนี้ (bar_staff) และบทบาทพอไหม
 * พนักงาน (STAFF): การจอง/เช็กอิน/ความแน่น · เจ้าของ/ผู้จัดการ: ทุกอย่าง
 */
@ApiTags('merchant')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant')
export class MerchantController {
  constructor(
    private readonly db: SupabaseService,
    private readonly crypto: PayoutCryptoService,
  ) {}

  @Post('bookings/:bookingId/status')
  @HttpCode(200)
  @ApiDoc({
    summary: "เปลี่ยนสถานะการจอง (ฝั่งร้าน)",
    description: "ทีมร้านยืนยัน/ปฏิเสธ/เช็กอิน/ปิดงาน/ยกเลิกการจอง · DB ตรวจว่าเปลี่ยนสถานะได้ตาม state machine",
    returns: "`id` รหัสการจอง · `status` สถานะใหม่",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  setBookingStatus(@CurrentUser() me: AuthUser, @Id('bookingId') id: string, @Body() b: TeamBookingStatusDto) {
    return this.db.rpc('app_team_set_booking_status', { p_actor: me.id, p_booking: id, p_to: b.to, p_reason: b.reason ?? null });
  }

  @Post('bookings/:bookingId/move')
  @HttpCode(200)
  @ApiDoc({
    summary: "ย้ายโต๊ะ",
    description:
      "ทีมร้านทุกบทบาท (รวม PR/STAFF) ย้ายการจองที่ยังถือโต๊ะอยู่ (รอยืนยัน → เช็กอินแล้ว) ไปโซน/โต๊ะอื่น ช่วงเวลาเดิม · " +
      "โต๊ะปลายทางต้องว่าง (TABLE_TAKEN) · ข้ามโซนต้องมีที่ว่างพอ (ZONE_FULL) · แจ้งลูกค้า + บันทึก audit log · ดูโต๊ะที่ว่างได้จาก GET merchant/bars/:barId/bookings/:bookingId/table-options",
    returns: "`id` · `zone_id` · `zone_name` · `table_id` · `table_name`",
    forbidden: "ไม่ใช่ทีมของร้านนี้",
  })
  moveBooking(@CurrentUser() me: AuthUser, @Id('bookingId') id: string, @Body() b: MoveBookingDto) {
    return this.db.rpc('app_team_move_booking', {
      p_actor: me.id,
      p_booking: id,
      p_zone: b.zone_id,
      p_table: b.table_id ?? null,
      p_reason: b.reason ?? null,
    });
  }

  @Post('bookings/:bookingId/refund')
  @HttpCode(200)
  @ApiDoc({
    summary: "ยืนยันการคืนเงินมัดจำ",
    description:
      "ทีมร้านทุกบทบาท (รวม PR/STAFF) อนุมัติให้คืนมัดจำลูกค้า (เคสหน้างาน เช่น ไม่มีโต๊ะให้) · การจองที่ยังไม่เช็กอิน → ยกเลิกฝั่งร้านและปล่อยโต๊ะ · " +
      "เช็กอิน/ไม่มาแล้วแต่ยังไม่โอนให้ร้าน → สถานะการจองคงเดิม · มัดจำเข้าคิว \"รอคืนลูกค้า\" ให้ NightOut โอนคืน · แจ้งลูกค้าและแอดมิน",
    returns: "`id` รหัสมัดจำ · `booking_id` · `settlement` = REFUND_PENDING · `amount` · `booking_status` สถานะการจองหลังทำรายการ",
    forbidden: "ไม่ใช่ทีมของร้านนี้",
  })
  refundDeposit(@CurrentUser() me: AuthUser, @Id('bookingId') id: string, @Body() b: RefundDepositDto) {
    return this.db.rpc('app_team_refund_deposit', { p_actor: me.id, p_booking: id, p_reason: b.reason });
  }

  @Post('bars/:barId/check-in')
  @HttpCode(200)
  @ApiDoc({
    summary: "เช็กอินลูกค้าด้วยรหัส/QR",
    description: "สแกน QR หรือพิมพ์รหัสการจองที่หน้าร้าน · ผ่านแล้วนับเป็น 1 โหวตในหน้าจัดอันดับ",
    returns: "`id` · `code` · `pax` จำนวนคน · `zone_name` โซน · `customer_name` ชื่อลูกค้า",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  checkIn(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: CheckInDto) {
    return this.db.rpc('app_check_in', { p_actor: me.id, p_bar: bar, p_code: b.code });
  }

  @Post('bars/:barId/crowd')
  @HttpCode(200)
  @ApiDoc({
    summary: "อัปเดตความแน่นของร้าน",
    description: "ตั้งสถานะ ว่าง/ใกล้เต็ม/เต็ม ที่ลูกค้าเห็นบนการ์ดร้าน (เกิน 60 นาทีไม่อัปเดต = ไม่ทราบสถานะ)",
    returns: "`bar_id` · `current_crowd` สถานะปัจจุบัน",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  crowd(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: CrowdDto) {
    return this.db.rpc('app_set_crowd', { p_actor: me.id, p_bar: bar, p_status: b.status });
  }

  @Patch('bars/:barId/info')
  @ApiDoc({
    summary: "แก้ข้อมูลร้าน",
    description: "แก้ชื่อ คำอธิบาย ที่อยู่ เบอร์โทร ย่าน สไตล์ เวลาเปิด-ปิด และลิงก์โซเชียล · ส่งเฉพาะ field ที่ต้องการแก้ · เจ้าของ/ผู้จัดการเท่านั้น",
    returns: "`id` รหัสร้าน",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  info(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: BarInfoDto) {
    return this.db.rpc('app_update_bar_info', { p_actor: me.id, p_bar: bar, p: b });
  }

  @Put('bars/:barId/menu')
  @ApiDoc({
    summary: "ตั้งเมนูและราคา",
    description: "แทนที่เมนูทั้งหมดของร้าน (ราคาแสดงเพื่อประเมินงบ ไม่มีสั่งล่วงหน้า)",
    returns: "`bar_id` · `count` จำนวนรายการที่บันทึก",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  menu(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: MenuDto) {
    return this.db.rpc('app_set_menu', { p_actor: me.id, p_bar: bar, p_items: b.items });
  }

  @Put('bars/:barId/promotions')
  @ApiDoc({
    summary: "ตั้งโปรโมชันของร้าน",
    description: "แทนที่โปรทั้งหมด (เช่น เบียร์ราคาพิเศษก่อน 2 ทุ่ม) · โปรใหม่/แก้ไขต้องรอแอดมินตรวจก่อนแสดง",
    returns: "`bar_id` · `count` จำนวนโปร · `pending` จำนวนที่รอตรวจ",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  promotions(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: BarPromotionsDto) {
    return this.db.rpc('app_set_bar_promotions', { p_actor: me.id, p_bar: bar, p_items: b.items });
  }

  @Put('bars/:barId/fees')
  @ApiDoc({
    summary: "ตั้งค่าบริการ / VAT / ค่าอื่นๆ",
    description: "ใช้คำนวณราคาประเมินในหน้าร้าน",
    returns: "`bar_id`",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  fees(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: FeesDto) {
    return this.db.rpc('app_set_fees', {
      p_actor: me.id,
      p_bar: bar,
      p_service_charge: b.service_charge,
      p_vat: b.vat,
      p_other: b.other,
    });
  }

  @Put('bars/:barId/zones')
  @ApiDoc({
    summary: "ตั้งโซนและโต๊ะ",
    description: "แทนที่โซนทั้งหมด พร้อมความจุ ระยะเวลานั่งเริ่มต้น และรายชื่อโต๊ะ (ใช้คำนวณโซนว่างตอนจอง)",
    returns: "`bar_id` · `zones` จำนวนโซนที่บันทึก",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  zones(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: ZonesDto) {
    return this.db.rpc('app_set_zones', { p_actor: me.id, p_bar: bar, p_zones: b.zones });
  }

  @Put('bars/:barId/safety/:key')
  @ApiDoc({
    summary: "ตั้งข้อมูลความปลอดภัย 1 ข้อ",
    description: "ร้านตอบ YES/NO/UNKNOWN ของหัวข้อความปลอดภัย (`key` เช่น cctv, security_guard) · ใช้คิดคะแนนความปลอดภัย",
    returns: "`bar_id` · `key` · `value`",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  safety(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Param('key') key: string, @Body() b: SafetyDto) {
    return this.db.rpc('app_set_safety', { p_actor: me.id, p_bar: bar, p_key: key.toUpperCase(), p_value: b.value });
  }

  @Put('bars/:barId/safety/:key/evidence')
  @ApiDoc({
    summary: "แนบหลักฐานความปลอดภัย",
    description: "แนบรูปหลักฐาน (อัปโหลดเข้า Storage เองก่อน แล้วส่ง path) ให้แอดมินตรวจยืนยัน",
    returns: "`bar_id` · `key` · `evidence_path`",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  safetyEvidence(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Param('key') key: string, @Body() b: EvidenceDto) {
    return this.db.rpc('app_set_safety_evidence', { p_actor: me.id, p_bar: bar, p_key: key.toUpperCase(), p_path: b.path });
  }

  @Patch('bars/:barId/booking-settings')
  @ApiDoc({
    summary: "ตั้งค่าการจอง มัดจำ และ PR",
    description: "ยอดมัดจำ (ต่อโต๊ะ/ต่อคน) นโยบายมัดจำ เวลาเก็บโต๊ะ และจำนวน PR ชาย/หญิง/LGBTQ+ ที่แสดงบนการ์ดร้าน",
    returns: "`bar_id`",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  bookingSettings(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: BookingSettingsDto) {
    return this.db.rpc('app_update_booking_settings', { p_actor: me.id, p_bar: bar, p: b });
  }

  /** เลขบัญชีเข้ารหัสที่นี่ก่อนส่งลง DB — DB/หน้าเว็บเห็นแค่ 4 ตัวท้าย */
  @Put('bars/:barId/payout-account')
  @ApiDoc({
    summary: "ตั้งบัญชีรับเงินของร้าน",
    description: "บัญชีที่ NightOut โอนเงินมัดจำให้หลังลูกค้าเช็กอิน · เลขบัญชีถูกเข้ารหัสที่ API ก่อนลง DB · เจ้าของร้านเท่านั้น",
    returns: "`id` รหัสบัญชี · `account_no_last4` เลขบัญชี 4 ตัวท้าย",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  payoutAccount(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: PayoutAccountDto) {
    return this.db.rpc('app_set_payout_account', {
      p_actor: me.id,
      p_bar: bar,
      p_bank_code: b.bank_code,
      p_account_name: b.account_name,
      p_account_no_enc: this.crypto.encrypt(b.account_no),
      p_last4: b.account_no.slice(-4),
    });
  }

  @Post('bars/:barId/promotion-orders')
  @ApiDoc({
    summary: "ซื้อแพ็กเกจโปรโมทร้าน",
    description: "สั่งซื้อพื้นที่โฆษณา (แบนเนอร์หน้าแรก/ร้านแนะนำ/บนสุดหน้าค้นหา) พร้อมสลิปโอน · รอแอดมินตรวจ · ไม่มีผลกับอันดับร้าน",
    returns: "`id` รหัสคำสั่งซื้อ · `status` = PAYMENT_SUBMITTED",
    status: 201,
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  orderPromotion(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: OrderPromotionDto) {
    return this.db.rpc('app_order_promotion', { p_actor: me.id, p_bar: bar, p_package: b.package_id, p_slip_path: b.slip_path });
  }

  @Post('bars/:barId/staff')
  @ApiDoc({
    summary: "เชิญพนักงานเข้าทีมร้าน",
    description: "เชิญด้วยอีเมลของผู้ใช้ที่สมัครแล้ว พร้อมบทบาท OWNER/MANAGER/STAFF",
    returns: "`bar_id` · `user_id` ผู้ถูกเชิญ · `role`",
    status: 201,
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  inviteStaff(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Body() b: InviteStaffDto) {
    return this.db.rpc('app_invite_staff', { p_actor: me.id, p_bar: bar, p_email: b.email, p_role: b.role });
  }

  @Delete('bars/:barId/staff/:userId')
  @ApiDoc({
    summary: "นำพนักงานออกจากทีมร้าน",
    description: "เจ้าของ/ผู้จัดการนำสมาชิกออกจากร้าน",
    returns: "`bar_id` · `user_id` · `removed` = true",
    forbidden: "ไม่ใช่ทีมของร้านนี้ หรือบทบาทไม่พอ (STAFF ทำได้แค่การจอง/เช็กอิน/ความแน่น)",
  })
  removeStaff(@CurrentUser() me: AuthUser, @Id('barId') bar: string, @Id('userId') user: string) {
    return this.db.rpc('app_remove_staff', { p_actor: me.id, p_bar: bar, p_user: user });
  }
}
