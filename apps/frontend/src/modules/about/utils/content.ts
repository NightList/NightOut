/**
 * ข้อมูลหน้า /about (เกี่ยวกับเรา · ติดต่อเรา) — แก้ข้อความ/ช่องทางติดต่อที่ไฟล์นี้ไฟล์เดียว
 * ทีมงานมาจาก Supabase (view public_team · ตาราง team_members) — ดู services/data.ts → useSiteTeam()
 * ⚠️ เบอร์/อีเมลเป็นข้อมูลตัวอย่าง — เปลี่ยนเป็นของจริงก่อนเปิดใช้งาน
 */

export const ABOUT_TEXT = [
  'NightOut ช่วยให้คุณเที่ยวกลางคืนได้มั่นใจกว่าเดิม เช็กราคาประเมิน มาตรการความปลอดภัย และความแน่นของร้านได้แบบเรียลไทม์ พร้อมจองโต๊ะง่าย ๆ ในไม่กี่คลิกก่อนออกจากบ้าน',
  'คะแนนรีวิวของเรามาจากคนที่ไปเช็กอินจริงเท่านั้น ร้านไม่สามารถซื้อดาวได้ ส่วนพื้นที่โฆษณาเราจะติดป้าย "แนะนำ" ให้เห็นอย่างโปร่งใสชัดเจนเสมอ',
];

export const CONTACT = {
  phone: '099-999-9999',
  email: 'test@gmail.com',
  hours: ['จันทร์ - อาทิตย์', '00:00 - 23:59'],
  address: ['กรุงเทพมหานคร', 'ประเทศไทย'],
};

export const SOCIALS = [
  { key: 'instagram', label: 'Instagram', href: 'https://instagram.com' },
  { key: 'tiktok', label: 'TikTok', href: 'https://tiktok.com' },
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com' },
  { key: 'youtube', label: 'YouTube', href: 'https://youtube.com' },
] as const;
