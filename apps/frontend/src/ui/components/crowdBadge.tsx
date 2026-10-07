import type { CrowdStatus } from '@nightout/types';
import { useCrowdStatus } from '@/hooks/useCrowdStatus';
import { timeAgo } from '@/ui/utils/format';

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
  const { stale, label, dot } = useCrowdStatus(crowd, updatedAt);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${!stale && crowd === 'AVAILABLE' ? 'animate-pulse' : ''}`}
        style={{ background: dot }}
      />
      <span className={stale ? 'text-muted' : ''}>{label}</span>
      {showTime && updatedAt && !stale && (
        <span className="text-xs text-muted">· {timeAgo(updatedAt)}</span>
      )}
    </span>
  );
}
