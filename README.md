# 🌙 NightOut

**NightOut** คือเว็บแอปสำหรับค้นหา จัดอันดับ และจองโต๊ะร้านกลางคืน เริ่มจากกรุงเทพฯ แล้วขยายไปทั่วประเทศ

ร้านแบ่งเป็น 3 ประเภท: **ผับ/บาร์** · **ร้านนั่งชิล** · **ร้านอาหารที่มีเครื่องดื่ม**

> **สถานะ:** 🧪 Demo — ทุกหน้าตาม [`docs/SITEMAP.md`](docs/SITEMAP.md) ใช้งานได้ด้วย **โหมดเดโม** (ข้อมูลร้านสมมติ 15 ร้าน เก็บในเบราว์เซอร์) · เชื่อม Supabase ตาม [`docs/SUPABASE.md`](docs/SUPABASE.md)

### 🧪 ลองใช้โหมดเดโม

1. `pnpm install` แล้ว `pnpm dev` → เปิด http://localhost:5173 (ลูกค้า + ร้าน) และ http://localhost:5174 (แอดมิน)
2. ไม่ต้องตั้ง `.env` — ถ้าไม่มี `VITE_SUPABASE_URL` แอปจะเข้าโหมดเดโมเอง (มีแถบม่วงด้านบน + ปุ่มรีเซ็ตข้อมูล)
3. หน้า `/login` มีปุ่มเข้าเร็ว **ลูกค้า / เจ้าของร้าน / Staff** · แอดมินกดปุ่มเข้าสู่ระบบ (เดโม) ที่ :5174

**ลองเส้นทางหลัก:** ลูกค้าจอง Moonlit Cellar → จ่ายมัดจำ (อัปโหลดรูปอะไรก็ได้) → สลับเป็นเจ้าของร้าน ยืนยันสลิปที่ `/merchant/deposits` → เปิด `/merchant/tonight` กรอกรหัสจองเพื่อเช็กอิน → กลับเป็นลูกค้า เขียนรีวิว

> ตอน dev web กับ admin เป็นคนละ origin จึงเก็บข้อมูลเดโมแยกกัน · ข้อมูลเดโมอยู่ใน `packages/mock` (แทนที่ด้วย API จริงทีละหน้า)

---

## ✨ ฟีเจอร์หลัก (MVP)

| ฟีเจอร์ | รายละเอียด |
|---|---|
| ⭐ **จัดอันดับดาว 1–5** | คิดคะแนนจากรีวิวที่เช็กอินจริง, จำนวนเช็กอิน, Safety Score และความครบของข้อมูลราคา แยกตามประเภทและย่าน |
| 💰 **Tag แนะนำ (Promoted)** | ร้านจ่ายเงินเพื่อขึ้นหน้าแรกหรือผลค้นหาได้ ติดป้าย "แนะนำ · โฆษณา" เสมอ และไม่มีผลต่อดาว |
| 🛡️ **ข้อมูลความปลอดภัย** | บอกว่าร้านมี ✅ / ไม่มี ❌ / ยังไม่มีข้อมูล ⚪ สำหรับ รปภ., CCTV, ทางหนีไฟ, ตรวจบัตร ฯลฯ พร้อมป้ายยืนยันโดย NightOut |
| 🧮 **ประเมินราคาก่อนไป** | คำนวณจากเมนู + service charge + VAT แล้วแสดงยอดรวมและยอดต่อหัว เก็บ snapshot ราคาไว้ตอนจอง |
| 📅 **จองโต๊ะ + มัดจำ** | เลือกโซนหรือโต๊ะ, ป้องกันจองซ้อน, โอนมัดจำผ่าน PromptPay + อัปโหลดสลิป (เงินเข้าบัญชีร้านโดยตรง) |
| 📲 **QR Check-in** | การ์ดหรือ PR หน้าร้านสแกน QR ได้เลย ถ้าไม่มาเช็กอินเกินเวลาที่ร้านตั้งไว้ ระบบยกเลิกโต๊ะอัตโนมัติ |
| 👯 **Share to Gang** | แชร์บัตรจอง (แผนที่, เวลา, โซน) เข้ากลุ่ม LINE ได้ทันที |
| 🟢🟡🔴 **Crowd Status** | สถานะความแน่นของร้านแบบ real-time ที่ร้านกดอัปเดตเอง |
| 📝 **รีวิว** | รีวิวได้เฉพาะคนที่เช็กอินแล้ว 1 booking = 1 รีวิว |
| 🏪 **Merchant Dashboard** | จัดการร้าน เมนู โต๊ะ มัดจำ การจอง หน้า "คืนนี้" สำหรับ Staff และ Analytics |
| 🗂️ **Admin Backoffice** | อนุมัติร้าน, ยืนยัน Safety, ดูแลรีวิว, ค่าคอมมิชชัน (Billing Events) และ Audit Log |

