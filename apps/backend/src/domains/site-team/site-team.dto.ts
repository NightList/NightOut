import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateTeamMemberDto extends createZodDto(C.TeamMemberBody) {}
export class UpdateTeamMemberDto extends createZodDto(C.UpdateTeamMemberBody) {}
export class ReorderTeamDto extends createZodDto(C.ReorderTeamBody) {}
