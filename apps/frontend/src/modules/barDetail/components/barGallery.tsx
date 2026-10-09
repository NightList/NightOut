import { Image } from 'antd';
import type { BarWithTier } from '@/services/data';

/** แถบรูปร้านใต้ภาพปก — กดแล้วดูเต็มจอและเลื่อนดูทีละรูป · มีแค่รูปปกรูปเดียว (หรือไม่มีรูป) ไม่แสดง */
export function BarGallery({ bar }: { bar: BarWithTier }) {
  const photos = bar.gallery ?? [];
  if (photos.length < 2) return null;
  return (
    <section aria-label={`รูปร้าน ${bar.name} ${photos.length} รูป`} className="mt-3">
      <ul className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
        <Image.PreviewGroup>
          {photos.map((p, i) => (
            <li key={p.id} className="shrink-0 snap-start">
              <Image
                src={p.url}
                alt={`รูปร้าน ${bar.name} ที่ ${i + 1}`}
                width={128}
                height={88}
                className="object-cover"
                rootClassName="overflow-hidden rounded-xl border border-border [&_img]:!h-[72px] [&_img]:!w-[104px] sm:[&_img]:!h-[88px] sm:[&_img]:!w-[128px]"
              />
            </li>
          ))}
        </Image.PreviewGroup>
      </ul>
    </section>
  );
}
