# Prompt: NightOut — เว็บแอปรวมร้านกลางคืน + Tier List + จองโต๊ะ (v2.8)

> คัดลอกทั้งหมดด้านล่างไปใช้กับ AI สร้างโค้ด (Claude, Cursor, v0, Lovable, Bolt ฯลฯ)

---

## บทบาท
คุณเป็น Full-stack Developer และ UX Designer ช่วยสร้างเว็บแอป **"NightOut"** (Responsive, Mobile-first, ทำเป็น PWA ได้) UI เป็นภาษาไทยทั้งหมด

NightOut เป็นแพลตฟอร์มสำหรับค้นหา จัดอันดับ และจองโต๊ะร้านกลางคืน โดยเริ่มจากกรุงเทพฯ แล้วค่อยขยายไปทั่วประเทศ ร้านแบ่งเป็น 3 ประเภทหลัก คือ **ผับ/บาร์**, **ร้านนั่งชิล** และ **ร้านอาหารที่มีเครื่องดื่ม**

**Core Loop:** Discover → Estimate → Check Availability → Book → Check-in → Review

## เสาหลัก 4 ข้อของสเปค
1. **Tier List ร้านกลางคืน**: จัดอันดับร้านในกรุงเทพฯ (อนาคตทั่วประเทศ)
2. **จองโต๊ะ**: มีมัดจำ, เช็กอินด้วย QR และยกเลิกอัตโนมัติ
3. **ความปลอดภัยของร้าน**: บอกให้ชัดว่าร้านไหนมีมาตรการความปลอดภัยอะไร และร้านไหนไม่มี
4. **ความโปร่งใสเรื่องราคา**: รู้ค่าใช้จ่ายโดยประมาณก่อนไป

## ปัญหาที่จะแก้
1. ลูกค้าไม่รู้ราคากลางของร้าน ไม่รู้ว่าไป 3-4 คนจะจ่ายเท่าไหร่
2. ร้านที่ไม่ดังแทบไม่มีคนไป ต้องการช่องทางดึงลูกค้า
3. หาร้านตามสไตล์ที่ชอบยาก ไม่รู้ว่าร้านไหนเข้ากับกลุ่มตัวเอง
4. ลูกค้าจองแล้วไม่มา (No-show) ซึ่งเป็นปัญหาใหญ่ของร้าน
5. ไม่รู้ว่าร้านปลอดภัยแค่ไหน และไม่รู้ว่าตอนนี้ร้านแน่นหรือยังก่อนออกเดินทาง
6. เพื่อนในกลุ่มหาร้านไม่เจอ หรือจำเวลานัดไม่ได้

---

## User Roles

**Customer**
- สมัครสมาชิก / เข้าสู่ระบบ
- ค้นหาและกรองร้าน
- ดู Tier List และคะแนนความปลอดภัย
- ดูเมนูและราคา และคำนวณค่าใช้จ่ายโดยประมาณ
- ดูโต๊ะว่าง จองโต๊ะ และจ่ายมัดจำ
- แชร์การจองให้เพื่อน
- เช็กอินด้วย QR
- รีวิวร้าน และบันทึกร้านโปรด

**Merchant (เจ้าของร้าน + พนักงานหน้าร้าน/การ์ด/PR)**
- สมัครและยืนยันตัวตนร้าน
- จัดการข้อมูลร้าน รูป เมนู ราคา แพ็กเกจ และโซน/โต๊ะ
- ตั้งค่ามัดจำและตรวจสลิปโอนเงิน
- ยืนยันหรือปฏิเสธการจอง
- สแกน QR เพื่อเช็กอินลูกค้า
- อัปเดตสถานะความแน่นของร้าน
- กรอกข้อมูลความปลอดภัยของร้าน
- ดูรีวิวและ Analytics
- Sub-role **Staff**: สิทธิ์สแกน QR, ดูรายการจองของคืนนั้น และอัปเดตความแน่นเท่านั้น

**Admin (ทีมเรา)**
- อนุมัติหรือระงับร้าน
- ตรวจสอบและยืนยันข้อมูลความปลอดภัยของร้าน
- ดูแลรีวิวที่ถูกรายงาน จัดการดาว/Tier และอนุมัติการโปรโมท
- จัดการค่าคอมมิชชัน
- ดู Audit Log
- สร้างบัญชีลูกค้า / ร้านค้า / พนักงานร้านได้ แต่สร้างแอดมินและแก้ชั้นบัญชีที่มีอยู่แล้วไม่ได้

**Super Admin (ทีมเรา)**
- ทำได้ทุกอย่างของ Admin
- สร้างบัญชีได้ทุกชั้น รวมแอดมินและซูเปอร์แอดมิน
- เป็นชั้นเดียวที่แก้ชั้นบัญชีที่สร้างผิดได้ (แก้เป็นลูกค้า / แอดมิน / ซูเปอร์แอดมิน → หลุดจากร้าน)
- ต้องมีซูเปอร์แอดมินอย่างน้อย 1 คนเสมอ · คนแรกตั้งด้วย `scripts/create-user.ts --role SUPER_ADMIN`

ชั้นบัญชีมาจากตอนสร้างบัญชี (สมัครเอง = ลูกค้า) สมัครเป็นร้าน และยอมรับคำเชิญเข้าทีม · ชื่อไทยกับลำดับอยู่ในตาราง `roles` (ADR 0005)

## Customer Flow
Age Gate (20+) → Onboarding (ความชอบ) → Home / Tier List / Search → Restaurant Detail → Menu/Pricing → Price Estimate → Availability → Booking (+มัดจำ) → Merchant Confirmation → Share to Gang → QR Check-in → Completed → Review

---

## ฟีเจอร์หลัก (MVP)

### 1. Tier List ⭐
- จัดอันดับร้านเป็น **ระดับดาว 1–5 ดาว (⭐–⭐⭐⭐⭐⭐)** แยกตามประเภท (ผับ/บาร์, นั่งชิล, ร้านอาหารที่มีเครื่องดื่ม) และตามย่าน
  - ระบบคำนวณคะแนนรวม 0–100 แล้วแปลงเป็นดาว: 90+ = 5 ดาว, 75–89 = 4 ดาว, 60–74 = 3 ดาว, 40–59 = 2 ดาว, ต่ำกว่า 40 = 1 ดาว
  - ร้านที่มีรีวิวจากการเช็กอินจริงน้อยกว่า 5 รีวิว ให้แสดงเป็น "ร้านใหม่" แทนดาว
  - หน้าจัดอันดับแบ่งแถวตาม **ดาว** (5★ → 4★ → 3★ → 1–2★) ไม่แสดงตัวอักษร S/A/B/C ให้ผู้ใช้เห็น ดูหัวข้อ "ระดับร้าน = ดาว" ในส่วนดีไซน์
  - ดาวของ NightOut ต่างจากคะแนนรีวิว (rating ที่ลูกค้าให้) ต้องแสดงแยกกันให้ชัด
- **คะแนนคำนวณจาก:**
  - รีวิวที่มาจากการเช็กอินจริงเท่านั้น (ถ่วงน้ำหนักตามความใหม่ของรีวิว)
  - จำนวนการเช็กอินจริงผ่านแอป
  - คะแนนความปลอดภัย (ข้อ 3)
  - ความครบถ้วนของข้อมูลราคา
- มีตัวเลือก **Editor's Pick** ที่แอดมินปักหมุดได้ แต่ต้องแยกป้ายให้ชัดว่าเป็นการคัดเลือกโดยทีม ไม่ใช่คะแนนจากระบบ
- **ร้านจ่ายเงินเพื่อเพิ่มดาวไม่ได้** ดาวมาจากคะแนนระบบเท่านั้น ส่วนการโปรโมทแบบจ่ายเงินดูที่ข้อ 1.1
- เก็บประวัติดาวรายเดือน เพื่อให้แสดงได้ว่าร้าน "ขึ้น/ลงดาว"

### 1.1 Tag แนะนำแบบจ่ายเงิน (Promoted Listing) 💰
- ร้านจ่ายเงินเพื่อขึ้น **Tag "แนะนำ"** และได้ตำแหน่งโปรโมทในหน้าแรก (Home) และผลค้นหา
- **แพ็กเกจโปรโมท** (แอดมินตั้งราคาได้):
  - ระยะเวลา: 7 / 14 / 30 วัน
  - ตำแหน่ง: Home Banner, Home "ร้านแนะนำ", อันดับต้นในผลค้นหาตามย่าน/ประเภท
  - จำนวนช่องโปรโมทต่อตำแหน่งต่อย่านมีจำกัด (เช่น 3 ช่อง) เพื่อไม่ให้หน้าแรกเต็มไปด้วยโฆษณา
- **ความโปร่งใส:**
  - ทุกการ์ดที่โปรโมทต้องมีป้าย **"แนะนำ · โฆษณา"** ให้เห็นชัด
  - การโปรโมทไม่มีผลต่อดาว คะแนนรีวิว หรือ Safety Score
  - ร้านที่ถูกระงับหรือมี Safety Score ต่ำกว่าเกณฑ์ ซื้อโปรโมทไม่ได้
  - เนื้อหาโปรโมทต้องทำตามนโยบายถ้อยคำ (ห้ามโฆษณาเครื่องดื่มแอลกอฮอล์)
- **การจ่ายเงินใน MVP:**
  - ร้านเลือกแพ็กเกจใน Merchant Dashboard → โอน PromptPay ของ NightOut → อัปโหลดสลิป
  - แอดมินตรวจแล้วเปิดใช้งาน ระบบเริ่มและหมดอายุตามวันที่อัตโนมัติ
  - payment gateway อัตโนมัติอยู่ใน Phase 2
- **Analytics ของร้าน:** impressions, clicks และจำนวนการจองที่มาจากตำแหน่งโปรโมท

