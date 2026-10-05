/**
 * สร้างบัญชีซูเปอร์แอดมิน / แอดมิน / เจ้าของร้าน / พนักงานร้าน (ใช้ Secret key — รันในเครื่องทีมเท่านั้น)
 * ซูเปอร์แอดมินคนแรกต้องตั้งจากสคริปต์นี้ (ADR 0005) — หลังจากนั้นแก้ชั้นบัญชีจาก Backoffice ได้
 *
 *   pnpm --filter @nightout/backend user:create --email owner@nightout.co --name "ซูเปอร์แอดมิน" --role SUPER_ADMIN
 *   pnpm --filter @nightout/backend user:create --email admin@nightout.co --name "แอดมิน" --role ADMIN
 *   pnpm --filter @nightout/backend user:create --email owner@bar.com --name "เจ้าของร้าน" --role MERCHANT --bar moonlit-cellar
 *   pnpm --filter @nightout/backend user:create --email staff@bar.com --name "พนักงาน" --role STAFF --bar moonlit-cellar
 *
 * ตัวเลือก
 *   --email       (บังคับ)
 *   --name        ชื่อที่แสดง (ไม่ใส่ = ส่วนหน้า @ ของอีเมล)
 *   --role        SUPER_ADMIN | ADMIN | MERCHANT | STAFF | CUSTOMER (ค่าเริ่มต้น CUSTOMER)
 *   --bar         slug ร้าน — MERCHANT = ตั้งเป็นเจ้าของร้าน · STAFF = เพิ่มเข้าทีมร้าน
 *   --password    ไม่ใส่ = สุ่มให้ 16 ตัว แล้วแสดงครั้งเดียว
 *   --birthdate   YYYY-MM-DD (ไม่ใส่ = 1990-01-01 · ต้องอายุ 20+)
 *
 * ถ้าอีเมลนี้มีบัญชีอยู่แล้ว จะไม่สร้างใหม่ แต่อัปเดต role / ร้าน ให้
 * อ่าน SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY จาก .env ที่ root
 */
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MERCHANT', 'STAFF', 'CUSTOMER'] as const;
type Role = (typeof ROLES)[number];

const { values: args } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', default: 'CUSTOMER' },
    bar: { type: 'string' },
    password: { type: 'string' },
    birthdate: { type: 'string', default: '1990-01-01' },
  },
});

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail('ไม่พบ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ใน .env ที่ root ของโปรเจกต์');

const email = args.email?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('ต้องใส่ --email ให้ถูกต้อง');
const role = args.role!.toUpperCase() as Role;
if (!ROLES.includes(role)) fail(`--role ต้องเป็น ${ROLES.join(' | ')}`);
if ((role === 'MERCHANT' || role === 'STAFF') && !args.bar) fail(`role ${role} ต้องระบุ --bar <slug ร้าน>`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(args.birthdate!)) fail('--birthdate ต้องเป็น YYYY-MM-DD');
const minBirth = new Date();
minBirth.setFullYear(minBirth.getFullYear() - 20);
if (new Date(args.birthdate!) > minBirth) fail('ต้องอายุ 20 ปีขึ้นไป');
const password = args.password ?? randomBytes(12).toString('base64url');
if (password.length < 10) fail('--password ต้องยาวอย่างน้อย 10 ตัว');
const displayName = args.name?.trim() || email.split('@')[0]!;

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = body?.msg ?? body?.message ?? body?.error_description ?? body?.error ?? text;
    throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${msg}`);
  }
  return body as T;
}
const rest = <T>(path: string, init: RequestInit = {}) =>
  api<T>(`/rest/v1/${path}`, { ...init, headers: { Prefer: 'return=representation', ...(init.headers ?? {}) } });

async function main() {
  // 0) ตรวจร้านก่อน — กันสร้างบัญชีค้างไว้ถ้า slug ผิด
  let bar: { id: string; name: string; owner_id: string | null } | undefined;
  if (args.bar) {
    const bars = await rest<{ id: string; name: string; owner_id: string | null }[]>(
      `bars?select=id,name,owner_id&slug=eq.${encodeURIComponent(args.bar)}`,
    );
    bar = bars[0] ?? fail(`ไม่พบร้าน slug "${args.bar}"`);
  }

  // 1) หา / สร้างบัญชี
  const existing = await rest<{ id: string; role: Role }[]>(`users?select=id,role&email=eq.${encodeURIComponent(email!)}`);
  if (existing[0]?.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    const others = await rest<{ id: string }[]>(
      `users?select=id&role=eq.SUPER_ADMIN&deleted_at=is.null&id=neq.${existing[0].id}`,
    );
    if (!others.length) fail('บัญชีนี้เป็นซูเปอร์แอดมินคนสุดท้าย — ตั้งคนอื่นเป็น SUPER_ADMIN ก่อน');
  }
  let userId = existing[0]?.id;
  let created = false;
  if (!userId) {
    const user = await api<{ id: string }>('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true, // ใช้งานได้ทันที ไม่ต้องยืนยันอีเมล
        user_metadata: { display_name: displayName, birthdate: args.birthdate }, // trigger ใช้สร้าง public.users (role เริ่มที่ CUSTOMER เสมอ)
      }),
    });
    userId = user.id;
    created = true;
  }

  // 2) ตั้ง role (หลังบ้านเท่านั้นที่ตั้งได้ — ไม่อ่านจาก metadata)
  await rest(`users?id=eq.${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) });

  // 3) ผูกกับร้าน
  const barName = bar?.name;
  if (bar) {
    if (role === 'MERCHANT') {
      // trigger เพิ่มเจ้าของเข้า bar_staff (OWNER) ให้อัตโนมัติ
      await rest(`bars?id=eq.${bar.id}`, { method: 'PATCH', body: JSON.stringify({ owner_id: userId }) });
      if (bar.owner_id && bar.owner_id !== userId) {
        // ร้านมี OWNER ได้คนเดียว — เจ้าของเดิมยังอยู่ในทีมในฐานะ MANAGER
        await rest(`bar_staff?bar_id=eq.${bar.id}&user_id=eq.${bar.owner_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ role: 'MANAGER' }),
        });
        console.warn(`! ร้าน ${bar.name} มีเจ้าของอยู่แล้ว — เปลี่ยนเจ้าของเป็นบัญชีนี้ เจ้าของเดิมเป็น MANAGER ในทีม`);
      }
    } else {
      await rest('bar_staff?on_conflict=bar_id,user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          bar_id: bar.id,
          user_id: userId,
          role: 'STAFF',
          accepted_at: new Date().toISOString(),
          revoked_at: null,
        }),
      });
    }
  }

  // 4) บันทึก audit
  await rest('audit_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      action: created ? 'user.create' : 'user.update_role',
      entity_type: 'users',
      entity_id: userId,
      after: { email, role, bar: args.bar ?? null, via: 'scripts/create-user.ts' },
    }),
  });

  console.log(`✔ ${created ? 'สร้างบัญชี' : 'อัปเดตบัญชี'} ${email}`);
  console.log(`  role: ${role}${barName ? ` · ร้าน: ${barName}` : ''}`);
  if (created) console.log(`  รหัสผ่าน: ${password}   ← แสดงครั้งเดียว ส่งให้เจ้าของบัญชีทางช่องทางส่วนตัว`);
  else if (args.password) console.log('  (บัญชีมีอยู่แล้ว — ไม่ได้เปลี่ยนรหัสผ่าน)');
}

main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
