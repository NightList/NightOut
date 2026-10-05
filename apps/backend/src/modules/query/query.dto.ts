import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export { PUBLIC_BUCKETS, UPLOAD_BUCKETS } from '@nightout/contracts';

export class ZoneAvailabilityQueryDto extends createZodDto(C.ZoneAvailabilityQuery) {}
export class SignedUrlsDto extends createZodDto(C.SignedUrlsBody) {}
export class UploadUrlDto extends createZodDto(C.UploadUrlBody) {}
