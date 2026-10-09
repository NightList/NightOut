import type { ReactNode } from 'react';

/**
 * ชิ้นส่วนหน้าร้าน (/merchant/*) ตามดีไซน์ "Merchant 1i Bento"
 * การ์ด 20px · ขอบ --border · พื้น --card (หรือ --surface สำหรับกล่องรอง)
 */

export function Tile({
  className = '',
  tone = 'card',
  children,
}: {
  className?: string;
  tone?: 'card' | 'surface';
  children: ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-[20px] border border-border p-5 ${
        tone === 'card' ? 'bg-card' : 'bg-surface'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** วงแหวนเปอร์เซ็นต์ (conic-gradient) — กลางวงเป็นตัวเลข % หรือ children */
export function Ring({ pct, size = 72, children }: { pct: number; size?: number; children?: ReactNode }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const inner = Math.round(size * 0.75);
  return (
    <span
      role="img"
      aria-label={`${p}%`}
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--gold) 0 ${p}%, color-mix(in srgb, var(--border) 80%, var(--card)) ${p}% 100%)`,
      }}
    >
      <span
        className="flex flex-col items-center justify-center rounded-full bg-card text-sm font-semibold"
        style={{ width: inner, height: inner }}
      >
        {children ?? `${p}%`}
      </span>
    </span>
  );
}

/** แถบความคืบหน้า 6px */
export function Meter({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <span className={`block h-1.5 rounded-full bg-border/70 ${className}`}>
      <span
        className="block h-full rounded-full bg-gold"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </span>
  );
}

/** ปุ่มกรองทรงแคปซูล — ตัวที่เลือกเป็นสีทอง */
export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`merchant-pill shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] ${
        active ? 'border-gold bg-gold font-semibold text-on-gold' : 'border-border text-muted'
      }`}
    >
      {children}
    </button>
  );
}

/** หัวข้อการ์ด: ป้ายเทาทางซ้าย + ไอคอน/ลิงก์ทางขวา */
export function TileLabel({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return (
    <span className="flex items-center justify-between gap-2 text-sm text-muted">
      {children}
      {end}
    </span>
  );
}
