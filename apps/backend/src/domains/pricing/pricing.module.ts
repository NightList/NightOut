import { Module } from '@nestjs/common';
import { PricingPublicController } from './pricing.public.controller';
import { PricingService } from './pricing.service';

/** โดเมน pricing — ตัวประเมินราคา (คำนวณใน @nightout/utils ใช้ร่วมกับหน้าเว็บ) */
@Module({ controllers: [PricingPublicController], providers: [PricingService] })
export class PricingModule {}
