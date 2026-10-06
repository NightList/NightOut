/**
 * Vercel Function entry — ส่งทุก request เข้า NestJS (cache instance ข้าม invocation)
 * ใช้ไฟล์ที่ build แล้วใน dist/ (build: pnpm turbo run build --filter=@nightout/backend)
 * เขียนเป็น JS เพื่อไม่ต้อง typecheck ก่อน dist ถูกสร้าง
 */
const { createApp } = require('../dist/bootstrap');

let appPromise;

/** @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */
module.exports = async function handler(req, res) {
  let app;
  try {
    appPromise ??= createApp();
    app = await appPromise;
  } catch (err) {
    // บูตไม่ผ่าน (ส่วนใหญ่ env ผิด — validateEnv) → ไม่ค้าง promise ที่ reject ไว้ ครั้งหน้าลองบูตใหม่
    // และตอบสาเหตุเป็น JSON แทน 500 FUNCTION_INVOCATION_FAILED เปล่าๆ (ข้อความ zod บอกแค่ชื่อตัวแปร ไม่มีค่าคีย์)
    appPromise = undefined;
    console.error('[boot] NestJS start failed:', err);
    const reason = err instanceof Error ? err.message : String(err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ statusCode: 503, message: `API_BOOT_FAILED: ${reason}` }));
    return;
  }
  app.getHttpAdapter().getInstance()(req, res);
};
