import { Plus, TrashIcon } from '@phosphor-icons/react';
import { type MenuItem } from '@/services/data';
import { setMenu, uploadMenuPhoto } from './api';
import { MenuPhoto } from './components/menuPhoto';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Upload,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/ui/components/pageHeader';
import { baht } from '@/ui/utils/format';
import { PHOTO_ACCEPT, checkPhoto } from '@/ui/utils/media';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const CATS: MenuItem['category'][] = ['เครื่องดื่ม', 'มิกเซอร์', 'อาหาร', 'ของทานเล่น'];

export function MerchantMenuPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<Omit<MenuItem, 'id' | 'available'>>();
  const [saving, setSaving] = useState(false);
  // รูปของรายการใหม่ — อัปโหลดตอนกด "เพิ่ม"
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const newPhotoUrl = useObjectUrl(newPhoto);
  const save = async (menu: MenuItem[], done = 'บันทึกเมนูแล้ว') => {
    setSaving(true);
    try {
      await setMenu(bar.id, menu);
      message.success(done);
      return true;
    } catch (e) {
      message.error((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };
  const closeAdd = () => {
    form.resetFields();
    setNewPhoto(null);
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="เมนู"
        subtitle="ราคาเมนูใช้ในตัวประเมินราคาของลูกค้า"
        extra={
          <Button type="primary" icon={<Plus />} onClick={() => setOpen(true)}>
            เพิ่มรายการ
          </Button>
        }
      />
      <Card>
        <Table
          rowKey="id"
          loading={saving}
          dataSource={bar.menu}
          pagination={false}
          scroll={{ x: 760 }}
          columns={[
            {
              title: 'รูป',
              key: 'photo',
              width: 150,
              render: (_, r) => (
                <MenuPhoto
                  name={r.name}
                  url={r.imageUrl}
                  disabled={saving}
                  upload={(f) => uploadMenuPhoto(bar.id, f)}
                  onChange={async (imagePath) => {
                    await save(
                      bar.menu.map((m) => (m.id === r.id ? { ...m, imagePath: imagePath ?? undefined } : m)),
                      imagePath ? 'บันทึกรูปเมนูแล้ว' : 'ลบรูปเมนูแล้ว',
                    );
                  }}
                />
              ),
            },
            {
              title: 'หมวด',
              dataIndex: 'category',
              filters: CATS.map((c) => ({ text: c, value: c })),
              onFilter: (v, r) => r.category === v,
            },
            { title: 'รายการ', dataIndex: 'name' },
            {
              title: 'ราคา',
              dataIndex: 'price',
              render: (v: number, r) => (
                <InputNumber
                  min={0}
                  defaultValue={v}
                  formatter={(x) => `${x}`}
                  onBlur={(e) => {
                    const price = Number(e.target.value);
                    if (price !== v)
                      void save(bar.menu.map((m) => (m.id === r.id ? { ...m, price } : m)));
                  }}
                  suffix="฿"
                />
              ),
            },
            {
              title: 'มีขาย',
              dataIndex: 'available',
              render: (v: boolean, r) => (
                <Switch
                  checked={v}
                  loading={saving}
                  onChange={(available) =>
                    void save(bar.menu.map((m) => (m.id === r.id ? { ...m, available } : m)))
                  }
                />
              ),
            },
            {
              title: '',
              key: 'd',
              render: (_, r) => (
                <Popconfirm
                  title="ลบรายการนี้?"
                  okText="ลบ"
                  cancelText="ยกเลิก"
                  onConfirm={() =>
                    save(
                      bar.menu.filter((m) => m.id !== r.id),
                      'ลบรายการแล้ว',
                    )
                  }
                >
                  <Button type="default" danger icon={<TrashIcon />} aria-label="ลบ" />
                </Popconfirm>
              ),
            },
          ]}
        />
        <p className="mt-3 text-xs text-muted">
          รวม {bar.menu.length} รายการ · เฉลี่ย{' '}
          {baht(
            Math.round(bar.menu.reduce((s, m) => s + m.price, 0) / Math.max(1, bar.menu.length)),
          )}
        </p>
      </Card>
      <Modal
        open={open}
        title="เพิ่มรายการเมนู"
        okText="เพิ่ม"
        cancelText="ยกเลิก"
        onCancel={closeAdd}
        confirmLoading={saving}
        onOk={async () => {
          const v = await form.validateFields();
          let imagePath: string | undefined;
          if (newPhoto) {
            setSaving(true);
            try {
              imagePath = await uploadMenuPhoto(bar.id, newPhoto);
            } catch (e) {
              setSaving(false);
              return void message.error((e as Error).message);
            }
          }
          const ok = await save(
            [...bar.menu, { ...v, id: `new-${Date.now()}`, available: true, imagePath }],
            'เพิ่มรายการแล้ว',
          );
          if (ok) closeAdd();
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ category: 'อาหาร' }}>
          <Form.Item name="category" label="หมวด">
            <Select options={CATS.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="name" label="ชื่อรายการ" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="ราคา (บาท)" rules={[{ required: true }]}>
            <InputNumber className="!w-full" min={0} />
          </Form.Item>
          <Form.Item label="รูป (ไม่บังคับ)" extra="JPG, PNG หรือ WebP ไม่เกิน 15MB · ลูกค้าเห็นในแท็บเมนูของหน้าร้าน">
            <div className="flex items-center gap-3">
              {newPhotoUrl && <img src={newPhotoUrl} alt="" className="size-16 rounded-lg object-cover" />}
              <Upload
                accept={PHOTO_ACCEPT}
                showUploadList={false}
                beforeUpload={(file) => {
                  const err = checkPhoto(file);
                  if (err) message.error(err);
                  else setNewPhoto(file);
                  return Upload.LIST_IGNORE;
                }}
              >
                <Button>{newPhoto ? 'เปลี่ยนรูป' : 'เลือกรูป'}</Button>
              </Upload>
              {newPhoto && (
                <Button type="text" danger onClick={() => setNewPhoto(null)}>
                  เอารูปออก
                </Button>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/** URL ชั่วคราวของไฟล์ที่เลือก (พรีวิวก่อนอัปโหลด) — คืนหน่วยความจำเมื่อเปลี่ยนไฟล์/ปิด */
function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  return url;
}
