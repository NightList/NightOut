import { House, Image as ImageIcon, MagnifyingGlass, Megaphone, UploadSimple } from '@phosphor-icons/react';
import { App, Modal, Upload } from 'antd';
import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';
import { useState, type ReactNode } from 'react';
import { barBookings, getState, MASTER, promptPayPayload } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Tile } from '@/ui/components/merchantUi';
import { baht } from '@/ui/utils/format';
import { orderPromotion } from './api';

type Placement = 'HOME_BANNER' | 'HOME_RECOMMENDED' | 'SEARCH_TOP';
const PLACEMENT: Record<Placement, { label: string; desc: string; icon: ReactNode }> = {
  HOME_RECOMMENDED: { label: 'หน้าแรก · แนะนำ', desc: 'การ์ดร้านในส่วน "แนะนำ" บนหน้าแรก', icon: <House /> },
  HOME_BANNER: { label: 'แบนเนอร์หน้าแรก', desc: 'แบนเนอร์ใหญ่ด้านบนหน้าแรก', icon: <ImageIcon /> },
  SEARCH_TOP: { label: 'ผลค้นหา', desc: 'ขึ้นบนสุดเมื่อค้นหาย่านหรือประเภทร้าน', icon: <MagnifyingGlass /> },
};
const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'กำลังแสดง', cls: 'text-(--crowd-available)' },
  PAYMENT_SUBMITTED: { label: 'รอตรวจสลิป', cls: 'text-gold-text' },
  PENDING_PAYMENT: { label: 'รอชำระ', cls: 'text-muted' },
  REJECTED: { label: 'ไม่ผ่าน', cls: 'text-(--crowd-full)' },
  EXPIRED: { label: 'หมดอายุ', cls: 'text-muted' },
  CANCELLED: { label: 'ยกเลิก', cls: 'text-muted' },
};
const DAY_MS = 24 * 60 * 60 * 1000;

