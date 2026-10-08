# Architecture Decision Records

บันทึกการตัดสินใจเชิงสถาปัตยกรรม 1 เรื่องต่อ 1 ไฟล์ (`NNNN-ชื่อเรื่อง.md`) — ห้ามแก้เนื้อหาของ ADR ที่ Accepted แล้ว ถ้าเปลี่ยนใจให้เขียน ADR ใหม่ที่ Supersede ของเดิม

| # | เรื่อง | สถานะ |
|---|---|---|
| [0001](0001-writes-through-backend-api.md) | การเขียนข้อมูลทั้งหมดผ่าน NestJS | Accepted |
| [0002](0002-migrate-direct-db-calls-to-backend-api.md) | ย้ายการอ่าน DB ตรงจากหน้าเว็บไปที่ Backend API | Accepted |
| [0003](0003-migrate-admin-direct-db-calls-to-backend-api.md) | ย้ายการอ่านข้อมูลของ Backoffice ไปที่ Backend API | Accepted |
| [0004](0004-shared-rest-client.md) | Rest client กลางใน `@nightout/utils/rest` ใช้ร่วมทุกแอป | Accepted |
| [0005](0005-account-role-catalog.md) | ชั้นบัญชีอิงตาราง `roles` และมีแต่ Super Admin ที่แก้ชั้นของบัญชีที่มีอยู่แล้ว | Accepted |
| [0006](0006-domain-sliced-api-and-shared-contracts.md) | จัดโค้ด API ตามโดเมน + สัญญา API ชุดเดียวใน `packages/contracts` | Accepted |
| [0007](0007-module-api-file.md) | API ของหน้าอยู่ใน `modules/<หน้า>/api.ts` ของโมดูลนั้น (Supersede บางส่วนของ 0006) | Accepted |
| [0008](0008-api-response-envelope.md) | ทุกคำตอบของ API เป็น `ApiResponse` { status, status_code, data, code, err_msg } · Rest แกะให้ | Accepted |
