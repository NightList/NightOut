import { z } from 'zod';

/** โดเมน bar-team — ทีมร้าน (bar_staff): เชิญ/นำออกพนักงาน · คำเชิญของฉัน */

export const BarStaffRole = z.enum(['OWNER', 'MANAGER', 'STAFF']);
export type BarStaffRole = z.infer<typeof BarStaffRole>;

/** POST /merchant/bars/:barId/staff */
export const InviteStaffBody = z.object({ email: z.email(), role: BarStaffRole.default('STAFF') });
export type InviteStaffBody = z.input<typeof InviteStaffBody>;

/** POST /invites/:barId/respond */
export const RespondInviteBody = z.object({ accept: z.boolean() });
export type RespondInviteBody = z.infer<typeof RespondInviteBody>;

/** GET /merchant/bars/:barId/team (rpc bar_team) */
export interface BarTeamMember {
  user_id: string;
  display_name: string;
  email: string;
  role: BarStaffRole;
  invited_at: string;
  accepted_at: string | null;
}

/** GET /me/invites (rpc my_invites) */
export interface MyInvite {
  bar_id: string;
  bar_name: string;
  role: BarStaffRole;
  invited_at: string;
  invited_by: string | null;
}

export const BAR_TEAM_ERRORS = {
  INVITEE_NOT_REGISTERED: 'อีเมลนี้ยังไม่ได้สมัคร NightOut — ให้พนักงานสมัครก่อนแล้วค่อยเชิญ',
  ALREADY_MEMBER: 'คนนี้อยู่ในทีมแล้ว',
  INVITE_NOT_FOUND: 'ไม่พบคำเชิญ (อาจถูกยกเลิกแล้ว)',
  CANNOT_REMOVE_SELF: 'นำตัวเองออกจากทีมไม่ได้',
  MEMBER_NOT_FOUND: 'ไม่พบสมาชิกนี้',
} as const satisfies Record<string, string>;
