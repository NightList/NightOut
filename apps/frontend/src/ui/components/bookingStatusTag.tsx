import type { BookingStatus } from '@nightout/types';
import { Tag } from 'antd';
import { BOOKING_STATUS } from '@/ui/utils/format';

export function BookingStatusTag({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS[status];
  return <Tag color={s.color}>{s.label}</Tag>;
}
