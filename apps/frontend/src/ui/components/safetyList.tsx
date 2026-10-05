import { CheckCircle, Question, SealCheck, XCircle } from '@phosphor-icons/react';
import { SAFETY_LABELS, safetyScore, type Bar } from '@/services/data';
import { Progress, Tooltip } from 'antd';

/** checklist ความปลอดภัย: แสดงสถานะเดียวต่อรายการ ✅ / ❌ / ⚪ */
export function SafetyList({ bar }: { bar: Bar }) {
  const score = safetyScore(bar);
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Progress
          type="circle"
          percent={score}
          size={64}
          strokeColor="var(--gold)"
          format={(p) => `${p}`}
        />
        <div>
          <p className="font-semibold">Safety Score</p>
          <p className="text-sm text-muted">
            คิดจากมาตรการที่ร้านมี · <SealCheck className="inline text-gold-text" /> = ยืนยันโดย
            NightOut
          </p>
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {bar.safety.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
          >
            {s.value === 'YES' ? (
              <CheckCircle
                weight="fill"
                className="shrink-0 text-(--crowd-available)"
                aria-label="มี"
              />
            ) : s.value === 'NO' ? (
              <XCircle weight="fill" className="shrink-0 text-(--crowd-full)" aria-label="ไม่มี" />
            ) : (
              <Question weight="fill" className="shrink-0 text-muted" aria-label="ยังไม่มีข้อมูล" />
            )}
            <span className="flex-1 text-sm">{SAFETY_LABELS[s.key]}</span>
            <Tooltip title={s.source === 'ADMIN_VERIFIED' ? 'ยืนยันโดย NightOut' : 'ร้านแจ้งเอง'}>
              {s.source === 'ADMIN_VERIFIED' ? (
                <SealCheck weight="fill" className="text-gold-text" />
              ) : (
                <span className="text-xs text-muted">ร้านแจ้ง</span>
              )}
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}
