import type { BarWithTier } from '@/services/data';
import { useRef } from 'react';
import { barImage } from '@/ui/utils/barImage';
import { EASE_OUT, MOTION_OK, gsap, useGSAP } from '../utils/gsap';

const COUNT = 14; // การ์ดรอบวง — เห็นครึ่งบน ~7 ใบแบบ Figma
/** ธีมมืด: การ์ดจางตามตำแหน่งกึ่งกลาง (สัดส่วนความสูง section) — ทึบถึง 60% แล้วหายหมดที่ 95% */
const FADE_START = 0.6;
const FADE_END = 0.95;

/**
 * Hero: การ์ดรูปร้านเรียงเป็นวงล้อ หมุนช้าๆ ตลอด (linear) + หมุนเพิ่มตามการเลื่อนหน้า (scrub)
 * ใช้ 2 ชั้นแยกกัน — ชั้นนอก = scroll, ชั้นใน = หมุนต่อเนื่อง — กัน tween ชนกัน
 * วงล้อมีศูนย์กลางใต้หัวข้อ เห็นแค่ครึ่งบน (overflow hidden) · การ์ดเอียงตามแนววง
 */
export function RadialCarousel({ bars, children }: { bars: BarWithTier[]; children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const cards = Array.from({ length: COUNT }, (_, i) => bars[i % Math.max(bars.length, 1)]);

  useGSAP(
    () => {
      // ธีมมืดพื้นโปร่ง → การ์ดครึ่งล่างต้องค่อยๆ จางหายแทนการโดนขอบ section ตัดเป็นเส้นตรง
      // ไม่ใช้ mask-image ครอบวงล้อ: Chrome วาด mask ทับเนื้อหาที่หมุนตลอดแล้วการ์ดหายเป็นแถบ (เช่นตอนลากรูปไปขอบจอ)
      // → ตั้ง opacity ให้การ์ดแต่ละใบตามตำแหน่งจริงทุกเฟรม (อ่าน rect 15 ครั้ง · เขียนแค่ opacity · ข้ามเมื่อพ้นจอ)
      const section = root.current!;
      const slots = gsap.utils.toArray<HTMLElement>('[data-radial-slot]');
      const fade = () => {
        const box = section.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) return;
        const dark = document.documentElement.classList.contains('dark');
        for (const el of slots) {
          if (!dark) {
            el.style.opacity = '';
            continue;
          }
          const y = (el.getBoundingClientRect().top - box.top) / box.height; // slot = จุดกึ่งกลางการ์ด
          el.style.opacity = String(gsap.utils.clamp(0, 1, (FADE_END - y) / (FADE_END - FADE_START)));
        }
      };
      gsap.ticker.add(fade);

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // เปิดหน้า: วงขยายออกจากกลาง + การ์ดโผล่ทีละใบ (ครั้งเดียวต่อการเข้าหน้า — ใช้ delight ได้)
        gsap.from('[data-radial-intro]', { scale: 0.72, duration: 1.2, ease: EASE_OUT });
        gsap.from('[data-radial-face]', {
          opacity: 0,
          scale: 0.9,
          duration: 0.8,
          ease: EASE_OUT,
          stagger: { each: 0.04, from: 'center' },
        });
        // หมุนต่อเนื่อง = linear (constant motion)
        gsap.to('[data-radial-spin]', { rotation: 360, duration: 90, ease: 'none', repeat: -1 });
        // เลื่อนหน้า = หมุนเพิ่ม 50° + หัวข้อจางลง
        gsap.to('[data-radial-scroll]', {
          rotation: 50,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
        gsap.to('[data-radial-title]', {
          yPercent: 30,
          opacity: 0.2,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      });
      return () => {
        gsap.ticker.remove(fade);
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate h-[24rem] overflow-hidden border-b border-border bg-surface dark:border-transparent dark:bg-transparent sm:h-[30rem] lg:h-[35rem]"
    >
      {/* จุดศูนย์กลางวงล้อ = ตำแหน่งหัวข้อ · ธีมมืด: การ์ดล่างจางด้วย opacity ราย slot (ดู fade ด้านบน) */}
      <div className="absolute left-1/2 top-[70%] size-0 [--radius:10.5rem] sm:[--radius:14rem] lg:top-[72%] lg:[--radius:18rem]">
        <div data-radial-intro className="absolute inset-0">
          <div data-radial-scroll className="absolute inset-0">
            <div data-radial-spin className="absolute inset-0">
              {cards.map((b, i) => (
                <div
                  key={i}
                  aria-hidden
                  data-radial-slot
                  className="absolute left-0 top-0 size-0"
                  style={{ transform: `rotate(${(360 / COUNT) * i}deg) translateY(calc(var(--radius) * -1))` }}
                >
                  <div
                    data-radial-face
                    className="absolute size-14 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-card bg-cover bg-center shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)] sm:size-20 lg:size-24"
                    style={{ backgroundImage: b ? `url(${barImage(b)})` : undefined }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        data-radial-title
        className="absolute inset-x-0 top-[70%] -translate-y-1/2 px-4 text-center lg:top-[72%]"
      >
        {children}
      </div>
    </section>
  );
}
