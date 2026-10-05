import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { AboutHero } from './components/aboutHero';
import { ContactSection } from './components/contactSection';
import { TeamSection } from './components/teamSection';
import './about.css';

/**
 * /about (+ /contact เลื่อนลงไปส่วนติดต่อเรา) — Figma: เกี่ยวกับเรา
 * ภาพปะติดมือถือ + เกี่ยวกับเรา → ทีมงาน (กริดเส้นทอง + แผงโปรไฟล์) → ติดต่อเรา + NIGHTOUT ยักษ์ปิดท้าย (แทนฟุตเตอร์)
 * แก้ข้อความ/ช่องทางติดต่อ: ./utils/content.ts · ทีมงานแก้ในตาราง team_members (Supabase)
 */
export function AboutPage() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== '/contact' && hash !== '#contact') return;
    // รอฟอนต์โหลดก่อน — ไม่งั้นตำแหน่งเลื่อนหลังข้อความเปลี่ยนฟอนต์
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) document.getElementById('contact')?.scrollIntoView({ block: 'start' });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, hash]);

  return (
    <div className="relative isolate overflow-hidden bg-black pb-24 text-white md:pb-0">
      <div
        aria-hidden="true"
        className="about-bg absolute inset-x-0 top-0 -z-20 h-[min(1400px,110vw)] min-h-180"
      />

      <AboutHero />

      <TeamSection />

      <ContactSection />
    </div>
  );
}