/** /merchant/promote — แคมเปญปัจจุบัน + การจองใหม่รายวัน · แพ็กเกจ (โอน PromptPay ของ NightOut + แนบสลิป → แอดมินตรวจแล้วเริ่มแสดง) · ประวัติ */
export function MerchantPromotePage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [pkgId, setPkgId] = useState<string | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [now] = useState(() => Date.now());
  const orders = getState()
    .promotions.filter((p) => p.barId === bar.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pkg = MASTER.packages.find((p) => p.id === pkgId);
  const pp = MASTER.promotionPromptPay;
  const canBuy = bar.staffRole !== 'STAFF' && bar.status === 'APPROVED';
  const current = orders.find((o) => o.status === 'ACTIVE') ?? orders.find((o) => o.status === 'PAYMENT_SUBMITTED');
  const hot = MASTER.packages.find((p) => p.placement === 'HOME_RECOMMENDED')?.id ?? MASTER.packages[0]?.id;

  // การจองใหม่ (ตามเวลาที่ลูกค้ากดจอง) 7 วันล่าสุด — ดูผลช่วงที่ร้านโปรโมท
  const all = barBookings(bar.id);
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = dayjs(now).startOf('day').subtract(6 - i, 'day');
    const n = all.filter((b) => dayjs(b.createdAt).isSame(start, 'day')).length;
    return { label: start.format('D MMM'), n };
  });
  const dayMax = Math.max(1, ...days.map((d) => d.n));
  const since = current ? new Date(current.createdAt).getTime() : now - 7 * DAY_MS;
  const fresh = all.filter((b) => new Date(b.createdAt).getTime() >= since);
  const freshIn = fresh.filter((b) => ['CHECKED_IN', 'COMPLETED'].includes(b.status));

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

  const stat = (label: string, short: string, value: number, gold = false) => (
    <span className="flex flex-col rounded-[10px] bg-surface p-2 lg:rounded-[14px] lg:p-3">
      <span className="text-[10px] text-muted lg:text-[11px]">
        <span className="lg:hidden">{short}</span>
        <span className="hidden lg:inline">{label}</span>
      </span>
      <b className={`text-[15px] lg:text-xl ${gold ? 'text-gold-text' : ''}`}>{value.toLocaleString('th-TH')}</b>
    </span>
  );

  const pick = (id: string) => (canBuy ? setPkgId(id) : message.info(bar.status !== 'APPROVED' ? 'ซื้อโปรโมทได้หลังร้านผ่านการตรวจและแสดงบนเว็บแล้ว' : 'เฉพาะเจ้าของ/ผู้จัดการร้าน'));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">โปรโมทร้าน</h1>
        <p className="mt-1 hidden text-sm text-muted lg:block">
          ได้ป้าย “แนะนำ · โฆษณา” และตำแหน่งพิเศษ · จ่ายผ่าน PromptPay · ไม่มีผลต่อดาวหรือคะแนนรีวิว
        </p>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-4 lg:gap-4">
        {/* แคมเปญปัจจุบัน */}
        <div className="flex flex-col gap-2 rounded-[20px] border border-gold/35 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--gold)_14%,var(--card)),var(--card))] p-4 lg:col-span-2 lg:gap-2.5 lg:p-[22px]">
          <span className="flex items-center justify-between gap-2">
            <span className="rounded-md border border-gold/40 px-2 py-0.5 text-[11px] text-gold-text lg:text-xs">แนะนำ · โฆษณา</span>
            {current ? (
              <span className={`inline-flex items-center gap-1.5 text-xs lg:text-[13px] ${STATUS[current.status]?.cls}`}>
                <span className="size-2 rounded-full bg-current" />
                {STATUS[current.status]?.label}
              </span>
            ) : (
              <span className="text-xs text-muted">ยังไม่ได้โปรโมท</span>
            )}
          </span>
          {current ? (
            <>
              <b className="text-lg font-semibold lg:text-[22px]">
                {PLACEMENT[current.placement].label} · {current.days} วัน
              </b>
              <span className="text-[13px] text-muted">
                สั่งซื้อ {dayjs(current.createdAt).format('D MMM')} · แสดง {current.days} วันนับจากทีม NightOut อนุมัติสลิป
              </span>
            </>
          ) : (
            <>
              <b className="text-lg font-semibold lg:text-[22px]">ให้ลูกค้าเห็นร้านก่อนใคร</b>
              <span className="text-[13px] text-muted">เลือกแพ็กเกจด้านล่าง โอนผ่าน PromptPay แล้วแนบสลิป ทีม NightOut ตรวจแล้วเริ่มแสดงทันที</span>
            </>
          )}
          <div className="mt-auto grid grid-cols-3 gap-1.5 lg:gap-2.5">
            {stat(current ? 'จองใหม่ตั้งแต่สั่งซื้อ' : 'จองใหม่ 7 วัน', 'จองใหม่', fresh.length, true)}
            {stat('มาเช็กอินแล้ว', 'เช็กอิน', freshIn.length)}
            {stat('ลูกค้าที่มาจริง (คน)', 'คน', freshIn.reduce((a, b) => a + b.pax, 0))}
          </div>
        </div>

        {/* การจองใหม่รายวัน */}
        <Tile className="hidden flex-col gap-2.5 lg:col-span-2 lg:flex lg:!p-[22px]">
          <b className="text-sm font-semibold">
            การจองใหม่รายวัน <span className="text-xs font-normal text-muted">· 7 วันล่าสุด</span>
          </b>
          <div className="flex min-h-36 flex-1 items-end gap-3" role="img" aria-label={days.map((d) => `${d.label} ${d.n}`).join(', ')}>
            {days.map((d) => (
              <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[11px] text-muted">{d.n || ''}</span>
                <span className="block w-full rounded-t-md bg-gold" style={{ height: `${(d.n / dayMax) * 100}%`, minHeight: d.n ? 4 : 0 }} />
                <span className="text-[11px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Tile>

        {/* แพ็กเกจ */}
        <b className="mt-1 text-[15px] font-semibold lg:hidden">แพ็กเกจ</b>
        {MASTER.packages.map((p) => {
          const isHot = p.id === hot;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-2xl bg-card p-3.5 lg:flex-col lg:items-stretch lg:gap-2 lg:rounded-[20px] lg:p-5 ${
                isHot ? 'border-2 border-gold' : 'border border-border'
              }`}
            >
              <span className="text-[22px] text-gold lg:text-2xl">{PLACEMENT[p.placement].icon}</span>
              <span className="flex min-w-0 flex-1 flex-col lg:flex-none">
                <b className="text-sm font-medium lg:text-[17px] lg:font-semibold">{p.name}</b>
                <span className="text-xs text-muted lg:hidden">{p.days} วัน</span>
                <span className="hidden text-[13px] leading-normal text-muted lg:block">{PLACEMENT[p.placement].desc}</span>
              </span>
              <span className="font-semibold lg:mt-auto lg:text-2xl">
                {baht(p.price)}
                <span className="hidden text-[13px] font-normal text-muted lg:inline"> / {p.days} วัน</span>
              </span>
              <button
                type="button"
                onClick={() => pick(p.id)}
                className={`merchant-pill h-9 shrink-0 rounded-xl px-3 text-sm font-semibold lg:h-[38px] ${
                  isHot ? 'bg-gold text-on-gold' : 'border border-border'
                } ${canBuy ? '' : 'opacity-60'}`}
              >
                <span className="lg:hidden">เลือก</span>
                <span className="hidden lg:inline">เลือกแพ็กเกจ</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ประวัติ */}
      <Tile className="flex flex-col gap-2">
        <b className="text-sm font-semibold">ประวัติการโปรโมท</b>
        {orders.length === 0 ? (
          <p className="py-4 text-sm text-muted">ยังไม่เคยซื้อโปรโมท</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 border-t border-border/60 py-2.5 text-sm first:border-t-0">
                <Megaphone className="shrink-0 text-gold" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">
                    {o.packageName} · {PLACEMENT[o.placement].label}
                  </span>
                  <span className="text-xs text-muted">
                    {dayjs(o.createdAt).format('D MMM YY')} · {o.days} วัน
                  </span>
                </span>
                <span className="font-semibold">{baht(o.price)}</span>
                <span className={`w-20 text-right text-xs ${STATUS[o.status]?.cls ?? 'text-muted'}`}>{STATUS[o.status]?.label ?? o.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Tile>

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
