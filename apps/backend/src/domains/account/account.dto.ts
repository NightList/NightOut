import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateProfileDto extends createZodDto(C.UpdateProfileBody) {}
export class MarkReadDto extends createZodDto(C.MarkReadBody) {}
export class CreateUserDto extends createZodDto(C.CreateUserBody) {}
export class UpdateUserAccountDto extends createZodDto(C.UpdateUserAccountBody) {}
export class SetUserRoleDto extends createZodDto(C.SetUserRoleBody) {}
export class UnbanUserDto extends createZodDto(C.UnbanUserBody) {}
