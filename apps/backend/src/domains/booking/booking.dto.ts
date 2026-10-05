import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateBookingDto extends createZodDto(C.CreateBookingBody) {}
export class CancelBookingDto extends createZodDto(C.CancelBookingBody) {}
export class TeamBookingStatusDto extends createZodDto(C.TeamBookingStatusBody) {}
export class MoveBookingDto extends createZodDto(C.MoveBookingBody) {}
export class CheckInDto extends createZodDto(C.CheckInBody) {}
export class ZoneAvailabilityQueryDto extends createZodDto(C.ZoneAvailabilityQuery) {}
