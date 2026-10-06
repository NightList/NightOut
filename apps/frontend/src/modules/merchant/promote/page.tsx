import { Megaphone, UploadSimple } from '@phosphor-icons/react';
import { getState, MASTER, orderPromotion, promptPayPayload } from '@/services/data';
import { App, Button, Card, Modal, Table, Tag, Upload } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { PageHeader } from '@/ui/components/pageHeader';
import { baht, dateTime } from '@/ui/utils/format';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const PLACEMENT = {
  HOME_BANNER: 'Home Banner',
  HOME_RECOMMENDED: 'ร้านแนะนำหน้าแรก',
  SEARCH_TOP: 'อันดับต้นในผลค้นหา',
};
const STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'กำลังแสดง', color: 'green' },
  PAYMENT_SUBMITTED: { label: 'รอตรวจสลิป', color: 'gold' },
  PENDING_PAYMENT: { label: 'รอชำระ', color: 'default' },
  REJECTED: { label: 'ไม่ผ่าน', color: 'red' },
  EXPIRED: { label: 'หมดอายุ', color: 'default' },
  CANCELLED: { label: 'ยกเลิก', color: 'default' },
};

/** /merchant/promote — ซื้อแพ็กเกจโปรโมท: โอน PromptPay ของ NightOut + แนบสลิป → แอดมินตรวจแล้วเริ่มแสดง */
export function MerchantPromotePage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [pkgId, setPkgId] = useState<string | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const orders = getState().promotions.filter((p) => p.barId === bar.id);
  const pkg = MASTER.packages.find((p) => p.id === pkgId);
  const pp = MASTER.promotionPromptPay;
  const canManage = bar.staffRole !== 'STAFF';

  const close = () => {
    setPkgId(null);
    setSlip(null);
  };
  const submit = async () => {
    if (!pkg || !slip) return;
    setSending(true);
    try {
      await orderPromotion(bar.id, pkg.id, slip);
      message.success('ส่งคำสั่งซื้อแล้ว รอแอดมินตรวจสลิป');
      close();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="โปรโมทร้าน"
        subtitle="ได้ป้าย “แนะนำ · โฆษณา” และตำแหน่งพิเศษ — ไม่มีผลต่อดาวหรือคะแนนรีวิว"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MASTER.packages.map((p) => (
          <Card key={p.id}>
            <Megaphone size={28} className="mb-2 text-gold-text" />
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted">
              {PLACEMENT[p.placement]} · {p.days} วัน
            </p>
            <p className="my-2 text-2xl font-bold text-gold-text">{baht(p.price)}</p>
            <Button block type="primary" disabled={!canManage || bar.status !== 'APPROVED'} onClick={() => setPkgId(p.id)}>
              ซื้อแพ็กเกจ
            </Button>
          </Card>
        ))}
      </div>
      {bar.status !== 'APPROVED' && <p className="text-sm text-muted">ซื้อโปรโมทได้หลังร้านผ่านการตรวจและเปิดแสดงแล้ว</p>}
      <Card title="ประวัติการโปรโมท">
        <Table
          rowKey="id"
          dataSource={orders}
          pagination={false}
          locale={{ emptyText: 'ยังไม่เคยซื้อโปรโมท' }}
          scroll={{ x: 640 }}
          columns={[
            { title: 'แพ็กเกจ', dataIndex: 'packageName' },
            {
              title: 'ตำแหน่ง',
              dataIndex: 'placement',
              render: (v: keyof typeof PLACEMENT) => PLACEMENT[v],
            },
            { title: 'ราคา', dataIndex: 'price', render: (v: number) => baht(v) },
            { title: 'สั่งเมื่อ', dataIndex: 'createdAt', render: (v: string) => dateTime(v) },
            {
              title: 'สถานะ',
              dataIndex: 'status',
              render: (s: string) => <Tag color={STATUS[s]?.color}>{STATUS[s]?.label ?? s}</Tag>,
            },
          ]}
        />
      </Card>
      <Modal
        open={!!pkg}
        title={pkg ? `ซื้อ ${pkg.name} ${pkg.days} วัน` : ''}
        okText="ส่งสลิป"
        cancelText="ยกเลิก"
        okButtonProps={{ disabled: !slip }}
        confirmLoading={sending}
        onOk={() => void submit()}
        onCancel={close}
        destroyOnHidden
      >
        {pkg && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-2xl bg-white p-3">
                <QRCodeSVG value={promptPayPayload(pp.promptpayId, pkg.price)} size={150} />
              </div>
              <div>
                <p className="text-muted">ยอดที่ต้องโอน</p>
                <p className="text-3xl font-bold text-gold-text">{baht(pkg.price)}</p>
                <p className="text-sm text-muted">PromptPay: {pp.name}</p>
              </div>
            </div>
            <Upload.Dragger
              accept="image/*,application/pdf"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                if (file.size > 10 * 1024 * 1024) {
                  message.error('ไฟล์ใหญ่เกิน 10MB');
                  return Upload.LIST_IGNORE;
                }
                setSlip(file);
                return false;
              }}
            >
              <div className="py-4">
                <UploadSimple size={28} className="mx-auto text-gold-text" />
                <p className="mt-2">{slip ? `เลือกแล้ว: ${slip.name}` : 'แตะเพื่อเลือกรูปสลิป หรือลากไฟล์มาวาง'}</p>
              </div>
            </Upload.Dragger>
          </div>
        )}
      </Modal>
    </div>
  );
}
