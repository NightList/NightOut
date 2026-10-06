/**
 * ป้าย "แนะนำ" ของร้านโปรโมท (โฆษณา) — ต้องบอกผู้ใช้เสมอว่าเป็นโฆษณา (title + ข้อความสำหรับโปรแกรมอ่านหน้าจอ)
 * `solid` = ป้ายทึบบนรูป (การ์ดกริด) · `outline` = ป้ายเส้นขอบข้างชื่อร้าน (ส่วนอันดับ)
 */
export function PromotedTag({
  variant = 'outline',
  className = '',
}: {
  variant?: 'solid' | 'outline';
  className?: string;
}) {
  const look =
    variant === 'solid'
      ? 'rounded-md bg-gold px-2 py-0.5 text-[11px] font-semibold text-on-gold'
      : 'rounded-full border border-gold/70 px-2.5 py-0.5 text-xs text-gold-text';
  return (
    <span
      title="ร้านโปรโมท (โฆษณา)"
      className={`inline-flex shrink-0 items-center ${look} ${className}`}
    >
      แนะนำ<span className="sr-only"> · โฆษณา</span>
    </span>
  );
}
