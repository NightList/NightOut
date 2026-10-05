import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiDoc } from '../common/api-doc';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  @ApiDoc({
    summary: 'เช็กว่า API ทำงานอยู่',
    description: 'ใช้กับ uptime monitor / ตรวจหลัง deploy · ไม่ต้องล็อกอิน',
    returns: '`status` = ok · `service` ชื่อบริการ · `time` เวลาเซิร์ฟเวอร์ (ISO 8601)',
    auth: false,
    validates: false,
  })
  check() {
    return { status: 'ok', service: 'nightout-api', time: new Date().toISOString() };
  }
}
