import { ABOUT_TEXT } from '../utils/content';

/**
 * ภาพปะติดส่วนหัว (Figma: เกี่ยวกับเรา) — มือถือตรงกลาง + รูปเอียง 4 รูปรอบ ๆ + หัวข้อทับมือถือ
 * ตำแหน่งวัดจาก Figma (เวที 860 × 610) แล้วแปลงเป็น % → ย่อขยายตามจอโดยไม่เพี้ยน
 * การเคลื่อนไหว: ตอนเปิดหน้า รูปค่อย ๆ ลอยขึ้นทีละรูป (stagger) แล้วลอยเบา ๆ ต่อ — ดู about.css
 */
const PHOTOS = [
  { src: '/images/about/splash.webp', x: 60, y: 38, w: 180, float: 'a' },
  { src: '/images/about/toast.webp', x: 610, y: 85, w: 140, float: 'b' },
  { src: '/images/about/bridge.webp', x: 0, y: 300, w: 240, float: 'b' },
  { src: '/images/about/whisky.webp', x: 622, y: 300, w: 228, float: 'a' },
] as const;

const W = 860;
const H = 610;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function AboutHero() {
  return (
    <section aria-labelledby="about-title" className="relative px-4 pt-[clamp(104px,11.9vw,190px)]">
      <div
        className="about-stage relative mx-auto w-full max-w-[860px]"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        <img
          src="/images/about/phone.webp"
          alt="หน้าแรกของ NightOut บนมือถือ"
          width={484}
          height={653}
          fetchPriority="high"
          className="about-pop absolute h-auto"
          style={{ left: pct(205, W), top: 0, width: pct(450, W), ['--i' as string]: 0 }}
        />
        {PHOTOS.map((p, i) => (
          <div
            key={p.src}
            className="about-pop absolute"
            style={{
              left: pct(p.x, W),
              top: pct(p.y, H),
              width: pct(p.w, W),
              ['--i' as string]: i + 1,
            }}
          >
            <img
              src={p.src}
              alt=""
              loading="eager"
              decoding="async"
              className={`about-float about-float--${p.float} h-auto w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]`}
            />
          </div>
        ))}

        <h1
          id="about-title"
          className="about-pop font-kanit absolute left-0 right-0 text-center font-semibold leading-none text-white"
          style={{ top: pct(418, H), ['--i' as string]: 5 }}
        >
          <span className="relative inline-block text-[11.6cqw] [text-shadow:0_6px_30px_rgba(0,0,0,0.55)]">
            เกี่ยวกับเรา
            <span
              lang="en"
              className="font-poppins absolute right-[-4%] top-[-18%] text-[3.4cqw] font-bold text-[#9b3df5]"
            >
              About us
            </span>
          </span>
        </h1>
      </div>

      <div
        className="about-pop font-kanit relative mx-auto mt-[-2.5%] max-w-255 space-y-3 text-center text-[clamp(15px,1.8vw,28px)] font-light leading-[1.15] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.6)]"
        style={{ ['--i' as string]: 6 }}
      >
        {ABOUT_TEXT.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
    </section>
  );
}
