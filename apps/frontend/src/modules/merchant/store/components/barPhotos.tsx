import { BAR_GALLERY_MAX } from '@nightout/contracts';
import { coverFirst, galleryCoverPath } from '@nightout/utils';
import { ImageSquare, Plus, UploadSimple } from '@phosphor-icons/react';
import { App, Popconfirm, Spin, Upload } from 'antd';
import { useState, type ReactNode } from 'react';
import type { Bar } from '@/services/data';
import { PHOTO_ACCEPT, checkPhoto } from '@/ui/utils/media';
import { setBarMedia, uploadGalleryPhoto } from '../api';

/**
 * รูปร้าน — 10 ช่องเสมอ: ปก (ช่องใหญ่ 2×2) + 9 ช่อง · ช่องว่างเป็นลายแรเงา แตะเพื่อเพิ่มรูป · แตะรูปเพื่อเลือก แล้วกด "ตั้งเป็นปก" / "ลบ"
 * บันทึกทันทีที่อัปโหลด/ลบ/ตั้งปก (ไม่ต้องกดบันทึกของฟอร์ม)
 */
export function BarPhotos({ bar }: { bar: Bar }) {
  const { message } = App.useApp();
  const [progress, setProgress] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const photos = bar.gallery ?? [];
  const saved = photos.map((p) => p.path);
  const cover = galleryCoverPath(bar.coverUrl, saved);
  const paths = coverFirst(saved, cover);
  const ordered = paths.map((p) => photos.find((g) => g.path === p)!);
  const room = BAR_GALLERY_MAX - photos.length;
  const busy = progress !== null;
  const selected = picked && paths.includes(picked) ? picked : null;

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

  const uploader = (children: ReactNode, className = '', label?: string) => (
    <Upload
      accept={PHOTO_ACCEPT}
      multiple
      showUploadList={false}
      disabled={busy || room <= 0}
      className={className}
      aria-label={label}
      beforeUpload={(file, list) => {
        // antd เรียกทีละไฟล์ — รวบทั้งชุดตอนไฟล์สุดท้าย แล้วอัปโหลดเอง
        if (file === list[list.length - 1]) void add(list);
        return Upload.LIST_IGNORE;
      }}
    >
      {children}
    </Upload>
  );

  const remove = (path: string) => {
    const next = paths.filter((x) => x !== path);
    setPicked(null);
    return save(next, path === cover ? (next[0] ?? null) : cover, 'ลบรูปแล้ว');
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-border bg-card p-5">
      <span className="flex justify-between gap-3 text-sm">
        <b className="font-semibold">รูปร้าน</b>
        <span className="text-muted tabular-nums">
          {photos.length} / {BAR_GALLERY_MAX} · รูปแรกเป็นปก
        </span>
      </span>

      <Spin spinning={busy} description={progress ?? undefined}>
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 lg:grid-cols-4 lg:auto-rows-[minmax(150px,1fr)] lg:gap-3">
          {Array.from({ length: BAR_GALLERY_MAX }, (_, i) => {
            const p = ordered[i];
            const isCover = i === 0;
            const slot = isCover
              ? 'col-span-3 h-60 sm:h-72 lg:col-span-2 lg:row-span-2 lg:h-auto'
              : 'aspect-square lg:aspect-auto';
            const shape = isCover ? 'rounded-[18px] lg:rounded-2xl' : 'rounded-xl lg:rounded-[14px]';
            if (!p)
              return (
                <li key={`empty-${i}`} className={slot}>
                  {uploader(
                    <span
                      className={`merchant-hatch flex size-full cursor-pointer flex-col justify-end gap-1 border p-2.5 text-muted transition-colors hover:border-gold hover:text-text ${shape} ${
                        isCover ? 'border-2 border-dashed border-gold/60' : 'border-border'
                      } ${i === ordered.length ? '' : 'opacity-80'}`}
                    >
                      {isCover ? (
                        <>
                          <span className="self-start rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold-text">ปก</span>
                          <span className="mt-auto flex items-center gap-2 text-sm text-text">
                            <ImageSquare size={22} className="text-gold-text" aria-hidden /> ยังไม่มีรูปร้าน
                          </span>
                          <span className="text-xs">แตะเพื่อเพิ่ม · รูปแรกจะเป็นปก (ตอนนี้ลูกค้าเห็นรูปแทนของ NightOut)</span>
                        </>
                      ) : (
                        <>
                          {i === ordered.length && <Plus size={18} className="text-gold-text" aria-hidden />}
                        </>
                      )}
                    </span>,
                    'block size-full [&_.ant-upload]:block [&_.ant-upload]:size-full',
                    `เพิ่มรูปช่องที่ ${i + 1}`,
                  )}
                </li>
              );
            const on = selected === p.path;
            return (
              <li key={p.path} className={slot}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={isCover ? `รูปปก ${bar.name}` : `รูปร้านที่ ${i + 1}`}
                  onClick={() => setPicked(on ? null : p.path)}
                  className={`relative block size-full overflow-hidden ${shape} ${
                    isCover ? 'border-2 border-gold' : 'border border-border'
                  } ${on ? 'ring-2 ring-gold ring-offset-2 ring-offset-card' : ''}`}
                >
                  <img src={p.url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                  {isCover && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-on-gold">
                      ปก
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {/* Desktop: ช่องท้ายแถวสุดท้าย (1 รูป + ช่องนี้กว้าง 3) */}
          <li className="hidden flex-col justify-center gap-1 rounded-[14px] border border-dashed border-border p-3 text-xs text-muted lg:col-span-3 lg:flex">
            <b className="text-sm font-medium text-text">{room > 0 ? `ว่างอีก ${room} ช่อง` : 'ครบ 10 รูปแล้ว'}</b>
            ช่องลายแรเงาคือช่องว่าง แตะเพื่อเพิ่มรูป · ตัวอย่างมุมที่ลูกค้าอยากเห็นเขียนไว้ในช่อง
          </li>
        </ul>
      </Spin>

      {ordered.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploader(
            <span
              className={`merchant-pill inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-muted/60 px-3.5 text-sm text-muted ${
                room <= 0 ? 'opacity-50' : 'hover:border-gold hover:text-text'
              }`}
            >
              <UploadSimple /> {room > 0 ? 'เพิ่มรูป' : 'ครบ 10 รูปแล้ว'}
            </span>,
          )}
          <button
            type="button"
            disabled={busy || !selected || selected === cover}
            onClick={() => selected && void save(paths, selected, 'ตั้งเป็นรูปปกแล้ว')}
            className="merchant-pill inline-flex h-9 items-center rounded-xl border border-border px-3.5 text-sm disabled:opacity-40"
          >
            ตั้งเป็นปก
          </button>
          <Popconfirm
            title="ลบรูปนี้?"
            description={selected === cover && ordered.length > 1 ? 'รูปถัดไปจะเป็นรูปปกแทน' : undefined}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            disabled={busy || !selected}
            onConfirm={() => selected && remove(selected)}
          >
            <button
              type="button"
              disabled={busy || !selected}
              className="merchant-pill inline-flex h-9 items-center rounded-xl border border-border px-3.5 text-sm text-(--crowd-full) disabled:opacity-40"
            >
              ลบ
            </button>
          </Popconfirm>
          <span className="self-center text-xs text-muted">{selected ? 'เลือกรูปแล้ว' : 'แตะรูปเพื่อเลือก'}</span>
        </div>
      )}
      <p className="text-xs text-muted">JPG, PNG หรือ WebP ไม่เกิน 15MB ต่อรูป · ใช้รูปบรรยากาศจริง ห้ามมีข้อความชวนดื่ม</p>
    </div>
  );
}
