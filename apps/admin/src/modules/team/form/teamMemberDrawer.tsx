import { Camera, Trash, UserCircle } from '@phosphor-icons/react';
import type { Db } from '@nightout/types';
import {
  App,
  Avatar,
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Typography,
  Upload,
} from 'antd';
import { useEffect, useState } from 'react';
import { useAdminAction } from '@/services/adminData';
import { CONTACT_FIELDS } from '../utils/contacts';
import { photoSrc, uploadTeamPhoto } from '../utils/photo';

interface Values {
  nickname: string;
  full_name?: string;
  roles: string[];
  skills: string[];
  bio?: string;
  photo_url?: string | null;
  contacts: Db.TeamContacts;
  active: boolean;
}

/** ค่าในฟอร์ม → body ของ API (ช่องว่าง = null / ไม่ส่ง · ช่องทางติดต่อที่ว่างตัดทิ้ง) */
function toBody(v: Values) {
  const contacts = Object.fromEntries(
    Object.entries(v.contacts ?? {})
      .map(([k, val]) => [k, String(val ?? '').trim()])
      .filter(([, val]) => val !== ''),
  );
  return {
    nickname: v.nickname.trim(),
    full_name: v.full_name?.trim() || null,
    roles: v.roles ?? [],
    skills: v.skills ?? [],
    bio: v.bio?.trim() || null,
    photo_url: v.photo_url || null,
    contacts,
    active: v.active,
  };
}

const MAX_PHOTO = 10 * 1024 * 1024;

/**
 * เพิ่ม / แก้ทีมงาน 1 คน — member = null คือเพิ่มใหม่
 * รูปย่อเป็น webp แล้วอัปโหลดเข้า team-photos ทันทีที่เลือก (ยังไม่บันทึกจนกด "บันทึก")
 */
