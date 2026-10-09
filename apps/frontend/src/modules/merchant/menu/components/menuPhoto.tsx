import { ImageSquare, Trash, UploadSimple } from '@phosphor-icons/react';
import { App, Button, Image, Popconfirm, Spin, Upload } from 'antd';
import { useState } from 'react';
import { PHOTO_ACCEPT, checkPhoto } from '@/ui/utils/media';

interface Props {
  name: string;
  url?: string;
  disabled?: boolean;
  /** ย่อ + อัปโหลดไฟล์ → คืน path ใน bar-media */
  upload: (file: File) => Promise<string>;
  /** บันทึก path ใหม่ (null = ลบรูป) */
  onChange: (path: string | null) => Promise<void>;
}

/** ช่องรูปของรายการเมนูในตาราง — รูปเล็กกดดูเต็ม · เปลี่ยน/ลบได้ทันที */
export function MenuPhoto({ name, url, disabled, upload, onChange }: Props) {
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

  const picker = (label: string) => (
    <Upload
      accept={PHOTO_ACCEPT}
      showUploadList={false}
      disabled={disabled || busy}
      beforeUpload={(file) => {
        void pick(file);
        return Upload.LIST_IGNORE;
      }}
    >
      <Button
        size="small"
        icon={<UploadSimple />}
        disabled={disabled || busy}
        aria-label={`${label} ${name}`}
      >
        {url ? undefined : label}
      </Button>
    </Upload>
  );

  return (
    <Spin spinning={busy} size="small">
      <div className="flex items-center gap-2">
        {url ? (
          <Image src={url} alt={name} width={48} height={48} className="rounded-lg object-cover" />
        ) : (
          <span
            className="grid size-12 place-items-center rounded-lg border border-dashed border-border text-muted"
            aria-hidden
          >
            <ImageSquare size={20} />
          </span>
        )}
        {picker(url ? 'เปลี่ยนรูป' : 'เพิ่มรูป')}
        {url && (
          <Popconfirm
            title="ลบรูปเมนูนี้?"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={() => onChange(null)}
          >
            <Button
              size="small"
              danger
              icon={<Trash />}
              disabled={disabled || busy}
              aria-label={`ลบรูป ${name}`}
            />
          </Popconfirm>
        )}
      </div>
    </Spin>
  );
}
