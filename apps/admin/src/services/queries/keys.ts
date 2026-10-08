/**
 * queryKey ของ Backoffice — ทุกการอ่านขึ้นต้นด้วย 'admin' → การกระทำใด ๆ สำเร็จแล้ว invalidate ทีเดียวทุกหน้า
 * (query ใน modules/<หน้า>/api.ts ก็ต้องขึ้นต้น 'admin' เช่น ['admin', 'dashboard'])
 */
export const backofficeKeys = {
  all: ['admin'] as const,
  view: (view: string, opts: unknown) => ['admin', 'view', view, opts] as const,
};
export const storageKeys = {
  signed: (bucket: string, path: string | null | undefined) => ['storage', 'signed', bucket, path] as const,
};