export function TeamMemberDrawer({
  open,
  member,
  onClose,
}: {
  open: boolean;
  member: Db.AdminTeamMember | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const act = useAdminAction();
  const [uploading, setUploading] = useState(false);
  const photo = Form.useWatch('photo_url', form);
  const nickname = Form.useWatch('nickname', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      member
        ? {
            nickname: member.nickname,
            full_name: member.full_name ?? undefined,
            roles: member.roles,
            skills: member.skills,
            bio: member.bio ?? undefined,
            photo_url: member.photo_url,
            contacts: member.contacts ?? {},
            active: member.active,
          }
        : { roles: [], skills: [], contacts: {}, active: true, photo_url: null },
    );
  }, [open, member, form]);

  const pickPhoto = async (file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      void message.error('ใช้ได้เฉพาะรูป JPG, PNG หรือ WebP');
      return;
    }
    if (file.size > MAX_PHOTO) {
      void message.error('รูปใหญ่เกิน 10MB');
      return;
    }
    setUploading(true);
    try {
      form.setFieldValue('photo_url', await uploadTeamPhoto(file));
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
      return; // ช่องที่ผิดแสดงข้อความใต้ช่องแล้ว
    }
    const body = toBody(v);
    try {
      await act.mutateAsync(
        member
          ? {
              method: 'PATCH',
              path: `team-members/${member.id}`,
              body,
              success: `บันทึกข้อมูล${body.nickname}แล้ว`,
            }
          : { method: 'POST', path: 'team-members', body, success: `เพิ่ม${body.nickname}แล้ว` },
      );
      onClose();
    } catch {
      // useAdminAction แจ้งเหตุผลเป็นภาษาไทยแล้ว — เปิดฟอร์มค้างไว้ให้แก้ต่อ
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={520}
      destroyOnHidden
      title={member ? `แก้ข้อมูล ${member.nickname}` : 'เพิ่มทีมงาน'}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            type="primary"
            loading={act.isPending}
            disabled={uploading}
            onClick={() => void save()}
          >
            {member ? 'บันทึก' : 'เพิ่มทีมงาน'}
          </Button>
        </div>
      }
    >
      <Form<Values> form={form} layout="vertical" disabled={act.isPending}>
        <Form.Item name="photo_url" hidden>
          <Input />
        </Form.Item>
        <div className="mb-6 flex items-center gap-4">
          <Avatar
            size={88}
            src={photoSrc(photo)}
            icon={<UserCircle size={56} weight="thin" />}
            alt={nickname ? `รูปของ ${nickname}` : 'รูปโปรไฟล์'}
            className="shrink-0"
          />
          <div className="space-y-2">
            <Space wrap>
              <Upload
                accept="image/jpeg,image/png,image/webp"
                showUploadList={false}
                beforeUpload={(f) => {
                  void pickPhoto(f);
                  return false;
                }}
              >
                <Button icon={<Camera size={16} />} loading={uploading}>
                  {photo ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
                </Button>
              </Upload>
              {photo && (
                <Button
                  icon={<Trash size={16} />}
                  onClick={() => form.setFieldValue('photo_url', null)}
                >
                  เอารูปออก
                </Button>
              )}
            </Space>
            <Typography.Text type="secondary" className="block text-xs">
              รูปแนวตั้งหรือจัตุรัส เห็นหน้าชัด · ระบบย่อเป็น 800px ให้เอง
            </Typography.Text>
          </div>
        </div>

        <Form.Item
          name="nickname"
          label="ชื่อเล่น"
          tooltip="ชื่อที่แสดงบนการ์ดในหน้าเกี่ยวกับเรา"
          rules={[{ required: true, whitespace: true, message: 'กรอกชื่อเล่น' }, { max: 40 }]}
        >
          <Input placeholder="เช่น แสน" maxLength={40} />
        </Form.Item>
        <Form.Item name="full_name" label="ชื่อจริง" rules={[{ max: 80 }]}>
          <Input placeholder="แสดงในแผงโปรไฟล์" maxLength={80} />
        </Form.Item>
        <Form.Item
          name="roles"
          label="ตำแหน่ง"
          extra="ตำแหน่งแรกคือตำแหน่งหลัก (สีทองบนการ์ด) · พิมพ์แล้วกด Enter · สูงสุด 6"
          rules={[{ type: 'array', max: 6, message: 'ใส่ได้สูงสุด 6 ตำแหน่ง' }]}
        >
          <Select
            mode="tags"
            tokenSeparators={[',']}
            placeholder="เช่น Founder, Fullstack Developer"
            open={false}
            maxCount={6}
          />
        </Form.Item>
        <Form.Item name="bio" label="แนะนำตัว" rules={[{ max: 1000 }]}>
          <Input.TextArea
            rows={4}
            showCount
            maxLength={1000}
            placeholder="เล่าสั้นๆ ว่าทำอะไรในทีม"
          />
        </Form.Item>
        <Form.Item
          name="skills"
          label="ทักษะ"
          extra="พิมพ์แล้วกด Enter · สูงสุด 20"
          rules={[{ type: 'array', max: 20, message: 'ใส่ได้สูงสุด 20 ทักษะ' }]}
        >
          <Select
            mode="tags"
            tokenSeparators={[',']}
            placeholder="เช่น React, NestJS"
            open={false}
            maxCount={20}
          />
        </Form.Item>

        <Divider titlePlacement="start" plain>
          ช่องทางติดต่อ
        </Divider>
        <Typography.Paragraph type="secondary" className="!-mt-2 text-xs">
          เว้นว่างช่องที่ไม่มี — ไอคอนนั้นจะไม่แสดงบนหน้าเว็บ
        </Typography.Paragraph>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map((f) => (
            <Form.Item
              key={f.key}
              name={['contacts', f.key]}
              label={f.label}
              rules={
                f.kind === 'url'
                  ? [
                      {
                        pattern: /^https:\/\/\S+\.\S+/,
                        message: 'ต้องเป็นลิงก์เต็มที่ขึ้นต้นด้วย https://',
                      },
                    ]
                  : f.kind === 'email'
                    ? [{ type: 'email', message: 'อีเมลไม่ถูกต้อง' }]
                    : f.kind === 'phone'
                      ? [{ pattern: /^[0-9+\-\s()]{6,20}$/, message: 'เบอร์โทรไม่ถูกต้อง' }]
                      : [{ max: 120 }]
              }
            >
              <Input
                placeholder={f.placeholder}
                inputMode={f.kind === 'phone' ? 'tel' : f.kind === 'email' ? 'email' : undefined}
                allowClear
              />
            </Form.Item>
          ))}
        </div>

        <Divider />
        <Form.Item
          name="active"
          label="แสดงบนหน้าเกี่ยวกับเรา"
          valuePropName="checked"
          className="!mb-0"
        >
          <Switch checkedChildren="แสดง" unCheckedChildren="ซ่อน" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
