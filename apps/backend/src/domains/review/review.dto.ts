import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class AddReviewDto extends createZodDto(C.AddReviewBody) {}
export class ReportReviewDto extends createZodDto(C.ReportReviewBody) {}
export class ModerateReviewDto extends createZodDto(C.ModerateReviewBody) {}
