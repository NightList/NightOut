# NightOut — ทะเบียนโมดูล

ไฟล์นี้คือแหล่งความจริงว่าในโค้ดมีโมดูลอะไรบ้าง ทำอะไร และอยู่ในแผนช่วงไหน
- โครงโฟลเดอร์ภายในแอปและกติกาของแต่ละชั้น → [ARCHITECTURE.md](ARCHITECTURE.md) §3 / §4 · route และ navigation → [SITEMAP.md](SITEMAP.md)
- **เพิ่ม / ลบ / เปลี่ยนชื่อโมดูล ต้องแก้ไฟล์นี้ในงานเดียวกัน**
- ของที่ไม่อยู่ใน MVP หรือ roadmap (`docs/PROMPT.md` หัวข้อ "Development Phases" + "ไม่ทำใน MVP", `README.md` หัวข้อ Roadmap) ต้องถามเจ้าของ repo ก่อนเริ่ม · ตกลงแล้วให้ใส่ Phase เป็น `นอก MVP — อนุมัติ YYYY-MM-DD`

**ค่าในคอลัมน์ Phase:** `1A` ลูกค้า · `1B` ร้าน · `1C` Backoffice (ตาม PROMPT.md) · `กฎธุรกิจ` = ไม่ได้อยู่ในรายการ MVP ตรงๆ แต่ตกลงแล้วในหัวข้อ "กฎธุรกิจที่ตกลงแล้ว" ของ `CLAUDE.md` · `นอก MVP — …` = ของนอกแผน

## 1. apps/frontend — ลูกค้า (`src/modules/*`)

| โมดูล | ทำอะไร | route | โดเมน API | หน้าคู่ (admin) | Phase |
|---|---|---|---|---|---|
| `home` | หน้าแรก: Hero, หมวด "คืนนี้อยากได้ฟีลไหน", ร้านแนะนำ | `/` | `catalog` · `site-content` | `homeContent` | 1A (เนื้อหาแก้ได้: นอก MVP — ยังไม่ระบุวันอนุมัติ) |
| `map` | แผนที่ร้านเต็มจอ (Leaflet + OpenFreeMap) | `/map` | `catalog` | — | กฎธุรกิจ |
| `login` | เข้าสู่ระบบ email + Google / Facebook | `/login` | Supabase Auth | — | 1A |
| `register` | สมัครสมาชิก | `/register` | Supabase Auth · `account` | — | 1A |
| `verifyEmail` | ยืนยันอีเมล | `/verify-email` | Supabase Auth | — | 1A |
| `forgotPassword` | ขอลิงก์รีเซ็ตรหัสผ่าน | `/forgot-password` | Supabase Auth | — | 1A |
| `resetPassword` | ตั้งรหัสผ่านใหม่ | `/reset-password` | Supabase Auth | — | 1A |
| `acceptInvite` | รับคำเชิญเข้าทีมร้าน | `/accept-invite` | `bar-team` | — | 1B |
| `onboarding` | Age Gate / Consent / ความชอบ | `/onboarding` | `account` | — | 1A |
| `ranking` | จัดอันดับรายสัปดาห์/รายเดือนตามโหวต (GSAP) | `/ranking` | `catalog` | `ranking` | 1A |
| `search` | ค้นหา / กรองร้าน (รวมกรอง PR) | `/search` | `catalog` | — | 1A |
| `barDetail` | หน้าร้าน: ข้อมูล Safety ความแน่น เมนู โปร | `/bars/:slug` | `catalog` · `booking` · `pricing` | `bars` · `safety` | 1A |
| `barReviews` | รีวิวทั้งหมดของร้าน | `/bars/:slug/reviews` | `catalog` · `review` | `reviews` | 1A |
| `book` | จองโต๊ะ + เลือกโปร 1 อย่าง + Checkout (เบอร์ + ยอมรับเงื่อนไขมัดจำ) | `/bars/:slug/book` | `booking` · `pricing` | `bookings` | 1A |
| `bookings` | รายการจองของฉัน | `/bookings` | `booking` | `bookings` | 1A |
| `bookingDetail` | รายละเอียดการจอง + QR เช็กอิน | `/bookings/:id` | `booking` | `bookings` | 1A |
| `deposit` | ส่งสลิปมัดจำ | `/bookings/:id/deposit` | `deposit` · `storage` | `deposits` | 1A |
| `share` | บัตรจองที่แชร์ให้แก๊ง | `/share/:token` | `booking` | — | 1A |
| `reviewNew` | เขียนรีวิว + แนบรูป/วิดีโอ ≤ 6 ไฟล์ | `/reviews/new` | `review` · `storage` | `reviews` | 1A |
| `myReviews` | รีวิวของฉัน | `/reviews` | `review` | `reviews` | 1A |
| `favorites` | ร้านโปรด | `/favorites` | `account` | — | 1A |
| `notifications` | แจ้งเตือน | `/notifications` | `account` | — | 1A |
| `profile` | โปรไฟล์ | `/profile` | `account` | `users` | 1A |
| `settings` | ตั้งค่าบัญชี / ลบบัญชี (PDPA) | `/settings` | `account` | `users` | 1A |
| `about` | เกี่ยวกับเรา / ติดต่อ + ทีมงาน NightOut | `/about` · `/contact` | `site-team` | `team` | นอก MVP — ยังไม่ระบุวันอนุมัติ |
| `static` | หน้าข้อความ terms / privacy / cookies | `/terms` · `/privacy` · `/cookies` | — | — | 1A (PDPA) |
| `notFound` | หน้า 404 | `*` | — | — | ระบบ |

