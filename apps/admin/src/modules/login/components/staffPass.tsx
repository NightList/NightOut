import { colors, useThemeMode } from '@nightout/ui';
import { ConfigProvider, type ThemeConfig } from 'antd';
import { useMemo, type ReactNode } from 'react';
import logoMark from '/logo-mark.svg';
import './staffPass.css';

const GOLD_RING = '0 0 0 3px rgba(232, 182, 76, 0.2)';

/** ช่องกรอก 48px / ปุ่ม 52px มุม 10 ตามบัตร Staff Pass */
function useStaffPassTheme(): ThemeConfig {
  const { resolved } = useThemeMode();
  return useMemo(() => {
    const c = colors[resolved];
    const field = {
      controlHeight: 48,
      borderRadius: 10,
      colorBgContainer: c.surface,
      hoverBorderColor: c.gold,
      activeBorderColor: c.gold,
      activeShadow: GOLD_RING,
    };
    return {
      components: {
        Input: { ...field, inputFontSize: 16 },
        Button: { controlHeightLG: 52, borderRadiusLG: 10, contentFontSizeLG: 16 },
        Form: { labelColor: c.muted, labelFontSize: 13, verticalLabelPadding: '0 0 6px' },
        Alert: { borderRadiusLG: 10 },
      },
    };
  }, [resolved]);
}

/**
 * บัตร "Staff Pass" — ต้นขั้ว (โลโก้ · kicker · Admin Pass · ชื่อผู้ถือ) + ฝั่งฟอร์ม
 * จอ < 900px ต้นขั้วกลายเป็นแถบบน รอยปรุอยู่ล่างแถบ
 */
export function StaffPass({
  kicker,
  holder,
  title,
  step,
  stepActive = false,
  children,
}: {
  kicker: string;
  holder: ReactNode;
  title: string;
  step: string;
  stepActive?: boolean;
  children: ReactNode;
}) {
  const theme = useStaffPassTheme();
  return (
    <ConfigProvider theme={theme}>
      <div className="staff-pass">
        <aside className="staff-pass__stub">
          <img src={logoMark} alt="NightOut" className="staff-pass__logo" />
          <div className="staff-pass__heading">
            <p className="staff-pass__mono staff-pass__kicker m-0 text-gold">{kicker}</p>
            <h1 className="staff-pass__title font-display font-bold text-[#ffd77a]">
              Admin
              <br /> Pass
            </h1>
          </div>
          <div className="staff-pass__mono staff-pass__holder flex min-w-0 items-center gap-2 text-muted">
            {holder}
          </div>
          <span aria-hidden className="staff-pass__notch staff-pass__notch--a" />
          <span aria-hidden className="staff-pass__notch staff-pass__notch--b" />
        </aside>

        <section className="staff-pass__body">
          <header className="flex items-baseline justify-between gap-4">
            <h2 className="m-0 text-2xl font-bold text-text">{title}</h2>
            <span
              className={`staff-pass__mono shrink-0 text-xs ${stepActive ? 'text-gold' : 'text-muted'}`}
            >
              {step}
            </span>
          </header>
          {children}
        </section>
      </div>
    </ConfigProvider>
  );
}
