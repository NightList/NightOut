import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { bearerOf } from '../../auth/bearer';
import { SupabaseJwtGuard, type AuthedRequest } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { BarId, TEAM_FORBIDDEN } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';

/** billing · ทีมร้าน — ค่าคอมของร้าน (ตาราง billing_events, RLS ของทีมร้าน) */
@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('merchant/bars/:barId')
export class BillingMerchantController {
  constructor(private readonly db: SupabaseService) {}

  @Get('billing-events')
  @ApiDoc({
    summary: 'ค่าบริการของร้าน',
    description: 'ค่าคอมต่อการเช็กอิน / ไม่มาตามนัด (trigger handle_booking_status_effects สร้างให้)',
    returns: 'รายการ `id` · `event_type` · `base_amount` · `amount` · `status` · `period` · `created_at` · `booking` { `code`, `booking_datetime` }',
    forbidden: TEAM_FORBIDDEN,
    validates: false,
  })
  events(@Req() req: AuthedRequest, @BarId() barId: string) {
    return this.db.selectAs<unknown[]>(
      bearerOf(req),
      `billing_events?select=id,event_type,base_amount,amount,status,period,created_at,booking:bookings!billing_events_booking_id_fkey(code,booking_datetime)&bar_id=eq.${barId}&order=created_at.desc`,
    );
  }
}
