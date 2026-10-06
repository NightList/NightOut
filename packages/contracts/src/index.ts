/**
 * @nightout/contracts — สัญญา API ของ NightOut 1 ไฟล์ต่อ 1 โดเมน (ADR 0006)
 *   backend:  class XDto extends createZodDto(C.XBody)   (apps/backend/src/domains/<domain>/<domain>.dto.ts)
 *   frontend: Rest.post<C.XResult>('/…', body satisfies C.XBody)   (apps/frontend|admin/src/services/api/<domain>.ts)
 * ไม่มี Nest / React / axios ที่นี่ — zod + type เท่านั้น
 */
export * from './common';
export * from './booking';
export * from './deposit';
export * from './review';
export * from './bar';
export * from './bar-team';
export * from './account';
export * from './promotion';
export * from './billing';
export * from './site-team';
export * from './storage';
export * from './pricing';
export * from './backoffice';
export * from './errors';
