-- =====================================================================
-- NightList · ทีมงาน: เอาเพดาน 20 ทักษะออก (ใส่ได้ไม่จำกัด)
--   แทน team_member_check() จาก …20261003000100 · กฎอื่นเหมือนเดิม (ชื่อเล่น 1–40 ตัว, ตำแหน่ง ≤ 6, photo_url)
--   สิทธิ์ของฟังก์ชันคงเดิม (create or replace ไม่ล้าง grant/revoke)
-- =====================================================================
create or replace function public.team_member_check(r public.team_members) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if r.nickname is null or char_length(btrim(r.nickname)) not between 1 and 40 then
    raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023', detail = 'nickname';
  end if;
  if cardinality(r.roles) > 6 then
    raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023', detail = 'roles';
  end if;
  if r.photo_url is not null and r.photo_url !~ '^(https?://|/)' then   -- http:// = Supabase ในเครื่อง
    raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023', detail = 'photo_url';
  end if;
end $$;
