import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { Drawer, Grid, Tag } from 'antd';
import { useEffect, useId, useState } from 'react';
import type { SiteTeamMember } from '../api';
import { teamContactLinks } from '../utils/teamContacts';
import { TeamContactLinks } from './teamContactLinks';
import { TeamPortrait } from './teamPortrait';

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * แผงโปรไฟล์ทีมงาน (antd Drawer) — จอ md ขึ้นไปออกขวา 560px · มือถือขึ้นจากล่างสูง 88vh
 * หัว: ลำดับ ชื่อ ชื่อจริง ตำแหน่ง + รูป 3:4 (ปุ่มปิดอยู่บนรูป) · ตัว: bio, สกิล, ช่องทางติดต่อ
 * ล่าง: คนก่อนหน้า/ถัดไป (วนรอบ) + ลูกศรซ้าย/ขวาบนคีย์บอร์ด
 */
export function TeamProfileDrawer({
  members,
  index,
  onClose,
  onNavigate,
}: {
  members: SiteTeamMember[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const bp = Grid.useBreakpoint();
  const desktop = !!bp.md;
  const titleId = useId();
  const n = members.length;
  const open = index !== null && n > 0;

  // ตอนปิด index = null แต่แผงยังเลื่อนออกอยู่ → แสดงคนล่าสุดไว้จนหายไป
  const [shown, setShown] = useState(index ?? 0);
  if (index !== null && index !== shown) setShown(index);

  const prev = (shown - 1 + n) % n;
  const next = (shown + 1) % n;

  useEffect(() => {
    if (!open || n < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate((shown - 1 + n) % n);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate((shown + 1) % n);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, n, shown, onNavigate]);

  const m = members[shown];
  if (!m) return null;
  const [mainRole, ...otherRoles] = m.roles;
  const bio = m.bio?.trim();
  const hasContacts = teamContactLinks(m.contacts).length > 0;
  const empty = !bio && m.skills.length === 0 && !hasContacts;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement={desktop ? 'right' : 'bottom'}
      size={desktop ? 560 : '88vh'}
      closable={false}
      classNames={{ root: 'team-drawer', body: 'team-drawer__body', footer: 'team-drawer__footer' }}
      aria-labelledby={titleId}
      footer={
        n > 1 ? (
          <nav aria-label="ทีมงานคนอื่น" className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => onNavigate(prev)}
              className="team-drawer__nav justify-start"
            >
              <CaretLeft weight="bold" aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">
                <span className="sr-only">คนก่อนหน้า: </span>
                {members[prev]?.nickname}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate(next)}
              className="team-drawer__nav justify-end border-l border-white/15"
            >
              <span className="truncate">
                <span className="sr-only">คนถัดไป: </span>
                {members[next]?.nickname}
              </span>
              <CaretRight weight="bold" aria-hidden="true" className="size-4 shrink-0" />
            </button>
          </nav>
        ) : null
      }
    >
      <header className="grid grid-cols-[minmax(0,1fr)_clamp(120px,34%,180px)] border-b border-white/15">
        <div className="flex min-w-0 flex-col justify-end gap-1 p-5 md:p-6">
          <h2
            id={titleId}
            className="font-kanit mt-6 text-[clamp(32px,4vw,44px)] font-semibold leading-none text-white"
          >
            {m.nickname}
          </h2>
          {m.full_name && <p className="text-sm text-white/70">{m.full_name}</p>}
          {mainRole && <p className="mt-2 text-sm font-medium text-gold">{mainRole}</p>}
          {otherRoles.length > 0 && (
            <p className="text-[13px] text-white/65">{otherRoles.join(', ')}</p>
          )}
        </div>
        <div className="py-4 pr-4 md:py-2 md:pr-2">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/15">
            <TeamPortrait
              key={m.id}
              photo={m.photo_url}
              alt={m.nickname}
              className="team-drawer__photo"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดโปรไฟล์"
              className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-gold"
            >
              <X weight="bold" aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-7 p-5 md:p-6">
        {empty ? (
          <p className="text-sm text-white/55">{m.nickname} ยังไม่ได้เขียนแนะนำตัว</p>
        ) : (
          <>
            {bio && (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-white/85">{bio}</p>
            )}

            {m.skills.length > 0 && (
              <section aria-labelledby={`${titleId}-skills`} className="flex flex-col gap-3">
                <h3 id={`${titleId}-skills`} className="text-[13px] font-medium text-white/55">
                  สกิล
                </h3>
                <div className="flex flex-wrap gap-2">
                  {m.skills.map((s) => (
                    <Tag key={s} variant="outlined" color="gold" className="m-0 text-[13px]">
                      {s}
                    </Tag>
                  ))}
                </div>
              </section>
            )}

            {hasContacts && (
              <section aria-labelledby={`${titleId}-contact`} className="flex flex-col gap-3">
                <h3 id={`${titleId}-contact`} className="text-[13px] font-medium text-white/55">
                  ติดต่อ
                </h3>
                <TeamContactLinks contacts={m.contacts} />
              </section>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
