import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class SignedUrlsDto extends createZodDto(C.SignedUrlsBody) {}
export class UploadUrlDto extends createZodDto(C.UploadUrlBody) {}
