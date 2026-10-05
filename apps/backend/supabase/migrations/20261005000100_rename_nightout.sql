-- =====================================================================
-- NightOut · เปลี่ยนชื่อแบรนด์ NightList → NightOut ใน DB ที่ใช้งานอยู่แล้ว
-- (migration เก่าแก้ข้อความแล้ว — ไฟล์นี้ตามแก้ฐานข้อมูลที่รัน migration เก่าไปก่อนเปลี่ยนชื่อ · รันซ้ำได้)
--   1) ฟังก์ชันที่มีข้อความแจ้งเตือน "NightList …" → สร้างใหม่ด้วยข้อความ NightOut (สิทธิ์ execute เดิมคงอยู่)
--      app_check_in: รับทั้ง QR ใหม่ "NIGHTOUT:<id>" และ QR เก่า "NIGHTLIST:<id>"
--   2) ข้อมูลที่แสดงให้ลูกค้าเห็น: ชื่อบัญชี PromptPay, สิทธิ์เมื่อจอง (perks), โปรของร้าน, โน้ต Editor's Pick
--   ประวัติ (notifications ที่ส่งไปแล้ว, audit_logs) ไม่แก้
-- =====================================================================
set search_path = public, extensions;

do $$
declare
  r record;
  def text;
begin
  for r in
    select p.oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and (p.prosrc like '%NightList%' or p.prosrc like '%NIGHTLIST%')
  loop
    def := pg_get_functiondef(r.oid);
    -- QR เช็กอิน: เก็บรูปแบบเก่าไว้ด้วย (ต้องแทนก่อนแทนชื่อทั่วไป)
    def := replace(def,
      $q$(code = v or (v like 'NIGHTLIST:%' and id::text = lower(substr(v, 11))))$q$,
      $q$(code = v
          or (v like 'NIGHTOUT:%' and id::text = lower(substr(v, 10)))
          or (v like 'NIGHTLIST:%' and id::text = lower(substr(v, 11))))$q$);
    -- แทนเฉพาะชื่อแบบตัวพิมพ์ผสม (ข้อความที่ผู้ใช้เห็น) — 'NIGHTLIST:' ใน QR เก่าต้องคงไว้
    def := replace(def, 'NightList', 'NightOut');
    execute def;
  end loop;
end $$;

update public.platform_settings
set value = jsonb_set(value, '{name}', to_jsonb(replace(value ->> 'name', 'NightList', 'NightOut')))
where value ->> 'name' like '%NightList%';

update public.bars
set perks = array(select replace(x, 'NightList', 'NightOut') from unnest(perks) as x)
where array_to_string(perks, '|') like '%NightList%';

update public.bar_promotions
set title = replace(title, 'NightList', 'NightOut'),
    description = replace(description, 'NightList', 'NightOut')
where title like '%NightList%' or description like '%NightList%';

update public.editor_picks
set note = replace(note, 'NightList', 'NightOut')
where note like '%NightList%';
