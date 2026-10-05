import { Module } from '@nestjs/common';
import { CatalogPublicController } from './catalog.public.controller';

/** โดเมน catalog — ข้อมูลสาธารณะที่หน้าเว็บโหลดตอนเปิด (view bar_detail, public_reviews, bar_cards, search_bars, nearby_bars · master: districts, styles, platform_settings, promotion_packages) */
@Module({ controllers: [CatalogPublicController] })
export class CatalogModule {}
