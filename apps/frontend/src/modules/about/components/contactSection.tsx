import {
  Briefcase,
  Clock,
  Envelope,
  FacebookLogo,
  InstagramLogo,
  MapPinSimple,
  Phone,
  TiktokLogo,
  YoutubeLogo,
  type Icon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { CONTACT, SOCIALS } from '../utils/content';

const SOCIAL_ICON: Record<(typeof SOCIALS)[number]['key'], Icon> = {
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  facebook: FacebookLogo,
  youtube: YoutubeLogo,
};

/** ไอคอน "เวลาทำการ" ใน Figma = กระเป๋าทำงาน + นาฬิกามุมขวาล่าง */
function HoursIcon() {
  return (
    <span className="relative inline-block size-[clamp(32px,2.8vw,46px)]">
      <Briefcase weight="fill" className="size-full" />
      <span className="absolute -bottom-[6%] -right-[8%] grid size-[52%] place-items-center rounded-full bg-black">
        <Clock weight="fill" className="size-[88%]" />
      </span>
    </span>
  );
}

function Item({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-3 py-[clamp(4px,0.6vw,10px)] text-center">
      <div className="mb-[clamp(8px,0.9vw,14px)] grid h-[clamp(32px,2.8vw,46px)] place-items-center">
        {icon}
      </div>
      <h3 className="font-kanit text-[clamp(17px,1.4vw,22px)] font-normal leading-tight">{title}</h3>
      <div className="font-poppins mt-[clamp(4px,0.5vw,8px)] space-y-[0.35em] text-[clamp(13px,0.95vw,15px)] font-semibold leading-snug">
        {children}
      </div>
    </div>
  );
}

const icon = 'size-[clamp(32px,2.8vw,46px)]';

/**
 * ติดต่อเรา (Figma: การ์ดกระจก — หัวข้อกลางบน · 4 ช่องมีเส้นคั่น · โซเชียลมุมขวาล่าง · NIGHTOUT ยักษ์จม ๆ อยู่ด้านหลัง)
 * การ์ดเป็นกระจกเบลอ → ตัวหนังสือยักษ์ส่วนที่อยู่หลังการ์ดจะเบลอ ส่วนที่ล้นลงมาคมชัด
 */
export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative scroll-mt-24 pt-[clamp(80px,9vw,140px)]"
    >
      <div className="relative z-10 mx-auto w-[calc(100%-2rem)] max-w-[1040px] overflow-hidden rounded-[20px] border border-white/10 border-t-white/25 bg-black/35 px-[clamp(16px,2vw,32px)] pb-[clamp(16px,1.6vw,24px)] pt-[clamp(20px,2vw,32px)] text-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md">
        {/* หัวข้อกลางการ์ด + "Contact us" ลอยมุมขวาบน */}
        <h2 id="contact-title" className="text-center">
          <span className="relative inline-block font-kanit text-[clamp(36px,3.6vw,56px)] font-semibold leading-[1.05]">
            ติดต่อเรา
            <span
              lang="en"
              className="font-poppins absolute right-[-3%] top-[-8%] text-[0.3em] font-bold leading-none text-[#9b3df5]"
            >
              Contact us
            </span>
          </span>
        </h2>

        {/* 4 ช่อง + เส้นคั่น (จอใหญ่) */}
        <div className="mt-[clamp(16px,1.6vw,26px)] grid grid-cols-2 gap-y-6 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-white/30">
          <Item icon={<Phone weight="fill" className={icon} />} title="โทรศัพท์">
            <a
              href={`tel:${CONTACT.phone.replace(/-/g, '')}`}
              className="!text-white hover:!text-gold"
            >
              {CONTACT.phone}
            </a>
          </Item>
          <Item icon={<Envelope weight="fill" className={icon} />} title="อีเมลล์">
            <a href={`mailto:${CONTACT.email}`} className="break-all !text-white hover:!text-gold">
              {CONTACT.email}
            </a>
          </Item>
          <Item icon={<HoursIcon />} title="เวลาทำการ">
            <p className="font-kanit font-medium">{CONTACT.hours[0]}</p>
            <p>{CONTACT.hours[1]}</p>
          </Item>
          <Item icon={<MapPinSimple weight="fill" className={icon} />} title="ที่อยู่">
            {CONTACT.address.map((a) => (
              <p key={a} className="font-kanit font-medium">
                {a}
              </p>
            ))}
          </Item>
        </div>

        {/* โซเชียล มุมขวาล่าง */}
        <ul className="mt-[clamp(14px,1.2vw,20px)] flex justify-center gap-[clamp(12px,1.3vw,22px)] md:justify-end">
          {SOCIALS.map((so) => {
            const I = SOCIAL_ICON[so.key];
            return (
              <li key={so.key}>
                <a
                  href={so.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={so.label}
                  className="grid size-9 place-items-center rounded-lg border border-white/70 !text-white transition-[background-color,border-color] duration-200 ease-out hover:border-white hover:bg-white/10"
                >
                  <I size={16} />
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* NIGHTOUT ยักษ์ — ครึ่งบนจมอยู่หลังการ์ด (เบลอ) ล้นลงมาแล้วถูกตัดที่ขอบล่างหน้า */}
      <div aria-hidden="true" className="relative -mt-[8.3vw] h-[13.2vw] overflow-hidden">
        <p className="font-poppins about-giant whitespace-nowrap text-center text-[19.15vw] font-bold leading-[0.7] tracking-[-0.02em]">
          NIGHTOUT
        </p>
      </div>
    </section>
  );
}
