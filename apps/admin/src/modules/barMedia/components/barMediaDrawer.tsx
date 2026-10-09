import {
  ArrowSquareOut,
  ImageSquare,
  Plus,
  Star,
  Trash,
  UploadSimple,
} from '@phosphor-icons/react';
import { BAR_GALLERY_MAX } from '@nightout/contracts';
import type { Db } from '@nightout/types';
import { App, Button, Drawer, Empty, Image, Popconfirm, Spin, Typography, Upload } from 'antd';
import { useState, type ReactNode } from 'react';
import { useAdminAction } from '@/services/adminData';
import { StatusTag } from '@/ui/components/StatusTag';
import { webSrc } from '@/ui/utils/image';
import { BAR_STATUS } from '@/ui/utils/labels';
import { barMediaAction, menuItemImageAction, uploadBarImage } from '../api';
import { coverFirst } from '@nightout/utils';
import { IMAGE_ACCEPT, checkImage, coverPathOf, mediaUrl } from '../utils/media';

/**
 * จัดการรูปของร้านเดียว — ปก + แกลเลอรี (สูงสุด 10) และรูปเมนูทีละรายการ
 * ทุกการกระทำบันทึกทันที (audit log + แจ้งทีมร้าน) · ไฟล์ที่เอาออก backend ลบจาก Storage ให้
 */
export function BarMediaDrawer({
  bar,
  onClose,
}: {
  bar: Db.AdminBarMedia | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={!!bar}
      onClose={onClose}
      size={720}
      destroyOnHidden
      title={
        bar && (
          <span className="flex flex-wrap items-center gap-2">
            {bar.name}
            <StatusTag map={BAR_STATUS} value={bar.status} />
          </span>
        )
      }
      extra={
        bar && (
          <Button
            href={webSrc(`/bars/${bar.slug}`)}
            target="_blank"
            rel="noreferrer"
            icon={<ArrowSquareOut size={16} />}
          >
            ดูหน้าร้าน
          </Button>
        )
      }
    >
      {bar && (
        <div className="space-y-8">
          <Gallery bar={bar} />
          <MenuPhotos bar={bar} />
        </div>
      )}
    </Drawer>
  );
}

function Gallery({ bar }: { bar: Db.AdminBarMedia }) {
  const { message } = App.useApp();
  const act = useAdminAction();
  const [uploading, setUploading] = useState<string | null>(null);
  const cover = coverPathOf(bar);
  const paths = coverFirst(
    bar.media.map((m) => m.storage_path),
    cover,
  );
  const room = BAR_GALLERY_MAX - paths.length;
  const busy = act.isPending || uploading !== null;

  const save = async (next: string[], nextCover: string | null, success: string) => {
    try {
      await act.mutateAsync({
        ...barMediaAction(bar.id, { paths: coverFirst(next, nextCover), cover_path: nextCover }),
        success,
      });
    } catch {
      // useAdminAction แจ้งเหตุผลแล้ว
    }
  };

  const add = async (files: File[]) => {
    files.map(checkImage).forEach((m) => m && void message.error(m));
    let ok = files.filter((f) => !checkImage(f));
    if (ok.length > room) {
      void message.warning(`เพิ่มได้อีก ${room} รูป — ใช้ ${room} รูปแรกที่เลือก`);
      ok = ok.slice(0, room);
    }
    const added: string[] = [];
    for (const [i, f] of ok.entries()) {
      setUploading(`กำลังอัปโหลด ${i + 1}/${ok.length}`);
      try {
        added.push(await uploadBarImage(bar.id, 'gallery', f));
      } catch (e) {
        void message.error(`${f.name}: อัปโหลดไม่สำเร็จ — ${(e as Error).message}`);
      }
    }
    setUploading(null);
    if (added.length)
      await save(
        [...paths, ...added],
        cover ?? added[0] ?? null,
        `เพิ่มรูปแล้ว ${added.length} รูป`,
      );
  };

  const uploader = (children: ReactNode) => (
    <Upload
      accept={IMAGE_ACCEPT}
      multiple
      showUploadList={false}
      disabled={busy}
      className="block size-full [&_.ant-upload]:block [&_.ant-upload]:size-full"
      beforeUpload={(file, list) => {
        if (file === list[list.length - 1]) void add(list);
        return Upload.LIST_IGNORE;
      }}
    >
      {children}
    </Upload>
  );

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <Typography.Title level={5} className="!m-0">
          ปก + แกลเลอรี
        </Typography.Title>
        <span className="text-xs tabular-nums opacity-70">
          {paths.length}/{BAR_GALLERY_MAX} รูป
        </span>
      </div>
      <Spin spinning={busy} description={uploading ?? undefined}>
        <Image.PreviewGroup>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {paths.map((p, i) => {
              const isCover = p === cover;
              return (
                <li
                  key={p}
                  className={`relative overflow-hidden rounded-lg border ${isCover ? 'col-span-2 border-(--gold) sm:row-span-2' : 'border-black/10 dark:border-white/10'}`}
                >
                  <Image
                    src={mediaUrl(p)}
                    alt={isCover ? `รูปปก ${bar.name}` : `รูปร้าน ${bar.name} ที่ ${i + 1}`}
                    rootClassName="!block size-full"
                    className={`!block w-full object-cover ${isCover ? 'aspect-[16/10] sm:!h-full sm:aspect-auto' : 'aspect-[4/3]'}`}
                  />
                  {isCover && (
                    <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-xs text-(--gold)">
                      <Star weight="fill" size={12} aria-hidden /> รูปปก
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-linear-to-t from-black/70 to-transparent p-2 pt-6">
                    {!isCover && (
                      <Button
                        size="small"
                        icon={<Star size={14} />}
                        disabled={busy}
                        onClick={() => void save(paths, p, 'ตั้งเป็นรูปปกแล้ว')}
                      >
                        ตั้งเป็นปก
                      </Button>
                    )}
                    <Popconfirm
                      title="ลบรูปนี้ออกจากร้าน?"
                      description={
                        isCover && paths.length > 1
                          ? 'รูปถัดไปจะเป็นรูปปกแทน · ทีมร้านได้รับแจ้งเตือน'
                          : 'ทีมร้านได้รับแจ้งเตือน'
                      }
                      okText="ลบ"
                      cancelText="ยกเลิก"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => {
                        const next = paths.filter((x) => x !== p);
                        return save(next, isCover ? (next[0] ?? null) : cover, 'ลบรูปแล้ว');
                      }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<Trash size={14} />}
                        disabled={busy}
                        aria-label="ลบรูป"
                      />
                    </Popconfirm>
                  </div>
                </li>
              );
            })}
            {room > 0 && (
              <li
                className={
                  paths.length
                    ? 'aspect-[4/3]'
                    : 'col-span-2 aspect-[16/10] sm:col-span-3 sm:aspect-[3/1]'
                }
              >
                {uploader(
                  <span className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/20 text-sm opacity-80 transition-opacity hover:opacity-100 dark:border-white/20">
                    <Plus size={22} aria-hidden />
                    {paths.length ? 'เพิ่มรูป' : 'ร้านยังไม่มีรูป — อัปโหลดแทนร้าน (รูปแรกเป็นปก)'}
                    <span className="text-xs opacity-70">เหลือ {room} รูป</span>
                  </span>,
                )}
              </li>
            )}
          </ul>
        </Image.PreviewGroup>
      </Spin>
      <Typography.Text type="secondary" className="mt-2 block text-xs">
        ปกใช้บนการ์ดร้าน แผนที่ และหัวหน้าร้าน · JPG/PNG/WebP ไม่เกิน 15MB (ย่อเป็น 1920px ให้เอง)
      </Typography.Text>
    </section>
  );
}

