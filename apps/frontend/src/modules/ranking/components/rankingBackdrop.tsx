/**
 * พื้นหลังหน้าจัดอันดับ (เฉพาะธีมมืด · Figma "จัดอันดับ")
 * ภาพแสงม่วง/ฟ้า กว้างเต็มจอ สัดส่วน 1:2 วางชิดบน แล้วจางลงสีพื้น
 * + แสงจาง ๆ ช่วงล่างหลังรายการอันดับ 4–10 (สีจาก token ธีม)
 * วางใน container ที่ relative + isolate (ดู page.tsx) — แบบเดียวกับ AuroraBackdrop ของหน้าแรก
 */
export function RankingBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden dark:block">
      <div className="aspect-[1/2] w-full bg-[url(/images/ranking/bg.webp)] bg-size-[100%_100%] bg-no-repeat [mask-image:linear-gradient(to_bottom,#000_75%,transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(40%_30%_at_0%_45%,color-mix(in_oklab,var(--link)_22%,transparent),transparent),radial-gradient(35%_30%_at_100%_85%,color-mix(in_oklab,var(--purple)_18%,transparent),transparent)]" />
    </div>
  );
}
