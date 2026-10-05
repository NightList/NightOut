-- =====================================================================
-- NightList · เรียงทีมงานหน้า /about ใหม่: Founder → Co-Founder → ที่เหลือ
-- (…001800 ใส่ทีมตั้งต้นไปแล้ว — แก้แค่ sort_order ตามชื่อเล่น · คนที่ไม่อยู่ในรายการไม่ถูกแตะ)
-- =====================================================================
update public.team_members t
set sort_order = v.sort_order
from (values
  ('แสน',   10),   -- Founder
  ('ก็อต',   20),   -- Co-Founder
  ('เติร์ด',  30),   -- Co-Founder
  ('วิน',    40),
  ('เนวิน',  50),
  ('พี',     60),
  ('บิว',    70)
) as v(nickname, sort_order)
where t.nickname = v.nickname;
