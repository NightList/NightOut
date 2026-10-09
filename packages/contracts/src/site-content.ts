import { z } from 'zod';

/**
 * โดเมน site-content — เนื้อหาหน้าแรกที่แอดมินแก้ได้ (ตาราง home_content / home_categories · bucket site-media)
 * Hero (หัวข้อ · คำโปรย · ช่องค้นหา · ภาพพื้น) + การ์ดหมวด "คืนนี้อยากได้ฟีลไหน" 8 ช่องแบบ bento
 * + ร้านยอดนิยมที่แอดมินปักไว้ (ตาราง home_popular_bars · สูงสุด HOME_POPULAR_MAX)
 * Backoffice จัดการที่ /home-content
 */

/** ช่องของการ์ดหมวดบนกริด bento — ตำแหน่งตายตัว (popular = การ์ดใหญ่ 2×2 · party = กว้าง 2) แก้ได้เฉพาะเนื้อหา */
export const HOME_CATEGORY_SLOTS = ['popular', 'pub', 'food', 'live', 'rooftop', 'chill', 'outdoor', 'party'] as const;
export const HomeCategorySlot = z.enum(HOME_CATEGORY_SLOTS);
export type HomeCategorySlot = z.infer<typeof HomeCategorySlot>;

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
    popular_eyebrow: z.string().trim().max(40).describe('บรรทัดเล็กเหนือชื่อ section ร้านยอดนิยม (ว่างได้)'),
    popular_title: line(60).describe('ชื่อ section ร้านยอดนิยม เช่น "ร้านยอดนิยม"'),
  })
  .partial();
export type UpdateHomeContentBody = z.infer<typeof UpdateHomeContentBody>;

/** PATCH /admin/home-categories/:slot — ส่งเฉพาะ field ที่แก้ */
export const UpdateHomeCategoryBody = z
  .object({
    title: line(30).describe('ชื่อหมวดบนการ์ด'),
    hint: z.string().trim().max(60).describe('คำอธิบายสั้นใต้ชื่อ'),
    link_to: internalLink.describe('กดการ์ดแล้วไปไหน'),
    image_url: imageUrl.describe('ภาพพื้นการ์ด'),
    badge: z.string().trim().max(30).nullable().describe('ป้ายเล็กเหนือชื่อ เช่น "อันดับประจำสัปดาห์" · null = ไม่มี'),
  })
  .partial();
export type UpdateHomeCategoryBody = z.infer<typeof UpdateHomeCategoryBody>;

/** จำนวนร้านในกริดร้านยอดนิยมของหน้าแรก (= จำนวนที่แอดมินปักได้สูงสุด) */
export const HOME_POPULAR_MAX = 8;

/** PUT /admin/home-popular — แทนที่ทั้งรายการตามลำดับ · [] = ไม่ปัก (หน้าแรกเรียงตามคะแนนรีวิวทั้งหมด) */
export const UpdateHomePopularBody = z.object({
  bar_ids: z
    .array(z.string().uuid())
    .max(HOME_POPULAR_MAX, `เลือกได้ไม่เกิน ${HOME_POPULAR_MAX} ร้าน`)
    .refine((ids) => new Set(ids).size === ids.length, 'มีร้านซ้ำ')
    .describe('รหัสร้าน (APPROVED) เรียงตามลำดับที่จะแสดง'),
});
export type UpdateHomePopularBody = z.infer<typeof UpdateHomePopularBody>;

/** ผลของ PUT /admin/home-popular */
export interface UpdateHomePopularResult {
  bar_ids: string[];
}

export interface HomeContent {
  hero_title_lead: string;
  hero_title_highlight: string;
  hero_title_tail: string;
  hero_subtitle: string;
  hero_search_placeholder: string;
  hero_image_url: string | null;
  categories_eyebrow: string;
  categories_title: string;
  popular_eyebrow: string;
  popular_title: string;
  updated_at: string;
}

export interface HomeCategory {
  slot: HomeCategorySlot;
  title: string;
  hint: string;
  link_to: string;
  image_url: string;
  badge: string | null;
  updated_at: string;
}

/** GET /public/home */
export interface PublicHomeResult {
  content: HomeContent;
  /** เรียงตาม HOME_CATEGORY_SLOTS เสมอ */
  categories: HomeCategory[];
  /** ร้านยอดนิยมที่แอดมินปักไว้ (เฉพาะร้าน APPROVED · เรียงตามลำดับ) — ช่องที่เหลือหน้าเว็บเติมด้วยคะแนนรีวิว */
  popular_bar_ids: string[];
}

export const SITE_CONTENT_ERRORS = {
  HOME_CATEGORY_NOT_FOUND: 'ไม่พบการ์ดหมวดนี้ — รีเฟรชหน้าแล้วลองใหม่',
  INVALID_HOME_POPULAR: 'เลือกร้านยอดนิยมได้ไม่เกิน 8 ร้าน และห้ามซ้ำ',
  HOME_POPULAR_BAR_NOT_FOUND: 'มีร้านที่ไม่พบหรือยังไม่อนุมัติ — รีเฟรชหน้าแล้วเลือกใหม่',
  INVALID_HOME_CONTENT: 'เนื้อหาหน้าแรกไม่ครบหรือยาวเกินไป (รูปต้องเป็น URL · ลิงก์ต้องขึ้นต้นด้วย /)',
} as const satisfies Record<string, string>;
