import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export type { PriceEstimateBody, PriceEstimateResult } from '@nightout/contracts';
export class PriceEstimateDto extends createZodDto(C.PriceEstimateBody) {}
