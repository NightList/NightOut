import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class PriceEstimateDto extends createZodDto(C.PriceEstimateBody) {}
