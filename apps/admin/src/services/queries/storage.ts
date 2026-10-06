import { useQuery } from '@tanstack/react-query';
import type { UploadBucket } from '@nightout/contracts';
import { signedUrl } from '@/services/api/storage';
import { storageKeys } from './keys';

/** URL ชั่วคราว (10 นาที) ของไฟล์ในบักเก็ตส่วนตัว เช่นสลิป */
export function useSignedUrl(bucket: Extract<UploadBucket, 'deposit-slips' | 'promo-slips' | 'bar-verifications'>, path: string | null | undefined) {
  return useQuery({
    queryKey: storageKeys.signed(bucket, path),
    enabled: !!path,
    staleTime: 9 * 60_000,
    queryFn: () => (path ? signedUrl(bucket, path) : null),
  });
}
