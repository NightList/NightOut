import type { CrowdStatus } from '@nightout/types';
import { useNow } from '@/hooks/useNow';
import { CROWD } from '@/ui/utils/format';

/** อัปเดตเกินนี้ถือว่าไม่ทราบสถานะ */
const STALE_MS = 60 * 60_000;

/**
 * สถานะความแน่นของร้าน (🟢🟡🔴) พร้อมเช็กความสด — เกิน 60 นาทีได้ "ไม่ทราบสถานะ" + จุดสีเทา
 * ใช้ร่วมกันทุกที่ที่แสดงสถานะคน (CrowdBadge, การ์ดหน้าแรก) ให้กติกาเดียวกัน · re-render ทุก 1 นาที
 */
export function useCrowdStatus(crowd: CrowdStatus, updatedAt?: string) {
  const now = useNow(60_000);
  const stale = !!updatedAt && now - new Date(updatedAt).getTime() > STALE_MS;
  const c = CROWD[crowd];
  return {
    stale,
    label: stale ? 'ไม่ทราบสถานะ' : c.label,
    dot: stale ? 'var(--muted)' : c.dot,
  };
}
