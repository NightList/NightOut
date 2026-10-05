import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class OrderPromotionDto extends createZodDto(C.OrderPromotionBody) {}
export class ReviewPromotionDto extends createZodDto(C.ApproveBody) {}
