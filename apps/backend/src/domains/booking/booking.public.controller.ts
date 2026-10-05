import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { bearerOf } from '../../auth/bearer';
import { ApiDoc } from '../../common/api-doc';
import { BarId } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { ZoneAvailabilityQueryDto } from './booking.dto';

/** booking · สาธารณะ — โซนว่าง (หน้าจอง) และบัตรจองจากลิงก์แชร์ · ส่ง token ต่อถ้ามี (RLS ตัดสินเหมือนเดิม) */
@ApiTags('booking')
@Controller()
export class BookingPublicController {
  constructor(private readonly db: SupabaseService) {}

  @Get('bars/:barId/zone-availability')
  @ApiDoc({
    summary: 'โซนว่างของร้านในเวลาที่เลือก',
    description: 'DB นับการจองของทุกคนให้ (ลูกค้าไม่เห็นการจองของคนอื่น) — ใช้ในหน้าจอง (rpc zone_availability)',
    returns: 'รายการ `zone_id` · `zone_name` · `capacity_pax` · `remaining_pax` ที่นั่งที่เหลือ · `free_tables` โต๊ะว่าง · `total_tables` · `full`',
    auth: false,
  })
  zoneAvailability(@Req() req: Request, @BarId() barId: string, @Query() q: ZoneAvailabilityQueryDto) {
    return this.db.rpcAs<unknown[]>(bearerOf(req), 'zone_availability', { p_bar: barId, p_datetime: q.datetime });
  }

  @Get('share-cards/:token')
  @ApiDoc({
    summary: 'บัตรจองจากลิงก์แชร์',
    description: 'ข้อมูลการจองสำหรับเพื่อนที่ได้ลิงก์ (ไม่มีข้อมูลส่วนตัว) (rpc get_share_card)',
    returns: '`booking_datetime` · `pax` · `status` · `zone_name` · `bar_name` · `bar_slug` · `address` · `lat` · `lng` · `host_first_name` · `going_count` หรือ `null` ถ้าไม่พบ',
    auth: false,
  })
  async shareCard(@Req() req: Request, @Param('token') token: string) {
    const rows = await this.db.rpcAs<unknown[]>(bearerOf(req), 'get_share_card', { p_token: token.slice(0, 200) });
    return rows[0] ?? null;
  }
}