## 2. apps/frontend — ร้าน (โฟลเดอร์ `merchant` → `src/modules/merchant/*`)

| โมดูล | ทำอะไร | route | โดเมน API | หน้าคู่ (admin) | Phase |
|---|---|---|---|---|---|
| `join` | สมัครลงร้าน | `/merchant/join` | `bar` | `merchants` | 1B |
| `status` | สถานะการสมัคร / รออนุมัติ | `/merchant/status` | `bar` | `merchants` | 1B |
| `dashboard` | ภาพรวมร้าน | `/merchant` | `bar` · `booking` | — | 1B |
| `tonight` | คืนนี้ + สแกน QR เช็กอิน + ความแน่น | `/merchant/tonight` | `booking` · `bar` | — | 1B |
| `bookings` | จัดการการจอง / ย้ายโต๊ะ | `/merchant/bookings` | `booking` | `bookings` | 1B |
| `deposits` | มัดจำของร้าน / ยืนยันคืนมัดจำ | `/merchant/deposits` | `deposit` | `deposits` | 1B |
| `store` | ข้อมูลร้าน เวลาเปิด-ปิด สไตล์ ลิงก์ | `/merchant/store` | `bar` · `storage` | `bars` | 1B |
| `menu` | เมนูและราคา | `/merchant/menu` | `bar` | — | 1B |
| `promotions` | โปรของร้าน (มี cutoff time) | `/merchant/promotions` | `bar` | `promotions` | 1B |
| `tables` | โซน / โต๊ะ | `/merchant/tables` | `bar` | — | 1B |
| `safety` | มาตรการ Safety | `/merchant/safety` | `bar` | `safety` | 1B |
| `settings` | ตั้งค่าการจอง มัดจำ บัญชีรับเงิน จำนวน PR | `/merchant/settings` | `bar` | — | 1B |
| `promote` | ซื้อแพ็กเกจโปรโมทร้าน | `/merchant/promote` | `promotion` | `promotions` | 1B |
| `reviews` | รีวิวของร้าน | `/merchant/reviews` | `review` | `reviews` | 1B |
| `analytics` | สถิติร้าน | `/merchant/analytics` | `bar` · `booking` | — | 1B |
| `billing` | ค่าคอมของร้าน | `/merchant/billing` | `billing` | `billing` | 1B |
| `staff` | ทีมร้าน: เชิญ / นำออก | `/merchant/staff` | `bar-team` | — | 1B |

## 3. apps/admin — Backoffice (`src/modules/*`)

