# เชื่อม Supabase (project ที่มีอยู่แล้ว)

> Project จริง: **Nightout Project** · ref `pxueavqyykdipcjqbxyd` · Tokyo (ap-northeast-1) · URL `https://pxueavqyykdipcjqbxyd.supabase.co`

สถานะตอนนี้: แอปทำงานใน **โหมดเดโม** (`@nightout/mock` เก็บใน localStorage) ถ้ามี `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` ระบบ **สมัคร/เข้าสู่ระบบ** จะไปที่ Supabase Auth ทันที ส่วนข้อมูลร้าน/การจองยังเป็นเดโมจนกว่าจะย้ายทีละหน้า (ดูข้อ 5)

## 1. เอาค่ามาจากไหน

Supabase Dashboard → ปุ่ม **Connect** (บนสุด) หรือ **Project Settings → API Keys**

Supabase ใหม่เรียก key ว่า **Publishable** (`sb_publishable_...`) และ **Secret** (`sb_secret_...`) ใช้แทน anon / service_role ได้เลย (ใส่ในตัวแปรชื่อเดิม)

| ค่า | ใช้ที่ | ตัวแปร |
|---|---|---|
| Project URL | frontend, admin, backend | `VITE_SUPABASE_URL`, `SUPABASE_URL` |
| anon public key | frontend, admin | `VITE_SUPABASE_ANON_KEY` |
| service_role key (**ลับ** ห้ามใส่ฝั่งเว็บ) | backend เท่านั้น | `SUPABASE_SERVICE_ROLE_KEY` |
| Connection string แบบ **Transaction pooler** port 6543 (ปุ่ม Connect) | backend บน Vercel | `DATABASE_URL` |

## 2. ใส่ค่าในเครื่อง

```bash
cp .env.example .env      # ครั้งแรก
# แก้ .env:
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # backend เท่านั้น
```

`.env` อยู่ใน `.gitignore` แล้ว **ห้าม commit** · frontend/admin อ่าน `.env` ไฟล์เดียวกันที่ root (`envDir` ใน `vite.config.ts`)

บน Vercel ตัวแปร `VITE_*` ถูกส่งเข้า build ได้เพราะประกาศไว้ใน `turbo.json` → `tasks.build.env` (Turborepo strict mode จะตัดตัวแปรที่ไม่ได้ประกาศทิ้ง)

## 3. รัน migration (สร้างตาราง)

```bash
pnpm --filter @nightout/backend db:login   # ครั้งแรก: เปิดเบราว์เซอร์ให้ล็อกอิน Supabase
pnpm --filter @nightout/backend db:link    # ครั้งแรก: link กับ pxueavqyykdipcjqbxyd (ถามรหัส DB)
pnpm --filter @nightout/backend db:push    # apply apps/backend/supabase/migrations/*
```

migration ที่มี (แยกตามโดเมน — รายละเอียด `docs/DATABASE.md` หัวข้อ 2):
- เฟส 1 `20261002000100` … `000800` — extensions/enums, ผู้ใช้/แจ้งเตือน, master, ร้าน (+ตาราง 1:1, PR), เมนู/ราคา, โต๊ะ/การจอง, รีวิว/ร้านโปรด, **view + RPC + RLS + Storage + Realtime**
- เฟส 2 `000900` … `001400` — มัดจำ (DRAFT), แชร์/ความปลอดภัย/ความแน่น, ranking, โปรโมท, billing, PDPA retention
- `001500` — index บน FK ทุกตัว + เปิด RLS
- `001600` — Backoffice: view `admin_*` (อ่านได้เฉพาะ ADMIN ที่ผ่าน MFA) + ฟังก์ชันการกระทำของแอดมิน (เรียกผ่าน NestJS เท่านั้น)
- `001700` — การกระทำของลูกค้า/ร้าน `app_*` (จอง, มัดจำ, รีวิว, ร้านโปรด, จัดการร้าน ฯลฯ — เรียกผ่าน NestJS เท่านั้น) + job หมดเวลาการจอง
- migration รุ่นแรก 0001–0003 อยู่ที่ `docs/legacy-migrations/`

