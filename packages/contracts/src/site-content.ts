import { z } from 'zod';

/**
 * โดเมน site-content — เนื้อหาหน้าแรกที่แอดมินแก้ได้ (ตาราง home_content / home_categories · bucket site-media)
 * Hero (หัวข้อ · คำโปรย · ช่องค้นหา · ภาพพื้น) + การ์ดหมวด "คืนนี้อยากได้ฟีลไหน" 8 ช่องแบบ bento
 * Backoffice จัดการที่ /home-content
 */

/** ช่องของการ์ดหมวดบนกริด bento — ตำแหน่งตายตัว (popular = การ์ดใหญ่ 2×2 · party = กว้าง 2) แก้ได้เฉพาะเนื้อหา */
export const HOME_CATEGORY_SLOTS = ['popular', 'pub', 'food', 'live', 'rooftop', 'chill', 'outdoor', 'party'] as const;
export const HomeCategorySlot = z.enum(HOME_CATEGORY_SLOTS);
export type HomeCategorySlot = z.infer<typeof HomeCategorySlot>;

/** ไอคอนที่เลือกได้ (Phosphor · ตัวแปลง key → ไอคอนอยู่ใน @nightout/ui `HOME_CATEGORY_ICONS`) */
export const HOME_CATEGORY_ICON_KEYS = [
  'crown',
  'martini',
  'fork-knife',
  'music-notes',
  'buildings',
  'armchair',
  'tree',
  'disco-ball',
  'beer-stein',
  'wine',
  'champagne',
  'microphone-stage',
  'cocktail',
  'moon-stars',
  'fire',
  'heart',
  'users-three',
  'sparkle',
] as const;
export const HomeCategoryIcon = z.enum(HOME_CATEGORY_ICON_KEYS);
export type HomeCategoryIcon = z.infer<typeof HomeCategoryIcon>;

const imageUrl = z
  .string()
  .trim()
  .max(500)
  // http:// ไว้สำหรับ Supabase ในเครื่อง · path ใน public/ ของเว็บ (เช่น /images/categories/x.webp) ก็ได้
  .regex(/^(https?:\/\/|\/)/, 'ต้องเป็น URL http(s):// หรือ path ที่ขึ้นต้นด้วย /');
/** ลิงก์ภายในเว็บเท่านั้น เช่น /ranking หรือ /search?style=Rooftop */
const internalLink = z
  .string()
  .trim()
  .max(300)
  .regex(/^\/(?!\/)\S*$/, 'ต้องเป็นลิงก์ในเว็บที่ขึ้นต้นด้วย / เช่น /search?category=PUB_BAR');
const line = (max: number) => z.string().trim().min(1).max(max);

/** PATCH /admin/home-content — ส่งเฉพาะ field ที่แก้ */
export const UpdateHomeContentBody = z
  .object({
    hero_title_lead: line(20).describe('คำหน้าหัวข้อ Hero เช่น "คืนนี้ไป"'),
    hero_title_highlight: line(20).describe('คำกลางตัวใหญ่สีทอง เช่น "ร้านไหน"'),
    hero_title_tail: z.string().trim().max(20).describe('คำท้าย เช่น "ดี" (ว่างได้)'),
    hero_subtitle: z.string().trim().max(160).describe('คำโปรยใต้หัวข้อ'),
    hero_search_placeholder: line(60).describe('ข้อความในช่องค้นหา'),
    hero_image_url: imageUrl.nullable().describe('ภาพพื้น Hero · null = ภาพดวงจันทร์ตั้งต้น (มีดาว/ไฟระยิบ)'),
    categories_eyebrow: z.string().trim().max(40).describe('บรรทัดเล็กเหนือชื่อ section หมวด (ว่างได้)'),
    categories_title: line(60).describe('ชื่อ section หมวด เช่น "คืนนี้อยากได้ฟีลไหน"'),
  })
  .partial();
export type UpdateHomeContentBody = z.infer<typeof UpdateHomeContentBody>;

/** PATCH /admin/home-categories/:slot — ส่งเฉพาะ field ที่แก้ */
export const UpdateHomeCategoryBody = z
  .object({
    title: line(30).describe('ชื่อหมวดบนการ์ด'),
    hint: z.string().trim().max(60).describe('คำอธิบายสั้นใต้ชื่อ'),
    link_to: internalLink.describe('กดการ์ดแล้วไปไหน'),
    icon: HomeCategoryIcon,
    image_url: imageUrl.describe('ภาพพื้นการ์ด'),
    badge: z.string().trim().max(30).nullable().describe('ป้ายเล็กเหนือชื่อ เช่น "อันดับประจำสัปดาห์" · null = ไม่มี'),
  })
  .partial();
export type UpdateHomeCategoryBody = z.infer<typeof UpdateHomeCategoryBody>;

export interface HomeContent {
  hero_title_lead: string;
  hero_title_highlight: string;
  hero_title_tail: string;
  hero_subtitle: string;
  hero_search_placeholder: string;
  hero_image_url: string | null;
  categories_eyebrow: string;
  categories_title: string;
  updated_at: string;
}

export interface HomeCategory {
  slot: HomeCategorySlot;
  title: string;
  hint: string;
  link_to: string;
  icon: HomeCategoryIcon;
  image_url: string;
  badge: string | null;
  updated_at: string;
}

/** GET /public/home */
export interface PublicHomeResult {
  content: HomeContent;
  /** เรียงตาม HOME_CATEGORY_SLOTS เสมอ */
  categories: HomeCategory[];
}

export const SITE_CONTENT_ERRORS = {
  HOME_CATEGORY_NOT_FOUND: 'ไม่พบการ์ดหมวดนี้ — รีเฟรชหน้าแล้วลองใหม่',
  INVALID_HOME_CONTENT: 'เนื้อหาหน้าแรกไม่ครบหรือยาวเกินไป (รูปต้องเป็น URL · ลิงก์ต้องขึ้นต้นด้วย /)',
} as const satisfies Record<string, string>;
