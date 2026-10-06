import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthedRequest, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { BarId, Id, TEAM_FORBIDDEN } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { InviteStaffDto } from './bar-team.dto';

/** bar-team · ทีมร้าน — สมาชิก เชิญ นำออก (rpc bar_team, app_invite_staff, app_remove_staff) */
@ApiTags('bar-team')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant/bars/:barId')
export class BarTeamMerchantController {
  constructor(private readonly db: SupabaseService) {}

  @Get('team')
  @ApiDoc({
    summary: 'สมาชิกทีมร้าน',
    description: 'รวมคนที่ถูกเชิญแต่ยังไม่ตอบรับ (rpc bar_team)',
    returns: 'รายการ `user_id` · `display_name` · `email` · `role` · `invited_at` · `accepted_at`',
    forbidden: TEAM_FORBIDDEN,
    validates: false,
  })
  team(@Req() req: AuthedRequest, @BarId() barId: string) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'bar_team', { p_bar: barId });
  }

  @Post('staff')
  @ApiDoc({
    summary: 'เชิญพนักงานเข้าทีมร้าน',
    description: 'เชิญด้วยอีเมลของผู้ใช้ที่สมัครแล้ว พร้อมบทบาท OWNER/MANAGER/STAFF · เจ้าของ/ผู้จัดการเท่านั้น (rpc app_invite_staff)',
    returns: '`bar_id` · `user_id` ผู้ถูกเชิญ · `role`',
    status: 201,
    forbidden: TEAM_FORBIDDEN,
  })
  invite(@CurrentUser() me: AuthUser, @BarId() bar: string, @Body() b: InviteStaffDto) {
    return this.db.rpc('app_invite_staff', { p_actor: me.id, p_bar: bar, p_email: b.email, p_role: b.role });
  }

  @Delete('staff/:userId')
  @ApiDoc({
    summary: 'นำพนักงานออกจากทีมร้าน',
    description: 'เจ้าของ/ผู้จัดการนำสมาชิกออกจากร้าน (ไม่ลดชั้นบัญชี) (rpc app_remove_staff)',
    returns: '`bar_id` · `user_id` · `removed` = true',
    forbidden: TEAM_FORBIDDEN,
  })
  remove(@CurrentUser() me: AuthUser, @BarId() bar: string, @Id('userId') user: string) {
    return this.db.rpc('app_remove_staff', { p_actor: me.id, p_bar: bar, p_user: user });
  }
}