### 2. ค้นหาและแนะนำร้าน
- **ค้นหาจาก:** ชื่อร้าน, ย่าน, ร้านใกล้ฉัน, ประเภทร้าน, งบต่อหัว, จำนวนคน, วัน/เวลาที่ว่าง, ความแน่นตอนนี้ และมาตรการความปลอดภัย
- ผลค้นหาแสดงร้านที่โปรโมท (ข้อ 1.1) ไว้ด้านบนพร้อมป้าย "แนะนำ · โฆษณา" ส่วนลำดับที่เหลือเรียงตามความเกี่ยวข้อง/ดาว/ระยะทาง
- **Style ของร้าน:** Live Music, Chill, Pub/Dance, Rooftop, Food-focused, Quiet, Outdoor, Private Room, Buffet
- **Recommendation ใน MVP เป็นแบบ rule-based** ดูจากความชอบตอน Onboarding + Style + งบ + ระยะทาง + โต๊ะว่าง ส่วน AI Recommendation / Chatbot อยู่ใน **Phase 2**
- Style เก็บเป็นตาราง `styles` (master) + `bar_styles` (many-to-many) ไม่เก็บเป็น array ใน `bars`
- **Location:** ขอสิทธิ์ตำแหน่งเฉพาะตอนกด "ร้านใกล้ฉัน" ใช้พิกัดคำนวณระยะแล้วไม่บันทึกลงฐานข้อมูล ถ้าไม่อนุญาตให้เลือกย่านแทน

### 3. ข้อมูลความปลอดภัยของร้าน (Safety Info) ⭐
แต่ละร้านมี checklist แสดงเป็นไอคอน โดยแยกให้เห็นชัดว่า **มี ✅ / ไม่มี ❌ / ยังไม่มีข้อมูล ⚪** ดังนี้
- รปภ./การ์ด
- กล้อง CCTV
- ทางหนีไฟและถังดับเพลิง
- ชุดปฐมพยาบาล
- ตรวจบัตรประชาชน (20+)
- จุดจอดรถ และบริการเรียกรถกลับบ้าน
- พนักงานหญิงช่วยดูแล
- ความสว่างบริเวณทางเข้า/ที่จอดรถ
- ช่องทางแจ้งเหตุฉุกเฉินในร้าน

**ระดับความน่าเชื่อถือของข้อมูล:**
- "ร้านแจ้งเอง": ร้านกรอกข้อมูลเอง
- "ยืนยันโดย NightOut": แอดมินตรวจจากรูป/เอกสาร หรือไปดูหน้างานแล้ว
- ลูกค้าที่เช็กอินแล้วโหวตได้ว่าข้อมูลตรงหรือไม่ ถ้ามีรายงานว่าไม่ตรงหลายครั้ง ระบบจะเปิดเรื่องให้แอดมินตรวจ

**คะแนนความปลอดภัย (Safety Score):** คิดเป็น 0-100 แสดงบนการ์ดร้าน และใช้เป็นตัวกรองได้

### 4. สถานะความแน่นของร้าน (Crowd Status)
- แถบสถานะแบบ real-time: 🟢 ว่าง / 🟡 ใกล้เต็ม / 🔴 โต๊ะเต็ม
- ร้านหรือ Staff กดอัปเดตได้ในแตะเดียว แสดงบนการ์ดร้านพร้อมเวลาที่อัปเดตล่าสุด
- ถ้าไม่ได้อัปเดตเกิน 60 นาที ให้แสดงเป็น "ไม่ทราบสถานะ"
- ใช้ Supabase Realtime

### 5. ความโปร่งใสเรื่องราคา (Price Transparency)
- **หน้าร้านแสดง:**
  - ราคาเมนู
  - ราคาเฉลี่ยต่อคน
  - แพ็กเกจ เช่น "เซ็ตโต๊ะ 3-4 คน ประมาณ X บาท"
  - Service Charge, VAT, ค่าเปิดขวด/ค่าอื่นๆ
- **ตัวคำนวณ:** Selected Items × Quantity + Service Charge + VAT + Other Fees = **Estimated Total** และยอดต่อหัว
- ต้องระบุว่าเป็น "ราคาโดยประมาณ" เสมอ และไม่รับประกันราคาสุดท้าย ถ้าร้านไม่ได้กำหนดราคาตายตัว
- **Price Snapshot:** เมื่อกดจอง ให้บันทึกผลการประเมินราคาลง `booking_price_snapshots` (รายการ, จำนวน, ราคาต่อหน่วย, service charge %, VAT %, ค่าอื่นๆ, ยอดรวม, ยอดต่อหัว) เพื่อให้ราคาที่ลูกค้าเห็นตอนจองไม่เปลี่ยนตามเมื่อร้านแก้ราคาภายหลัง
- **Package Snapshot:** ถ้าเลือกแพ็กเกจ ให้ copy ชื่อแพ็กเกจ รายการ ราคา และค่าธรรมเนียม ณ ตอนจอง ลง `booking_package_snapshots`

### 6. จองโต๊ะ + มัดจำ (Deposit)
- ลูกค้าเลือกร้าน วัน เวลา จำนวนคน และโซน โดย **ระบุโต๊ะหรือไม่ก็ได้**:
  - `zone_id` บังคับ ส่วน `table_id` เป็น optional
  - ถ้าลูกค้าไม่เลือกโต๊ะ ร้านจะ assign โต๊ะตอนยืนยันหรือตอนเช็กอิน
  - ร้านเล็กที่ไม่แบ่งโต๊ะ ใช้โซนเดียว (เช่น "ทั้งร้าน") พร้อมกำหนดความจุรวมได้
- **Availability แบบ Reservation Interval:**
  - ทุกการจองเก็บเป็นช่วงเวลา `reserved_from` – `reserved_until` (ร้านตั้ง `default_duration_minutes` ต่อโซน เช่น 180 นาที)
  - เก็บเป็นคอลัมน์ `tstzrange` ชื่อ `reserved_period`
- **Overlap Protection (ป้องกัน Double Booking):**
  - ระดับโต๊ะ: ใช้ PostgreSQL exclusion constraint `EXCLUDE USING gist (table_id WITH =, reserved_period WITH &&)` เฉพาะสถานะที่ยังถือโต๊ะอยู่ (PENDING, AWAITING_DEPOSIT, DEPOSIT_SUBMITTED, CONFIRMED, CHECKED_IN)
  - ระดับโซน (กรณีไม่ระบุโต๊ะ): ตรวจความจุโซนใน transaction ที่ `SELECT ... FOR UPDATE` เพื่อไม่ให้จองเกินจำนวนโต๊ะหรือจำนวนคนที่โซนรับได้
  - การเช็กโต๊ะว่างใน UI ต้องใช้ logic เดียวกันกับตอนบันทึก
- **ระบบมัดจำ (ร้านเลือกเปิดหรือปิดเองได้):**
  - ร้านตั้งยอดมัดจำขั้นต่ำ (ต่อโต๊ะหรือต่อคน) และใส่ PromptPay QR ของร้าน
  - ลูกค้าโอนเข้าบัญชีร้านโดยตรง แล้วอัปโหลดสลิป
  - ร้านกดตรวจและยืนยัน ระบบจะอ่าน QR ในสลิปเพื่อช่วยตรวจยอดและเวลาเบื้องต้น
  - **แพลตฟอร์มไม่ถือเงินลูกค้า** เพื่อไม่ต้องเป็นผู้ให้บริการชำระเงิน
  - ร้านต้องประกาศนโยบายมัดจำให้ชัดก่อนลูกค้าโอน ได้แก่ หักเป็นค่าอาหาร / คืนได้ถ้ายกเลิกก่อน X ชม. / ไม่คืนถ้า No-show
  - ถ้ามัดจำไม่ได้รับการยืนยันภายในเวลาที่กำหนด ให้ booking เป็น EXPIRED
  - **(อัปเดต 2026-10)** หน้า Checkout ต้องมีช่องเบอร์โทร (บังคับ) และ checkbox ยอมรับเงื่อนไขริบมัดจำ — ระบบเก็บหลักฐานว่าลูกค้ากดยอมรับ (ข้อความที่เห็น, เวลา, IP, อุปกรณ์) แก้ไขย้อนหลังไม่ได้ เพื่อใช้ยืนยันเมื่อมีข้อพิพาท
  - **(อัปเดต 2026-10)** ปฏิเสธสลิปต้องเลือกเหตุผลจาก dropdown · เลือก "สลิปปลอม" = ติด Flag ที่ผู้ใช้ ครบ 2 ครั้งแบนบัญชีและเบอร์โทรนั้น (จองใหม่ไม่ได้แม้สมัครบัญชีใหม่) · แอดมินปลดแบนได้
  - **(อัปเดต 2026-10)** Dashboard ร้านมีปุ่ม "ย้ายโต๊ะ" และ "ยืนยันการคืนเงิน" ให้ทุกคนในทีมร้าน (รวม PR) จัดการเคสหน้างาน — ร้านอนุมัติคืน แล้ว NightOut เป็นผู้โอนคืน
- **Booking Status:** PENDING, AWAITING_DEPOSIT, DEPOSIT_SUBMITTED, CONFIRMED, REJECTED, CANCELLED_BY_CUSTOMER, CANCELLED_BY_MERCHANT, CHECKED_IN, COMPLETED, NO_SHOW, EXPIRED
- **Status Transition Rules:** เปลี่ยนสถานะได้เฉพาะตามตารางนี้ ต้อง validate ฝั่ง server (หรือใช้ DB function) และบันทึกทุกครั้งลง `booking_status_history` (from, to, changed_by, reason, created_at)

| จาก | ไปได้ | ผู้ทำ |
|---|---|---|
| PENDING | AWAITING_DEPOSIT, CONFIRMED, REJECTED, CANCELLED_BY_CUSTOMER, EXPIRED | ระบบ / ร้าน / ลูกค้า |
| AWAITING_DEPOSIT | DEPOSIT_SUBMITTED, CANCELLED_BY_CUSTOMER, EXPIRED | ลูกค้า / ระบบ |
| DEPOSIT_SUBMITTED | CONFIRMED, AWAITING_DEPOSIT (สลิปไม่ผ่าน), REJECTED | ร้าน |
| CONFIRMED | CHECKED_IN, NO_SHOW, CANCELLED_BY_CUSTOMER, CANCELLED_BY_MERCHANT | Staff / ระบบ / ลูกค้า / ร้าน |
| CHECKED_IN | COMPLETED | ร้าน / ระบบ (ปิดอัตโนมัติหลัง `reserved_until`) |
| REJECTED, CANCELLED_*, NO_SHOW, EXPIRED, COMPLETED | — (สถานะสุดท้าย) | — |

