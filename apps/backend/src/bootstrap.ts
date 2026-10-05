import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

/** สร้างแอป (ใช้ทั้ง local server และ Vercel Function) */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
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
        'API ของ NightOut — หน้าเว็บอ่าน/เขียนข้อมูลผ่าน API นี้เท่านั้น (ADR 0002) · key ใน body และ response เป็น snake_case ทั้งหมด · ' +
          'เส้นที่มีรูปกุญแจต้องส่ง `Authorization: Bearer <Supabase access token>`',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('health', 'สถานะของ API')
      .addTag('public', 'ข้อมูลสาธารณะ: ร้าน รีวิว ย่าน ทีมงาน โซนว่าง บัตรแชร์ URL ไฟล์')
      .addTag('me', 'ข้อมูลของฉัน (ล็อกอิน): โปรไฟล์ การจอง แจ้งเตือน คำเชิญ อัปโหลดไฟล์')
      .addTag('pricing', 'ประเมินราคาก่อนไปร้าน (สาธารณะ)')
      .addTag('customer', 'ลูกค้า: จอง มัดจำ รีวิว ร้านโปรด แจ้งเตือน โปรไฟล์ สมัครลงร้าน')
      .addTag('merchant', 'ทีมร้าน: การจอง เช็กอิน ข้อมูลร้าน เมนู โปร โซน ความปลอดภัย การเงิน พนักงาน')
      .addTag('admin', 'Backoffice (ADMIN เท่านั้น): อนุมัติร้าน ตรวจสลิป/โปร จัดการรีวิว ผู้ใช้')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(doc));

  await app.init();
  return app;
}
