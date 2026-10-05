import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class SubmitDepositDto extends createZodDto(C.SubmitDepositBody) {}
export class RefundDepositDto extends createZodDto(C.RefundDepositBody) {}
export class ReviewDepositDto extends createZodDto(C.ReviewDepositBody) {}
export class SettleDepositDto extends createZodDto(C.SettleDepositBody) {}
