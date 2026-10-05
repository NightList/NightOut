import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** account — โปรไฟล์ของแอดมิน + ชั้นบัญชี · backend: domains/account */

/** GET /me/profile ด้วย token ที่ระบุ (ตอนโหลด session ก่อน Rest รู้จัก token) */
export const fetchMyProfile = (accessToken: string) => Rest.get<C.MyProfile>('/me/profile', { headers: { Authorization: `Bearer ${accessToken}` } });

/** ห้าชั้นบัญชีจากตาราง roles พร้อมสิทธิ์ของผู้เรียก (GET /admin/roles) */
export const fetchAccountRoles = () => Rest.get<C.AccountRoleOption[]>('/admin/roles');
