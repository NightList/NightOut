import { BAR_GALLERY_MAX } from '@nightout/contracts';
import { coverFirst, galleryCoverPath } from '@nightout/utils';
import { ImageSquare, Plus, Star, Trash } from '@phosphor-icons/react';
import { App, Button, Card, Popconfirm, Spin, Upload } from 'antd';
import { useState, type ReactNode } from 'react';
import type { Bar } from '@/services/data';
import { PHOTO_ACCEPT, checkPhoto } from '@/ui/utils/media';
import { setBarMedia, uploadGalleryPhoto } from '../api';

/**
 * รูปร้านในหน้าข้อมูลร้าน — ปก (ช่องใหญ่) + แกลเลอรี สูงสุด 10 รูป · บันทึกทันทีที่อัปโหลด/ลบ/ตั้งปก (ไม่ต้องกดบันทึกของฟอร์ม)
 * ปกใช้บนการ์ดร้าน แผนที่ และหัวหน้าร้าน · ลูกค้าเห็นแกลเลอรีทั้งหมดในหน้าร้าน
 */
export function BarPhotos({ bar }: { bar: Bar }) {
  const { message } = App.useApp();
  const [progress, setProgress] = useState<string | null>(null);
  const photos = bar.gallery ?? [];
  const saved = photos.map((p) => p.path);
  const cover = galleryCoverPath(bar.coverUrl, saved);
  const paths = coverFirst(saved, cover);
  const ordered = paths.map((p) => photos.find((g) => g.path === p)!);
  const room = BAR_GALLERY_MAX - photos.length;
  const busy = progress !== null;

  const save = async (next: string[], nextCover: string | null, done: string) => {
    setProgress('กำลังบันทึก…');
    try {
      await setBarMedia(bar.id, { paths: coverFirst(next, nextCover), cover_path: nextCover });
      message.success(done);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  const add = async (files: File[]) => {
    const bad = files.map(checkPhoto).filter((m): m is string => !!m);
    bad.forEach((m) => void message.error(m));
    let ok = files.filter((f) => !checkPhoto(f));
    if (ok.length > room) {
      void message.warning(`เพิ่มได้อีก ${room} รูป — ใช้ ${room} รูปแรกที่เลือก`);
      ok = ok.slice(0, room);
    }
    if (!ok.length) return;
    const added: string[] = [];
    for (const [i, f] of ok.entries()) {
      setProgress(`กำลังอัปโหลด ${i + 1}/${ok.length}`);
      try {
        added.push(await uploadGalleryPhoto(bar.id, f));
      } catch (e) {
        void message.error(`${f.name}: ${(e as Error).message}`);
      }
    }
    if (!added.length) return setProgress(null);
    // ยังไม่มีปก → รูปแรกที่เพิ่มเป็นปก
    await save([...paths, ...added], cover ?? added[0] ?? null, `เพิ่มรูปแล้ว ${added.length} รูป`);
  };

  const uploader = (children: ReactNode, className: string) => (
    <Upload
      accept={PHOTO_ACCEPT}
      multiple
      showUploadList={false}
      disabled={busy}
      className={className}
      beforeUpload={(file, list) => {
        // antd เรียกทีละไฟล์ — รวบทั้งชุดตอนไฟล์สุดท้าย แล้วอัปโหลดเอง
        if (file === list[list.length - 1]) void add(list);
        return Upload.LIST_IGNORE;
      }}
    >
      {children}
    </Upload>
  );

  return (
    <Card
      title="รูปร้าน"
      className="!mb-6"
      extra={
        <span className="text-xs text-muted tabular-nums">
          {photos.length}/{BAR_GALLERY_MAX} รูป
        </span>
      }
    >
      <p className="mb-4 text-sm text-muted">
        รูปปกขึ้นบนการ์ดร้าน แผนที่ และหัวหน้าร้าน · ลูกค้าเลื่อนดูรูปทั้งหมดได้ในหน้าร้าน ·
        ใช้รูปบรรยากาศจริงของร้าน ห้ามมีข้อความชวนดื่ม
      </p>

      <Spin spinning={busy} description={progress ?? undefined}>
        {ordered.length === 0 ? (
          uploader(
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <ImageSquare size={40} className="text-gold-text" aria-hidden />
              <p className="font-medium">ยังไม่มีรูปร้าน</p>
              <p className="max-w-sm text-sm text-muted">
                รูปแรกที่เพิ่มจะเป็นรูปปก — ตอนนี้ลูกค้าเห็นรูปแทนของ NightOut
              </p>
              <Button type="primary" icon={<Plus />}>
                เพิ่มรูป
              </Button>
            </div>,
            'block [&_.ant-upload]:block',
          )
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map((p, i) => {
              const isCover = p.path === cover;
              return (
                <li
                  key={p.path}
                  className={`relative overflow-hidden rounded-xl border bg-card ${
                    isCover
                      ? 'col-span-2 aspect-[16/10] border-gold sm:row-span-2 sm:aspect-auto'
                      : 'aspect-[4/3] border-border'
                  }`}
                >
                  <img
                    src={p.url}
                    alt={isCover ? `รูปปก ${bar.name}` : `รูปร้าน ${bar.name} ที่ ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover"
                  />
                  {isCover && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-xs text-gold-highlight backdrop-blur">
                      <Star weight="fill" aria-hidden /> รูปปก
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-linear-to-t from-black/70 to-transparent p-2 pt-6">
                    {!isCover && (
                      <Button
                        size="small"
                        icon={<Star />}
                        disabled={busy}
                        onClick={() => void save(paths, p.path, 'ตั้งเป็นรูปปกแล้ว')}
                      >
                        ตั้งเป็นปก
                      </Button>
                    )}
                    <Popconfirm
                      title="ลบรูปนี้?"
                      description={
                        isCover && ordered.length > 1 ? 'รูปถัดไปจะเป็นรูปปกแทน' : undefined
                      }
                      okText="ลบ"
                      cancelText="ยกเลิก"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => {
                        const next = paths.filter((x) => x !== p.path);
                        return save(next, isCover ? (next[0] ?? null) : cover, 'ลบรูปแล้ว');
                      }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<Trash />}
                        disabled={busy}
                        aria-label="ลบรูป"
                      />
                    </Popconfirm>
                  </div>
                </li>
              );
            })}
            {room > 0 && (
              <li className="aspect-[4/3]">
                {uploader(
                  <span className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-sm text-muted transition-colors hover:border-gold hover:text-text">
                    <Plus size={22} aria-hidden />
                    เพิ่มรูป
                    <span className="text-xs">เหลือ {room} รูป</span>
                  </span>,
                  'block size-full [&_.ant-upload]:block [&_.ant-upload]:size-full',
                )}
              </li>
            )}
          </ul>
        )}
      </Spin>
      <p className="mt-3 text-xs text-muted">
        JPG, PNG หรือ WebP ไม่เกิน 15MB ต่อรูป (ระบบย่อให้ก่อนอัปโหลด)
      </p>
    </Card>
  );
}