- สถานะ **PENDING** ที่ร้านไม่ตอบภายในเวลาที่กำหนด (เช่น 30 นาที หรือก่อนเวลาจอง) จะกลายเป็น **EXPIRED**
- **NO_SHOW** ใช้เมื่อการจองที่ CONFIRMED แล้วเลย `auto_cancel_at` โดยไม่มีการเช็กอิน

### 7. แชร์การจองให้เพื่อน (Share to Gang)
- หลังจองสำเร็จ มีปุ่มแชร์ "บัตรจอง" ที่มีชื่อร้าน แผนที่ (ลิงก์ Google Maps) วัน-เวลา โซนโต๊ะ และชื่อคนจอง
- แชร์เข้า LINE ได้ทันที (LINE share URL หรือ LIFF) และมี Web Share API สำหรับแอปอื่น
- ลิงก์เปิดเป็นหน้า public ที่ไม่ต้องล็อกอิน และไม่แสดงข้อมูลส่วนตัว เช่น เบอร์โทร หรือ QR เช็กอิน
- (ตัวเลือก) เพื่อนกด "ไปด้วย" เพื่อให้คนจองเห็นว่ามีใครไปบ้าง

### 8. QR Check-in + ยกเลิกอัตโนมัติ
- **QR Check-in:**
  - เมื่อการจอง CONFIRMED ลูกค้าจะได้ QR Code ที่เป็น signed token ใช้ครั้งเดียว และหมดอายุหลัง auto_cancel_at
  - การ์ดหรือ PR หน้าร้านเปิดหน้า Staff Scanner บนมือถือ (ใช้กล้องผ่านเว็บ) แล้วสแกน ระบบจะเช็กอินทันที พร้อมแสดงชื่อ จำนวนคน และโซน
  - มี Manual Check-in สำรอง (ค้นหาจากชื่อหรือรหัสจอง)
  - บันทึกลงตาราง `checkins`: `checked_in_at`, `checked_in_by` (user id ของ Staff/ร้าน) และ `method` (`QR` / `MANUAL`)
  - booking หนึ่งรายการเช็กอินได้ครั้งเดียว (unique `booking_id`)
  - การเช็กอินจะสร้าง Billing Event `CHECK_IN` (ดูข้อ 13)
- **Auto Cancellation:**
  - ร้านตั้ง Grace Period ได้เอง (เช่น 15 / 30 / 60 นาที) ระบบคำนวณ `auto_cancel_at = booking_datetime + grace_period`
  - แจ้งเตือนลูกค้าก่อนหมดเวลา
  - ถ้าไม่มีการเช็กอิน สถานะจะเป็น NO_SHOW แล้วโต๊ะกลับไปว่าง
  - แจ้งทั้งลูกค้าและร้าน ส่วนมัดจำเป็นไปตามนโยบายที่ร้านประกาศไว้
  - การเปลี่ยนเป็น NO_SHOW จะสร้าง Billing Event `NO_SHOW` (ดูข้อ 13)

### 9. เมนูร้าน
- ร้านอัปโหลดเมนูพร้อมรูป ราคา และหมวดหมู่
- ติดสถานะ available ได้

### 10. รีวิว
- รีวิวได้เฉพาะ booking ที่ CHECKED_IN หรือ COMPLETED ให้คะแนน เขียนความเห็น และแนบรูป
- **1 booking รีวิวได้ 1 ครั้ง** (unique constraint บน `reviews.booking_id`) แก้ไขได้ แต่สร้างใหม่ซ้ำไม่ได้
- แสดงแบบแกลเลอรีรูป
- มีระบบรายงานรีวิว (Report Review), Moderation และ log ฝั่งแอดมิน

### 11. โปรโมชันสำหรับคนจองผ่านแอป (ต้องเป็นไปตามข้อ "นโยบายถ้อยคำ" ด้านล่าง)
- **อนุญาตเฉพาะสิทธิประโยชน์ที่ไม่ใช่เครื่องดื่มแอลกอฮอล์** เช่น
  - ส่วนลดค่าอาหาร
  - อาหารทานเล่นฟรี
  - น้ำดื่ม/ซอฟต์ดริงก์ฟรี
  - ยกเว้นค่าเข้า/ค่าโต๊ะ
  - โต๊ะโซนพิเศษ
- **ห้ามมีโปรลดราคา แจก หรือซื้อ 1 แถม 1 สำหรับเครื่องดื่มแอลกอฮอล์**

### 12. Merchant Dashboard
- **Merchant Verification:** DRAFT → PENDING_REVIEW → APPROVED / REJECTED / SUSPENDED
- **จัดการข้อมูล:** ร้าน, รูป, เวลาเปิด-ปิด, เมนู, ราคา, แพ็กเกจ, โซน/โต๊ะ, มัดจำ, Grace Period, Safety Info และโปรโมชัน
- **การจอง:** ดูแบบปฏิทินหรือรายการ, ตรวจสลิป และยืนยันหรือปฏิเสธ
- **หน้าจอ "คืนนี้" สำหรับ Staff:** ปุ่มสแกน QR, รายการจองของคืนนี้ และปุ่มอัปเดตความแน่น
- **Analytics:** จำนวนการจอง, อัตราเช็กอิน, อัตรา No-show, ช่วงเวลาที่คนจองเยอะ, ดาว และผลของการโปรโมท
- **โปรโมทร้าน:** เลือกแพ็กเกจ, อัปโหลดสลิป และดูสถานะ/วันหมดอายุ

### 13. Admin + โมเดลรายได้
- ให้ร้านใช้ฟรีช่วงทดลอง (`trial_ends_at`) หลังจากนั้นเก็บค่าคอมมิชชัน
- **Commission Rule แยกจากตาราง `bars`:**
  - ตาราง `commission_rules` มีฟิลด์ bar_id, calculation_type (`PERCENTAGE` / `FIXED` / `FIXED_PER_PERSON`), rate, `charge_on_no_show`, `no_show_rate`, effective_from, effective_to และ created_by
  - ร้านหนึ่งมีได้หลาย rule ตามช่วงเวลา แต่ต้องไม่ทับกัน การแก้ rate ให้สร้าง rule ใหม่แทนการแก้ของเดิม เพื่อเก็บเป็น history
  - ตอนคำนวณค่าคอม ให้ใช้ rule ที่มีผล ณ `booking_datetime`
- **Billing Events:** ตาราง `billing_events` มีฟิลด์ booking_id, bar_id, event_type, commission_rule_id, base_amount, amount, status (`PENDING` / `INVOICED` / `PAID` / `WAIVED`) และ period
  - **`CHECK_IN`:** สร้างเมื่อเช็กอินสำเร็จ คิดค่าคอมตาม rule โดย base_amount มาจาก Price Snapshot (หรือจำนวนคน ถ้าเป็น FIXED_PER_PERSON)
  - **`NO_SHOW`:** สร้างเมื่อ booking เป็น NO_SHOW แต่จะคิดเงินเฉพาะเมื่อ rule ตั้ง `charge_on_no_show = true` (ค่าเริ่มต้นคือ false) ถ้าตั้งไว้ ให้คิดจาก `no_show_rate` เช่น % ของมัดจำที่ร้านยึดไว้
  - ถ้าอยู่ในช่วง trial ให้สร้าง event เป็น `WAIVED`
  - booking หนึ่งรายการมี billing event แต่ละประเภทได้ 1 รายการ (unique `booking_id` + `event_type`)
  - ไม่สร้าง event สำหรับ PENDING, REJECTED, CANCELLED_* และ EXPIRED
- แอดมินดูสรุปรายเดือนจาก `billing_events` และออก invoice ได้
- **แอดมินทำได้:**
  - ดูสรุปค่าคอมรายเดือน
  - อนุมัติหรือระงับร้าน
  - ยืนยัน Safety Info
  - ดูแลรีวิว
  - ปักหมุด Editor's Pick
  - ตั้งราคาแพ็กเกจโปรโมท, ตรวจสลิป และเปิด/ปิดการโปรโมท
  - ดู Audit Log

### 14. โซเชียลและการตลาด
- **External Links เท่านั้น:** ร้านใส่ลิงก์ IG, TikTok, Facebook, LINE OA, เว็บไซต์ และลิงก์คลิปรีวิวได้ ตารางคือ `bar_links` (bar_id, type, url, sort_order) และตรวจ URL/โดเมนตาม type
- หน้าร้านทุกหน้ามี OG image สำหรับแชร์
- **ไม่ดึงข้อมูลจากโซเชียลใดๆ ใน MVP** ไม่ว่าจะเป็นโพสต์ ยอดผู้ติดตาม หรือการเช็กอินจาก IG/Facebook
  - Meta ไม่เปิด API ให้ดึงข้อมูลการเช็กอินของผู้ใช้ทั่วไปแล้ว
  - การ scrape ผิดเงื่อนไขการใช้งานและ PDPA
- Campaign/UTM tracking ไม่อยู่ใน MVP schema

### 15. Favorite และ Notification
- **Favorite:** บันทึกร้านที่สนใจ
- **Notification:** แจ้งเมื่อ booking ถูกสร้าง, ยืนยัน, ปฏิเสธ, ยกเลิก, เมื่อมัดจำได้รับการยืนยัน, แจ้งเตือนก่อนถึงเวลา, เตือนก่อนยกเลิกอัตโนมัติ, เมื่อเช็กอิน และชวนรีวิว
- **ช่องทาง:** Web Push, LINE Messaging API และ In-app (กระดิ่งในเว็บ)
- **สถานะของแต่ละการส่ง:** `notifications` (1 รายการต่อผู้รับต่อเหตุการณ์) + `notification_deliveries` (1 รายการต่อช่องทาง) โดยมีฟิลด์:
  - status: `QUEUED` / `SENT` / `FAILED` / `RETRYING`
  - attempt_count, last_error, next_retry_at, sent_at
  - `read_at` สำหรับ In-app
  - retry แบบ exponential backoff สูงสุด 5 ครั้ง ถ้ายังไม่ผ่านให้เป็น FAILED แล้วส่งช่องทางสำรอง (In-app)
