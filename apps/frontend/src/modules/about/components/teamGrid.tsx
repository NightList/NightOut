import { Grid } from 'antd';
import type { SiteTeamMember } from '@/services/data';
import { TeamTile } from './teamTile';

/** จำนวนคอลัมน์ตามจอ: lg ขึ้นไป 4 · md 3 · เล็กกว่านั้น 2 */
export function useTeamColumns() {
  const bp = Grid.useBreakpoint();
  if (bp.lg) return 4;
  if (bp.md) return 3;
  return 2;
}

/**
 * กริดเส้นทอง — ช่องแรกเป็นคำอธิบาย (มือถือกินเต็มแถว) ตามด้วยทีมงานทีละช่อง
 * ช่องว่างท้ายแถวเติมเส้นทแยงให้กริดครบสี่เหลี่ยม · `skeleton` = จำนวนช่องโหลด (ไม่มีข้อมูลจริง)
 */
export function TeamGrid({
  members,
  openIndex,
  onOpen,
  skeleton = 0,
}: {
  members: SiteTeamMember[];
  openIndex: number | null;
  onOpen: (index: number) => void;
  skeleton?: number;
}) {
  const cols = useTeamColumns();
  const captionSpan = cols === 2 ? 2 : 1;
  const count = skeleton || members.length;
  const used = captionSpan + count;
  const fillers = (cols - (used % cols)) % cols;
  const hasOpen = openIndex !== null;

  return (
    <ul
      className={`team-grid ${hasOpen ? 'has-open' : ''}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      aria-busy={skeleton > 0 || undefined}
    >
      <li className="team-cell team-cell--caption" style={{ gridColumn: `span ${captionSpan}` }}>
        <div className="flex h-full flex-col justify-between gap-6 p-4 md:p-5">
          <p className="font-kanit text-[clamp(17px,1.5vw,22px)] font-medium leading-snug text-white">คนเบื้องหลัง NightOut</p>
          <p className="max-w-[26ch] text-[13px] leading-relaxed text-white/60">
            {skeleton > 0
              ? 'กำลังโหลดทีมงาน'
              : `ทั้งหมด ${members.length} คน กดที่การ์ดเพื่อดูโปรไฟล์และช่องทางติดต่อ`}
          </p>
        </div>
      </li>

      {skeleton > 0
        ? Array.from({ length: skeleton }, (_, i) => (
            <li key={`s${i}`} className="team-cell" aria-hidden="true">
              <span className="team-tile team-tile--skeleton" />
            </li>
          ))
        : members.map((m, i) => (
            <li key={m.id} className={`team-cell ${openIndex === i ? 'is-selected' : ''}`}>
              <TeamTile member={m} selected={openIndex === i} onOpen={() => onOpen(i)} />
            </li>
          ))}

      {Array.from({ length: fillers }, (_, i) => (
        <li key={`f${i}`} className="team-cell team-cell--filler" aria-hidden="true" />
      ))}
    </ul>
  );
}
