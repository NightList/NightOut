import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { bearerOf } from '../../auth/bearer';
import { ApiDoc } from '../../common/api-doc';
import { SupabaseService } from '../../supabase/supabase.service';

/** site-team · สาธารณะ — ทีมงาน NightOut บนหน้า /about (view public_team) */
@ApiTags('site-team')
@Controller('public')
export class SiteTeamPublicController {
  constructor(private readonly db: SupabaseService) {}

  @Get('team')
  @ApiDoc({
    summary: 'ทีมงานหน้าเกี่ยวกับเรา',
    description: 'สมาชิกทีมที่ active (view public_team) เรียงตาม sort_order',
    returns: 'รายการ `id` · `nickname` · `full_name` · `roles` · `bio` · `skills` · `photo_url` · `contacts` · `sort_order`',
    auth: false,
    validates: false,
  })
  team(@Req() req: Request) {
    return this.db.selectAs<unknown[]>(bearerOf(req), 'public_team?select=id,nickname,full_name,roles,bio,skills,photo_url,contacts,sort_order&order=sort_order');
  }
}