- **แยก Authentication กับ Notification:**
  - เข้าสู่ระบบด้วย **email + password** ของ Supabase Auth เท่านั้น (ดูหัวข้อ "Authentication") ส่วน LINE ไม่ได้ใช้ล็อกอิน
  - การรับแจ้งเตือนทาง LINE ผู้ใช้ต้องกด "เชื่อม LINE" ในหน้า `/profile` (LINE Login ใช้เพื่อเอา `line_user_id` มาเท่านั้น) แล้วเพิ่มเพื่อน LINE OA และยินยอม (opt-in)
  - เก็บช่องทางแจ้งเตือนไว้ใน `notification_channels` (user_id, channel, line_user_id / push_subscription, opted_in_at, opted_out_at) ไม่ปนกับตาราง auth และปิดรับได้ทุกเมื่อ

### 16. Authentication (email + password ด้วย Supabase Auth)
- ใช้ **Supabase Auth — Email provider** ตรงๆ ไม่ต้องทำ endpoint login เองใน NestJS
- **สมัคร (`/register`):**
  - อีเมล + password (อย่างน้อย 10 ตัว และเปิด Leaked Password Protection ของ Supabase)
  - ชื่อที่แสดง, วันเกิด (ต้องอายุ 20+), ยอมรับ Terms และ Privacy
  - เรียก `supabase.auth.signUp()` แล้ว trigger ใน DB (`on auth.users insert`) สร้างแถวใน `public.users` + `user_consents`
  - ต้องยืนยันอีเมล (Confirm email = เปิด) ก่อนจองโต๊ะ ส่วนดูร้านได้ทันที
- **เข้าสู่ระบบ (`/login`):**
  - `supabase.auth.signInWithPassword({ email, password })` จาก frontend
  - ข้อความ error ใช้แบบเดียวกันเสมอ คือ "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
- **ป้องกันการเดารหัส:** ใช้ rate limit ของ Supabase Auth + **CAPTCHA (Cloudflare Turnstile)** ที่ Supabase รองรับในตัว บนหน้า login, register และ forgot-password
- **ลืมรหัสผ่าน:** `/forgot-password` → `resetPasswordForEmail()` → ลิงก์ในอีเมล → `/reset-password` → `updateUser({ password })`
- **Staff ของร้าน:**
  - เจ้าของร้านเชิญ Staff ด้วยอีเมล โดย NestJS เรียก `auth.admin.inviteUserByEmail()`
  - Staff ตั้งรหัสเองจากลิงก์ในอีเมล แล้วถูกผูกกับร้านใน `bar_staff`
- **Admin:** email + password + **TOTP MFA** (Supabase MFA) บังคับทุกบัญชี และ `apps/admin` ต้องเช็ก AAL2 ก่อนเข้า
- **Session:** จัดการโดย supabase-js (access token อายุสั้น + refresh token อัตโนมัติ) ส่ง access token ไป NestJS ใน header `Authorization: Bearer` และมีปุ่ม "ออกจากระบบทุกอุปกรณ์" (`signOut({ scope: 'global' })`) ใน `/settings`
- **อีเมลของระบบ** (ยืนยันอีเมล, รีเซ็ตรหัส, เชิญ Staff): ใช้ custom SMTP (เช่น Resend) และ template ภาษาไทยตามธีม
- Supabase Auth เปิดเฉพาะ Email provider ส่วน Phone / Google / LINE provider ปิด
---

## นโยบายถ้อยคำและกฎหมาย (Wording & Legal Policy) ⚠️
ระบบต้องเน้นข้อมูลร้าน บรรยากาศ ราคา ความปลอดภัย และการจอง **ไม่ใช่การชักชวนให้ดื่ม** ตามแนว พ.ร.บ.ควบคุมเครื่องดื่มแอลกอฮอล์ พ.ศ. 2551

**ห้าม:**
- ใช้ชื่อหรือโลโก้ยี่ห้อเครื่องดื่มแอลกอฮอล์ในการโฆษณาหรือแบนเนอร์
- ใช้ถ้อยคำเชิญชวนให้ดื่ม เช่น "ดื่มให้สุด" หรือ "ยิ่งดื่มยิ่งคุ้ม"
- ทำโปรลดราคา แจก หรือแถมเครื่องดื่มแอลกอฮอล์
- **ใช้คำแสลงหรือคำเลี่ยงมาแทนชื่อเครื่องดื่มเพื่อทำโปรที่ผิดกฎหมาย** เพราะกฎหมายดูที่เนื้อหาและเจตนา การเปลี่ยนคำไม่ทำให้ถูกกฎหมาย

**ให้ใช้:**
- คำกลางๆ เชิงข้อมูล เช่น "เครื่องดื่ม", "เซ็ตโต๊ะ", "แพ็กเกจโต๊ะ 3-4 คน", "สิทธิพิเศษเมื่อจองผ่าน NightOut"
- ราคาเมนูแสดงเป็นข้อมูลรายการในหน้าร้านได้ แต่ไม่ทำเป็นแบนเนอร์หรือโฆษณาดัน

**อื่นๆ:**
- **Age Gate 20+:**
  - ผู้เยี่ยมชมต้องยืนยันว่าอายุ 20 ปีขึ้นไป ก่อนเห็นเนื้อหา
  - ตอนสมัคร ต้องกรอกวันเกิดและตรวจว่าอายุ 20+
  - `age_verification_method` เป็น `SELF_DECLARED` (MVP), `ID_CHECK_AT_VENUE` (Staff ติ๊กยืนยันตอนเช็กอินหลังดูบัตร) หรือ `EKYC` (Phase 2)
  - บันทึก `age_verified`, `age_verified_at` และ `age_verification_method`
- **Consent:**
  - ตาราง `user_consents` (user_id, consent_type, version, granted, granted_at, revoked_at)
  - consent_type: TERMS, PRIVACY, AGE_CONFIRMATION, LOCATION, MARKETING, LINE_NOTIFICATION
  - ถ้าเอกสารเปลี่ยนเวอร์ชัน ต้องให้ผู้ใช้ยอมรับใหม่
- มีข้อความ "ดื่มไม่ขับ" และปุ่มเรียกรถกลับบ้าน (ลิงก์ Grab / Bolt)
- ทำตาม PDPA:
  - มี Privacy Policy, Terms, Cookie Policy และ Consent Management
  - ผู้ใช้ลบบัญชีได้ และมี Data Retention Policy
  - สลิปมัดจำเก็บเท่าที่จำเป็น แล้วลบตามรอบที่กำหนด
- ขอสิทธิ์ตำแหน่งเฉพาะตอนใช้ "ร้านใกล้ฉัน" ไม่ track ตลอดเวลา และไม่บันทึกพิกัดของผู้ใช้
- ให้ AI ที่เขียนข้อความในระบบ (copy, seed data, โปรตัวอย่าง) ทำตามนโยบายนี้ทุกครั้ง

---

## Database (MVP Schema)
- **ผู้ใช้และสิทธิ์:** users, user_preferences, user_consents
- **แจ้งเตือน (แยกจาก auth):** notification_channels, notifications, notification_deliveries
- **ร้าน:** bars, bar_hours, styles, bar_styles, bar_media, bar_links, bar_verifications, bar_staff, bar_safety_features, safety_reports, crowd_status_logs
- **จัดอันดับ:** tier_scores, tier_history
- **เมนูและราคา:** menu_categories, menu_items, price_packages, price_package_items, bar_fees (service charge, VAT, ค่าเปิดขวด)
- **โต๊ะและการจอง:** table_zones, tables, bookings, booking_status_history, booking_price_snapshots, booking_package_snapshots, deposits, checkins, booking_shares
- **รีวิว:** reviews, review_images, review_reports, review_moderation_logs
- **โปรโมท:** promotion_packages, promoted_listings, promoted_listing_payments, promoted_listing_stats
- **อื่นๆ:** favorites, promotions, commission_rules, billing_events, audit_logs
- **ไม่อยู่ใน MVP schema:** campaigns, campaign_clicks และตารางที่ใช้ดึงข้อมูลจากโซเชียล

**ฟิลด์สำคัญ**
- `users`: id (= auth.users.id), display_name, email (sync จาก auth.users), phone (optional), birthdate, role (CUSTOMER / MERCHANT / STAFF / ADMIN / SUPER_ADMIN → FK `roles.code`), age_verified, age_verified_at, age_verification_method
- `notification_channels`: id, user_id, channel (LINE / WEB_PUSH / IN_APP), line_user_id, push_subscription, opted_in_at, opted_out_at
- `notifications`: id, user_id, event_type, booking_id, payload, read_at, created_at
- `notification_deliveries`: id, notification_id, channel, status (QUEUED / SENT / FAILED / RETRYING), attempt_count, last_error, next_retry_at, sent_at
- `bars`: id, owner_id, slug, name, category (PUB_BAR / CHILL / RESTAURANT), description, address, district, province, lat, lng, status, trial_ends_at, deposit_enabled, deposit_amount, deposit_unit (PER_TABLE / PER_PERSON), promptpay_id, deposit_policy, grace_period_minutes, pending_timeout_minutes, safety_score, current_tier
  - ไม่มี open_hours, styles หรือ commission ในตารางนี้
- `bar_hours`: id, bar_id, day_of_week, open_time, close_time, is_closed, special_date (กรณีวันหยุด/วันพิเศษ) และรองรับเวลาปิดข้ามเที่ยงคืน (เช่น 18:00–02:00)
- `styles`: id, key, name_th, icon · `bar_styles`: bar_id, style_id (PK คู่)
- `bar_links`: id, bar_id, type (INSTAGRAM / TIKTOK / FACEBOOK / LINE_OA / WEBSITE / REVIEW_CLIP), url, sort_order
- `bar_safety_features`: id, bar_id, feature_key, value (YES / NO / UNKNOWN), source (SELF_DECLARED / ADMIN_VERIFIED), evidence_url, verified_by, verified_at
- `crowd_status_logs`: id, bar_id, status (AVAILABLE / ALMOST_FULL / FULL), updated_by, created_at
- `tier_scores`: id, bar_id, period, category, review_score, checkin_score, safety_score, price_info_score, total_score, stars (1–5), tier (S / A / B / C — คำนวณจาก stars), is_new (boolean)
- `table_zones`: id, bar_id, name, capacity_pax, default_duration_minutes, allow_zone_only_booking
- `tables`: id, zone_id, name, seats, active
- `price_packages`: id, bar_id, name, pax_min, pax_max, total_price, active
- `price_package_items`: id, package_id, menu_item_id, quantity, unit_price_snapshot
- `bookings`: id, code, user_id, bar_id, zone_id (required), table_id (nullable), booking_datetime, reserved_from, reserved_until, reserved_period (tstzrange), pax, status, grace_period_minutes, auto_cancel_at, confirmed_at, completed_at
  - `EXCLUDE USING gist (table_id WITH =, reserved_period WITH &&) WHERE (table_id IS NOT NULL AND status IN ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN'))`
