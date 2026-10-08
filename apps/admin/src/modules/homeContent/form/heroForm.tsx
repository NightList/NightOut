import { ArrowCounterClockwise, Camera } from '@phosphor-icons/react';
import type { UpdateHomeContentBody } from '@nightout/contracts';
import type { Db } from '@nightout/types';
import { App, Button, Card, Divider, Form, Input, Typography, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { useAdminAction } from '@/services/adminData';
import { webSrc } from '@/ui/utils/image';
import { checkImage, IMAGE_ACCEPT, uploadSiteImage } from '../utils/media';

type Values = Omit<Db.AdminHomeContent, 'updated_at'>;

/** ภาพตั้งต้นของ Hero (ไฟล์ใน public/ ของเว็บลูกค้า) — ใช้เมื่อ hero_image_url = null */
const DEFAULT_HERO = '/images/home/hero-night-1280.jpg';

/**
 * Hero ของหน้าแรก + ชื่อ section หมวด — บันทึกครั้งเดียวทั้งฟอร์ม (PATCH /admin/home-content)
 * ภาพอัปโหลดทันทีที่เลือก แต่ยังไม่ขึ้นเว็บจนกด "บันทึก"
 */
export function HeroForm({ content }: { content: Db.AdminHomeContent | undefined }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const act = useAdminAction();
  const [uploading, setUploading] = useState(false);
  const image = Form.useWatch('hero_image_url', form);
  const lead = Form.useWatch('hero_title_lead', form);
  const highlight = Form.useWatch('hero_title_highlight', form);
  const tail = Form.useWatch('hero_title_tail', form);

  useEffect(() => {
    if (content) form.setFieldsValue(content);
  }, [content, form]);

  const pick = async (file: File) => {
    const err = checkImage(file);
    if (err) return void message.error(err);
    setUploading(true);
    try {
      form.setFieldValue('hero_image_url', await uploadSiteImage(file, 'hero'));
    } catch (e) {
      void message.error(`อัปโหลดรูปไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    let v: Values;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    const body: UpdateHomeContentBody = {
      hero_title_lead: v.hero_title_lead.trim(),
      hero_title_highlight: v.hero_title_highlight.trim(),
      hero_title_tail: v.hero_title_tail?.trim() ?? '',
      hero_subtitle: v.hero_subtitle?.trim() ?? '',
      hero_search_placeholder: v.hero_search_placeholder.trim(),
      hero_image_url: v.hero_image_url || null,
      categories_eyebrow: v.categories_eyebrow?.trim() ?? '',
      categories_title: v.categories_title.trim(),
    };
    await act
      .mutateAsync({ method: 'PATCH', path: 'home-content', body, success: 'บันทึกหน้าแรกแล้ว' })
      .catch(() => undefined); // useAdminAction แจ้งเหตุผลแล้ว
  };

  return (
    <Card
      title="Hero และหัวข้อ"
      loading={!content}
      extra={
        <Button type="primary" loading={act.isPending} disabled={uploading} onClick={() => void save()}>
          บันทึก
        </Button>
      }
    >
      <Form<Values> form={form} layout="vertical" disabled={act.isPending}>
        <Form.Item name="hero_image_url" hidden>
          <Input />
        </Form.Item>

        {/* ตัวอย่างคร่าว ๆ ของ Hero บนเว็บ */}
        <div
          className="relative mb-4 flex aspect-[16/6] items-center justify-center overflow-hidden rounded-lg bg-[#07070d] bg-cover bg-center px-4 text-center"
          style={{ backgroundImage: `url("${webSrc(image || DEFAULT_HERO)}")` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <p className="relative flex items-end gap-2 font-bold leading-none text-white">
            <span className="text-lg">{lead}</span>
            <span className="text-5xl text-[#e8b64c]">{highlight}</span>
            {tail && <span className="text-lg">{tail}</span>}
          </p>
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Upload
            accept={IMAGE_ACCEPT}
            showUploadList={false}
            beforeUpload={(f) => {
              void pick(f);
              return false;
            }}
          >
            <Button icon={<Camera size={16} />} loading={uploading}>
              เปลี่ยนภาพพื้น
            </Button>
          </Upload>
          {image && (
            <Button
              icon={<ArrowCounterClockwise size={16} />}
              onClick={() => form.setFieldValue('hero_image_url', null)}
            >
              ใช้ภาพตั้งต้น
            </Button>
          )}
          <Typography.Text type="secondary" className="text-xs">
            ภาพแนวนอน 16:9 โทนมืด · ระบบย่อเป็น 2560px ให้เอง · ภาพตั้งต้นมีดาว/ไฟตึกระยิบ ภาพที่อัปโหลดจะเป็นภาพนิ่ง
          </Typography.Text>
        </div>

        <div className="grid gap-x-4 sm:grid-cols-3">
          <Form.Item name="hero_title_lead" label="คำหน้า" rules={[{ required: true, whitespace: true, message: 'กรอกคำหน้า' }]}>
            <Input maxLength={20} placeholder="คืนนี้ไป" />
          </Form.Item>
          <Form.Item
            name="hero_title_highlight"
            label="คำกลาง (ตัวใหญ่สีทอง)"
            rules={[{ required: true, whitespace: true, message: 'กรอกคำกลาง' }]}
          >
            <Input maxLength={20} placeholder="ร้านไหน" />
          </Form.Item>
          <Form.Item name="hero_title_tail" label="คำท้าย">
            <Input maxLength={20} placeholder="ดี (เว้นว่างได้)" />
          </Form.Item>
        </div>
        <Form.Item name="hero_subtitle" label="คำโปรยใต้หัวข้อ">
          <Input.TextArea rows={2} maxLength={160} showCount />
        </Form.Item>
        <Form.Item
          name="hero_search_placeholder"
          label="ข้อความในช่องค้นหา"
          rules={[{ required: true, whitespace: true, message: 'กรอกข้อความในช่องค้นหา' }]}
        >
          <Input maxLength={60} />
        </Form.Item>

        <Divider titlePlacement="start" plain>
          Section การ์ดหมวด
        </Divider>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item name="categories_eyebrow" label="บรรทัดเล็กเหนือชื่อ" className="!mb-0">
            <Input maxLength={40} placeholder="เลือกตามสไตล์ (เว้นว่างได้)" />
          </Form.Item>
          <Form.Item
            name="categories_title"
            label="ชื่อ section"
            className="!mb-0"
            rules={[{ required: true, whitespace: true, message: 'กรอกชื่อ section' }]}
          >
            <Input maxLength={60} placeholder="คืนนี้อยากได้ฟีลไหน" />
          </Form.Item>
        </div>
      </Form>
    </Card>
  );
}
