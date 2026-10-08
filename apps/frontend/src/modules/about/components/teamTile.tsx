import { ArrowUpRight } from '@phosphor-icons/react';
import type { SiteTeamMember } from '../api';
import { TeamPortrait } from './teamPortrait';

/**
 * ช่องทีมงาน 1 คนในกริดเส้นทอง — กระจก (glassmorphism) + รูป
 * กดแล้วเปิดแผงโปรไฟล์ · ระหว่างเปิดแผง คนที่ไม่ได้เลือกรูปจางหายเหลือแค่กระจก (about.css)
 */
export function TeamTile({
  member,
  selected,
  onOpen,
}: {
  member: SiteTeamMember;
  selected: boolean;
  onOpen: () => void;
}) {
  const [mainRole, ...otherRoles] = member.roles;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`ดูโปรไฟล์ ${member.nickname}`}
      aria-haspopup="dialog"
      aria-pressed={selected}
      className={`team-tile group ${selected ? 'is-selected' : ''}`}
    >
      <span className="team-tile__photo" aria-hidden="true">
        <TeamPortrait photo={member.photo_url} alt="" />
        <span className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      </span>

      <ArrowUpRight weight="bold" aria-hidden="true" className="team-tile__arrow absolute right-3 top-3 size-5 text-gold md:right-4 md:top-4" />

      <span className="relative mt-auto flex flex-col gap-0.5 p-3 text-left md:p-4">
        <span className="font-kanit text-[clamp(20px,2vw,30px)] font-semibold leading-tight text-white">
          {member.nickname}
        </span>
        {mainRole && <span className="text-[13px] font-medium leading-snug text-gold md:text-sm">{mainRole}</span>}
        {otherRoles.length > 0 && (
          <span className="text-[12px] leading-snug text-white/65 md:text-[13px]">{otherRoles.join(', ')}</span>
        )}
      </span>
    </button>
  );
}
