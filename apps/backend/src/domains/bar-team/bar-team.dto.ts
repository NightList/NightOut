import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class InviteStaffDto extends createZodDto(C.InviteStaffBody) {}
export class RespondInviteDto extends createZodDto(C.RespondInviteBody) {}