**Core Loop:** `Discover → Estimate → Check Availability → Book → Check-in → Review`

---

## 🚀 เริ่มต้นใช้งาน

**ต้องมี:** Node.js 22+, pnpm 10 (`corepack enable`) และ Docker (สำหรับ Supabase local)

```bash
pnpm install
cp .env.example .env                 # ใส่ค่า Supabase หลัง db:start
pnpm --filter @nightout/backend db:start   # Supabase local (Studio :54323)
pnpm dev                             # frontend :5173 · admin :5174 · (api: pnpm --filter @nightout/backend dev → :3000/api/docs)
```

| คำสั่ง | ทำอะไร |
|---|---|
| `pnpm dev` | รันทุกแอปพร้อมกัน (Turborepo) |
| `pnpm build` | build ทุก package |
| `pnpm test` | unit test (utils, ui tokens) + API e2e |
| `pnpm lint` / `pnpm typecheck` | ตรวจโค้ด |
| `pnpm --filter @nightout/frontend dev` | รันแอปเดียว |

## 🧱 Tech Stack

| ชั้น | เทคโนโลยี |
|---|---|
| Frontend | React + TypeScript + Vite + React Router + TanStack Query + **Ant Design v6** (+ ProComponents ใน admin) + Tailwind CSS + Phosphor Icons + Motion |
| Backend | NestJS (TypeScript) + nestjs-zod + Swagger |
| Database | Supabase (PostgreSQL, Auth, Storage, Realtime, RLS, pg_cron) |
| Infra | Terraform (Vercel + Supabase providers) |
| Hosting | Vercel project เดียว — services `frontend` (/), `admin` (/admin), `backend` (/api) ใน `vercel.json` |
| Monorepo | pnpm workspaces + Turborepo |
| Auth | Supabase Auth: email + password · Turnstile · MFA สำหรับ Admin |
| Notification | Web Push, LINE Messaging API, In-app |

## 📁 โครงสร้างโปรเจกต์ (แผน)

```
night-list/
├── apps/
│   ├── frontend/     # React — ลูกค้า + ร้าน (/merchant) + Staff Scanner (PWA)
│   ├── admin/        # React + antd Pro — Backoffice ทีม NightOut
│   └── backend/      # NestJS API: src/ (controllers) · src/modules/ (business logic) · supabase/ (migrations, RLS, seed)
├── packages/
│   ├── ui/           # antd theme + Tailwind preset (Midnight Gold)
│   ├── mock/         # โหมดเดโม: ข้อมูลสมมติ + store ในเบราว์เซอร์
│   ├── types/        # TypeScript types + Zod schemas
│   ├── config/       # eslint, tsconfig, tailwind preset
│   └── utils/        # price/star calculator, status transitions
├── infra/terraform/  # Vercel + Supabase (dev/staging/prod)
└── docs/
    ├── PROMPT.md       # สเปคเต็ม + prompt สำหรับ AI
    ├── ARCHITECTURE.md # สถาปัตยกรรมระบบ
    └── SITEMAP.md      # รายชื่อหน้าและ route
CLAUDE.md             # กติกาสำหรับ Claude (branch, commit, skills)
.claude/skills/       # Agent skills: ant-design, antd, frontend-design, animate ฯลฯ
```

## 🎨 ดีไซน์

ธีม **Midnight Gold** (ดำ · ทอง · ม่วง) รองรับ **Light / Dark mode** มี motion ตอนสลับธีม (circular reveal) และเคารพ `prefers-reduced-motion`

