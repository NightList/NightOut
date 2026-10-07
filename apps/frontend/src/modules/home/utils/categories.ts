import {
  Armchair,
  Buildings,
  Crown,
  DiscoBall,
  ForkKnife,
  Martini,
  MusicNotes,
  Tree,
} from '@phosphor-icons/react';
import type { HomeCategory } from '../type/category';

/**
 * หมวดหมู่หน้าแรก (การ์ดใต้ Hero) — 8 หมวดที่คนค้นบ่อย · ที่เหลือเลือกได้ในหน้า /search
 * ใช้ตัวกรองที่หน้าค้นหามีอยู่แล้ว (category = ประเภทร้าน · style = สไตล์) ไม่ต้องเพิ่มฟิลด์ใน DB
 */
export const CATEGORIES: HomeCategory[] = [
  {
    key: 'popular',
    title: 'ร้านยอดนิยม',
    hint: 'อันดับจากโหวตของคนที่ไปจริง',
    to: '/ranking',
    icon: Crown,
    image: '/images/categories/night-out-group-toast.webp',
    badge: 'อันดับประจำสัปดาห์',
  },
  {
    key: 'pub',
    title: 'ผับ / บาร์',
    hint: 'ดื่ม เต้น สังสรรค์',
    to: '/search?category=PUB_BAR',
    icon: Martini,
    image: '/images/categories/intimate-cocktail-bar.webp',
  },
  {
    key: 'food',
    title: 'ร้านอาหาร',
    hint: 'มื้อเย็นก่อนออกเที่ยว',
    to: '/search?category=RESTAURANT',
    icon: ForkKnife,
    image: '/images/categories/friends-dinner-toast.webp',
  },
  {
    key: 'live',
    title: 'ดนตรีสด',
    hint: 'ร้านที่มีวงเล่นสด',
    to: '/search?style=Live%20Music',
    icon: MusicNotes,
    image: '/images/categories/live-music-dinner.webp',
  },
  {
    key: 'rooftop',
    title: 'Rooftop',
    hint: 'นั่งชมวิวเมืองบนดาดฟ้า',
    to: '/search?style=Rooftop',
    icon: Buildings,
    image: '/images/categories/rooftop-lounge-skyline.webp',
  },
  {
    key: 'chill',
    title: 'นั่งชิล',
    hint: 'เพลงเบา คุยกันสบาย',
    to: '/search?category=CHILL',
    icon: Armchair,
    image: '/images/categories/vinyl-listening-bar.webp',
  },
  {
    key: 'outdoor',
    title: 'Outdoor',
    hint: 'โต๊ะกลางแจ้ง รับลมเย็น',
    to: '/search?style=Outdoor',
    icon: Tree,
    image: '/images/categories/outdoor-garden-dinner.webp',
  },
  {
    key: 'party',
    title: 'ปาร์ตี้',
    hint: 'ดีเจ ฟลอร์เต้นรำ',
    to: '/search?style=Party%20%26%20Dancing',
    icon: DiscoBall,
    image: '/images/categories/edm-dance-floor.webp',
  },
];
