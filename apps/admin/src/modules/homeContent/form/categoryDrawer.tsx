import { Camera } from '@phosphor-icons/react';
import { HOME_CATEGORY_ICON_KEYS, type UpdateHomeCategoryBody } from '@nightout/contracts';
import type { Db } from '@nightout/types';
import { HOME_CATEGORY_ICONS } from '@nightout/ui';
import { App, Button, Drawer, Form, Input, Select, Typography, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { useAdminAction } from '@/services/adminData';
import { webSrc } from '@/ui/utils/image';
import { SLOT_LABELS } from '../utils/slots';
import { checkImage, IMAGE_ACCEPT, uploadSiteImage } from '../utils/media';

type Values = Pick<Db.AdminHomeCategory, 'title' | 'hint' | 'link_to' | 'icon' | 'image_url' | 'badge'>;

const ICON_OPTIONS = HOME_CATEGORY_ICON_KEYS.map((key) => {
  const { icon: Icon, label } = HOME_CATEGORY_ICONS[key]!;
  return {
    value: key,
    label: (
      <span className="inline-flex items-center gap-2">
        <Icon size={16} weight="duotone" />
        {label}
      </span>
    ),
  };
});

/** แก้การ์ดหมวด 1 ช่อง (PATCH /admin/home-categories/:slot) — ตำแหน่งบนกริดตายตัว แก้ได้เฉพาะเนื้อหา */
export function CategoryDrawer({ category, onClose }: { category: Db.AdminHomeCategory | null; onClose: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const act = useAdminAction();
  const [uploading, setUploading] = useState(false);
  const image = Form.useWatch('image_url', form);

  useEffect(() => {
    if (!category) return;
    form.resetFields();
    form.setFieldsValue(category);
  }, [category, form]);

  const pick = async (file: File) => {
    const err = checkImage(file);
    if (err) return void message.error(err);
    setUploading(true);
    try {
      form.setFieldValue('image_url', await uploadSiteImage(file, 'category'));
    } catch (e) {
      void message.error(`อัปโหลดรูปไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!category) return;
    let v: Values;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    const body: UpdateHomeCategoryBody = {
      title: v.title.trim(),
      hint: v.hint?.trim() ?? '',
      link_to: v.link_to.trim(),
      icon: v.icon as UpdateHomeCategoryBody['icon'],
      image_url: v.image_url,
      badge: v.badge?.trim() || null,
    };
    try {
      await act.mutateAsync({
        method: 'PATCH',
        path: `home-categories/${category.slot}`,
        body,
        success: `บันทึกการ์ด${body.title}แล้ว`,
      });
      onClose();
    } catch {
      // useAdminAction แจ้งเหตุผลแล้ว — เปิดฟอร์มค้างไว้ให้แก้ต่อ
    }
  };

  return (
    <Drawer
      open={!!category}
      onClose={onClose}
      size={480}
      destroyOnHidden
      title={category ? `แก้การ์ด · ${SLOT_LABELS[category.slot] ?? category.slot}` : ''}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button type="primary" loading={act.isPending} disabled={uploading} onClick={() => void save()}>
            บันทึก
          </Button>
        </div>
      }
    >
      <Form<Values> form={form} layout="vertical" disabled={act.isPending}>
        <Form.Item name="image_url" hidden rules={[{ required: true, message: 'ต้องมีภาพ' }]}>
          <Input />
        </Form.Item>
        <div className="mb-6">
          <div
            className="mb-2 aspect-[16/10] w-full rounded-lg bg-[#14121c] bg-cover bg-center"
            style={image ? { backgroundImage: `url("${webSrc(image)}")` } : undefined}
            role="img"
            aria-label="ภาพพื้นการ์ด"
          />
          <Upload
            accept={IMAGE_ACCEPT}
            showUploadList={false}
            beforeUpload={(f) => {
              void pick(f);
              return false;
            }}
          >
            <Button icon={<Camera size={16} />} loading={uploading}>
              เปลี่ยนภาพ
            </Button>
          </Upload>
          <Typography.Text type="secondary" className="mt-1 block text-xs">
            ภาพคน/บรรยากาศร้าน โทนมืด ตัวหนังสือสีขาวอยู่มุมล่างซ้าย · ระบบย่อเป็น 1280px ให้เอง
          </Typography.Text>
        </div>

        <Form.Item name="title" label="ชื่อหมวด" rules={[{ required: true, whitespace: true, message: 'กรอกชื่อหมวด' }]}>
          <Input maxLength={30} />
        </Form.Item>
        <Form.Item name="hint" label="คำอธิบายสั้น">
          <Input maxLength={60} />
        </Form.Item>
        <Form.Item name="icon" label="ไอคอน" rules={[{ required: true }]}>
          <Select options={ICON_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="link_to"
          label="ลิงก์เมื่อกดการ์ด"
          extra="ลิงก์ในเว็บ เช่น /ranking, /search?category=PUB_BAR, /search?style=Rooftop"
          rules={[
            { required: true, message: 'กรอกลิงก์' },
            { pattern: /^\/(?!\/)\S*$/, message: 'ต้องขึ้นต้นด้วย / และไม่มีช่องว่าง' },
          ]}
        >
          <Input maxLength={300} />
        </Form.Item>
        <Form.Item name="badge" label="ป้ายเหนือชื่อ" extra="เว้นว่าง = ไม่มีป้าย" className="!mb-0">
          <Input maxLength={30} placeholder="เช่น อันดับประจำสัปดาห์" allowClear />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
