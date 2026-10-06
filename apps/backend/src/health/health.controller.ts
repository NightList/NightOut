import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiDoc } from '../common/api-doc';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly db: SupabaseService) {}

  @Get()
  @ApiQuery({ name: 'deep', required: false, description: '1 = ลองเรียก Supabase จริงด้วย (ช้ากว่า)' })
  @ApiDoc({
    summary: 'เช็กว่า API ทำงานอยู่ + ตั้งค่า Supabase ครบไหม',
    description:
      'ใช้กับ uptime monitor / ตรวจหลัง deploy · ไม่ต้องล็อกอิน · `config` บอกแค่ว่ามีค่าหรือไม่ (ไม่เปิดเผยคีย์) · `?deep=1` ping PostgREST ด้วย anon key',
    returns:
      '`status` = ok · `service` · `time` (ISO 8601) · `config` { supabase_url, supabase_host, anon_key, service_role_key } · `supabase` { ok, status | error } เมื่อ deep=1',
    auth: false,
    validates: false,
  })
  async check(@Query('deep') deep?: string) {
    const base = { status: 'ok', service: 'nightout-api', time: new Date().toISOString(), config: this.db.status };
    return deep === '1' || deep === 'true' ? { ...base, supabase: await this.db.ping() } : base;
  }
}
