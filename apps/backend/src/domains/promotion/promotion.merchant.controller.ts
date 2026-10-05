import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { BarId, TEAM_FORBIDDEN } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { OrderPromotionDto } from './promotion.dto';

/** promotion · ทีมร้าน — ซื้อแพ็กเกจโปรโมทร้าน (rpc app_order_promotion · สลิปใน promo-slips/<bar_id>/…) */
@ApiTags('promotion')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant/bars/:barId')
export class PromotionMerchantController {
  constructor(private readonly db: SupabaseService) {}

  @Post('promotion-orders')
  @ApiDoc({
    summary: 'ซื้อแพ็กเกจโปรโมทร้าน',
    description: 'สั่งซื้อพื้นที่โฆษณา (แบนเนอร์หน้าแรก/ร้านแนะนำ/บนสุดหน้าค้นหา) พร้อมสลิปโอน · รอแอดมินตรวจ · ไม่มีผลกับอันดับร้าน',
    returns: '`id` รหัสคำสั่งซื้อ · `status` = PAYMENT_SUBMITTED',
    status: 201,
    forbidden: TEAM_FORBIDDEN,
  })
  order(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: OrderPromotionDto) {
    return this.db.rpc('app_order_promotion', { p_actor: me.id, p_bar: bar, p_package: b.package_id, p_slip_path: b.slip_path });
  }
}
