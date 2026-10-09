import { useThemeMode } from '@nightout/ui';

const SRC = {
  dark: '/images/brand/logo-on-dark.webp',
  light: '/images/brand/logo-on-light.webp',
} as const;

/**
 * โลโก้ NightOut (สัญลักษณ์ + ตัวอักษร) — กำหนดความสูงด้วย className (กว้างตามสัดส่วนเอง)
 * - surface="dark": พื้นมืดเสมอ (ทับภาพ / footer / การ์ด Auth) → ตัวอักษรสว่าง
 * - surface="auto": ตามธีม → เลือกไฟล์เดียวใน JS (ไม่ใช่ซ่อนด้วย CSS ซึ่งยังโหลดทั้ง 2 ไฟล์)
 */
export function BrandLogo({
  surface = 'auto',
  alt = 'NightOut',
  className = '',
  lazy = false,
}: {
  surface?: 'dark' | 'auto';
  alt?: string;
  className?: string;
  lazy?: boolean;
}) {
  const { resolved } = useThemeMode();
  const onDark = surface === 'dark' || resolved === 'dark';
  return (
    <img
      src={onDark ? SRC.dark : SRC.light}
      alt={alt}
      width={1904}
      height={348}
      decoding="async"
      loading={lazy ? 'lazy' : undefined}
      className={`w-auto ${className}`}
    />
  );
}
