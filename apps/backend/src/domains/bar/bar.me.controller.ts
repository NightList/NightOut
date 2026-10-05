import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { SupabaseService } from '../../supabase/supabase.service';
import { MerchantJoinDto } from './bar.dto';

/** bar · ลูกค้า — สมัครลงร้าน (rpc app_merchant_join) */
@ApiTags('bar')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller()
export class BarMeController {
  constructor(private readonly db: SupabaseService) {}

  @Post('merchant/join')
  @ApiDoc({
    summary: 'สมัครลงร้าน',
    description: 'เจ้าของร้านส่งข้อมูลร้านเพื่อขอลงในระบบ · ร้านจะอยู่สถานะ PENDING_REVIEW จนแอดมินอนุมัติ · ผู้สมัครกลายเป็น MERCHANT/OWNER ของร้านนั้น',
    returns: '`id` รหัสร้าน · `slug` · `status` = PENDING_REVIEW',
    status: 201,
  })
  join(@CurrentUser() me: AuthUser, @Body() b: MerchantJoinDto) {
    return this.db.rpc('app_merchant_join', { p_actor: me.id, p: b });
  }
}
