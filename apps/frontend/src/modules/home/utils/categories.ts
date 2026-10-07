import type { SiteHomeCategory, SiteHomeContent } from '@/services/data';

/**
 * ค่าตั้งต้นของเนื้อหาหน้าแรก — ใช้ตอน API ยังไม่ตอบ/ต่อไม่ได้ (ค่าเดียวกับ seed ใน migration 20261007000100)
 * ของจริงแอดมินแก้ที่ Backoffice → GET /public/home (ดู useHomeContent)
 * หมวดใช้ตัวกรองที่หน้าค้นหามีอยู่แล้ว (category = ประเภทร้าน · style = สไตล์)
 */
export const DEFAULT_CONTENT: Omit<SiteHomeContent, 'updated_at'> = {
  hero_title_lead: 'คืนนี้ไป',
  hero_title_highlight: 'ร้านไหน',
  hero_title_tail: 'ดี',
  hero_subtitle: 'ดูอันดับจากคนที่ไปจริง รู้ราคาต่อหัวก่อนออกจากบ้าน แล้วจองโต๊ะได้เลย',
  hero_search_placeholder: 'ค้นหาร้านที่โดนใจสำหรับคุณ',
  hero_image_url: null,
  categories_eyebrow: 'เลือกตามสไตล์',
  categories_title: 'คืนนี้อยากได้ฟีลไหน',
};

const img = (name: string) => `/images/categories/${name}.webp`;

export const DEFAULT_CATEGORIES: Omit<SiteHomeCategory, 'updated_at'>[] = [
  { slot: 'popular', title: 'ร้านยอดนิยม', hint: 'อันดับจากโหวตของคนที่ไปจริง', link_to: '/ranking', icon: 'crown', image_url: img('night-out-group-toast'), badge: 'อันดับประจำสัปดาห์' },
  { slot: 'pub', title: 'ผับ / บาร์', hint: 'ดื่ม เต้น สังสรรค์', link_to: '/search?category=PUB_BAR', icon: 'martini', image_url: img('intimate-cocktail-bar'), badge: null },
  { slot: 'food', title: 'ร้านอาหาร', hint: 'มื้อเย็นก่อนออกเที่ยว', link_to: '/search?category=RESTAURANT', icon: 'fork-knife', image_url: img('friends-dinner-toast'), badge: null },
  { slot: 'live', title: 'ดนตรีสด', hint: 'ร้านที่มีวงเล่นสด', link_to: '/search?style=Live%20Music', icon: 'music-notes', image_url: img('live-music-dinner'), badge: null },
  { slot: 'rooftop', title: 'Rooftop', hint: 'นั่งชมวิวเมืองบนดาดฟ้า', link_to: '/search?style=Rooftop', icon: 'buildings', image_url: img('rooftop-lounge-skyline'), badge: null },
  { slot: 'chill', title: 'นั่งชิล', hint: 'เพลงเบา คุยกันสบาย', link_to: '/search?category=CHILL', icon: 'armchair', image_url: img('vinyl-listening-bar'), badge: null },
  { slot: 'outdoor', title: 'Outdoor', hint: 'โต๊ะกลางแจ้ง รับลมเย็น', link_to: '/search?style=Outdoor', icon: 'tree', image_url: img('outdoor-garden-dinner'), badge: null },
  { slot: 'party', title: 'ปาร์ตี้', hint: 'ดีเจ ฟลอร์เต้นรำ', link_to: '/search?style=Party%20%26%20Dancing', icon: 'disco-ball', image_url: img('edm-dance-floor'), badge: null },
];
