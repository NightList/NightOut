## 2026-10-08 — แผนที่ responsive และ fullscreen

- ใช้ความสูงตาม viewport ปัจจุบัน และเปิด map ใน Modal หลัง animation จบ โดยมี map ทำงานเพียงตัวเดียว
- Shared map layer ตรวจขนาด container, resize WebGL และใช้ raster สำรองเมื่อโหลดเกินเวลา/เกิด runtime error พร้อมแจ้งเมื่อ raster โหลดไม่ได้
- ไฟล์หลัก: `page.tsx`, `ui/components/barMap.tsx`, `ui/components/mapBaseLayer.tsx`, `ui/utils/mapStyle.ts`, `ui/utils/mapTiles.ts`
