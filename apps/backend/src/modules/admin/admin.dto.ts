import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export { ACCOUNT_TYPES, canCreateRole, CreateUserBody, type AccountType } from '@nightout/contracts';

export class SetBarStatusDto extends createZodDto(C.SetBarStatusBody) {}
export class SetEditorPickDto extends createZodDto(C.SetEditorPickBody) {}
export class ReviewDto extends createZodDto(C.ApproveBody) {}
export class ReviewDepositDto extends createZodDto(C.ReviewDepositBody) {}
export class UnbanUserDto extends createZodDto(C.UnbanUserBody) {}
export class SettleDepositDto extends createZodDto(C.SettleDepositBody) {}
export class ModerateReviewDto extends createZodDto(C.ModerateReviewBody) {}
export class SetUserRoleDto extends createZodDto(C.SetUserRoleBody) {}
export class UpdateUserAccountDto extends createZodDto(C.UpdateUserAccountBody) {}
export class CreateTeamMemberDto extends createZodDto(C.TeamMemberBody) {}
export class UpdateTeamMemberDto extends createZodDto(C.UpdateTeamMemberBody) {}
export class ReorderTeamDto extends createZodDto(C.ReorderTeamBody) {}
export class CreateUserDto extends createZodDto(C.CreateUserBody) {}
