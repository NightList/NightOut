import { CaretRight, Check, ForkKnife, ShieldCheck, Storefront, Table as TableIcon } from '@phosphor-icons/react';
import { Button, Empty, Result } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CATEGORY_LABELS, getBar, type BarWithTier } from '@/services/data';
import { useAuth } from '@/services/auth';
import { useDemo } from '@/hooks/useDemo';
import { Meter } from '@/ui/components/merchantUi';
import { PageHeader } from '@/ui/components/pageHeader';
import { barImage } from '@/ui/utils/barImage';

interface Prep {
  to: string;
  icon: ReactNode;
  title: string;
  sub: string;
  state: string;
  stateCls: string;
  pct: number;
  cta: string;
}

/** ความพร้อมของร้านระหว่างรอตรวจ — คำนวณจากข้อมูลที่ร้านกรอกแล้ว */
function prepTiles(bar: BarWithTier): Prep[] {
  const info = [!!bar.coverUrl || !!bar.gallery?.length, bar.hours.some((h) => !h.closed), !!bar.description, bar.styles.length > 0];
  const infoDone = info.filter(Boolean).length;
  const menu = bar.menu.length;
  const zones = bar.zones.length;
  const safetyYes = bar.safety.filter((s) => s.value === 'YES').length;
  const safetyTotal = Math.max(bar.safety.length, 9);
  const state = (done: boolean, started: boolean, text: string) => ({
    state: done ? 'ครบแล้ว' : started ? text : 'ยังไม่เริ่ม',
    stateCls: done ? 'text-(--crowd-available)' : started ? 'text-gold-text' : 'text-muted',
  });
  return [
    { to: '/merchant/store', icon: <Storefront />, title: 'ข้อมูลร้าน', sub: 'รูปปก + แกลเลอรี, เวลาเปิด-ปิด', ...state(infoDone === info.length, infoDone > 0, `${infoDone} / ${info.length} ส่วน`), pct: (infoDone / info.length) * 100, cta: 'แก้ไข' },
    { to: '/merchant/menu', icon: <ForkKnife />, title: 'เมนู', sub: 'ใช้ประเมินราคาก่อนลูกค้าไป', ...state(menu >= 20, menu > 0, `${menu} รายการ`), pct: Math.min(menu / 20, 1) * 100, cta: 'เพิ่มเมนู' },
    { to: '/merchant/tables', icon: <TableIcon />, title: 'โซน / โต๊ะ', sub: 'ต้องมีอย่างน้อย 1 โซนเพื่อรับจอง', ...state(zones > 0, false, ''), pct: zones > 0 ? 100 : 0, cta: 'ตั้งค่าโต๊ะ' },
    { to: '/merchant/safety', icon: <ShieldCheck />, title: 'ความปลอดภัย', sub: 'มีผลต่อดาวของร้าน', ...state(safetyYes >= safetyTotal, safetyYes > 0, `${safetyYes} / ${safetyTotal} ข้อ`), pct: (safetyYes / safetyTotal) * 100, cta: 'กรอก checklist' },
  ];
}

const STEPS = ['ส่งข้อมูล', 'กำลังตรวจ', 'อนุมัติ'];

