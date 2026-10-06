import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PUBLIC_BUCKETS } from '@nightout/contracts';
import type { Request } from 'express';
import { bearerOf } from '../../auth/bearer';
import { SupabaseJwtGuard, type AuthedRequest } from '../../auth/supabase-jwt.guard';
import { ApiDoc } from '../../common/api-doc';
import { SupabaseService } from '../../supabase/supabase.service';
import { SignedUrlsDto, UploadUrlDto } from './storage.dto';

/**
 * storage — ไฟล์ใน Supabase Storage: หน้าเว็บขอ URL จากที่นี่แล้ว PUT/GET ตรงกับ Storage (ไฟล์ใหญ่ไม่ผ่าน API)
 * สิทธิ์จริงตัดสินโดย Storage policy ของแต่ละ bucket ในนามผู้เรียก (โฟลเดอร์แรก = เจ้าของ)
 */
@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly db: SupabaseService) {}

  @Post('signed-urls')
  @HttpCode(200)
  @ApiDoc({
    summary: 'ขอ URL ชั่วคราวของไฟล์',
    description: 'เช่นรูป/วิดีโอรีวิว (bucket private) หรือสลิปของตัวเอง — Storage policy ตัดสินว่าผู้เรียกเห็นไฟล์ไหนได้ (ส่ง Bearer ถ้าล็อกอิน)',
    returns: '`urls` = object { path → URL } เฉพาะไฟล์ที่มีสิทธิ์',
    auth: false,
  })
  async signedUrls(@Req() req: Request, @Body() b: SignedUrlsDto) {
    return { urls: await this.db.signUrlsAs(bearerOf(req), b.bucket, b.paths, b.expires_in) };
  }

  @Post('upload-url')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(SupabaseJwtGuard)
  @ApiDoc({
    summary: 'ขอ URL อัปโหลดไฟล์',
    description:
      'สลิปมัดจำ / รูป-วิดีโอรีวิว / สลิปโปรโมท / หลักฐานความปลอดภัย / รูปทีมงาน — หน้าเว็บ PUT ไฟล์ตรงเข้า URL นี้ · Storage policy ตรวจว่าโฟลเดอร์แรกเป็นของผู้เรียก',
    returns: '`upload_url` URL สำหรับ PUT ไฟล์ (ใช้ได้ครั้งเดียว ~2 ชม.) · `path` path ที่จะได้ · `public_url` URL ถาวร (เฉพาะ bucket public เช่น team-photos)',
    forbidden: 'อัปโหลดลงโฟลเดอร์ของคนอื่นไม่ได้',
  })
  async uploadUrl(@Req() req: AuthedRequest, @Body() b: UploadUrlDto) {
    const upload_url = await this.db.signedUploadUrlAs(bearerOf(req)!, b.bucket, b.path);
    return { upload_url, path: b.path, public_url: PUBLIC_BUCKETS.includes(b.bucket) ? this.db.publicUrl(b.bucket, b.path) : null };
  }
}