function MenuPhotos({ bar }: { bar: Db.AdminBarMedia }) {
  const { message } = App.useApp();
  const act = useAdminAction();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const busy = act.isPending || uploadingId !== null;

  const set = async (item: Db.AdminBarMedia['menu'][number], path: string | null) => {
    try {
      await act.mutateAsync({
        ...menuItemImageAction(item.id, { path }),
        success: path ? `บันทึกรูป ${item.name} แล้ว` : `ลบรูป ${item.name} แล้ว`,
      });
    } catch {
      // useAdminAction แจ้งเหตุผลแล้ว
    }
  };

  const pick = async (item: Db.AdminBarMedia['menu'][number], file: File) => {
    const err = checkImage(file);
    if (err) return void message.error(err);
    setUploadingId(item.id);
    try {
      const path = await uploadBarImage(bar.id, 'menu', file);
      setUploadingId(null);
      await set(item, path);
    } catch (e) {
      setUploadingId(null);
      void message.error(`อัปโหลดไม่สำเร็จ: ${(e as Error).message}`);
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <Typography.Title level={5} className="!m-0">
          รูปเมนู
        </Typography.Title>
        <span className="text-xs tabular-nums opacity-70">
          มีรูป {bar.menu_image_count}/{bar.menu.length} รายการ
        </span>
      </div>
      {bar.menu.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="ร้านยังไม่มีเมนู — ร้านเพิ่มรายการได้ที่หน้าเมนูของร้าน"
        />
      ) : (
        <Image.PreviewGroup>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {bar.menu.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2">
                <Spin spinning={uploadingId === m.id} size="small">
                  {m.image_path ? (
                    <Image
                      src={mediaUrl(m.image_path)}
                      alt={m.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <span
                      className="grid size-12 place-items-center rounded-md border border-dashed border-black/20 opacity-60 dark:border-white/20"
                      aria-hidden
                    >
                      <ImageSquare size={20} />
                    </span>
                  )}
                </Spin>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{m.name}</div>
                  <div className="text-xs opacity-60">{m.category ?? '-'}</div>
                </div>
                <Upload
                  accept={IMAGE_ACCEPT}
                  showUploadList={false}
                  disabled={busy}
                  beforeUpload={(f) => {
                    void pick(m, f);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button size="small" icon={<UploadSimple size={14} />} disabled={busy}>
                    {m.image_path ? 'เปลี่ยน' : 'เพิ่มรูป'}
                  </Button>
                </Upload>
                {m.image_path && (
                  <Popconfirm
                    title={`ลบรูป ${m.name}?`}
                    description="ทีมร้านได้รับแจ้งเตือน"
                    okText="ลบ"
                    cancelText="ยกเลิก"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => set(m, null)}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<Trash size={14} />}
                      disabled={busy}
                      aria-label={`ลบรูป ${m.name}`}
                    />
                  </Popconfirm>
                )}
              </li>
            ))}
          </ul>
        </Image.PreviewGroup>
      )}
    </section>
  );
}
