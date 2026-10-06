import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiDoc } from '../../common/api-doc';
import { PriceEstimateDto } from './pricing.dto';
import { PricingService } from './pricing.service';

/** pricing · สาธารณะ — ประเมินราคาก่อนไปร้าน (ไม่แตะ DB) */
@ApiTags('pricing')
@Controller('pricing')
export class PricingPublicController {
  constructor(private readonly pricing: PricingService) {}

  @Post('estimate')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ประเมินราคาก่อนไปร้าน',
    description: 'คำนวณยอดโดยประมาณจากรายการเมนูที่เลือก + ค่าบริการ/VAT/ค่าอื่นๆ ของร้าน แล้วหารต่อคน · สาธารณะ ไม่ต้องล็อกอิน · ไม่บันทึกอะไรลงฐานข้อมูล',
    returns: '`subtotal` ยอดรวมรายการ · `service_charge` ค่าบริการ · `vat` ภาษี · `other_fees` ค่าอื่นๆ · `estimated_total` ยอดรวมทั้งหมด · `per_person` ยอดต่อคน (บาท)',
    auth: false,
  })
  estimate(@Body() body: PriceEstimateDto) {
    return this.pricing.estimate(body);
  }
}
