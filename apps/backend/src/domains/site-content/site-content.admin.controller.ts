import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HomeCategorySlot } from '@nightout/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { AdminGuard } from '../../auth/admin.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateHomeCategoryDto, UpdateHomeContentDto } from './site-content.dto';

/** site-content · Backoffice — แก้เนื้อหาหน้าแรก (rpc admin_save_home_content, admin_save_home_category · audit log) */
@ApiTags('site-content')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class SiteContentAdminController {
  constructor(private readonly db: SupabaseService) {}

  @Patch('home-content')
  @ApiDoc({
    summary: 'แก้ Hero / ชื่อ section หมวดของหน้าแรก',
    description:
      'ส่งเฉพาะ field ที่แก้ · ภาพอัปโหลดเข้า bucket site-media ก่อนด้วย POST /storage/upload-url แล้วส่ง URL มา · `hero_image_url: null` = กลับไปใช้ภาพตั้งต้น · rpc admin_save_home_content · บันทึก audit log',
    returns: 'แถว home_content หลังแก้',
    forbidden: ADMIN_FORBIDDEN,
  })
  saveContent(@CurrentUser() me: AuthUser, @Body() b: UpdateHomeContentDto) {
    return this.db.rpc('admin_save_home_content', { p_actor: me.id, p: b });
  }

  @Patch('home-categories/:slot')
  @ApiDoc({
    summary: 'แก้การ์ดหมวดบนหน้าแรก',
    description: 'slot ตายตัว 8 ช่อง (popular · pub · food · live · rooftop · chill · outdoor · party) · ส่งเฉพาะ field ที่แก้ · rpc admin_save_home_category · บันทึก audit log',
    returns: 'แถว home_categories หลังแก้',
    forbidden: ADMIN_FORBIDDEN,
  })
  saveCategory(
    @CurrentUser() me: AuthUser,
    @Param('slot', new ZodValidationPipe(HomeCategorySlot)) slot: HomeCategorySlot,
    @Body() b: UpdateHomeCategoryDto,
  ) {
    return this.db.rpc('admin_save_home_category', { p_actor: me.id, p_slot: slot, p: b });
  }
}
