/**
 * hook กลางของ Backoffice (useAdminView · useAdminAction · useSignedUrl) — ชื่อ view / path / body ของแต่ละหน้าอยู่ใน modules/<หน้า>/api.ts (ADR 0007)
 * ชื่อโดเมนเดียวกับ backend และ @nightout/contracts (ADR 0006)
 */
export * from '@/services/queries/keys';
export * from '@/services/queries/backoffice';
export * from '@/services/queries/storage';
