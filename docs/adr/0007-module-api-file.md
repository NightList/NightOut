# ADR 0007: API ของหน้าอยู่ใน `modules/<หน้า>/api.ts` ของโมดูลนั้น

- **สถานะ:** Accepted — ย้ายครบทุกโมดูลของ `apps/frontend` และ `apps/admin` แล้ว (2026-10-09)
- **วันที่:** 2026-10-09
- **Supersede บางส่วน:** ADR 0006 ข้อ "หน้า import ผ่าน `services/data.ts` เท่านั้น" และการแยก `services/api` / `services/queries` / `queries/keys.ts` ต่อโดเมนฝั่งหน้าเว็บ (ฝั่ง backend + contracts ของ ADR 0006 คงเดิม)

## Context
หน้าเดียวต้องเปิด 5 ไฟล์ใน 3 โฟลเดอร์ (`services/api/<domain>.ts` → `queries/keys.ts` → `queries/<domain>.ts` → `services/data.ts` → `page.tsx`) — แก้หรือไล่บั๊กเรื่องเดียวต้องกระโดดหลายที่ และ F12 จากหน้าไปเจอ `export *` ก่อนถึงโค้ดจริง

## Decision
**กฎข้อเดียว: ทุก API ที่โมดูลใช้ อยู่ใน `api.ts` ของโมดูลนั้น**

```
apps/frontend/src/modules/book/
  page.tsx
  api.ts          ← Rest + useQuery/useMutation + query key ของทุกเส้นที่ book ใช้
  components/ hooks/ utils/
```

- เรียก `Rest` (`@nightout/utils/rest`) ตรงใน `api.ts` · type ของ body/response จาก `@nightout/contracts` (`satisfies C.XBody`, `Rest.get<C.XResult>`)
- อ่าน = hook `useQuery` ใน `api.ts` · query key ขึ้นต้นด้วยชื่อโดเมน (`['booking', …]`) ให้ invalidate ทั้งโดเมนได้
- เขียน = ฟังก์ชันหรือ `useMutation` ใน `api.ts` · ไม่ต้อง `refresh()` — Rest โหลด store ใหม่ให้เอง (`afterWrite` → `refreshAfterWrite`)
- 2 โมดูลใช้เส้นเดียวกัน → **ประกาศในแต่ละ `api.ts`** (ซ้ำ 1–3 บรรทัด ไม่ import ข้ามโมดูล) — type จาก contracts ชุดเดียวกัน typecheck ไล่ให้ครบเมื่อ body เปลี่ยน
- component ใช้ข้ามหน้าใน `ui/` ที่เรียก API เอง (เช่น `favoriteButton.tsx`) ประกาศเส้นนั้นในไฟล์ component · `services/auth.tsx` ก็เช่นกัน (`/me/profile`)
- `services/` เหลือของที่ไม่ใช่ API รายหน้า: `sync.ts` (catalog + `/me/overview` ตอนเปิดแอป) · `mappers/` · `auth.tsx` · `api/storage.ts` (อัปโหลดไฟล์) · `data.ts` (อ่าน store) — ลบ `services/api/<domain>.ts`, `services/queries/*` และ `queries/keys.ts` แล้ว

### Backoffice (`apps/admin`)
- hook กลางคงอยู่ `services/adminData.ts`: `useAdminView(view, opts)` (GET `/admin/views/:view`) · `useAdminAction()` (ส่ง `{ method, path, body, success }` → invalidate `['admin']` ทุกหน้า) · `useSignedUrl`
- `modules/<หน้า>/api.ts` ประกาศของหน้านั้น: view hook ที่ผูก opts ไว้ (`useDeposits = () => useAdminView('admin_deposits', { order: … })`) + action builder ที่มี type ของ body (`reviewDepositAction(id, body: C.ReviewDepositBody): AdminActionInput`)
- หน้าเรียก `act.mutate({ ...reviewDepositAction(d.id, { approve: true }), success: '…' })` — path / method / body ไม่อยู่ในหน้าแล้ว
- query อื่นของ admin (`/admin/dashboard`, `/admin/roles`, `/admin/master/:table`) อยู่ใน `api.ts` ของหน้าที่ใช้ และ key ต้องขึ้นต้น `['admin', …]` ให้ `useAdminAction` รีเฟรชได้

## เพิ่มเส้นใหม่
1. migration (`app_*`) → 2. `contracts/<domain>.ts` → 3. `domains/<domain>/` (dto + controller) → 4. `modules/<หน้า>/api.ts`
ถ้า backend มีเส้นแล้ว = ทำแค่ข้อ 4

## Consequences
- **ได้:** เปิดโฟลเดอร์หน้าเดียวเห็นทั้ง UI และ API · F12 จากหน้าเจอโค้ดจริง · กฎเดียวไม่ต้องตัดสินใจว่าวางที่ไหน
- **เสีย:** เส้นที่หลายหน้าใช้ประกาศซ้ำ (URL เปลี่ยน = ค้นแก้ทุก `api.ts` · ตอนนี้ซ้ำ: `PATCH /me/profile` (onboarding + profile) · admin `bars/:id/status` (bars + merchants) · view `admin_bars` (bars, homeContent, users))
- **ย้ายแล้ว:** frontend 25 โมดูล (`book` นำร่อง แล้วตามด้วยที่เหลือ) + admin 16 โมดูล · พฤติกรรมเดิม (ชื่อฟังก์ชัน / query key / ข้อความเดิม)
