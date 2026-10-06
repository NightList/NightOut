import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthedRequest, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { BarId } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { RespondInviteDto } from './bar-team.dto';

/** bar-team · ฉัน — คำเชิญเข้าทีมร้านที่รอฉันตอบ (rpc my_invites, app_respond_invite) */
@ApiTags('bar-team')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller()
export class BarTeamMeController {
  constructor(private readonly db: SupabaseService) {}

  @Get('me/invites')
  @ApiDoc({
    summary: 'คำเชิญเข้าทีมร้านของฉัน',
    description: 'คำเชิญที่ยังไม่ได้ตอบ (rpc my_invites)',
    returns: 'รายการ `bar_id` · `bar_name` · `role` · `invited_at` · `invited_by`',
    validates: false,
  })
  invites(@Req() req: AuthedRequest) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'my_invites', {});
  }

  @Post('invites/:barId/respond')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ตอบรับ/ปฏิเสธคำเชิญเข้าทีมร้าน',
    description: 'ผู้ใช้ที่ถูกเชิญเป็นพนักงานร้านกดรับหรือปฏิเสธ · รับแล้วชั้นบัญชีเป็น MERCHANT/STAFF ตามบทบาท (rpc app_respond_invite)',
    returns: '`bar_id` · `accepted` ผลการตอบ · `role` บทบาทในร้าน (เมื่อรับ)',
  })
  respond(@CurrentUser() me: AuthUser, @BarId() barId: string, @Body() b: RespondInviteDto) {
    return this.db.rpc('app_respond_invite', { p_actor: me.id, p_bar: barId, p_accept: b.accept });
  }
}
