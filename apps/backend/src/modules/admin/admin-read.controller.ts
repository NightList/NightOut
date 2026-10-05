import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/admin.guard';
import { bearerOf } from '../../auth/bearer';
import { SupabaseJwtGuard, type AuthedRequest } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { ADMIN_MASTER_TABLES, ADMIN_VIEW_MAX_LIMIT, ADMIN_VIEWS, canCreateRole } from '@nightout/contracts';
import type { UserRole } from '@nightout/types';
import { SupabaseService } from '../../supabase/supabase.service';

export { ADMIN_MASTER_TABLES, ADMIN_VIEWS } from '@nightout/contracts';

const COLUMN = /^[a-z][a-z0-9_]{0,62}$/;
const MAX_LIMIT = ADMIN_VIEW_MAX_LIMIT;

/** "col.asc" / "col.desc" → PostgREST order */
function parseOrder(order: unknown, fallback?: string): string | null {
  if (order === undefined || order === '') return fallback ?? null;
  const m = typeof order === 'string' ? /^([a-z][a-z0-9_]{0,62})\.(asc|desc)$/.exec(order) : null;
  if (!m) throw new BadRequestException('order ต้องเป็น <คอลัมน์>.asc หรือ <คอลัมน์>.desc');
  return `${m[1]}.${m[2]}`;
}

/** ค่าใน filter → ใส่เครื่องหมายคำพูดตามรูปแบบ PostgREST (กันจุลภาค/วงเล็บในค่า) */
const quote = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/**
 * query string → PostgREST filter
 *   ?status=APPROVED            → status=eq.APPROVED
 *   ?status=PENDING_REVIEW,DRAFT → status=in.("PENDING_REVIEW","DRAFT")
 * คีย์สงวน: order, limit
 */
export function toPostgrestQuery(q: Record<string, unknown>, defaultOrder?: string): string {
  const parts = ['select=*'];
  for (const [col, raw] of Object.entries(q)) {
    if (col === 'order' || col === 'limit') continue;
    if (!COLUMN.test(col)) throw new BadRequestException(`ชื่อคอลัมน์ไม่ถูกต้อง: ${col}`);
    if (typeof raw !== 'string' || raw.length > 2000) throw new BadRequestException(`ค่าของ ${col} ไม่ถูกต้อง`);
    const values = raw.split(',');
    parts.push(
      values.length > 1
        ? `${col}=in.(${encodeURIComponent(values.map(quote).join(','))})`
        : `${col}=eq.${encodeURIComponent(raw)}`,
    );
  }
  const order = parseOrder(q.order, defaultOrder);
  if (order) parts.push(`order=${order}`);
  const limit = q.limit === undefined ? 1000 : Number(q.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new BadRequestException(`limit ต้องเป็น 1–${MAX_LIMIT}`);
  parts.push(`limit=${limit}`);
  return parts.join('&');
}

/**
 * การอ่านของ Backoffice (ADR 0002 — เดิม apps/admin อ่าน view admin_* จาก Supabase ตรง)
 * ด่าน 1: JWT + AdminGuard (ADMIN + MFA) · ด่าน 2: RLS ของ view (อ่านในนามผู้เรียก ไม่ใช้ service_role)
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, AdminGuard)
@Controller('admin')
export class AdminReadController {
  constructor(private readonly db: SupabaseService) {}

  @Get('dashboard')
  @ApiDoc({
    summary: 'ตัวเลขหน้าแดชบอร์ด',
    description: 'สรุปร้าน การจอง มัดจำ รีวิว และคิวงานที่รอตรวจ (rpc admin_dashboard)',
    returns: 'object ตัวเลขของแดชบอร์ด (ดู Db.AdminDashboard) หรือ `null`',
    forbidden: 'ไม่ใช่ ADMIN หรือยังไม่ผ่าน MFA',
    validates: false,
  })
  async dashboard(@Req() req: AuthedRequest) {
    const rows = await this.db.rpcAs<unknown[]>(bearerOf(req), 'admin_dashboard', {});
    return rows?.[0] ?? null;
  }

  @Get('roles')
  @ApiDoc({
    summary: 'รายการชั้นบัญชี',
    description:
      'ห้าชั้นจากตาราง roles เรียงตาม sort_order พร้อมสิทธิ์ของผู้เรียก — แอดมินสร้างบัญชีได้แค่ลูกค้า / ร้านค้า / พนักงาน · แก้ชั้นของบัญชีที่มีอยู่ได้เฉพาะ SUPER_ADMIN',
    returns:
      'รายการ `code` · `label_th` · `sort_order` · `can_enter_backoffice` · `can_create` ผู้เรียกเลือกชั้นนี้ตอนสร้างบัญชีได้ · `can_assign` ผู้เรียกแก้บัญชีอื่นเป็นชั้นนี้ได้',
    forbidden: 'ไม่ใช่ ADMIN หรือยังไม่ผ่าน MFA',
    validates: false,
  })
  async roles(@Req() req: AuthedRequest) {
    const rows = await this.db.selectAs<{ code: UserRole; label_th: string; sort_order: number; can_enter_backoffice: boolean }[]>(
      bearerOf(req),
      'roles?select=code,label_th,sort_order,can_enter_backoffice&order=sort_order',
    );
    const actor = req.user?.role;
    return rows.map((r) => ({ ...r, can_create: canCreateRole(actor, r.code), can_assign: actor === 'SUPER_ADMIN' }));
  }

  @Get('views/:view')
  @ApiQuery({ name: 'order', required: false, description: '<คอลัมน์>.asc | <คอลัมน์>.desc' })
  @ApiQuery({ name: 'limit', required: false, description: `จำนวนแถว (1–${MAX_LIMIT}, ค่าเริ่มต้น 1000)` })
  @ApiDoc({
    summary: 'อ่าน view ของ Backoffice',
    description:
      `view ที่อ่านได้: ${ADMIN_VIEWS.join(', ')} · กรองด้วย query string \`<คอลัมน์>=<ค่า>\` (หลายค่าคั่นด้วย , = in) เช่น \`?status=PENDING_REVIEW,DRAFT&order=created_at.asc\``,
    returns: 'รายการแถวของ view (key เป็น snake_case ตามคอลัมน์)',
    forbidden: 'ไม่ใช่ ADMIN หรือยังไม่ผ่าน MFA',
  })
  view(@Req() req: AuthedRequest, @Param('view') view: string, @Query() q: Record<string, unknown>) {
    if (!(ADMIN_VIEWS as readonly string[]).includes(view)) throw new BadRequestException(`ไม่รู้จัก view: ${view}`);
    return this.db.selectAs<unknown[]>(bearerOf(req), `${view}?${toPostgrestQuery(q)}`);
  }

  @Get('master/:table')
  @ApiQuery({ name: 'order', required: false, description: '<คอลัมน์>.asc | <คอลัมน์>.desc' })
  @ApiDoc({
    summary: 'ตาราง master',
    description: `ตารางตั้งค่า: ${ADMIN_MASTER_TABLES.join(', ')}`,
    returns: 'รายการแถวของตาราง',
    forbidden: 'ไม่ใช่ ADMIN หรือยังไม่ผ่าน MFA',
  })
  master(@Req() req: AuthedRequest, @Param('table') table: string, @Query('order') order?: string) {
    if (!(ADMIN_MASTER_TABLES as readonly string[]).includes(table)) throw new BadRequestException(`ไม่รู้จักตาราง: ${table}`);
    return this.db.selectAs<unknown[]>(bearerOf(req), `${table}?${toPostgrestQuery({ order })}`);
  }
}
