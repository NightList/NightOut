import { useSiteHome } from '../api';
import type { HomeCategory } from '../type/category';

/**
 * เนื้อหาหน้าแรก (Hero + การ์ดหมวด + ร้านยอดนิยมที่ปักไว้) จาก API — ไม่มีค่าตั้งต้นในหน้าเว็บ
 * ยังไม่มา = content/categories เป็น undefined (หน้าแสดง skeleton) · โหลดไม่ได้ = failed (หน้าแสดงปุ่มลองใหม่)
 * การ์ดเรียงตาม slot มาจาก API แล้ว (order=sort_order)
 */
export function useHomeContent() {
  const { data, isError, refetch } = useSiteHome();
  const categories = data?.categories.map(
    (c): HomeCategory => ({
      key: c.slot,
      title: c.title,
      hint: c.hint,
      to: c.link_to,
      image: c.image_url,
      badge: c.badge ?? undefined,
    }),
  );
  return {
    content: data?.content,
    categories,
    /** ร้านยอดนิยมที่แอดมินปักไว้ · ยังไม่มา/โหลดไม่ได้ = [] (กริดเรียงตามคะแนนรีวิวไปก่อน) */
    popularIds: data?.popular_bar_ids ?? [],
    failed: !data && isError,
    retry: () => void refetch(),
  };
}
