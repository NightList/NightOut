import { MapPin } from '@phosphor-icons/react';
import { Tag } from 'antd';
import { CATEGORY_LABELS, type BarWithTier } from '@/services/data';
import { BarCover } from '@/ui/components/barCard';
import { BarRating } from '@/ui/components/barRating';
import { CrowdBadge } from '@/ui/components/crowdBadge';
import { FavoriteButton } from '@/ui/components/favoriteButton';

/** ภาพปกร้านเต็มความกว้าง + ปุ่มร้านโปรด */
export function BarHero({ bar }: { bar: BarWithTier }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border">
      <BarCover bar={bar} className="h-56 md:h-72" />
      <FavoriteButton barId={bar.id} className="!absolute right-4 top-4" />
    </div>
  );
}

/** หัวข้อร้าน: ป้ายหมวด/สไตล์ · ชื่อ · ดาว ย่าน สถานะคน · คำอธิบาย */
export function BarHeader({ bar }: { bar: BarWithTier }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{CATEGORY_LABELS[bar.category]}</Tag>
        {bar.promoted && <Tag>แนะนำ · โฆษณา</Tag>}
        {bar.styles.map((s) => (
          <Tag key={s} color="purple" variant="filled">
            {s}
          </Tag>
        ))}
      </div>
      <h1 className="mt-3 font-display text-4xl font-bold">{bar.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
        <BarRating bar={bar} />
        <span className="inline-flex items-center gap-1 text-muted">
          <MapPin /> {bar.district}
        </span>
        <CrowdBadge crowd={bar.crowd} updatedAt={bar.crowdUpdatedAt} showTime />
      </div>
      <p className="mt-4 text-muted">{bar.description}</p>
    </>
  );
}
