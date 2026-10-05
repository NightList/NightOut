import { Body, Controller, Delete, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { SupabaseJwtGuard, type AuthUser } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_FORBIDDEN, Id } from '../../common/params';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateTeamMemberDto, ReorderTeamDto, UpdateTeamMemberDto } from './site-team.dto';

/** site-team · Backoffice — จัดการทีมงานหน้า /about (rpc admin_save_team_member, admin_delete_team_member, admin_reorder_team_members · audit log) */
@ApiTags('site-team')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin/team-members')
export class SiteTeamAdminController {
  constructor(private readonly db: SupabaseService) {}

  @Post()
  @ApiDoc({
    summary: 'เพิ่มทีมงาน',
    description: 'เพิ่มคนในหน้าเกี่ยวกับเรา (ต่อท้ายลำดับ) · รูปอัปโหลดเข้า bucket team-photos ก่อนด้วย POST /storage/upload-url แล้วส่ง URL มา · บันทึก audit log',
    returns: '`id` · `nickname` · `active` · `sort_order`',
    status: 201,
    forbidden: ADMIN_FORBIDDEN,
  })
  create(@CurrentUser() me: AuthUser, @Body() b: CreateTeamMemberDto) {
    return this.db.rpc('admin_save_team_member', { p_actor: me.id, p_id: null, p: b });
  }

  @Put('order')
  @ApiDoc({
    summary: 'เรียงลำดับทีมงาน',
    description: 'ส่ง id ทั้งหมดเรียงจากบนลงล่าง → sort_order 10, 20, 30, … (ลำดับเดียวกับหน้าเกี่ยวกับเรา)',
    returns: '`updated` จำนวนแถวที่เปลี่ยนลำดับ',
    forbidden: ADMIN_FORBIDDEN,
  })
  reorder(@CurrentUser() me: AuthUser, @Body() b: ReorderTeamDto) {
    return this.db.rpc('admin_reorder_team_members', { p_actor: me.id, p_ids: b.ids });
  }

  @Patch(':id')
  @ApiDoc({
    summary: 'แก้ข้อมูลทีมงาน',
    description: 'ส่งเฉพาะ field ที่ต้องการแก้ เช่น `{ "active": false }` = ซ่อนจากหน้าเว็บ · บันทึก audit log (ก่อน/หลัง)',
    returns: '`id` · `nickname` · `active` · `sort_order`',
    forbidden: ADMIN_FORBIDDEN,
  })
  update(@CurrentUser() me: AuthUser, @Id() id: string, @Body() b: UpdateTeamMemberDto) {
    return this.db.rpc('admin_save_team_member', { p_actor: me.id, p_id: id, p: b });
  }

  @Delete(':id')
  @ApiDoc({
    summary: 'ลบทีมงาน',
    description: 'ลบถาวร (ถ้าแค่ไม่อยากให้แสดง ใช้ PATCH active=false) · บันทึก audit log',
    returns: '`id` · `deleted` = true',
    forbidden: ADMIN_FORBIDDEN,
  })
  remove(@CurrentUser() me: AuthUser, @Id() id: string) {
    return this.db.rpc('admin_delete_team_member', { p_actor: me.id, p_id: id });
  }
}
