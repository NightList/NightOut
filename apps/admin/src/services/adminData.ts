/**
 * จุดเดียวที่หน้า Backoffice ใช้อ่าน/เขียนข้อมูล — ของจริงอยู่ใน services/api/<domain>.ts (เรียก Rest) และ services/queries/<domain>.ts (TanStack Query)
 * ชื่อโดเมนเดียวกับ backend และ @nightout/contracts (ADR 0006)
 */
export * from '@/services/queries/keys';
export * from '@/services/queries/backoffice';
export * from '@/services/queries/account';
export * from '@/services/queries/storage';
