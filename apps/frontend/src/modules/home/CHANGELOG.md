# home — ประวัติการแก้ไข

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `prefetchSiteHome` · `useSiteHome` (`GET /public/home`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — ตัดป้าย "ทีมงานเลือก"
- การ์ดกริดร้านยอดนิยมไม่มีป้าย "ทีมงานเลือก" (Editor's Pick) แล้ว เหลือ "แนะนำ" (โฆษณา) และ "ร้านใหม่"
- ไฟล์: `components/popularGrid.tsx`

## 2026-10-08 — ร้านยอดนิยมตามที่แอดมินปัก
- กริด "ร้านยอดนิยม" ใช้ร้านที่แอดมินปักไว้ก่อน (`popular_bar_ids` จาก `GET /public/home`) แล้วเติมช่องที่เหลือด้วยร้านคะแนนรีวิวสูงสุดที่ไม่ซ้ำจนครบ 8 (`utils/popularBars.ts`)
- หัวข้อ/บรรทัดเล็กของ section มาจาก API (ระหว่างรอใช้ข้อความเดิม เพราะ section อยู่พ้นจอแรก)
- cache หน้าแรกใน localStorage ขึ้นเป็น `nightout-site-home:v2` (รูปแบบข้อมูลเปลี่ยน)
- ไฟล์: `page.tsx`, `components/popularGrid.tsx`, `utils/useHomeContent.ts`, `utils/popularBars.ts` (ใหม่), `services/queries/site-content.ts`

## 2026-10-08 — เลิกใช้ค่าตั้งต้นของ Hero/การ์ดหมวด ใช้ skeleton แทน
- เนื้อหา Hero + การ์ด "คืนนี้อยากได้ฟีลไหน" มาจาก `GET /public/home` อย่างเดียว ไม่มีค่าตั้งต้นในหน้าเว็บแล้ว (ลบ `utils/categories.ts`) — กันเห็นข้อความตั้งต้นแวบก่อนเปลี่ยนเป็นของที่แอดมินแก้
- ระหว่างรอ: Hero แสดงพื้นสีกลางคืน + skeleton แทนหัวข้อ (ช่องค้นหาใช้ได้เลย) · กริดหมวดแสดง skeleton ตามช่อง bento เดิม
- โหลดไม่สำเร็จ (หลัง TanStack ลองซ้ำครบ): Hero แสดงข้อความ + ปุ่ม "ลองใหม่" และซ่อนกริดหมวด · เอาการรอภาพ Hero 1.5 วิออก (ภาพโหลดเมื่อรู้เนื้อหาแล้วเท่านั้น)
- ไฟล์: `utils/useHomeContent.ts`, `components/hero.tsx`, `components/categoryGrid.tsx`, `page.tsx`, `type/category.ts`

## 2026-10-08 — เอาไอคอนมุมซ้ายบนของการ์ดหมวดออก
- การ์ด "คืนนี้อยากได้ฟีลไหน" ไม่แสดงไอคอนหมวดมุมซ้ายบนแล้ว ให้เห็นภาพเต็มขึ้น · เนื้อหาการ์ดชิดล่างด้วย `justify-end`
- ตัด `icon` ออกจาก `HomeCategory` และไม่แปลง `homeCategoryIcon()` ใน `useHomeContent` อีก · ค่าตั้งต้นใน `utils/categories.ts` ไม่มี `icon` แล้ว (ลบคอลัมน์ใน DB ด้วย — migration `20261008000100_site_content_drop_category_icon`)
- ไฟล์: `components/categoryGrid.tsx`, `type/category.ts`, `utils/useHomeContent.ts`, `utils/categories.ts`

## 2026-10-07 — กันภาพ Hero โหลดซ้ำ + cache เนื้อหาหน้าแรกผิดรูป
- เปิดเว็บครั้งแรก (ยังไม่มี cache) ไม่โหลดภาพ Hero ตั้งต้นทิ้งก่อนรู้ว่าแอดมินตั้งภาพไว้ไหม: ระหว่างรอแสดงพื้นสีกลางคืน รอไม่เกิน 1.5 วิ และเลิกรอทันทีถ้า API ล้ม (ใช้ภาพตั้งต้น)
- ยิง `GET /public/home` ตั้งแต่ boot คู่กับ catalog (`prefetchSiteHome()` ใน `main.tsx`) ให้ render แรกได้ข้อมูลเร็วขึ้น
- cache ในเครื่องเปลี่ยนเป็น `nightout-site-home:v1` + ตรวจรูปแบบก่อนใช้ (ผิดรูป = ทิ้ง · ลบ key เก่า) และอ่าน localStorage ครั้งเดียว — กันหน้าแรกพังเมื่อสัญญา `PublicHomeResult` เปลี่ยน
- ไฟล์: `utils/useHomeContent.ts`, `components/hero.tsx`, `components/skyBackdrop.tsx`, `page.tsx`, `services/queries/site-content.ts`, `main.tsx`
