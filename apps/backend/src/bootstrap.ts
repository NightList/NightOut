import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

/** สร้างแอป (ใช้ทั้ง local server และ Vercel Function) */
export async function createApp(): Promise<INestApplication> {
  // abortOnError: false — บูตพัง (เช่น env ไม่ผ่าน validateEnv) ให้ throw กลับมา แทน process.exit(1)
  // ที่ทำให้ Vercel ตอบ 500 FUNCTION_INVOCATION_FAILED โดยไม่บอกสาเหตุ (api/index.js ตอบสาเหตุเป็น JSON ให้)
  const app = await NestFactory.create(AppModule, { bufferLogs: true, abortOnError: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api'); // public path บน Vercel: /api/*

  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS', '').split(',').filter(Boolean),
    credentials: true,
  });

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('NightOut API')
      .setDescription(
        'API ของ NightOut — หน้าเว็บอ่าน/เขียนข้อมูลผ่าน API นี้เท่านั้น (ADR 0002) · จัดกลุ่มตามโดเมน (ADR 0006) · key ใน body และ response เป็น snake_case ทั้งหมด · ' +
          'เส้นที่มีรูปกุญแจต้องส่ง `Authorization: Bearer <Supabase access token>`',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('health', 'สถานะของ API')
      .addTag('catalog', 'ข้อมูลสาธารณะตอนเปิดเว็บ: ร้าน รีวิว ย่าน สไตล์ ตั้งค่า แพ็กเกจโปรโมท')
      .addTag('booking', 'การจอง: จอง ยกเลิก สถานะ เช็กอิน ย้ายโต๊ะ โซนว่าง บัตรแชร์')
      .addTag('deposit', 'มัดจำ: ส่งสลิป ตรวจสลิป ปิดยอด คืนมัดจำ สมุดมัดจำของร้าน')
      .addTag('review', 'รีวิว: เขียน รายงาน จัดการ')
      .addTag('bar', 'ร้าน: สมัครลงร้าน ข้อมูล เมนู โปร ค่าธรรมเนียม โซน ความปลอดภัย ตั้งค่าการจอง บัญชีรับเงิน ความแน่น อนุมัติ')
      .addTag('bar-team', 'ทีมร้าน: สมาชิก เชิญ นำออก คำเชิญของฉัน')
      .addTag('account', 'บัญชี: โปรไฟล์ ข้อมูลของฉัน แจ้งเตือน ร้านโปรด ลบบัญชี · ผู้ใช้/ชั้นบัญชี/แบน (Backoffice)')
      .addTag('promotion', 'โปรโมทร้าน: ซื้อแพ็กเกจ ตรวจคำสั่งซื้อ')
      .addTag('billing', 'ค่าคอมของร้าน')
      .addTag('site-team', 'ทีมงาน NightOut หน้าเกี่ยวกับเรา')
      .addTag('storage', 'ไฟล์: URL อัปโหลด / URL ชั่วคราว')
      .addTag('pricing', 'ประเมินราคาก่อนไปร้าน (สาธารณะ)')
      .addTag('backoffice', 'การอ่านของหน้าแอดมิน: แดชบอร์ด view admin_* ตาราง master (ADMIN + MFA)')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(doc));

  await app.init();
  // bufferLogs เก็บ log ไว้รอ logger ตัวจริง — ไม่ flush = log ทุกบรรทัด (รวม error) หายเงียบ ไม่ขึ้นใน Vercel Logs
  app.flushLogs();
  return app;
}
