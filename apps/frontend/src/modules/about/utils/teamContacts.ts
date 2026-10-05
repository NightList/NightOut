import {
  ChatCircleText,
  Envelope,
  FacebookLogo,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  Phone,
  TiktokLogo,
  type Icon,
} from '@phosphor-icons/react';
import type { Db } from '@nightout/types';

export interface TeamContactLink {
  key: keyof Db.TeamContacts;
  label: string;
  href: string;
  icon: Icon;
  /** เปิดแท็บใหม่ (ลิงก์โซเชียล) · mailto / tel เปิดในแท็บเดิม */
  external: boolean;
}

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

/** ลำดับไอคอนที่แสดง · Phosphor ไม่มีโลโก้ LINE → ใช้ ChatCircleText */
const SOCIALS: { key: 'facebook' | 'instagram' | 'tiktok' | 'line' | 'github' | 'linkedin'; label: string; icon: Icon }[] = [
  { key: 'facebook', label: 'Facebook', icon: FacebookLogo },
  { key: 'instagram', label: 'Instagram', icon: InstagramLogo },
  { key: 'tiktok', label: 'TikTok', icon: TiktokLogo },
  { key: 'line', label: 'LINE', icon: ChatCircleText },
  { key: 'github', label: 'GitHub', icon: GithubLogo },
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedinLogo },
];

/**
 * contacts (jsonb) → ลิงก์ที่กดได้ เรียง FB, IG, TikTok, LINE, GitHub, LinkedIn, อีเมล, โทร
 * โซเชียลที่ไม่ใช่ URL เต็มให้ข้าม (กันลิงก์เสีย) · LINE ID ที่ไม่ใช่ URL → https://line.me/ti/p/~{id}
 */
export function teamContactLinks(contacts: Db.TeamContacts | null | undefined): TeamContactLink[] {
  const c = contacts ?? {};
  const links: TeamContactLink[] = [];

  for (const s of SOCIALS) {
    const raw = c[s.key]?.trim();
    if (!raw) continue;
    if (s.key === 'line' && !isUrl(raw)) {
      const id = raw.replace(/^@?~?/, '');
      if (!id) continue;
      links.push({ ...s, href: `https://line.me/ti/p/~${encodeURIComponent(id)}`, external: true });
      continue;
    }
    if (!isUrl(raw)) continue;
    links.push({ ...s, href: raw, external: true });
  }

  const email = c.email?.trim();
  if (email) links.push({ key: 'email', label: `อีเมล ${email}`, href: `mailto:${email}`, icon: Envelope, external: false });

  const phone = c.phone?.trim();
  const tel = phone?.replace(/[^\d+]/g, '');
  if (phone && tel) links.push({ key: 'phone', label: `โทร ${phone}`, href: `tel:${tel}`, icon: Phone, external: false });

  return links;
}
