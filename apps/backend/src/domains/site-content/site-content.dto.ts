import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateHomeContentDto extends createZodDto(C.UpdateHomeContentBody) {}
export class UpdateHomeCategoryDto extends createZodDto(C.UpdateHomeCategoryBody) {}
export class UpdateHomePopularDto extends createZodDto(C.UpdateHomePopularBody) {}
