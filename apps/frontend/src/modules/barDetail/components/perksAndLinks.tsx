import { Gift, InstagramLogo, TiktokLogo } from '@phosphor-icons/react';
import { Button } from 'antd';
import type { BarWithTier } from '@/services/data';
import { InfoSection } from '@/ui/components/infoSection';

/** สิทธิพิเศษเมื่อจองผ่าน NightOut */
export function Perks({ perks }: { perks: string[] }) {
  if (!perks.length) return null;
  return (
    <InfoSection icon={<Gift />} title="สิทธิพิเศษเมื่อจองผ่าน NightOut">
      <ul className="list-inside list-disc text-sm text-muted">
        {perks.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </InfoSection>
  );
}

/** ปุ่มโซเชียลของร้าน (IG / TikTok) */
export function SocialLinks({ links }: { links: BarWithTier['links'] }) {
  if (!links.length) return null;
  return (
    <div className="flex gap-2">
      {links.map((l) => (
        <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener">
          <Button
            shape="circle"
            aria-label={l.type}
            icon={l.type === 'INSTAGRAM' ? <InstagramLogo /> : <TiktokLogo />}
          />
        </a>
      ))}
    </div>
  );
}
