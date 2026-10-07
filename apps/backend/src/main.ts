import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApp } from './bootstrap';

async function main() {
  const app = await createApp();
  const port = app.get(ConfigService).get<number>('PORT', 3000);
  const server = await app.listen(port);
  // ค่าเริ่มต้นของ Node ปิด connection ว่างหลัง 5 วิ — เบราว์เซอร์เก็บไว้นานกว่าแล้วหยิบตัวที่ถูกปิดมาใช้ → "ติดต่อ API ไม่ได้" ครั้งแรกหลังกลับมาที่แท็บ
  // ให้ server ถือนานกว่าเบราว์เซอร์ (headersTimeout ต้องมากกว่า keepAliveTimeout)
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  Logger.log(`API http://localhost:${port}  ·  Swagger http://localhost:${port}/docs`, 'Bootstrap');
}

void main();
