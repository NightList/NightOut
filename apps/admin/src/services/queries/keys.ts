/**
 * queryKey ของ Backoffice — ทุกการอ่านขึ้นต้นด้วย 'admin' → การกระทำใด ๆ สำเร็จแล้ว invalidate ทีเดียวทุกหน้า
 */
export const backofficeKeys = {
  all: ['admin'] as const,
  view: (view: string, opts: unknown) => ['admin', 'view', view, opts] as const,
  dashboard: ['admin', 'dashboard'] as const,
  master: (table: string) => ['admin', 'master', table] as const,
};
export const accountKeys = {
  roles: ['admin', 'roles'] as const,
};
export const storageKeys = {
  signed: (bucket: string, path: string | null | undefined) => ['storage', 'signed', bucket, path] as const,
};
