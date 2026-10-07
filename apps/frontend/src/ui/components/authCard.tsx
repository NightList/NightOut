import { Typography } from 'antd';
import type { ReactNode } from 'react';
import { BrandLogo } from './brandLogo';

/**
 * การ์ดกระจกของหน้า Auth (Figma: "Login")
 * กว้าง ~460px กลางจอ · โลโก้อยู่ในการ์ดด้านบน · มุม 16px · พื้นดำโปร่ง + blur · ขอบขาวจาง
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  /** หัวข้อ (ไม่ใส่ก็ได้ — หน้า login มีแค่โลโก้ตาม Figma) */
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-115">
      <div className="rounded-2xl border border-purple/45 bg-grey/5 px-6 pb-8 pt-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-lg sm:px-14">
        <BrandLogo surface="dark" className="mx-auto mb-6 block h-12.5" />
        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && (
              <Typography.Title level={4} className="mb-1! text-white!">
                {title}
              </Typography.Title>
            )}
            {subtitle && <p className="text-balance text-sm text-white/75">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
      {footer && <div className="mt-4 text-center text-xs text-white/60">{footer}</div>}
    </div>
  );
}
