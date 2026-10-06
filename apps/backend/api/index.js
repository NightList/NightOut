/**
 * Vercel Function entry — ส่งทุก request เข้า NestJS (cache instance ข้าม invocation)
 * ใช้ไฟล์ที่ build แล้วใน dist/ (build: pnpm turbo run build --filter=@nightout/backend)
 * เขียนเป็น JS เพื่อไม่ต้อง typecheck ก่อน dist ถูกสร้าง
 */
const { createApp } = require('../dist/bootstrap');

let appPromise;

/** @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */
module.exports = async function handler(req, res) {
  appPromise ??= createApp();
  const app = await appPromise;
  app.getHttpAdapter().getInstance()(req, res);
};