หลังแก้ migration ทุกครั้ง: `pnpm --filter @nightout/backend db:types` (สร้าง `packages/types/src/database.generated.ts` ใหม่)

ข้อมูลร้านเดโม: `supabase/seed.sql` (สร้างจาก `@nightout/mock` → `pnpm --filter @nightout/backend db:seed:gen`)

### เปลี่ยน schema ทั้งชุด / ใส่ร้านเดโมใหม่ (⚠️ ลบข้อมูลทั้งหมดใน DB)
```bash
pnpm --filter @nightout/backend db:reset:remote   # = supabase db reset --linked → รัน migration ใหม่ทั้งหมด + seed.sql
```

หลัง push ให้แก้ PromptPay ของแพลตฟอร์มใน Table Editor → `platform_settings` → key `deposit_promptpay`

## สร้างบัญชีแอดมิน / ร้าน

ลูกค้าสมัครเองที่ `/register` ได้ · บัญชีแอดมิน/ร้านสร้างด้วยคำสั่งนี้ (ใช้ Secret key ใน `.env` — รันในเครื่องทีมเท่านั้น)

> มีแอดมินคนแรกแล้ว เพิ่มบัญชีอื่นได้จาก Backoffice → **ผู้ใช้ → เพิ่มผู้ใช้** (ไม่ต้องรันสคริปต์) · สคริปต์ด้านล่างใช้สร้างแอดมินคนแรก หรือทำในเครื่องทีม

```bash
# แอดมิน
pnpm --filter @nightout/backend user:create --email admin@nightout.co --name "แอดมิน" --role ADMIN
# เจ้าของร้าน (ผูกกับร้านด้วย slug — ดูได้ใน Table Editor → bars)
pnpm --filter @nightout/backend user:create --email owner@bar.com --name "เจ้าของร้าน" --role MERCHANT --bar moonlit-cellar
# ผู้จัดการร้าน
pnpm --filter @nightout/backend user:create --email mgr@bar.com --name "ผู้จัดการ" --role MANAGER --bar moonlit-cellar
# พนักงานร้าน
pnpm --filter @nightout/backend user:create --email staff@bar.com --name "พนักงาน" --role STAFF --bar moonlit-cellar
```

- ไม่ใส่ `--password` = สุ่มให้และแสดงครั้งเดียว · บัญชีใช้ได้ทันที (ไม่ต้องยืนยันอีเมล)
- อีเมลที่มีบัญชีอยู่แล้ว = อัปเดต role / ร้าน ให้ (ไม่สร้างซ้ำ ไม่เปลี่ยนรหัส)
- `MERCHANT` = เจ้าของร้าน · ร้านยังไม่มีเจ้าของ → เจ้าของหลัก (`bars.owner_id`) · มีอยู่แล้ว → **เจ้าของร่วม** (OWNER ใน `bar_staff` เจ้าของเดิมไม่ถูกเปลี่ยน)
- `MANAGER` = ผู้จัดการร้าน (`users.role` = MERCHANT เพื่อเข้าเมนูร้านค้าได้ครบ · `bar_staff.role` = MANAGER)
- `STAFF` = พนักงาน (`users.role` = STAFF · `bar_staff.role` = STAFF)
- บันทึกทุกครั้งใน `audit_logs`
- หน้า **ผู้ใช้**: `SUPER_ADMIN` เพิ่ม/แก้ไข/ลบบัญชีได้ทุกคน · `ADMIN` แก้ไขได้เฉพาะบัญชีตัวเอง (ชื่อ อีเมล เบอร์โทร และรหัสผ่าน) และเปลี่ยนชั้นบัญชีไม่ได้
- หน้า **จัดการทีมงาน**: `SUPER_ADMIN` เพิ่ม/แก้ไข/ลบ/เรียงลำดับได้ทั้งหมด · `ADMIN` แก้ไขและซ่อน/แสดงได้เฉพาะแถวที่ `contacts.email` ตรงกับอีเมลบัญชีตัวเอง
- เข้า Backoffice (`/admin/login`): อีเมล + รหัสผ่าน → ต้องเป็น `ADMIN` ในตาราง `users` → MFA แบบ TOTP (ครั้งแรกสแกน QR ผูกแอป Authenticator) · ต้องเปิด TOTP ที่ Authentication → Multi-Factor (เปิดอยู่แล้วเป็นค่าเริ่มต้น)
  - แอดมินทำมือถือหาย: ลบ factor ของบัญชีนั้นที่ Authentication → Users → เลือกบัญชี → MFA factors แล้วให้ล็อกอินใหม่เพื่อผูกแอปอีกครั้ง
