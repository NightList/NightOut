import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = (name: string) => fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  // อ่าน .env จาก root ของ monorepo (ไฟล์เดียวกับ backend) — ค่าเริ่มต้นของ Vite คือโฟลเดอร์แอป
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // ใช้ source ของ workspace packages ตรงๆ — ไม่ต้องรอ tsup build dist (กัน error ตอน dist ถูกลบระหว่าง rebuild)
      { find: /^@nightout\/utils\/rest$/, replacement: fileURLToPath(new URL('../../packages/utils/src/rest.ts', import.meta.url)) },
      { find: /^@nightout\/(mock|types|utils|ui|contracts)$/, replacement: pkg('$1') },
    ],
  },
  // worker ของ MapLibre เป็น ES module (import shared chunk) → ต้อง bundle เป็น es
  worker: { format: 'es' },
  build: {
    // แยก vendor ออกเป็น chunk ของตัวเอง — เบราว์เซอร์ cache ไว้ได้ข้าม deploy และโหลดขนานกัน
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'vendor-react';
          // antd ไม่รวมเป็นก้อนเดียว — ให้ Rollup แยกตามหน้าที่ใช้ หน้าแรกจะได้ไม่ต้องโหลด Table/DatePicker/Upload ที่ยังไม่ใช้
          if (/[\\/]node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/.test(id)) return 'vendor-motion';
          if (id.includes('@supabase')) return 'vendor-supabase';
        },
      },
    },
  },
  // strictPort: พอร์ตไม่ว่าง = error ทันที (ไม่ขยับไป 5174 ไปชน Backoffice)
  server: { port: 5173, strictPort: true },
});
