import { getAntdTheme } from '@nightout/ui';
import { ConfigProvider, type ThemeConfig } from 'antd';
import { Outlet } from 'react-router';
import { NAV } from '@/configs/nav';
import { AgeGate } from '@/ui/components/ageGate';
import { Navbar } from '@/ui/components/navbar';

/**
 * ธีมเฉพาะหน้า Auth (Figma: "Login" 1600×1024)
 * พื้นหลังเป็นภาพเมืองกลางคืนโทนม่วงเสมอ จึงล็อกเป็น dark ไม่ขึ้นกับสวิตช์ธีม
 * ช่องกรอก: กล่องเทาโปร่ง มุม 6px ไม่มีขอบ · ปุ่มหลัก: ม่วง
 */
const base = getAntdTheme('dark');
const authTheme: ThemeConfig = {
  ...base,
  cssVar: { key: 'nightout-auth' },
  token: {
    ...base.token,
    colorPrimary: '#a738f5',
    colorTextLightSolid: '#ffffff',
    colorLink: '#c4a6ff',
    borderRadius: 6,
  },
  components: {
    ...base.components,
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.10)',
      colorBorder: 'transparent',
      hoverBorderColor: 'rgba(255, 255, 255, 0.25)',
      activeBorderColor: '#8b6fe0',
      activeShadow: '0 0 0 3px rgba(139, 111, 224, 0.25)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.35)',
      controlHeightLG: 42,
      paddingInlineLG: 14,
    },
    DatePicker: {
      colorBgContainer: 'rgba(255, 255, 255, 0.10)',
      colorBorder: 'transparent',
      controlHeightLG: 42,
    },
    Form: { labelColor: 'rgba(255, 255, 255, 0.9)', verticalLabelPadding: '0 0 6px' },
    Button: { primaryColor: '#ffffff', controlHeightLG: 44, fontWeight: 600 },
  },
};

/**
 * Layout ของหน้า Auth ทั้งหมด (login / register / forgot / reset / verify / invite)
 * Figma "Login": navbar แคปซูลลอยแบบเดียวกับหน้าหลัก · การ์ดกระจกอยู่กลางจอ · ภาพเมืองกลางคืนเต็มจอ
 */
export function AuthLayout() {
  return (
    <ConfigProvider theme={authTheme}>
      <div className="dark relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#07070d] text-[#f5f1e8]">
        <AgeGate />
        <img
          src="/images/login/bg-login.webp"
          srcSet="/images/login/bg-login-sm.webp 900w, /images/login/bg-login.webp 1920w"
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-10 size-full object-cover object-[30%_center]"
        />
        {/* ย้อมม่วง + มืดลง ให้การ์ดเด่นและอ่านออก (Figma: overlay ม่วงเข้ม) */}
        <div className="absolute inset-0 -z-10 bg-[#1a0b33]/55 mix-blend-multiply" />
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/55 via-black/35 to-black/70" />

        <header className="sticky top-0 z-40 h-0">
          <div className="flex justify-center px-3 pt-3 md:pt-4">
            <Navbar items={NAV} overVideo minimal />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-24">
          <Outlet />
        </main>
      </div>
    </ConfigProvider>
  );
}
