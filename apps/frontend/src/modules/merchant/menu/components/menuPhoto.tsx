import { ImageSquare, Spinner } from '@phosphor-icons/react';
import { App, Upload } from 'antd';
import { useState } from 'react';
import { PHOTO_ACCEPT, checkPhoto } from '@/ui/utils/media';

interface Props {
  name: string;
  url?: string;
  disabled?: boolean;
  /** ขนาดกรอบ (px) */
  size?: number;
  /** ย่อ + อัปโหลดไฟล์ → คืน path ใน bar-media */
  upload: (file: File) => Promise<string>;
  /** บันทึก path ใหม่ */
  onChange: (path: string) => Promise<void>;
}

/** รูปของรายการเมนู — กดที่รูปเพื่อเพิ่ม/เปลี่ยนได้ทันที (ลบรูปทำในหน้าต่างแก้ไขรายการ) */
export function MenuPhoto({ name, url, disabled, size = 48, upload, onChange }: Props) {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    const err = checkPhoto(file);
    if (err) return void message.error(err);
    setBusy(true);
    try {
      await onChange(await upload(file));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Upload
      accept={PHOTO_ACCEPT}
      showUploadList={false}
      disabled={disabled || busy}
      beforeUpload={(file) => {
        void pick(file);
        return Upload.LIST_IGNORE;
      }}
    >
      <span
        role="button"
        aria-label={`${url ? 'เปลี่ยนรูป' : 'เพิ่มรูป'} ${name}`}
        title={url ? 'เปลี่ยนรูป' : 'เพิ่มรูป'}
        onClick={(e) => e.stopPropagation()}
        className="relative grid shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-border bg-[repeating-linear-gradient(135deg,var(--card)_0_6px,var(--surface)_6px_12px)] text-muted hover:border-gold"
        style={{ width: size, height: size }}
      >
        {url ? <img src={url} alt="" className="absolute inset-0 size-full object-cover" /> : <ImageSquare size={20} />}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/50 text-white">
            <Spinner className="animate-spin" />
          </span>
        )}
      </span>
    </Upload>
  );
}