- Backoffice **อ่านและเขียนผ่าน NestJS ทั้งหมด** (ADR 0003: view `admin_*` → `GET /admin/views/:view` · ปุ่มอนุมัติร้าน ตรวจสลิป ซ่อนรีวิว เปลี่ยนสิทธิ์ ฯลฯ → `POST/PATCH /admin/*`) ที่ `VITE_API_BASE_URL` (ค่าเริ่มต้น dev `http://localhost:3000/api`) → ต้องเปิด backend ด้วย (`pnpm dev` ที่ root เปิดให้ครบ) และมี `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + anon key ใน `.env` · `CORS_ORIGINS` ต้องมี `http://localhost:5174`
- ⚠️ ปุ่ม **Add user** ใน Supabase Dashboard ใช้ไม่ได้ (ไม่มีช่องวันเกิด → trigger ตรวจอายุ 20+ ปฏิเสธ)

## 4. Vercel

Project → Settings → Environment Variables (ทั้ง Production และ Preview):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY   (Sensitive)
CORS_ORIGINS=https://<โดเมน>
JOB_SECRET, QR_SIGNING_KEY  (สุ่มยาวๆ)
PAYOUT_ENCRYPTION_KEY       (สุ่มยาวๆ ≥ 16 ตัว · ใช้เข้ารหัสเลขบัญชีร้าน · ห้ามเปลี่ยนหลังมีข้อมูลแล้ว · Sensitive)
```

Supabase → Authentication → URL Configuration: ใส่ Site URL = โดเมนเว็บ และ Redirect URLs = `https://<โดเมน>/**`
ถ้าใช้ปุ่ม Google/Facebook ในหน้า Login: Authentication → Providers → เปิด Google / Facebook แล้วใส่ Client ID/Secret จาก Google Cloud / Meta for Developers

## 5. เช็กว่าเชื่อม Supabase แล้ว

เปิดเว็บ → F12 → แท็บ Console → พิมพ์ `NightOut` ในช่อง filter

- `✅ เชื่อมต่อ Supabase สำเร็จ (<host>) · ร้าน N · รีวิว N · ย่าน N` — อ่านข้อมูลสาธารณะได้
- `✅ เชื่อมต่อ NestJS API สำเร็จ (<url>)` — หลังบ้านตอบ
- `✅ โหลดข้อมูลผู้ใช้จาก Supabase (<อีเมล> · <role>) · การจอง N · แจ้งเตือน N …` — หลังล็อกอิน
- `API POST /bookings → 201` / `อัปโหลดไฟล์ deposit-slips/…` — ทุกครั้งที่เขียนข้อมูล
- พิมพ์ `__nightout()` ใน Console เพื่อดูสรุปจำนวนข้อมูลที่โหลดอยู่
- แอดมิน (`/admin`) ใช้ป้าย `NightOut Admin`
- ❌ สีแดง = ต่อไม่ได้ พร้อมสาเหตุ (เช่น migration ยังไม่ได้ push → `Could not find the function …`)

## 6. สถานะ

ทุกหน้า (ลูกค้า · ร้าน · แอดมิน) อ่าน/เขียนข้อมูลจริงแล้ว — ไม่มีข้อมูลเดโมใน localStorage (`@nightout/mock` เหลือเป็นแค่ cache/type ของหน้าเว็บ) · การโอนเงินมัดจำให้ร้าน/คืนลูกค้าจริงยังเป็น DRAFT รอข้อ 10.3
