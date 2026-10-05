import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * เข้ารหัสเลขบัญชีร้านก่อนบันทึก (AES-256-GCM) — DB เก็บ iv(12) + tag(16) + ciphertext
 * key มาจาก PAYOUT_ENCRYPTION_KEY (ห้ามเปลี่ยนหลังมีข้อมูลแล้ว ไม่งั้นถอดรหัสของเดิมไม่ได้)
 */
@Injectable()
export class PayoutCryptoService {
  constructor(private readonly config: ConfigService) {}

  private key(): Buffer {
    const raw = this.config.get<string>('PAYOUT_ENCRYPTION_KEY');
    if (!raw) throw new ServiceUnavailableException('PAYOUT_ENCRYPTION_KEY is not configured');
    return createHash('sha256').update(raw).digest();
  }

  /** คืน base64 ของ iv + tag + ciphertext */
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
  }
}
