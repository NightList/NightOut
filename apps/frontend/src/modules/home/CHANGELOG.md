# home — ประวัติการแก้ไข

## 2026-10-07 — กันภาพ Hero โหลดซ้ำ + cache เนื้อหาหน้าแรกผิดรูป
- เปิดเว็บครั้งแรก (ยังไม่มี cache) ไม่โหลดภาพ Hero ตั้งต้นทิ้งก่อนรู้ว่าแอดมินตั้งภาพไว้ไหม: ระหว่างรอแสดงพื้นสีกลางคืน รอไม่เกิน 1.5 วิ และเลิกรอทันทีถ้า API ล้ม (ใช้ภาพตั้งต้น)
- ยิง `GET /public/home` ตั้งแต่ boot คู่กับ catalog (`prefetchSiteHome()` ใน `main.tsx`) ให้ render แรกได้ข้อมูลเร็วขึ้น
- cache ในเครื่องเปลี่ยนเป็น `nightout-site-home:v1` + ตรวจรูปแบบก่อนใช้ (ผิดรูป = ทิ้ง · ลบ key เก่า) และอ่าน localStorage ครั้งเดียว — กันหน้าแรกพังเมื่อสัญญา `PublicHomeResult` เปลี่ยน
- ไฟล์: `utils/useHomeContent.ts`, `components/hero.tsx`, `components/skyBackdrop.tsx`, `page.tsx`, `services/queries/site-content.ts`, `main.tsx`
