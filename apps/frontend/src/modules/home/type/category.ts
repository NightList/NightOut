/** การ์ดหมวดหมู่ในหน้าแรก (หลังแปลงจาก API) — ลิงก์ไป /ranking, /search?category= หรือ /search?style= */
export interface HomeCategory {
  /** ช่องบนกริด bento (popular = การ์ดใหญ่ · party = กว้าง 2) */
  key: string;
  title: string;
  /** คำอธิบายสั้นใต้ชื่อหมวดบนการ์ด */
  hint: string;
  to: string;
  /** ภาพพื้นการ์ด */
  image: string;
  /** ป้ายเล็กเหนือชื่อ เช่น "อันดับประจำสัปดาห์" */
  badge?: string;
}