/** ขั้นตอนตรวจ 3 จุด: เสร็จ = ทอง+เครื่องหมายถูก · ปัจจุบัน = วงม่วงกะพริบ */
function ReviewSteps({ current }: { current: number }) {
  return (
    <ol className="m-0 flex list-none items-center p-0 text-[13px]" aria-label="ขั้นตอนการตรวจร้าน">
      {STEPS.map((label, i) => (
        <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`} aria-current={i === current ? 'step' : undefined}>
          <span className={`flex w-[90px] flex-col items-center gap-1.5 ${i > current ? 'text-muted' : ''}`}>
            {i < current ? (
              <span className="grid size-7 place-items-center rounded-full bg-gold text-on-gold">
                <Check />
              </span>
            ) : i === current ? (
              <span className="grid size-7 place-items-center rounded-full border-2 border-link">
                <span className="size-2.5 animate-pulse rounded-full bg-link" />
              </span>
            ) : (
              <span className="size-7 rounded-full border border-border" />
            )}
            {label}
          </span>
          {i < STEPS.length - 1 && <span className={`mb-[22px] h-0.5 flex-1 ${i < current ? 'bg-gold' : 'bg-border'}`} />}
        </li>
      ))}
    </ol>
  );
}

/** /merchant/status — สถานะการตรวจร้าน (จาก my_bar_detail) */
export function MerchantStatusPage() {
  useDemo();
  const { user } = useAuth();
  const bar = user?.barId ? getBar(user.barId) : null;
  if (!bar)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="สถานะการตรวจสอบ" />
        <Empty description="ยังไม่มีร้านที่สมัคร">
          <Link to="/merchant/join">
            <Button type="primary">สมัครเป็นร้านค้า</Button>
          </Link>
        </Empty>
      </div>
    );
  if (bar.status === 'REJECTED' || bar.status === 'SUSPENDED')
    return (
      <Result
        status="warning"
        title={bar.status === 'REJECTED' ? `${bar.name} ยังไม่ผ่านการตรวจ` : `${bar.name} ถูกระงับชั่วคราว`}
        subTitle={bar.statusReason ?? 'ติดต่อทีม NightOut เพื่อขอรายละเอียด'}
        extra={
          <Link to="/merchant">
            <Button type="primary">ไปหน้าร้านของฉัน</Button>
          </Link>
        }
      />
    );

  const approved = bar.status === 'APPROVED';
  const current = bar.status === 'DRAFT' ? 0 : approved ? 3 : 1;
  const badge = approved ? 'อนุมัติแล้ว' : bar.status === 'DRAFT' ? 'ร่าง · ยังไม่ส่งตรวจ' : 'กำลังตรวจ';
  const title = approved ? `${bar.name} เปิดหน้าร้านแล้ว` : 'ทีม NightOut กำลังตรวจร้านของคุณ';
  const body = approved
    ? 'ลูกค้าเห็นร้านและจองโต๊ะได้แล้ว · ดูการจองและสแกนเช็กอินได้ที่หน้าร้านของฉัน'
    : 'ลูกค้ายังไม่เห็นร้าน ระหว่างนี้เตรียมข้อมูลร้าน เมนู โต๊ะ และตั้งค่าการจองได้ · ปกติใช้เวลา 1–2 วันทำการ';
  const tiles = prepTiles(bar);
  const heroCls = approved
    ? 'border-(--crowd-available)/40 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--crowd-available)_12%,var(--card)),var(--card))]'
    : 'border-link/30 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--purple)_14%,var(--card)),var(--card))]';
  const badgeCls = approved ? 'border-(--crowd-available)/40 text-(--crowd-available)' : 'border-link/30 text-link';

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4 lg:grid-rows-[minmax(300px,auto)_minmax(240px,auto)]">
        <section className={`col-span-2 flex flex-col gap-4 rounded-[20px] border p-7 ${heroCls}`}>
          <span className={`self-start rounded-xl border px-2.5 text-[13px] leading-6 ${badgeCls}`}>{badge}</span>
          <h1 className="font-display text-[34px] font-bold leading-tight">{title}</h1>
          <p className="text-[15px] leading-relaxed text-muted text-pretty">{body}</p>
          <div className="mt-auto">
            <ReviewSteps current={current} />
          </div>
        </section>
        <Link
          to="/merchant"
          className="col-span-2 flex flex-col justify-end rounded-[20px] border border-border bg-cover bg-center p-6 text-white"
          style={{ backgroundImage: `linear-gradient(to top, rgba(7,7,13,.92), rgba(7,7,13,.2)), url(${barImage(bar)})` }}
        >
          <span className="text-[13px] text-white/75">ร้านของฉัน</span>
          <b className="font-display text-[32px] font-bold text-white">{bar.name}</b>
          <span className="text-sm text-white/80">
            {CATEGORY_LABELS[bar.category]} · {bar.district}
          </span>
        </Link>
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="merchant-pill flex min-w-0 flex-col gap-2.5 rounded-[20px] border border-border bg-card p-5 text-inherit hover:border-gold"
          >
            <span className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-surface text-xl text-gold">{t.icon}</span>
              <span className={`text-xs ${t.stateCls}`}>{t.state}</span>
            </span>
            <b className="text-[17px] font-semibold">{t.title}</b>
            <span className="text-[13px] leading-normal text-muted">{t.sub}</span>
            <Meter pct={t.pct} className="mt-auto" />
            <span className="text-[13px] text-link">{t.cta} →</span>
          </Link>
        ))}
      </div>

      {/* ---------- มือถือ ---------- */}
      <div className="flex flex-col gap-3 lg:hidden">
        <section className={`flex flex-col gap-2.5 rounded-[20px] border p-[18px] ${heroCls}`}>
          <span className={`self-start rounded-xl border px-2 text-xs leading-[22px] ${badgeCls}`}>{badge}</span>
          <h1 className="font-display text-[22px] font-bold leading-snug">{title}</h1>
          <p className="text-[13px] leading-normal text-muted">{body}</p>
          <ReviewSteps current={current} />
        </section>
        <h2 className="mt-1 text-[15px] font-semibold">{approved ? 'ข้อมูลร้าน' : 'เตรียมไว้ก่อนได้'}</h2>
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {tiles.map((t) => (
            <li key={t.to}>
              <Link
                to={t.to}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-inherit"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-xl text-gold">{t.icon}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className="text-sm font-medium">{t.title}</b>
                  <span className={`text-xs ${t.stateCls}`}>{t.state}</span>
                </span>
                <CaretRight className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/merchant">
          <Button type="primary" block size="large">
            ไปหน้าร้านของฉัน
          </Button>
        </Link>
      </div>
    </>
  );
}
