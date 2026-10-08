import { z } from 'zod';
import { uuid } from './common';

/** โดเมน site-team — ทีมงาน NightOut บนหน้า /about (view public_team) · Backoffice จัดการที่ /team (เพิ่ม/ลบ/ลำดับ = Super Admin · แก้/ซ่อน = Super Admin หรือ Admin เฉพาะแถวที่ contacts.email = อีเมลตัวเอง) */

const https = z.url().startsWith('https://').max(300);
/** ช่องทางติดต่อ — ว่าง = ไม่แสดงไอคอนนั้น (DB เก็บเฉพาะ key เหล่านี้) */
export const TeamContacts = z
  .object({
    facebook: https.describe('URL เต็ม (https://)'),
    instagram: https,
    tiktok: https,
    github: https,
    linkedin: https,
    line: z.string().trim().max(120).describe('LINE ID หรือ URL'),
    email: z.email().max(120),
    phone: z.string().trim().regex(/^[0-9+\-\s()]{6,20}$/, 'เบอร์โทรไม่ถูกต้อง'),
  })
  .partial();
export type TeamContacts = z.infer<typeof TeamContacts>;

const roles = z.array(z.string().trim().min(1).max(40)).max(6);
const skills = z.array(z.string().trim().min(1).max(40));
const photoUrl = z
  .string()
  .trim()
  .max(500)
  // http:// ไว้สำหรับ Supabase ในเครื่อง (http://127.0.0.1:54321) · javascript:/data: ไม่ผ่าน
  .regex(/^(https?:\/\/|\/)/, 'ต้องเป็น URL http(s):// หรือ path ที่ขึ้นต้นด้วย /');

/** POST /admin/team-members */
export const TeamMemberBody = z.object({
  nickname: z.string().trim().min(1).max(40).describe('ชื่อที่แสดงบนการ์ด เช่น "แสน"'),
  full_name: z.string().trim().max(80).nullish().describe('ชื่อจริง (แสดงในแผงโปรไฟล์)'),
  roles: roles.default([]).describe('ตำแหน่ง · ตัวแรก = ตำแหน่งหลัก'),
  bio: z.string().trim().max(1000).nullish().describe('แนะนำตัว'),
  skills: skills.default([]),
  photo_url: photoUrl.nullish().describe('URL รูป (team-photos) หรือ path ใน public/ เช่น /images/teams/san.webp'),
  contacts: TeamContacts.default({}),
  active: z.boolean().default(true).describe('false = ซ่อนจากหน้าเกี่ยวกับเรา'),
});
export type TeamMemberBody = z.input<typeof TeamMemberBody>;

/** PATCH /admin/team-members/:id — ส่งเฉพาะ field ที่แก้ (ไม่มีค่าเริ่มต้น จะได้ไม่ทับของเดิม) */
export const UpdateTeamMemberBody = TeamMemberBody.extend({ roles, skills, contacts: TeamContacts, active: z.boolean() }).partial();
export type UpdateTeamMemberBody = z.infer<typeof UpdateTeamMemberBody>;

/** PUT /admin/team-members/order */
export const ReorderTeamBody = z.object({ ids: z.array(uuid).min(1).max(200).describe('id ทีมงานเรียงจากบนลงล่าง') });
export type ReorderTeamBody = z.infer<typeof ReorderTeamBody>;

/** GET /public/team (view public_team) */
export interface PublicTeamMember {
  id: string;
  nickname: string;
  full_name: string | null;
  roles: string[];
  bio: string | null;
  skills: string[];
  photo_url: string | null;
  contacts: TeamContacts;
  sort_order: number;
}

export const SITE_TEAM_ERRORS = {
  TEAM_MEMBER_NOT_FOUND: 'ไม่พบทีมงานคนนี้แล้ว (อาจถูกลบไปแล้ว)',
  INVALID_TEAM_MEMBER: 'ข้อมูลทีมงานไม่ครบหรือไม่ถูกต้อง (ชื่อเล่น 1–40 ตัว · รูปต้องเป็น URL หรือ path ที่ขึ้นต้นด้วย /)',
  INVALID_TEAM_ORDER: 'ลำดับทีมงานไม่ถูกต้อง — รีเฟรชหน้าแล้วลองใหม่',
  TEAM_MEMBER_NOT_OWN: 'แอดมินแก้หรือซ่อนได้เฉพาะแถวของตัวเอง (อีเมลในช่องทางติดต่อต้องตรงกับอีเมลบัญชี) — แถวอื่นให้ซูเปอร์แอดมินแก้',
  TEAM_MEMBER_EMAIL_LOCKED: 'อีเมลในช่องทางติดต่อต้องเป็นอีเมลบัญชีของคุณ — เปลี่ยนได้เฉพาะซูเปอร์แอดมิน',
} as const satisfies Record<string, string>;
