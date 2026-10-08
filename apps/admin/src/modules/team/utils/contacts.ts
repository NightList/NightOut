import type { Db } from '@nightout/types';

type TeamContacts = Db.TeamContacts;

/** ช่องทางติดต่อที่หน้าเกี่ยวกับเรารู้จัก (ตรงกับ DB · migration …001800) */
export const CONTACT_FIELDS: {
  key: keyof TeamContacts & string;
  label: string;
  placeholder: string;
  kind: 'url' | 'email' | 'phone' | 'text';
}[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/…', kind: 'url' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…', kind: 'url' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@…', kind: 'url' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/…', kind: 'url' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…', kind: 'url' },
  { key: 'line', label: 'LINE', placeholder: 'LINE ID หรือ https://line.me/…', kind: 'text' },
  { key: 'email', label: 'อีเมล', placeholder: 'name@example.com', kind: 'email' },
  { key: 'phone', label: 'เบอร์โทร', placeholder: '08x-xxx-xxxx', kind: 'phone' },
];

/** จำนวนช่องทางที่กรอกไว้ */
export const contactCount = (c: TeamContacts | null | undefined) =>
  CONTACT_FIELDS.filter((f) => (c?.[f.key] ?? '').trim() !== '').length;

const normEmail = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

/**
 * แถวนี้เป็นของบัญชีที่ล็อกอินอยู่ไหม — อีเมลในช่องทางติดต่อตรงกับอีเมลบัญชี (ไม่สนตัวพิมพ์)
 * ใช้ซ่อน/ปิดปุ่มเท่านั้น · DB ตรวจจริงใน team_member_is_own (migration …20261008000200)
 */
export const isOwnMember = (
  c: TeamContacts | null | undefined,
  accountEmail: string | null | undefined,
) => normEmail(accountEmail) !== '' && normEmail(c?.email) === normEmail(accountEmail);
