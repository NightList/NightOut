import { Body, Controller, HttpCode, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { BarId, TEAM_FORBIDDEN } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { BarMediaService } from './bar-media.service';
import { BarInfoDto, BarMediaDto, BarPromotionsDto, BookingSettingsDto, CrowdDto, EvidenceDto, FeesDto, MenuDto, PayoutAccountDto, SafetyDto, ZonesDto } from './bar.dto';
import { PayoutCryptoService } from './payout-crypto.service';

/**
 * bar · ทีมร้าน — ข้อมูลร้าน รูปร้าน เมนู โปร ค่าธรรมเนียม โซน ความปลอดภัย ตั้งค่าการจอง บัญชีรับเงิน ความแน่น
 * ฟังก์ชันใน DB ตรวจ bar_staff + บทบาท: STAFF ทำได้แค่ความแน่น · เจ้าของ/ผู้จัดการ ทุกอย่าง · บัญชีรับเงินเฉพาะเจ้าของ
 */
@ApiTags('bar')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant/bars/:barId')
export class BarMerchantController {
  constructor(
    private readonly db: SupabaseService,
    private readonly crypto: PayoutCryptoService,
    private readonly media: BarMediaService,
  ) {}

  @Post('crowd')
  @HttpCode(200)
  @ApiDoc({
    summary: 'อัปเดตความแน่นของร้าน',
    description: 'ตั้งสถานะ ว่าง/ใกล้เต็ม/เต็ม ที่ลูกค้าเห็นบนการ์ดร้าน (เกิน 60 นาทีไม่อัปเดต = ไม่ทราบสถานะ) (rpc app_set_crowd)',
    returns: '`bar_id` · `current_crowd` สถานะปัจจุบัน',
    forbidden: TEAM_FORBIDDEN,
  })
  crowd(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: CrowdDto) {
    return this.db.rpc('app_set_crowd', { p_actor: me.id, p_bar: bar, p_status: b.status });
  }

  @Patch('info')
  @ApiDoc({
    summary: 'แก้ข้อมูลร้าน',
    description: 'แก้ชื่อ คำอธิบาย ที่อยู่ เบอร์โทร ย่าน สไตล์ เวลาเปิด-ปิด และลิงก์โซเชียล · ส่งเฉพาะ field ที่ต้องการแก้ · เจ้าของ/ผู้จัดการเท่านั้น (rpc app_update_bar_info)',
    returns: '`id` รหัสร้าน',
    forbidden: TEAM_FORBIDDEN,
  })
  info(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: BarInfoDto) {
    return this.db.rpc('app_update_bar_info', { p_actor: me.id, p_bar: bar, p: b });
  }

  @Put('media')
  @ApiDoc({
    summary: 'ตั้งรูปร้าน (ปก + แกลเลอรี)',
    description:
      'แทนที่แกลเลอรีทั้งชุดตามลำดับ (สูงสุด 10 รูป · อัปโหลดเข้า bucket bar-media/<bar_id>/gallery/ เองก่อนด้วย POST /storage/upload-url แล้วส่ง path) · `cover_path` = รูปปกที่ใช้บนการ์ด/แผนที่/หัวหน้าร้าน (ต้องอยู่ในแกลเลอรี · null = ใช้รูปแทน) · ไฟล์ที่เอาออกถูกลบจาก Storage · เจ้าของ/ผู้จัดการเท่านั้น (rpc app_set_bar_media)',
    returns: '`bar_id` · `count` จำนวนรูป · `cover_image_url` URL รูปปก · `paths` แกลเลอรีที่บันทึก',
    forbidden: TEAM_FORBIDDEN,
  })
  setMedia(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: BarMediaDto) {
    return this.media.setGallery('app_set_bar_media', me.id, bar, b);
  }

  @Put('menu')
  @ApiDoc({
    summary: 'ตั้งเมนูและราคา',
    description:
      'แทนที่เมนูทั้งหมดของร้าน (ราคาแสดงเพื่อประเมินงบ ไม่มีสั่งล่วงหน้า) · `image_path` ต่อรายการ = รูปใน bucket bar-media/<bar_id>/menu/ (ไม่ส่ง = คงรูปเดิม · null = ลบรูป) · รูปที่ถูกแทน/ลบถูกลบจาก Storage (rpc app_set_menu)',
    returns: '`bar_id` · `count` จำนวนรายการที่บันทึก',
    forbidden: TEAM_FORBIDDEN,
  })
  menu(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: MenuDto) {
    return this.media.setMenu(me.id, bar, b);
  }

  @Put('promotions')
  @ApiDoc({
    summary: 'ตั้งโปรโมชันของร้าน',
    description: 'แทนที่โปรทั้งหมด (เช่น เบียร์ราคาพิเศษก่อน 2 ทุ่ม) · โปรใหม่/แก้ไขต้องรอแอดมินตรวจก่อนแสดง (rpc app_set_bar_promotions)',
    returns: '`bar_id` · `count` จำนวนโปร · `pending` จำนวนที่รอตรวจ',
    forbidden: TEAM_FORBIDDEN,
  })
  promotions(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: BarPromotionsDto) {
    return this.db.rpc('app_set_bar_promotions', { p_actor: me.id, p_bar: bar, p_items: b.items });
  }

  @Put('fees')
  @ApiDoc({
    summary: 'ตั้งค่าบริการ / VAT / ค่าอื่นๆ',
    description: 'ใช้คำนวณราคาประเมินในหน้าร้าน (rpc app_set_fees)',
    returns: '`bar_id`',
    forbidden: TEAM_FORBIDDEN,
  })
  fees(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: FeesDto) {
    return this.db.rpc('app_set_fees', { p_actor: me.id, p_bar: bar, p_service_charge: b.service_charge, p_vat: b.vat, p_other: b.other });
  }

  @Put('zones')
  @ApiDoc({
    summary: 'ตั้งโซนและโต๊ะ',
    description: 'แทนที่โซนทั้งหมด พร้อมความจุ ระยะเวลานั่งเริ่มต้น และรายชื่อโต๊ะ (ใช้คำนวณโซนว่างตอนจอง) · โซน/โต๊ะที่ไม่ส่งมา = ปิดใช้ (rpc app_set_zones)',
    returns: '`bar_id` · `zones` จำนวนโซนที่บันทึก',
    forbidden: TEAM_FORBIDDEN,
  })
  zones(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: ZonesDto) {
    return this.db.rpc('app_set_zones', { p_actor: me.id, p_bar: bar, p_zones: b.zones });
  }

  @Put('safety/:key')
  @ApiDoc({
    summary: 'ตั้งข้อมูลความปลอดภัย 1 ข้อ',
    description: 'ร้านตอบ YES/NO/UNKNOWN ของหัวข้อความปลอดภัย (`key` เช่น cctv, security_guard) · ใช้คิดคะแนนความปลอดภัย (rpc app_set_safety)',
    returns: '`bar_id` · `key` · `value`',
    forbidden: TEAM_FORBIDDEN,
  })
  safety(@CurrentUser() me: AuthUser, @BarId() bar: string, @Param('key') key: string, @Body() b: SafetyDto) {
    return this.db.rpc('app_set_safety', { p_actor: me.id, p_bar: bar, p_key: key.toUpperCase(), p_value: b.value });
  }

  @Put('safety/:key/evidence')
  @ApiDoc({
    summary: 'แนบหลักฐานความปลอดภัย',
    description: 'แนบรูปหลักฐาน (อัปโหลดเข้า bucket bar-verifications เองก่อน แล้วส่ง path) ให้แอดมินตรวจยืนยัน (rpc app_set_safety_evidence)',
    returns: '`bar_id` · `key` · `evidence_path`',
    forbidden: TEAM_FORBIDDEN,
  })
  safetyEvidence(@CurrentUser() me: AuthUser, @BarId() bar: string, @Param('key') key: string, @Body() b: EvidenceDto) {
    return this.db.rpc('app_set_safety_evidence', { p_actor: me.id, p_bar: bar, p_key: key.toUpperCase(), p_path: b.path });
  }

  @Patch('booking-settings')
  @ApiDoc({
    summary: 'ตั้งค่าการจอง มัดจำ และ PR',
    description: 'ยอดมัดจำ (ต่อโต๊ะ/ต่อคน) นโยบายมัดจำ เวลาเก็บโต๊ะ และจำนวน PR ชาย/หญิง/LGBTQ+ ที่แสดงบนการ์ดร้าน (rpc app_update_booking_settings)',
    returns: '`bar_id`',
    forbidden: TEAM_FORBIDDEN,
  })
  bookingSettings(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: BookingSettingsDto) {
    return this.db.rpc('app_update_booking_settings', { p_actor: me.id, p_bar: bar, p: b });
  }

  /** เลขบัญชีเข้ารหัสที่นี่ก่อนส่งลง DB — DB/หน้าเว็บเห็นแค่ 4 ตัวท้าย */
  @Put('payout-account')
  @ApiDoc({
    summary: 'ตั้งบัญชีรับเงินของร้าน',
    description: 'บัญชีที่ NightOut โอนเงินมัดจำให้หลังลูกค้าเช็กอิน · เลขบัญชีถูกเข้ารหัส AES-256-GCM ที่ API ก่อนลง DB (PAYOUT_ENCRYPTION_KEY) · เจ้าของร้านเท่านั้น (rpc app_set_payout_account)',
    returns: '`id` รหัสบัญชี · `account_no_last4` เลขบัญชี 4 ตัวท้าย',
    forbidden: TEAM_FORBIDDEN,
  })
  payoutAccount(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: PayoutAccountDto) {
    return this.db.rpc('app_set_payout_account', {
      p_actor: me.id,
      p_bar: bar,
      p_bank_code: b.bank_code,
      p_account_name: b.account_name,
      p_account_no_enc: this.crypto.encrypt(b.account_no),
      p_last4: b.account_no.slice(-4),
    });
  }
}