- `booking_status_history`: id, booking_id, from_status, to_status, changed_by, reason, created_at
- `booking_price_snapshots`: id, booking_id, items (json: name, qty, unit_price), subtotal, service_charge_rate, vat_rate, other_fees, estimated_total, per_person, created_at
- `booking_package_snapshots`: id, booking_id, package_id, package_name, items (json), package_price, fees (json), created_at
- `deposits`: id, booking_id, amount, slip_image_url, slip_ref, status (SUBMITTED / VERIFIED / REJECTED / REFUNDED / FORFEITED), verified_by, verified_at
- `checkins`: id, booking_id (unique), checked_in_at, checked_in_by, method (QR / MANUAL), id_checked (boolean)
- `reviews`: id, booking_id (unique), user_id, bar_id, rating, comment, status, created_at, updated_at
- `booking_shares`: id, booking_id, share_token, created_at
- `commission_rules`: id, bar_id, calculation_type, rate, charge_on_no_show, no_show_rate, effective_from, effective_to, created_by
- `billing_events`: id, booking_id, bar_id, event_type (CHECK_IN / NO_SHOW), commission_rule_id, base_amount, amount, status (PENDING / INVOICED / PAID / WAIVED), period, created_at, unique (booking_id, event_type)
- `user_consents`: id, user_id, consent_type, version, granted, granted_at, revoked_at
- `user_preferences`: user_id, preferred_styles[], budget_per_person, usual_pax, preferred_districts[], theme (LIGHT / DARK / SYSTEM, ค่าเริ่มต้น SYSTEM), reduced_motion (boolean, nullable = ตามระบบ)
- `promotion_packages`: id, name, placement (HOME_BANNER / HOME_RECOMMENDED / SEARCH_TOP), duration_days, price, max_slots_per_area, active
- `promoted_listings`: id, bar_id, package_id, placement, district, category, starts_at, ends_at, status (PENDING_PAYMENT / PAYMENT_SUBMITTED / ACTIVE / EXPIRED / REJECTED / CANCELLED), approved_by
- `promoted_listing_payments`: id, promoted_listing_id, amount, slip_image_url, status (SUBMITTED / VERIFIED / REJECTED), verified_by, verified_at
- `promoted_listing_stats`: id, promoted_listing_id, date, impressions, clicks, bookings

## โครงสร้างโปรเจกต์ (Monorepo)
ใช้ **pnpm workspaces + Turborepo** และ TypeScript ทั้งหมด