| โมดูล | ทำอะไร | route | โดเมน API / view | หน้าคู่ (frontend) | Phase |
|---|---|---|---|---|---|
| `login` | เข้าสู่ระบบ + MFA | `/login` | Supabase Auth | — | 1C |
| `dashboard` | แดชบอร์ด | `/` | `backoffice` (`/admin/dashboard`) | — | 1C |
| `merchants` | ร้านรออนุมัติ | `/merchants` | `bar` · `admin_bars` | `merchant/join` · `merchant/status` | 1C |
| `bars` | จัดการร้าน / ระงับ / Editor's Pick | `/bars` | `bar` · `admin_bars` | `barDetail` · `merchant/store` | 1C |
| `safety` | ยืนยัน Safety | `/safety` | `bar` · `admin_safety_queue` | `merchant/safety` | 1C |
| `ranking` | ดาว / อันดับ | `/ranking` | `bar` · `admin_bars` | `ranking` | 1C |
| `promotions` | ตรวจถ้อยคำโปร + คำสั่งซื้อโปรโมท | `/promotions` | `promotion` · `admin_bar_promotions` · `admin_promoted_listings` | `merchant/promotions` · `merchant/promote` | 1C |
| `users` | ผู้ใช้ ชั้นบัญชี แบน / ปลดแบน | `/users` | `account` · `admin_users` | `profile` · `settings` | 1C |
| `team` | ทีมงาน NightOut หน้า /about | `/team` | `site-team` · `admin_team_members` | `about` | นอก MVP — ยังไม่ระบุวันอนุมัติ |
| `homeContent` | แก้ Hero / ชื่อ section / การ์ดหมวดของหน้าแรก | `/home-content` | `site-content` · `admin_home_content` · `admin_home_categories` | `home` | นอก MVP — ยังไม่ระบุวันอนุมัติ |
| `bookings` | ติดตามการจอง | `/bookings` | `backoffice` · `admin_bookings` | `bookings` · `merchant/bookings` | 1C |
| `deposits` | ตรวจสลิป / ปฏิเสธพร้อมเหตุผล / รอคืนลูกค้า | `/deposits` | `deposit` | `deposit` · `merchant/deposits` | 1C |
| `reviews` | รีวิวที่ถูกรายงาน | `/reviews` | `review` | `barReviews` · `reviewNew` | 1C |
| `billing` | ค่าคอม (Billing Events) | `/billing` | `backoffice` · `admin_billing_events` | `merchant/billing` | 1C |
| `auditLogs` | Audit Log | `/audit-logs` | `backoffice` · `admin_audit_logs` | — | 1C |
| `settings` | ดูค่าระบบ สไตล์ร้าน มาตรการ Safety (อ่านอย่างเดียว · แก้ผ่าน migration/seed) | `/settings` | `backoffice` (`/admin/master/:table`) | — | 1C |

## 4. apps/backend — โดเมน (`src/domains/*`)

| โดเมน | ทำอะไร | controller | Phase |
|---|---|---|---|
| `catalog` | ข้อมูลตั้งต้นของเว็บ (ร้าน รีวิว ย่าน สไตล์ ตั้งค่า แพ็กเกจ) | public | 1A |
| `booking` | จอง ยกเลิก สถานะ เช็กอิน ย้ายโต๊ะ โซนว่าง บัตรแชร์ | public · me · merchant | 1A / 1B |
| `deposit` | ส่งสลิป ตรวจสลิป ปิดยอด คืนมัดจำ สมุดมัดจำ | me · merchant · admin | 1A / 1B / 1C |
| `review` | เขียน รายงาน จัดการรีวิว | me · admin | 1A / 1C |
| `bar` | สมัครลงร้าน ข้อมูลร้าน เมนู โปร ค่าธรรมเนียม โซน Safety ตั้งค่า บัญชีรับเงิน ความแน่น อนุมัติ | me · merchant · admin | 1B / 1C |
| `bar-team` | ทีมร้าน: เชิญ นำออก คำเชิญของฉัน | me · merchant | 1B |
| `account` | โปรไฟล์ overview แจ้งเตือน ร้านโปรด ลบบัญชี · ผู้ใช้ ชั้นบัญชี แบน | me · admin | 1A / 1C |
| `promotion` | โปรโมทร้าน: ซื้อแพ็กเกจ ตรวจคำสั่งซื้อ | merchant · admin | 1B / 1C |
| `billing` | ค่าคอมของร้าน | merchant | 1B |
| `pricing` | ประเมินราคา (ไม่แตะ DB) | public | 1A |
| `storage` | URL อัปโหลด / URL ชั่วคราว | storage (controller เดียว) | 1A / 1B |
| `backoffice` | การอ่านของหน้าแอดมิน: แดชบอร์ด view `admin_*` ตาราง master | admin | 1C |
| `site-team` | ทีมงาน NightOut หน้า /about (อ่านสาธารณะ + จัดการ) | public · admin | นอก MVP — ยังไม่ระบุวันอนุมัติ |
| `site-content` | เนื้อหาหน้าแรก: Hero ชื่อ section การ์ดหมวด (อ่านสาธารณะ + แก้) | public · admin | นอก MVP — ยังไม่ระบุวันอนุมัติ |

**ระบบ (นอก `domains/`):** `health` (เช็กสถานะ) · `jobs` (`/jobs/*` เรียกจาก pg_cron: auto-cancel / no-show, หมดเวลา pending, notification outbox, คำนวณดาว, เปิด/ปิดโปรโมท)
