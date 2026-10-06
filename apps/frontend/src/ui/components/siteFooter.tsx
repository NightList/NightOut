import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { Link } from 'react-router';

const MENU = [
  { to: '/', label: 'หน้าหลัก' },
  { to: '/ranking', label: 'จัดอันดับ' },
  { to: '/search?category=RESTAURANT', label: 'ร้านอาหาร' },
  { to: '/reviews', label: 'รีวิว' },
  { to: '/about', label: 'เกี่ยวกับเรา' },
];
const CONTACT = [
  { to: '/about', label: 'ติดต่อทีมงาน' },
  { to: '/merchant/join', label: 'ลงโฆษณา' },
  { to: '/merchant/join', label: 'ร่วมธุรกิจ' },
];
const SOCIAL = [
  { href: 'https://instagram.com', label: 'Instagram', icon: InstagramLogoIcon },
  { href: 'https://tiktok.com', label: 'TikTok', icon: TiktokLogoIcon },
  { href: 'https://facebook.com', label: 'Facebook', icon: FacebookLogoIcon },
  { href: 'https://youtube.com', label: 'YouTube', icon: YoutubeLogoIcon },
];

function Column({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 font-semibold text-gold-text">{title}</p>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="!text-white/75 transition-colors hover:!text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * ฟุตเตอร์ (Figma: Main → Footer) — การ์ดกระจกลอยบนภาพเมืองกลางคืน (city-strip.jpg)
 * ซ้าย: โลโก้ + คำโปรย + โซเชียล · เส้นคั่น · ขวา: เมนูหลัก / ติดต่อเรา · ล่าง: ลิขสิทธิ์
 * ภาพพื้นเป็นกลางคืนเสมอ → ตัวอักษรขาวทั้งสองธีม
 */
export function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`relative isolate overflow-hidden px-4 pb-28 pt-24 md:px-8 md:pb-10 md:pt-40 ${className}`}
    >
      <img
        src="/images/home/footer-bg.webp"
        srcSet="/images/home/footer-bg-sm.webp 800w, /images/home/footer-bg.webp 1774w"
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 size-full object-cover object-bottom"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background/40 to-black/30" />

      <div className="mx-auto max-w-6xl rounded-[28px] border border-white/15 bg-black/35 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-12">
          <div className="md:flex-1">
            <Link to="/" className="inline-flex items-center gap-3 !text-white">
              <img
                src="/images/common/logo.png"
                alt=""
                width={48}
                height={48}
                className="size-12 object-contain"
              />
              <span className="text-2xl font-bold text-purple">NightOut</span>
            </Link>
            <p className="mt-4 text-white/85">ค้นหาร้านเหล้า บาร์ และสถานที่นั่งชิล ใกล้คุณ</p>
            <p className="mt-1 text-xs text-white/55">Discover night vibes arround you.</p>
            <ul className="mt-5 flex gap-3">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="grid size-10 place-items-center rounded-lg border border-white/30 !text-white transition-colors hover:border-gold hover:!text-gold"
                  >
                    <s.icon size={20} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <span className="h-px bg-white/15 md:h-auto md:w-px" aria-hidden />

          <div className="grid grid-cols-2 gap-8 md:flex-1 md:gap-12">
            <Column title="เมนูหลัก" links={MENU} />
            <Column title="ติดต่อเรา" links={CONTACT} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t border-white/15 pt-5 text-xs text-white/60 sm:flex-row sm:justify-center">
          <p>2026 Nightout. สงวนลิขสิทธิ์ทั้งหมด</p>
        </div>
      </div>
    </footer>
  );
}
