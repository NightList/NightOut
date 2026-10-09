import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { HomeCategory, HomeContent, PublicHomeResult } from '@nightout/contracts';
import type { Request } from 'express';
import { bearerOf } from '../../auth/bearer';
import { ApiDoc } from '../../common/api-doc';
import { SupabaseService } from '../../supabase/supabase.service';

const CONTENT_COLS =
  'hero_title_lead,hero_title_highlight,hero_title_tail,hero_subtitle,hero_search_placeholder,hero_image_url,categories_eyebrow,categories_title,popular_eyebrow,popular_title,updated_at';
const CATEGORY_COLS = 'slot,title,hint,link_to,image_url,badge,updated_at';

/** site-content · สาธารณะ — เนื้อหาหน้าแรก (view public_home_content / public_home_categories / public_home_popular) */
@ApiTags('site-content')
@Controller('public')
export class SiteContentPublicController {
  constructor(private readonly db: SupabaseService) {}

  @Get('home')
  @ApiDoc({
    summary: 'เนื้อหาหน้าแรก',
    description:
      'Hero + การ์ดหมวด "คืนนี้อยากได้ฟีลไหน" + ร้านยอดนิยมที่แอดมินปักไว้ (view public_home_content, public_home_categories, public_home_popular)',
    returns:
      '`content` (หัวข้อ/คำโปรย/ช่องค้นหา/ภาพ Hero · ชื่อ section หมวดและร้านยอดนิยม) · `categories` การ์ด 8 ช่องเรียงตามกริด (`slot` · `title` · `hint` · `link_to` · `image_url` · `badge`) · `popular_bar_ids` ร้านที่ปักไว้ตามลำดับ (เฉพาะร้าน APPROVED · ว่างได้)',
    auth: false,
    validates: false,
  })
  async home(@Req() req: Request): Promise<PublicHomeResult> {
    const token = bearerOf(req);
    const [content, categories, popular] = await Promise.all([
      this.db.selectAs<HomeContent[]>(token, `public_home_content?select=${CONTENT_COLS}&limit=1`),
      this.db.selectAs<HomeCategory[]>(token, `public_home_categories?select=${CATEGORY_COLS}&order=sort_order`),
      this.db.selectAs<{ bar_id: string }[]>(token, 'public_home_popular?select=bar_id&order=sort_order'),
    ]);
    return { content: content[0]!, categories, popular_bar_ids: popular.map((p) => p.bar_id) };
  }
}