| Token | Dark | Light | ใช้กับ |
|---|---|---|---|
| Background | `#07070D` | `#FAF8F3` | พื้นหน้า |
| Surface | `#11111A` | `#FFFFFF` | header, แถบต่างๆ |
| Card | `#171520` | `#F4F1EA` | การ์ด, modal |
| Border | `#34283F` | `#E4DCCF` | ขอบ |
| Text / Muted | `#F5F1E8` / `#A7A1B3` | `#1A1523` / `#5E5670` | ตัวอักษร |
| Primary Gold | `#E8B64C` (highlight `#FFD77A`) | `#E8B64C` (ตัวอักษรทอง `#8A5A00`) | ปุ่มหลัก, ดาว, คะแนน |
| Accent Purple | `#A738F5` (ลิงก์ `#B86BFA`) | `#A738F5` (ลิงก์ `#7E22CE`) | accent, ลิงก์ |

**Tier:** S `#E8B64C` · A `#963BE8` · B `#5869C8` · C `#74788B`

🖼️ **Figma:** [NightOut Design](https://www.figma.com/design/FtXQS2NeyuHQZIA3chcvLL/NightList?node-id=7-4)

Motion ใช้ [Motion](https://motion.dev) (`motion/react`) ดูรายละเอียดทั้งหมดใน [`docs/PROMPT.md`](docs/PROMPT.md#ดีไซน์)

---|---|---|
| Background | `#09090B` | พื้นหน้า |
| Surface | `#111113` | การ์ด |
| Gold | `#D4AF37` | ปุ่มหลัก, ดาว, ยอดเงิน, ป้ายโฆษณา |
| Purple | `#7C3AED` | ปุ่มรอง, chip ที่เลือก, focus |
| Purple Light | `#A78BFA` | ลิงก์/ข้อความบนพื้นดำ |
| Text | `#F5F5F5` | ตัวอักษร |

---

## 🤖 วิธีใช้ Prompt

1. เปิดไฟล์ [`docs/PROMPT.md`](docs/PROMPT.md)
2. คัดลอกทั้งหมดไปวางใน AI สร้างโค้ด (Claude, Cursor, v0, Lovable, Bolt ฯลฯ)
3. AI จะเริ่มจากการเสนอ Sitemap + User Flow แล้วทำตาม "ลำดับการส่งงาน" ในไฟล์ทีละขั้น

## 🌿 Git Branching

| Branch | ใช้ทำอะไร |
|---|---|
| `demo` | ตัว dev — งานใหม่ทั้งหมดขึ้นที่นี่ก่อน ลองใช้ / ทดสอบบน branch นี้ |
| `main` | ตัวจริง — ใช้ deploy ขึ้นเว็บ · merge จาก `demo` เมื่อทุกอย่างโอเคแล้ว (ผ่าน Pull Request `demo → main`) |

- ไม่แตก branch ย่อย · ห้าม push ตรงเข้า `main`
- Vercel: production = `main`, preview = `demo`

## 🗺️ Roadmap

- **Phase 1 — MVP**
  - 1A: ฝั่งลูกค้า
  - 1B: ฝั่งร้าน (Merchant)
  - 1C: Admin Backoffice
- **Phase 2 — AI & Growth**
  - AI Recommendation และ Chatbot
  - Campaign tracking
  - Payment gateway อัตโนมัติ
  - eKYC
  - ขยายไปต่างจังหวัด

## ⚖️ ข้อกำหนดทางกฎหมาย

- **อายุ:** ต้องยืนยันอายุ 20 ปีขึ้นไป (Age Gate)
- **พ.ร.บ.ควบคุมเครื่องดื่มแอลกอฮอล์:**
  - ไม่โฆษณาเครื่องดื่มแอลกอฮอล์ และไม่ทำโปรลด แจก หรือแถมแอลกอฮอล์
  - ไม่ใช้คำเลี่ยงเพื่อทำโปรเหล่านี้
  - แพลตฟอร์มเน้นข้อมูลร้าน ราคา ความปลอดภัย และการจอง
- **PDPA:** มี Consent, Privacy Policy, ลบบัญชีได้ และใช้ตำแหน่งเฉพาะตอนจำเป็น
- ข้อความ "ดื่มไม่ขับ" พร้อมปุ่มเรียกรถกลับบ้าน

> ส่วนนี้เป็นแนวทางเบื้องต้น ไม่ใช่คำปรึกษาทางกฎหมาย ควรให้ทนายตรวจก่อนเปิดใช้งานจริง

---

© NightOut
