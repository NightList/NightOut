import type { CrowdStatus } from '@nightout/types';
import { useNow } from '@/hooks/useNow';
import { CROWD, timeAgo } from '@/ui/utils/format';

/** 🟢🟡🔴 สถานะความแน่น — มีข้อความคู่เสมอ, เกิน 60 นาทีแสดง "ไม่ทราบสถานะ" */
export function CrowdBadge({
  crowd,
  updatedAt,
  showTime,
}: {
  crowd: CrowdStatus;
  updatedAt?: string;
  showTime?: boolean;
}) {
  const now = useNow(60_000);
  const stale = updatedAt && now - new Date(updatedAt).getTime() > 60 * 60_000;
  const c = CROWD[crowd];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${!stale && crowd === 'AVAILABLE' ? 'animate-pulse' : ''}`}
        style={{ background: stale ? 'var(--muted)' : c.dot }}
      />
      <span className={stale ? 'text-muted' : ''}>{stale ? 'ไม่ทราบสถานะ' : c.label}</span>
      {showTime && updatedAt && !stale && (
        <span className="text-xs text-muted">· {timeAgo(updatedAt)}</span>
      )}
    </span>
  );
}
