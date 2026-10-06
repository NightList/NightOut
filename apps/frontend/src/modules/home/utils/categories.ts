import { Armchair, Buildings, Crown, DiscoBall, ForkKnife, Martini, MusicNotes, Tree } from '@phosphor-icons/react';
import type { HomeCategory } from '../type/category';

/**
 * หมวดหมู่หน้าแรก (Figma: แถวไอคอนใต้ Hero) — 8 หมวดที่คนค้นบ่อย · ที่เหลือเลือกได้ในหน้า /search
 * ใช้ตัวกรองที่หน้าค้นหามีอยู่แล้ว (category = ประเภทร้าน · style = สไตล์) ไม่ต้องเพิ่มฟิลด์ใน DB
 */
export const CATEGORIES: HomeCategory[] = [
  { key: 'popular', title: 'ร้านยอดนิยม', to: '/ranking', icon: Crown },
  { key: 'pub', title: 'ผับ / บาร์', to: '/search?category=PUB_BAR', icon: Martini },
  { key: 'food', title: 'ร้านอาหาร', to: '/search?category=RESTAURANT', icon: ForkKnife },
  { key: 'live', title: 'ดนตรีสด', to: '/search?style=Live%20Music', icon: MusicNotes },
  { key: 'rooftop', title: 'Rooftop', to: '/search?style=Rooftop', icon: Buildings },
  { key: 'chill', title: 'นั่งชิล', to: '/search?category=CHILL', icon: Armchair },
  { key: 'outdoor', title: 'Outdoor', to: '/search?style=Outdoor', icon: Tree },
  { key: 'party', title: 'ปาร์ตี้', to: '/search?style=Party%20%26%20Dancing', icon: DiscoBall },
];
