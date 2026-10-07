import { useMemo, useRef } from 'react';
import { EASE_OUT, MOTION_OK, MOTION_REDUCE, gsap, useGSAP } from '../utils/gsap';

/**
 * แยกข้อความเป็นตัวอักษรแบบ grapheme (Intl.Segmenter) — ภาษาไทยสระ/วรรณยุกต์ติดกับพยัญชนะ
 * ไม่หลุดออกจากกันเหมือนการ split ทีละ char (SplitText แยก "ผู้" เป็น 3 ชิ้น)
 */
function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('th', { granularity: 'grapheme' });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/**
 * หัวข้อ "สัปดาห์นี้ ผู้ชนะได้แก่…" — เล่นครั้งเดียวเมื่อเลื่อนมาถึง
 * ไม่ pin / ไม่ scrub — ข้อความที่ต้องอ่านไม่ควรค้างครึ่งทาง · ไม่มีกรอบ overflow ตัดสระบน/ล่าง
 * เปลี่ยนสัปดาห์/เดือน (key ใหม่) ขณะอยู่ในจอ → เล่นใหม่ทันที เป็นสัญญาณว่าข้อมูลเปลี่ยน
 */
export function SplitHeading({ lead, text }: { lead: string; text: string }) {
  const root = useRef<HTMLElement>(null);
  const chars = useMemo(() => graphemes(text), [text]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
        });
        tl.from('[data-lead]', {
          opacity: 0,
          y: 24,
          filter: 'blur(6px)',
          duration: 0.5,
          ease: EASE_OUT,
        }).from(
          '[data-char]',
          {
            // ไม่ blur รายตัว — filter บนทุก span = rasterize ใหม่ทุกเฟรม (ช้าบนมือถือ)
            opacity: 0,
            yPercent: 40,
            duration: 0.6,
            ease: EASE_OUT,
            stagger: 0.03,
          },
          '-=0.25',
        );
      });
      mm.add(MOTION_REDUCE, () => {
        gsap.set('[data-lead], [data-char]', { clearProps: 'all' });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [lead, text], revertOnUpdate: true },
  );

  return (
    <section ref={root} className="flex items-center justify-center py-16 sm:py-24">
      <h2
        aria-label={`${lead} ${text}…`}
        className="max-w-full text-center text-5xl font-bold leading-[1.3] sm:text-7xl lg:text-8xl"
      >
        {/* ช่องว่างท้าย inline-block ถูกตัดทิ้ง → เว้นระยะด้วย margin แทน */}
        <span aria-hidden data-lead className="me-[0.3em] inline-block text-muted">
          {lead}
        </span>
        <span aria-hidden className="inline-flex text-gold">
          {chars.map((c, i) => (
            <span key={i} data-char className="inline-block whitespace-pre">
              {c}
            </span>
          ))}
          <span data-char className="inline-block">
            …
          </span>
        </span>
      </h2>
    </section>
  );
}
