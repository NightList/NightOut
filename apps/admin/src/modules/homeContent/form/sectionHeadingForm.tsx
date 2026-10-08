import type { UpdateHomeContentBody } from '@nightout/contracts';
import type { Db } from '@nightout/types';
import { Button, Form, Input } from 'antd';
import { useEffect } from 'react';
import { useAdminAction } from '@/services/adminData';
import { homeContentAction } from '../api';

/** คู่คอลัมน์หัวข้อ section ใน home_content (บรรทัดเล็ก + ชื่อ) */
export type SectionHeadingFields =
  | { eyebrow: 'categories_eyebrow'; title: 'categories_title' }
  | { eyebrow: 'popular_eyebrow'; title: 'popular_title' };

interface Values {
  eyebrow: string;
  title: string;
}

/**
 * หัวข้อของ section บนหน้าแรก (บรรทัดเล็กเหนือชื่อ + ชื่อ section) — วางไว้ใน Card ของ section นั้น ไม่ปนกับฟอร์ม Hero
 * บันทึกแยกด้วย PATCH /admin/home-content ส่งเฉพาะ 2 คอลัมน์นี้ · ปุ่มบันทึกกดได้เมื่อแก้ค่าแล้ว
 */
export function SectionHeadingForm({
  content,
  fields,
  placeholders,
}: {
  content: Db.AdminHomeContent | undefined;
  fields: SectionHeadingFields;
  placeholders: Values;
}) {
  const [form] = Form.useForm<Values>();
  const act = useAdminAction();
  const eyebrow = Form.useWatch('eyebrow', form);
  const title = Form.useWatch('title', form);
  const savedEyebrow = content?.[fields.eyebrow];
  const savedTitle = content?.[fields.title];
  const dirty = !!content && ((eyebrow ?? '') !== savedEyebrow || (title ?? '') !== savedTitle);

  useEffect(() => {
    if (savedTitle !== undefined) form.setFieldsValue({ eyebrow: savedEyebrow, title: savedTitle });
  }, [savedEyebrow, savedTitle, form]);

  const save = async () => {
    let v: Values;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    const body: UpdateHomeContentBody = { [fields.eyebrow]: v.eyebrow?.trim() ?? '', [fields.title]: v.title.trim() };
    await act
      .mutateAsync({ ...homeContentAction(body), success: 'บันทึกหัวข้อแล้ว' })
      .catch(() => undefined); // useAdminAction แจ้งเหตุผลแล้ว
  };

  return (
    <Form<Values>
      form={form}
      layout="vertical"
      disabled={!content || act.isPending}
      className="mb-5 grid items-end gap-x-4 sm:grid-cols-[1fr_1fr_auto]"
      onFinish={() => void save()}
    >
      <Form.Item name="eyebrow" label="บรรทัดเล็กเหนือชื่อ" className="!mb-3 sm:!mb-0">
        <Input maxLength={40} placeholder={`${placeholders.eyebrow} (เว้นว่างได้)`} />
      </Form.Item>
      <Form.Item
        name="title"
        label="ชื่อ section"
        className="!mb-3 sm:!mb-0"
        rules={[{ required: true, whitespace: true, message: 'กรอกชื่อ section' }]}
      >
        <Input maxLength={60} placeholder={placeholders.title} />
      </Form.Item>
      <Button htmlType="submit" loading={act.isPending} disabled={!dirty}>
        บันทึกหัวข้อ
      </Button>
    </Form>
  );
}