```
night-list/
├── apps/
│   ├── frontend/           # React (Vite) — ฝั่งลูกค้า + ฝั่งร้าน (/merchant) + Staff Scanner (PWA)
│   │   └── api/og/         # Vercel Function สร้าง meta/OG image ให้ /bars/:slug และ /share/:token
│   ├── admin/              # React (Vite) + Ant Design v6 + ProComponents — Backoffice ทีม NightOut (อนุมัติร้าน, Safety, ดาว, โปรโมท, Review, Billing, Audit)
│   └── backend/            # NestJS app (Vercel Function): src/ = HTTP entry (controllers, guards, pipes)
│                           #   src/modules/ = domain modules (booking, pricing, ranking, notification, jobs ...)
│                           #   supabase/ = migrations (SQL), RLS policies, DB functions, seed data
│
├── packages/
│   ├── ui/                 # antd theme + Tailwind preset + คอมโพเนนต์ร่วม (dark nightlife) ใช้ร่วมกัน 2 แอป
│   ├── types/              # TypeScript types + Zod schemas (BookingStatus, DTO, API contracts) ใช้ร่วม frontend/NestJS
│   ├── config/             # eslint, tsconfig, tailwind preset, env schema
│   ├── utils/              # price calculator, star calculator, date/timezone (Asia/Bangkok), status transition map, formatters
│   └── mock/               # โหมดเดโม: seed ร้านสมมติ + store (localStorage) + service ที่หน้าเว็บเรียก จนกว่าจะต่อ API จริง
│
├── infra/
│   └── terraform/
│       ├── modules/        # vercel-project, supabase-project
│       ├── envs/           # dev / staging / prod (tfvars)
│       └── main.tf
│
├── .github/workflows/      # CI: lint, test, build, supabase db push, terraform plan/apply
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

**หลักการแบ่งหน้าที่**
- `apps/*` ไม่เขียนลง DB ตรงสำหรับงานสำคัญ (booking, status, check-in, deposit, billing, promotion) ต้องเรียกผ่าน NestJS API
- การอ่านข้อมูลสาธารณะ (รายชื่อร้าน, เมนู) และ Realtime (Crowd Status, สถานะ booking) ใช้ Supabase client + RLS จาก frontend ได้โดยตรง เพราะ NestJS บน Vercel เป็น serverless จึงถือ websocket ไม่ได้
- `apps/backend` แยกเป็น controller (ชั้นบาง: guard + validation) กับ `src/modules/*` (business logic ของ booking, pricing, ranking, notification) เพื่อให้ jobs และ API ใช้ logic เดียวกัน
- Status transition map, ตัวคำนวณราคา และตัวคำนวณดาว อยู่ใน `packages/utils` ให้ทั้ง frontend (แสดงผล) และ NestJS (validate) ใช้โค้ดเดียวกัน
- `apps/admin` deploy แยกโดเมน (เช่น admin.nightout.app) และเข้าได้เฉพาะ role ADMIN

## Sitemap
รายชื่อหน้าทั้งหมด (path, access, ส่วนประกอบหลัก, สถานะใน Figma) และ user flow อยู่ใน **[`SITEMAP.md`](SITEMAP.md)** ให้ยึดไฟล์นั้นเป็นหลัก

## Tech Stack
| ชั้น | เทคโนโลยี |
|---|---|
| **Frontend (web)** | **React** 19 + TypeScript + Vite + React Router + TanStack Query + **Ant Design v6** + **Tailwind CSS** (layout/ตกแต่ง) + **Phosphor Icons** + **Motion** (`motion/react`) + Zod (`apps/frontend`) |
| **Frontend (admin)** | **React** 19 + TypeScript + Vite + React Router + TanStack Query + **Ant Design v6** (`antd@^6`) + **ProComponents** (`@ant-design/pro-components`: ProLayout, ProTable, ProForm) + Tailwind CSS + Phosphor Icons + Zod (`apps/admin`) |
| **Backend** | **NestJS** (TypeScript) + nestjs-zod (ใช้ schema ร่วมจาก `packages/types`) + Swagger/OpenAPI + Guards สำหรับ RBAC |
| **DB** | **Supabase** — PostgreSQL (+ btree_gist, pg_cron, pg_net), Auth, Storage (รูปร้าน/สลิป), Realtime, RLS |
| **Infra** | **Terraform** — provider `vercel/vercel` และ `supabase/supabase`, remote state (Terraform Cloud หรือ S3 + lock) |
| **Hosting** | **Vercel** — 3 projects: `web`, `admin` (static + Vercel Functions สำหรับ OG) และ `api` (NestJS เป็น Vercel Function) |
| Monorepo | pnpm + Turborepo |
| แผนที่ | Google Maps หรือ Leaflet + OpenStreetMap |
| Auth | **Supabase Auth — email + password** (+ Turnstile CAPTCHA, TOTP MFA สำหรับ Admin) — NestJS ตรวจ Supabase JWT ทุก request |
| แจ้งเตือน | Web Push, LINE Messaging API (ผ่าน LINE OA opt-in) และ In-app |
| แชร์ | LINE share URL / LIFF + Web Share API |
| QR | สร้าง QR ใน NestJS (signed JWT) + สแกนด้วยกล้องผ่านเว็บ (เช่น html5-qrcode) |
| PWA | vite-plugin-pwa (Manifest + Service Worker) ใน `apps/frontend` |

**Background Jobs (เพราะ NestJS รันแบบ serverless บน Vercel)**
- ใช้ **Supabase pg_cron + pg_net** เรียก endpoint `POST /jobs/*` ของ NestJS ตามรอบเวลา และป้องกัน endpoint ด้วย `JOB_SECRET`
  - ทุก 1 นาที: auto-cancel/no-show, pending/deposit expiry, notification retry, เปิด/ปิด promoted listing
  - รายวัน: คำนวณดาว, ลบสลิปที่หมดอายุ, สรุป promoted_listing_stats
  - (ทางเลือก: Vercel Cron ได้ แต่รอบทุกนาทีต้องใช้แพลน Pro)
- ทุก job ต้อง idempotent และทำงานเป็น batch สั้นๆ ไม่เกิน timeout ของ Vercel Function
- แจ้งเตือนใช้ outbox pattern: บันทึกลง `notification_deliveries` สถานะ QUEUED ใน transaction เดียวกับ event แล้วให้ job ส่งพร้อม retry

**SEO / แชร์ลิงก์ (เพราะ React SPA)**
- `apps/frontend` เป็น SPA ส่วนหน้า `/bars/:slug` และ `/share/:token` ใช้ Vercel rewrites ส่ง bot/crawler (LINE, Facebook, X) ไปที่ `api/og` เพื่อคืน HTML ที่มี meta/OG tags และรูป OG ที่สร้างด้วย `@vercel/og`
- ทำ `sitemap.xml` ของหน้าร้านจาก Vercel Function

## Infrastructure as Code (Terraform)
- **จัดการด้วย Terraform:**
  - Vercel: สร้าง 3 projects (`web`, `admin`, `api`) ผูก Git repo, root directory, build command, environment variables ต่อ environment, custom domains (nightout.app, admin.nightout.app, api.nightout.app)
  - Supabase: project ต่อ environment (dev / staging / prod), region `ap-southeast-1` (Singapore), ตั้งค่า Auth (เปิดเฉพาะ Email provider, MFA TOTP), redirect URLs, storage buckets
  - Secrets (Supabase keys, LINE channel secret/token, JOB_SECRET, QR signing key) ส่งเป็นตัวแปร `sensitive` จาก Terraform Cloud / GitHub Secrets และห้าม commit ลง repo
- **ไม่ใช้ Terraform จัดการ schema:** migrations, RLS และ DB functions อยู่ใน `apps/backend/supabase` แล้วรันด้วย `supabase db push` ใน CI
- **CI/CD (GitHub Actions):**
  - PR: lint + test + build + `terraform plan` (comment ผลลงใน PR)
  - merge `main`: `terraform apply` (staging) → `supabase db push` → Vercel deploy
  - prod ต้องมี manual approval
- **Environments:** dev / staging / prod แยก Supabase project และ Vercel environment กันชัดเจน

## ดีไซน์
- **สไตล์:** Nightlife, Premium, Minimal, Modern · Mobile-first
- **ธีมหลัก: Midnight Gold** (ดำ · ทอง · ม่วง) ใช้ Gold กับปุ่มหลักและคะแนน ส่วน Purple ใช้กับ accent และลิงก์
- รองรับ **Light / Dark mode** พร้อม motion ตอนสลับธีม (รายละเอียดด้านล่าง)
- **ไฟล์ออกแบบ (Figma):** https://www.figma.com/design/FtXQS2NeyuHQZIA3chcvLL/NightOut?node-id=7-4 ใช้เป็น reference ของ layout และคอมโพเนนต์ แต่ถ้าสีหรือข้อความใน Figma ไม่ตรงกับ token และกฎในเอกสารนี้ ให้ยึดเอกสารนี้

### Design Tokens — Midnight Gold
ประกาศเป็น CSS variables ใน `packages/ui` แล้วใช้ผ่าน Tailwind preset เช่น `bg-background`, `text-muted`, `bg-gold`, `text-link` ห้าม hard-code hex ในคอมโพเนนต์

| Token | Dark (ค่าเริ่มต้น) | Light | ใช้กับ |
|---|---|---|---|
| `--background` | `#07070D` | `#FAF8F3` | พื้นหน้า |
| `--surface` | `#11111A` | `#FFFFFF` | header, sidebar, bottom bar |
| `--card` | `#171520` | `#F4F1EA` | การ์ดร้าน, modal, bottom sheet |
| `--border` | `#34283F` | `#E4DCCF` | ขอบการ์ด, input, divider |
| `--text` | `#F5F1E8` | `#1A1523` | ตัวอักษรหลัก |
| `--muted` | `#A7A1B3` | `#5E5670` | ตัวอักษรรอง, placeholder |
| `--gold` | `#E8B64C` | `#E8B64C` | **พื้น**ปุ่มหลัก ("จองเลย", "บันทึก"), ป้ายโฆษณา, Tier S |
| `--gold-highlight` | `#FFD77A` | `#F5C85E` | hover ของปุ่มทอง, glow, ไฮไลต์ในหัวข้อ |
| `--gold-text` | `#E8B64C` | `#8A5A00` | ดาว ⭐, คะแนน, ยอดเงิน, ตัวอักษรทองบนพื้น |
| `--on-gold` | `#07070D` | `#1A1523` | ตัวอักษรบนปุ่มทอง |
| `--purple` | `#A738F5` | `#A738F5` | accent: แท็บที่เลือก, chip ที่เลือก, focus ring, ขอบ glow, ไอคอน |
| `--link` | `#B86BFA` | `#7E22CE` | ลิงก์และข้อความสีม่วงขนาดเล็ก |
| `--tier-s` | `#E8B64C` | `#E8B64C` | Tier S (Legendary) |
| `--tier-a` | `#963BE8` | `#963BE8` | Tier A (Excellent) |
| `--tier-b` | `#5869C8` | `#5869C8` | Tier B (Good) |
| `--tier-c` | `#74788B` | `#74788B` | Tier C (Normal) |
| `--crowd-available` / `almost-full` / `full` | `#22C55E` / `#EAB308` / `#EF4444` | `#16A34A` / `#CA8A04` / `#DC2626` | Crowd Status (ใส่ข้อความคู่เสมอ) |

**กฎ contrast (WCAG AA)**
- ข้อความขนาดปกติต้องได้ ≥ 4.5:1
- `#A738F5` บนพื้นดำได้แค่ 4.3:1 จึงใช้เป็นสี accent / ขอบ / ไอคอน / ตัวอักษรใหญ่เท่านั้น ส่วนลิงก์และข้อความม่วงขนาดเล็กให้ใช้ `--link`
- ใน Light mode ห้ามใช้ `#E8B64C` เป็นตัวอักษรบนพื้นขาว ให้ใช้ `--gold-text` (`#8A5A00`) แทน
- ทองและม่วงใช้เป็นสีเน้น ไม่ใช้เต็มพื้นที่ใหญ่ ยกเว้น gradient ใน hero

**Gradient และเอฟเฟกต์**
- **Hero:** รูปบรรยากาศบาร์ + overlay `linear-gradient(90deg, #07070D 0%, rgba(7,7,13,.6) 50%, transparent)` และเส้นแสงม่วง `#A738F5` แนวทแยง
- **หัวข้อใหญ่:** ตัวอักษร serif ครึ่งแรกเป็น `--text` ครึ่งหลังเป็น gradient ทอง `#FFD77A → #E8B64C` (เช่น "NIGHT**LIST**")
- **Glow:** การ์ดตอน hover ใช้ `box-shadow: 0 0 0 1px var(--gold), 0 8px 32px rgba(167,56,245,.25)`
- **Light mode:** ลด glow เหลือเงานุ่ม `0 8px 24px rgba(26,21,35,.08)` และ hero overlay ใช้ `#FAF8F3` แทน

**Typography**
- หัวข้อแบรนด์ / hero: serif หรือ display เช่น **Playfair Display** หรือ **Cinzel** (ภาษาอังกฤษเท่านั้น)
- ภาษาไทยและเนื้อหา: **IBM Plex Sans Thai** หรือ **Noto Sans Thai** (UI) และ **Mitr** / **Prompt** สำหรับหัวข้อไทย
- ข้อความตกแต่งลายมือ (เช่น slogan ใน hero) ใช้ได้ไม่เกิน 1 จุดต่อหน้า

**ไอคอนและโลโก้**
- ใช้ **Phosphor Icons** (`@phosphor-icons/react`) ทั้งหมด (ไม่ใช้ `@ant-design/icons`) ไอคอนปกติ weight `regular` สี `--muted` ส่วนที่เลือกหรือ active ใช้ weight `fill` + `--gold-text`
- ดาวคะแนนใช้ `<Star weight="fill" />` สี `--gold-text` และดาวที่ยังว่างใช้ `<Star weight="regular" />` สี `--border`
- ไอคอนมงกุฎ 👑 ใช้เป็นสัญลักษณ์ ranking / Tier (เส้นทอง)

### Light / Dark Mode
- **ตัวเลือก 3 แบบ:** 🌙 มืด / ☀️ สว่าง / 💻 ตามระบบ
  - ค่าเริ่มต้นคือ **มืด** ถ้าอ่านค่าที่ผู้ใช้บันทึกไว้ไม่ได้ให้ใช้ **Dark**
- **ปุ่มสลับ:** อยู่ใน header (ไอคอนพระจันทร์/ดวงอาทิตย์) และในหน้า `settings`
- **การบันทึก:**
  - ผู้ใช้ทั่วไป: เก็บใน `localStorage` (`nightout-theme`)
  - ถ้าล็อกอิน: sync ไปที่ `user_preferences.theme` (`LIGHT` / `DARK` / `SYSTEM`) ด้วย
- **Implementation:**
  - Tailwind `darkMode: 'class'`: ใส่ class `dark` / `light` ที่ `<html>` และสลับค่า CSS variables ตาม class
  - **กันจอกะพริบ (FOUC):** ใส่ inline script เล็กๆ ใน `<head>` ของ `index.html` ให้อ่านค่าธีมแล้วตั้ง class ก่อน React render
  - ตั้ง `<meta name="theme-color">` ให้เปลี่ยนตามธีม (`#07070D` / `#FAF8F3`)
  - `ThemeProvider` + hook `useTheme()` อยู่ใน `packages/ui` ใช้ร่วมกันทั้ง `apps/frontend` และ `apps/admin`
  - `apps/admin` (antd): map token เดียวกันเข้า `ConfigProvider` (ดูหัวข้อ "Ant Design ใน Backoffice")
- **หน้าที่ต้องเป็น Dark เสมอ:** Staff Scanner (`/merchant/tonight`) เพราะใช้ในร้านที่มืด เพื่อไม่ให้แสบตา
- **รูปภาพ:** รูปร้านไม่ต้องปรับตามธีม แต่ overlay และ gradient บนรูปต้องเปลี่ยนตามธีม

### Motion
ใช้ **Motion** (`motion/react`, เดิมชื่อ Framer Motion) และกำหนด motion tokens ใน `packages/ui`

| Token | ค่า | ใช้กับ |
|---|---|---|
| `duration.fast` | 150ms | hover, กดปุ่ม, toggle |
| `duration.base` | 250ms | เปิด/ปิด dropdown, tab, การ์ด |
| `duration.slow` | 400ms | page transition, bottom sheet, เปลี่ยนธีม |
| `ease.out` | `cubic-bezier(0.22, 1, 0.36, 1)` | ค่าเริ่มต้น |
| `spring.sheet` | `{ type: 'spring', stiffness: 380, damping: 32 }` | bottom sheet, modal |

**Motion สำหรับสลับธีม (Light ↔ Dark)** ⭐
- ใช้ **View Transitions API** ทำ circular reveal ขยายวงกลมออกจากตำแหน่งปุ่มสลับธีม ใช้เวลา 400ms ด้วย `ease.out`
- ไอคอนพระจันทร์ ↔ ดวงอาทิตย์ หมุน 90° พร้อม fade/scale ใช้เวลา 250ms
- **Fallback** (browser ที่ไม่รองรับ View Transitions): ใส่ `transition: background-color, color, border-color 300ms` ที่ตัวแปรสีหลัก
- ห้ามใส่ transition สีให้ทุก element ตลอดเวลา ให้เปิด class `theme-transition` เฉพาะช่วงที่กำลังสลับ แล้วเอาออก เพื่อไม่ให้ UI หน่วง

**Motion ใน UI**
- **Page transition:** fade + เลื่อนขึ้น 8px (250ms)
- **Tier List:** แถว S → A → B → C ค่อยๆ ปรากฏแบบ stagger ห่างกัน 60ms และการ์ดในแถวไล่ต่อกันทีละ 40ms
- **การ์ดร้าน:** hover แล้วยกขึ้น `y: -4px` + ขอบทอง + glow ม่วง ส่วนกด (tap) ให้ `scale: 0.98`
- **ดาว / คะแนน:** ดาวค่อยๆ เติมสีทองจากซ้ายไปขวาเมื่อเลื่อนมาเห็นในจอ และตัวเลขคะแนนนับขึ้น (count-up)
- **ปุ่ม ♥ Favorite:** เด้ง (scale 1 → 1.25 → 1) + เปลี่ยนเป็นสีทอง
- **Crowd Status:** จุดสีมี pulse เบาๆ เฉพาะสถานะ 🟢 ว่าง (2 วินาทีต่อรอบ)
- **Hero:** ภาพพื้นหลัง parallax เบาๆ (ไม่เกิน 20px) และแสงบนแก้วมี shimmer 1 ครั้งตอนโหลด
- **Bottom sheet ประเมินราคา:** เลื่อนขึ้นแบบ `spring.sheet` และยอด Estimated Total นับตัวเลขเมื่อค่าเปลี่ยน
- **จองสำเร็จ:** เครื่องหมายถูกวาดเส้น (path draw) พร้อมประกายทองเล็กๆ รวมไม่เกิน 1 วินาที
- **Skeleton loading:** shimmer ไล่จาก `--card` ไป `--border`
- **Toast / แจ้งเตือน:** slide-in จากบนบนมือถือ และจากมุมขวาล่างบน desktop

**กฎ Motion**
- เคารพ `prefers-reduced-motion`: ถ้าผู้ใช้ปิด motion ให้ตัด parallax, stagger, count-up และ circular reveal เหลือแค่ fade 150ms หรือเปลี่ยนทันที ใช้ `useReducedMotion()` ของ Motion
- animate เฉพาะ `transform` และ `opacity` (ยกเว้นตอนสลับธีม) เพื่อให้ได้ 60fps บนมือถือ
- motion ต้องไม่ขวางการใช้งาน ผู้ใช้ต้องกดปุ่มได้ทันทีโดยไม่ต้องรอ animation จบ
- Staff Scanner ใช้ motion น้อยที่สุด เน้นความเร็ว

### ระดับร้าน = ดาว (ไม่แสดงตัวอักษร S / A / B / C)
ผู้ใช้เห็นระดับร้านเป็น **ดาว 1–5** เท่านั้น ตัวอักษร Tier (S/A/B/C) ใช้แค่ภายในโค้ดและฐานข้อมูล:

| ภายใน | ที่ผู้ใช้เห็น | เงื่อนไข (คะแนนรวม) |
|---|---|---|
| S | ★★★★★ 5 ดาว | ≥ 90 |
| A | ★★★★☆ 4 ดาว | 75–89 |
| B | ★★★☆☆ 3 ดาว | 60–74 |
| C | ★★☆☆☆ / ★☆☆☆☆ 1–2 ดาว | < 60 |

- component: `<TierStars stars|tier size="sm|lg" />` (packages/ui) · ในการ์ด/หน้าร้านใช้ `<BarRating bar />` = ดาว + คะแนนรีวิวเฉลี่ย + จำนวนรีวิว
- ร้านที่ขึ้นเป็น "ร้านใหม่" (รีวิวน้อยกว่า 5) ยังไม่มีดาวและยังไม่อยู่ในหน้าจัดอันดับ
- **หน้าจัดอันดับ:** หัวแถวเป็นกล่องดาวใหญ่ (5 ดาว → 1–2 ดาว) ด้านซ้าย การ์ดร้านเรียงแนวนอน เลื่อนได้บนมือถือ
- ดาวเป็นสีทองเสมอ (`--gold-text`) สี `--tier-*` เก็บไว้ใช้ในกราฟของ admin เท่านั้น

### Ant Design + Tailwind (ทั้ง `apps/frontend` และ `apps/admin`)
- **antd v6** เป็นคอมโพเนนต์หลักทั้ง 2 แอป (`apps/admin` ใช้ ProComponents เพิ่ม) ส่วน **Tailwind** ใช้กับ layout, spacing, responsive และของตกแต่ง (gradient, glow) ไม่ใช้สร้างคอมโพเนนต์ซ้ำกับ antd
- **Theme:** มี `ConfigProvider` ตัวเดียวที่ root ใช้ `theme.darkAlgorithm` / `theme.defaultAlgorithm` ตามธีมที่เลือก และ map Midnight Gold token:
  - `colorPrimary: '#E8B64C'`, `colorLink: '#B86BFA'` (Light: `#7E22CE`), `colorInfo: '#A738F5'`
  - `colorBgBase: '#07070D'` (Light: `#FAF8F3`), `colorBgContainer: '#171520'` (Light: `#FFFFFF`)
  - `colorBorder: '#34283F'` (Light: `#E4DCCF`), `colorTextBase: '#F5F1E8'` (Light: `#1A1523`)
  - `borderRadius: 12`
  - ค่าสีทั้งหมดมาจาก `packages/ui/tokens.ts` ไฟล์เดียว แล้วสร้างทั้ง antd theme และ Tailwind CSS variables จากไฟล์นี้
- **ลำดับ CSS:** ใช้ `StyleProvider layer` ของ antd คู่กับ Tailwind v4 `@layer theme, base, antd, components, utilities` เพื่อไม่ให้ Tailwind preflight ไปทับ antd
- **Layout (admin):** `ProLayout` (เมนูซ้าย + access ตาม role ADMIN) และหน้า CRUD ใช้ `ProTable` + `ProForm`/`ModalForm`
- **กฎ:**
  - ปรับ theme ด้วย token ก่อน แล้วค่อยใช้ `classNames` / `styles` / Tailwind class ห้าม override `.ant-*` แบบ global
  - `Table` ต้องมี `rowKey` เสมอ และใช้ server-side pagination/sort/filter ผ่าน NestJS API
  - เมนูและ access ต้องตรงกับการตรวจสิทธิ์ฝั่ง backend
  - ห้ามใช้ shadcn/ui หรือ UI library อื่นเพิ่ม
- **Agent Skill:** repo มี skill `ant-design` และ `antd` อยู่ใน `.claude/skills/` ก่อนเขียนหรือแก้โค้ด antd ให้ค้น API ด้วย `antd info <Component> --format json` และหลังแก้ให้รัน `antd lint <path> --format json`
- **React:** ใช้ **function component + hooks** ทั้งหมด (standard React) ห้ามเขียน class component ยกเว้น `ErrorBoundary` HOC ใช้เฉพาะเรื่องที่ครอบหลายหน้า เช่น `withErrorBoundary` ส่วนการกันสิทธิ์เข้าหน้าให้ใช้ layout route (`<RequireAuth>`, `<RequireRole>`)
- **เอกสารประกอบ:** [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`SITEMAP.md`](SITEMAP.md)

### คอมโพเนนต์หลัก
- **Header:** โลโก้ + เมนู (หน้าแรก / จัดอันดับ / ร้าน / รีวิว / เกี่ยวกับเรา) + ช่องค้นหาทรงแคปซูล + ปุ่มสลับธีม + โปรไฟล์ โดยเมนูที่เลือกอยู่เป็นสีทองพร้อมขีดล่างทอง
- **ปุ่ม:**
  - Primary: พื้น `--gold` ตัวอักษร `--on-gold`
  - Secondary: ขอบทอง ตัวอักษร `--gold-text` พื้นโปร่ง
  - Tertiary: ตัวอักษร `--link`
  - ทุกปุ่มมุมโค้งแบบ pill (9999px) หรือ 12px
- **การ์ดร้าน:** รูป, ชื่อ, ดาว (1–5) หรือป้าย "ร้านใหม่", ป้าย Tier, ป้าย "แนะนำ · โฆษณา" (ถ้าโปรโมท), ประเภท/สไตล์, ระยะทาง, ราคาต่อหัว, Safety Score, Crowd Status, ปุ่ม ♥ และปุ่ม "ดูรายละเอียด →" ขอบทอง
- **Chip หมวดหมู่ / ตัวกรอง:** ขอบ `--border` ส่วนที่เลือกอยู่เป็นพื้น `--purple` ตัวอักษรขาว
- **แผงรายละเอียดร้าน (desktop):** เปิดเป็น side panel ด้านขวา มีรูป, ชื่อ + ป้าย Tier, ดาว, tag, คำอธิบาย, เวลาเปิด-ปิด, ราคาเฉลี่ย, ที่จอดรถ และปุ่ม "ดูรีวิวทั้งหมด"
- **หน้าร้าน:** ปุ่ม "ประเมินราคา" และ "จองเลย" ติดด้านล่างจอ
- **Staff Scanner:** ปุ่มใหญ่ ใช้มือเดียวได้ในที่มืด และบังคับเป็น Dark mode

### Layout อ้างอิงจาก Mockup (ใช้ token ของธีม Midnight Gold)
**Desktop (Home)**
- **Header:** โลโก้ NightOut (พระจันทร์เสี้ยว gradient ม่วง→ทอง) + เมนู: จัดอันดับ / จองโต๊ะ / แนะนำ / ค้นหา / โปรไฟล์
  - เมนูปกติเป็นสีเทา var(--muted) ส่วนเมนูที่เลือกอยู่เป็นทอง พร้อมขีดล่างทอง
- **Hero "ร้านแนะนำสุดฮอตในกรุงเทพฯ":**
  - พื้น gradient ดำ → ม่วงเข้ม (var(--background) → #1E0B33) และขอบบาง ทองจาง (rgba ของ #E8B64C ที่ 30%)
  - ป้าย "แนะนำ · โฆษณา" เป็นขอบทอง ตัวอักษรทอง
- **"อันดับร้านดังประจำสัปดาห์ (⭐–⭐⭐⭐⭐⭐)":** grid การ์ดร้าน 3 คอลัมน์ เลื่อนแนวนอนได้
- **การ์ดร้าน:**
  - พื้น var(--card), ขอบ var(--border), hover ขอบทอง + เงา glow ม่วงจางๆ
  - ดาวเป็นทอง ชื่อร้านเป็น #F5F5F5 และรายละเอียด (ประเภท, ราคาเฉลี่ย, Safety Score) เป็น var(--muted)
  - Crowd Status มีจุดสี + ข้อความ (ว่าง / ใกล้เต็ม / โต๊ะเต็ม)
- **แถบค้นหา + ตัวกรอง (ย่าน / ประเภท / งบ / เวลาว่าง):**
  - chip ปกติขอบ var(--border) ส่วน chip ที่เลือกเป็นพื้นม่วง #A738F5 ตัวอักษรขาว
- **"ร้านใกล้ฉัน":** แผนที่ธีมมืด หมุดร้านสีทอง ร้านที่โปรโมทเป็นหมุดทองมีวงม่วงรอบ
- **Sidebar ขวา (sticky):**
  - **การ์ด "ประเมินราคา & จองโต๊ะ":**
    - ฟิลด์: วันที่, เวลา, จำนวนคน, โซน, รายการเมนู
    - ยอดรวมโดยประมาณ (Estimated Total) ตัวใหญ่สีทอง
    - ปุ่มหลัก "คำนวณและจองเลย" พื้นทอง ตัวอักษรดำ
  - **การ์ด "ข้อมูลความปลอดภัย":** แต่ละรายการแสดง **สถานะเดียว** ✅ มี / ❌ ไม่มี / ⚪ ยังไม่มีข้อมูล (ไม่แสดง ✅ และ ❌ คู่กันแบบใน mockup) พร้อมป้าย "ร้านแจ้งเอง" หรือ "ยืนยันโดย NightOut"
- **Footer:** เกี่ยวกับเรา, เงื่อนไขการใช้งาน, นโยบายความเป็นส่วนตัว, ติดต่อเรา และบรรทัด "20+ · ดื่มไม่ขับ · PDPA" สีเทา

**Mobile**
- **Header:** hamburger + โลโก้ + avatar
- ลำดับเนื้อหา: ช่องค้นหา → Hero ร้านแนะนำ → การ์ดอันดับร้านเรียงเป็น 1 คอลัมน์
- **Bottom bar (sticky):**
  - ปุ่มรอง "ประเมินราคา & จองโต๊ะ" ขอบทอง ตัวอักษรทอง
  - ปุ่มหลัก "คำนวณและจองโต๊ะ" พื้นทอง ตัวอักษรดำ
  - ตัวประเมินราคาเปิดเป็น bottom sheet (var(--card))

**การใช้สีตามองค์ประกอบ (สรุป)**
| องค์ประกอบ | สี |
|---|---|
| พื้นหน้า / การ์ด / modal | var(--background) / var(--card) / var(--card) |
| ปุ่มหลัก (จอง, คำนวณ), ดาว, ยอดเงิน, ป้ายโฆษณา, Editor's Pick | ทอง #E8B64C (hover #FFD77A) |
| ปุ่มรอง, chip ที่เลือก, focus ring, badge สไตล์ร้าน | ม่วง #A738F5 |
| ลิงก์, ข้อความเน้นบนพื้นดำ | ม่วงอ่อน `--link` #B86BFA |
| Hero / แบนเนอร์ / โลโก้ | gradient ม่วง #A738F5 → ทอง #E8B64C หรือ ดำ → ม่วงเข้ม #1E0B33 |
| Crowd Status | 🟢 #22C55E / 🟡 #EAB308 / 🔴 #EF4444 (ใส่ข้อความคู่ด้วยเสมอ) |
| ห้ามใช้ | สีส้ม/อำพัน (Amber), hex ตรงๆ ในคอมโพเนนต์ และม่วง #A738F5 กับข้อความขนาดเล็ก |

**ข้อความใน UI:** ใช้ภาษาไทยให้ถูกต้องทั้งหมด (mockup มีข้อความภาษาไทยเพี้ยนหลายจุด) ส่วนชื่อร้านใน seed data ต้องเป็นชื่อสมมติ ห้ามใช้ชื่อร้านจริง

## Production Requirements
- **Security:**
  - Supabase RLS + RBAC (NestJS Guards) และตรวจ Supabase JWT ฝั่ง server ใน NestJS
  - Input validation (nestjs-zod) และ rate limiting (@nestjs/throttler)
  - CORS จำกัดเฉพาะโดเมนของ web/admin
  - ตรวจชนิดและขนาดไฟล์ (รูป/สลิป)
  - QR token แบบ signed + ใช้ครั้งเดียว
- **Booking:**
  - Reservation interval + exclusion constraint + zone capacity lock
  - Status transition rules ที่ validate ทั้งใน API และ DB
  - Price/Package snapshot
  - Auto-cancel, no-show และ pending expiry
- **Billing:** billing events แบบ idempotent (unique booking_id + event_type)
- **System:** Audit logs, error logging, backup/recovery และ notification retry + dead-letter
- **Privacy:** ตามหัวข้อนโยบายด้านบน
- **Testing:** unit test (Vitest/Jest) สำหรับ price calculator, star calculator และ status transitions, integration test ของ NestJS กับ Supabase local (`supabase start`) สำหรับ overlap/double booking (ยิงจองพร้อมกันหลาย request), E2E ด้วย Playwright
- **Infra:** `terraform plan` ต้องผ่านก่อน merge และแยก state ต่อ environment

---

## Development Phases
**MVP (Phase 1)** — ทำตามลำดับนี้
- **1A Customer:**
  - Age Gate + Consent, Auth, Onboarding
  - Ranking (ดาว) + ร้านแนะนำ (โปรโมท), Search/Filter, Restaurant Detail (Safety + Crowd)
  - Menu, Price Estimate, Availability
  - Booking (+snapshot), Deposit, Share to Gang
  - QR Check-in, Review, Favorite, Notifications
- **1B Merchant:**
  - Signup + Verification
  - จัดการร้าน, เวลาเปิด-ปิด, styles, links, เมนู, ราคา/ค่าธรรมเนียม, แพ็กเกจ, โซน/โต๊ะ, มัดจำ และ Safety
  - Booking Management, Tonight/Scanner, Crowd Status
  - Staff accounts, Analytics และหน้าซื้อโปรโมท
- **1C Admin (apps/admin):**
  - อนุมัติร้านและยืนยัน Safety
  - ดาว / Editor's Pick
  - แพ็กเกจโปรโมทและการอนุมัติ
  - Users, Booking monitoring, Review moderation
  - Commission Rules, Billing Events และ Audit Log

**Phase 2 — AI & Growth**
- AI Recommendation และ AI Chatbot แนะนำร้าน
- Campaign / UTM tracking
- เชื่อม Instagram Business ของร้าน (ร้านต้องยินยอม)
- Payment gateway อัตโนมัติ (แทนการอัปโหลดสลิป) สำหรับมัดจำและค่าโปรโมท และ Refund อัตโนมัติ
- eKYC ยืนยันอายุ
- ขยาย Tier List ไปต่างจังหวัด

## ไม่ทำใน MVP
- โปรลด แจก หรือแถมเครื่องดื่มแอลกอฮอล์ รวมถึงการใช้คำเลี่ยงเพื่อทำโปรเหล่านี้
- ถือเงินลูกค้าแทนร้าน, payment gateway และ refund อัตโนมัติ
- ดึงข้อมูลใดๆ จากโซเชียล (ใช้ External Links เท่านั้น)
- Campaign / UTM tracking
- AI ทั้งหมด (ไปอยู่ใน Phase 2)
- ระบบ referral ที่ซับซ้อน

## ลำดับการส่งงาน
1. Sitemap + User Flow (Customer / Merchant / Staff / Admin)
2. Wireframe หน้าหลัก: Home (ร้านแนะนำ + Ranking ดาว), Restaurant Detail, Booking + Deposit, บัตรจองที่แชร์, Staff Scanner
3. Setup monorepo (pnpm + Turborepo) ตามโครงสร้าง `night-list/`: React (Vite) 2 แอป, NestJS, packages/config, types, ui, utils
4. `infra/terraform`: Vercel 3 projects + Supabase (dev/staging) + CI pipeline
5. `apps/backend/supabase`: migrations, RLS, exclusion constraint, DB functions, pg_cron schedules
6. Seed data ร้านสมมติ 15 ร้านในกรุงเทพฯ ให้ครบ 3 ประเภท พร้อม hours, styles, safety, zones/tables และ commission rules โดยทำตามนโยบายถ้อยคำ
7. NestJS (`apps/backend`): auth guard → availability → booking (overlap protection + snapshot) → status transitions → deposit → check-in → billing events → promoted listings
8. NestJS jobs (`/jobs/*` เรียกจาก pg_cron): auto-cancel/no-show, pending expiry, notification outbox + retry, คำนวณดาว, เปิด/ปิดโปรโมท
9. `apps/frontend` ฝั่งลูกค้า: Search → Restaurant Detail → Pricing → Booking → Deposit → Share → QR → Review + OG/SEO function
10. `apps/frontend/merchant`: Dashboard + Tonight + Crowd Status (Realtime) + Promote
11. `apps/admin`: Backoffice ทั้งหมด
12. PWA, Testing, Production Deployment (terraform apply prod + manual approval) และ README

เริ่มจากข้อ 1 แล้วถามฉันก่อนถ้ามีจุดที่ไม่ชัดเจน
