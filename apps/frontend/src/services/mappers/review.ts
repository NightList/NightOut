import type { Review, ReviewMedia } from '@nightout/mock';
import { signedUrls } from '@/services/api/storage';
import { log } from '@/services/log';

/** review — แถวจาก view public_reviews / my_reviews → รูปแบบที่หน้าเว็บใช้ (ชนิด Review ของ @nightout/mock) */
export interface MediaRow {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  storage_path: string;
  thumb_path?: string | null;
  duration_sec?: number | null;
}
export interface PublicReviewRow {
  id: string;
  bar_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  display_name: string | null;
  media: MediaRow[];
}
export interface MyReviewRow extends Omit<PublicReviewRow, 'display_name'> {
  booking_id: string;
  status: Review['status'];
}
/** URL ชั่วคราวของไฟล์รีวิว (bucket review-media เป็น private) — ขอผ่าน API */
export async function signReviewPaths(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  try {
    return await signedUrls('review-media', paths, 6 * 3600);
  } catch (e) {
    log.warn('ขอ URL รูปรีวิวไม่สำเร็จ', (e as Error).message);
    return new Map();
  }
}

export const mediaPaths = (rows: { media: MediaRow[] }[]) =>
  rows.flatMap((r) => r.media.flatMap((m) => [m.storage_path, m.thumb_path].filter((p): p is string => !!p)));

function toMedia(m: MediaRow, urls: Map<string, string>): ReviewMedia {
  return m.kind === 'VIDEO'
    ? {
        id: m.id,
        type: 'video',
        src: urls.get(m.storage_path),
        poster: m.thumb_path ? urls.get(m.thumb_path) : undefined,
        duration: m.duration_sec ?? undefined,
      }
    : { id: m.id, type: 'image', src: urls.get(m.storage_path) };
}


export function toPublicReview(r: PublicReviewRow, urls: Map<string, string>): Review {
  return {
    id: r.id,
    barId: r.bar_id,
    userName: r.display_name ?? 'ผู้ใช้ NightOut',
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: r.created_at,
    media: r.media.length ? r.media.map((m) => toMedia(m, urls)) : undefined,
    status: 'PUBLISHED',
  };
}

export function toMyReview(r: MyReviewRow, me: { id: string; displayName: string }, urls: Map<string, string>): Review {
  return {
    id: r.id,
    barId: r.bar_id,
    bookingId: r.booking_id,
    userId: me.id,
    userName: me.displayName,
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: r.created_at,
    media: r.media.length ? r.media.map((m) => toMedia(m, urls)) : undefined,
    status: r.status,
  };
}
