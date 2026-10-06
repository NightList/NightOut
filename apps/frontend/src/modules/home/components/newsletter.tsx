import { EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react';
import { App } from 'antd';
import { useState } from 'react';

/**
 * สมัครรับข่าวสาร — แบนเนอร์ขอบเรืองม่วง: ไอคอน · หัวข้อ + คำอธิบาย · ช่องอีเมล + ปุ่มในแคปซูลเดียว
 * เดโม: แค่ตรวจรูปแบบอีเมลแล้วขึ้นข้อความสำเร็จ
 */
export function Newsletter() {
  const { message } = App.useApp();
  const [email, setEmail] = useState('');

  return (
    <section aria-labelledby="home-news" className="mx-auto max-w-7xl px-4 md:px-8">
      <div
        className="flex flex-col gap-5 rounded-3xl border border-border p-5 dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:flex-row md:items-center md:gap-8 md:p-8"
        style={{
          background:
            'radial-gradient(55% 120% at 100% 50%, rgba(167,56,245,0.14), transparent 70%), linear-gradient(100deg, var(--card), color-mix(in srgb, var(--hero-via) 60%, var(--card)))',
        }}
      >
        <div className="flex items-start gap-4 md:flex-1 md:items-center">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-purple/40 bg-purple/10 text-link md:size-14"
            aria-hidden
          >
            <EnvelopeSimple size={26} weight="duotone" />
          </span>
          <div className="min-w-0">
            <h2 id="home-news" className="text-xl font-bold md:text-2xl">
              สมัครรับข่าวสาร
            </h2>
            <p className="mt-1 text-sm text-muted">
              ร้านเปิดใหม่ โปรโมชันของร้าน และอันดับประจำสัปดาห์ ส่งตรงถึงอีเมลคุณ
            </p>
          </div>
        </div>

        <form
          className="flex w-full items-center gap-1.5 rounded-full border border-border bg-background/70 p-1.5 focus-within:border-gold dark:border-white/12 md:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email))
              return void message.warning('กรอกอีเมลให้ถูกต้องก่อนนะ');
            message.success('สมัครรับข่าวสารแล้ว');
            setEmail('');
          }}
        >
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="send"
            aria-label="อีเมล"
            placeholder="อีเมลของคุณ"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-4 py-2 text-base outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="flex shrink-0 select-none items-center justify-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-on-gold transition duration-150 ease-out [touch-action:manipulation] hover:bg-gold-highlight active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:px-5"
          >
            <PaperPlaneTilt size={16} weight="fill" aria-hidden />
            สมัคร
          </button>
        </form>
      </div>
    </section>
  );
}
