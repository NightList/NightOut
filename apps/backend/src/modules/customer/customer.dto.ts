import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

/** DTO = zod จาก @nightout/contracts (สัญญาชุดเดียวกับหน้าเว็บ) ห่อด้วย createZodDto ให้ Nest ตรวจ + ทำ Swagger */
export class CreateBookingDto extends createZodDto(C.CreateBookingBody) {}
export class SubmitDepositDto extends createZodDto(C.SubmitDepositBody) {}
export class CancelBookingDto extends createZodDto(C.CancelBookingBody) {}
export class AddReviewDto extends createZodDto(C.AddReviewBody) {}
export class MarkReadDto extends createZodDto(C.MarkReadBody) {}
export class UpdateProfileDto extends createZodDto(C.UpdateProfileBody) {}
export class ReportReviewDto extends createZodDto(C.ReportReviewBody) {}
export class RespondInviteDto extends createZodDto(C.RespondInviteBody) {}
export class MerchantJoinDto extends createZodDto(C.MerchantJoinBody) {}
