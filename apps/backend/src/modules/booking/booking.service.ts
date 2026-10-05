import { BadRequestException, Injectable } from '@nestjs/common';
import type { BookingStatus, UserRole } from '@nightout/types';
import { canTransition, nextStatuses } from '@nightout/utils';

type Actor = UserRole | 'SYSTEM';

/**
 * Booking domain service
 * TODO: availability (reservation interval), create booking in a transaction
 *       (exclusion constraint + zone capacity lock), price/package snapshot, outbox
 */
@Injectable()
export class BookingService {
  /** ตรวจว่าเปลี่ยนสถานะได้ตาม state machine ไม่งั้น throw 400 */
  assertTransition(from: BookingStatus, to: BookingStatus, actor: Actor): void {
    if (!canTransition(from, to, actor)) {
      throw new BadRequestException(
        `ไม่สามารถเปลี่ยนสถานะจาก ${from} เป็น ${to} (${actor}) — ทำได้: ${
          nextStatuses(from, actor).join(', ') || 'ไม่มี'
        }`,
      );
    }
  }
}
