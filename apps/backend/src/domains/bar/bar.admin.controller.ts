import { Body, Controller, HttpCode, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN, Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { BarMediaService } from './bar-media.service';
import { ApproveDto, BarMediaDto, MenuItemImageDto, SetBarStatusDto } from './bar.dto';

/** bar · Backoffice — อนุมัติ/ระงับร้าน · รูปร้าน/รูปเมนูแทนร้าน · ยืนยัน Safety · ตรวจถ้อยคำโปรของร้าน (audit log ในธุรกรรมเดียว) */
@ApiTags('bar')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class BarAdminController {
  constructor(
    private readonly db: SupabaseService,
    private readonly media: BarMediaService,
  ) {}

  @Patch('bars/:id/status')
  @ApiDoc({
    summary: 'อนุมัติ/ระงับร้าน',
    description: 'เปลี่ยนสถานะร้าน (APPROVED = ขึ้นหน้าเว็บ, REJECTED/SUSPENDED = ซ่อน) พร้อมเหตุผล · บันทึก audit log (rpc admin_set_bar_status)',
    returns: '`id` รหัสร้าน · `status` สถานะใหม่',
    forbidden: ADMIN_FORBIDDEN,
  })
  setStatus(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: SetBarStatusDto) {
    return this.db.rpc('admin_set_bar_status', { p_actor: me.id, p_bar: id, p_status: b.status, p_reason: b.reason ?? null });
  }

  @Put('bars/:id/media')
  @ApiDoc({
    summary: 'ตั้งรูปร้านแทนร้าน (ปก + แกลเลอรี)',
    description:
      'เหมือน PUT /merchant/bars/:barId/media แต่ทำในนาม NightOut (เช่น ลบรูปไม่เหมาะสม · อัปโหลดรูปที่ร้านส่งมา) · ไฟล์อยู่ bucket bar-media/<bar_id>/gallery/ · บันทึก audit log + แจ้งทีมร้าน (rpc admin_set_bar_media)',
    returns: '`bar_id` · `count` จำนวนรูป · `cover_image_url` URL รูปปก · `paths` แกลเลอรีที่บันทึก',
    forbidden: ADMIN_FORBIDDEN,
  })
  setMedia(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: BarMediaDto) {
    return this.media.setGallery('admin_set_bar_media', me.id, id, b);
  }

  @Put('menu-items/:id/image')
  @ApiDoc({
    summary: 'ตั้ง/ลบรูปเมนู 1 รายการแทนร้าน',
    description:
      '`path` = รูปใน bucket bar-media/<bar_id>/menu/ (อัปโหลดเองก่อน) · null = ลบรูป · รูปเดิมถูกลบจาก Storage · บันทึก audit log + แจ้งทีมร้าน (rpc admin_set_menu_item_image)',
    returns: '`id` รหัสรายการเมนู · `bar_id` · `image_path` รูปปัจจุบัน',
    forbidden: ADMIN_FORBIDDEN,
  })
  setMenuItemImage(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: MenuItemImageDto) {
    return this.media.setMenuItemImage(me.id, id, b);
  }

  @Post('safety/:id/verify')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ยืนยันข้อมูลความปลอดภัย',
    description: 'แอดมินตรวจหลักฐานแล้วยืนยันข้อความปลอดภัย 1 ข้อของร้าน → ADMIN_VERIFIED + ปิดรายงาน + คำนวณคะแนน Safety ใหม่ (rpc admin_verify_safety)',
    returns: '`id` รหัสรายการ · `source` = ADMIN_VERIFIED',
    forbidden: ADMIN_FORBIDDEN,
  })
  verifySafety(@CurrentUser() me: AuthUser, @Id() id: string) {
    return this.db.rpc('admin_verify_safety', { p_actor: me.id, p_feature: id });
  }

  @Post('bar-promotions/:id/moderate')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ตรวจโปรโมชันของร้าน',
    description: 'อนุมัติหรือปฏิเสธโปรที่ร้านตั้ง ก่อนแสดงให้ลูกค้าเห็น (rpc admin_moderate_bar_promotion)',
    returns: '`id` รหัสโปร · `moderation_status` APPROVED / REJECTED',
    forbidden: ADMIN_FORBIDDEN,
  })
  moderatePromotion(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: ApproveDto) {
    return this.db.rpc('admin_moderate_bar_promotion', { p_actor: me.id, p_promotion: id, p_approve: b.approve, p_reason: b.reason ?? null });
  }
}
