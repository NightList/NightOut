import { getVersion, subscribe } from '@nightout/mock';
import { useSyncExternalStore } from 'react';

/**
 * Re-render เมื่อข้อมูลเดโมเปลี่ยน แล้วเรียก service ของ @nightout/mock ตรงๆ ใน render
 * (ตอนต่อ Supabase / NestJS จริง ให้เปลี่ยนเป็น TanStack Query ทีละหน้า)
 */
export function useDemo(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}
