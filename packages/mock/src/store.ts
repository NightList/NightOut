import { createSeed, type DemoState } from './seed';

const KEY = 'nightout-demo-v1';
const SESSION_KEY = 'nightout-demo-session';

type Listener = () => void;

let state: DemoState | null = null;
/** false = ไม่อ่าน/เขียน localStorage และไม่สร้างข้อมูลเดโม (หน้าเว็บที่ใช้ข้อมูลจริงจาก Supabase) */
let persistEnabled = true;

const emptyState = (): DemoState => ({
  version: 3,
  bars: [],
  reviews: [],
  bookings: [],
  notifications: [],
  users: [],
  favorites: {},
  promotions: [],
  audit: [],
});

/**
 * ปิดการเก็บ state ลง localStorage — store เป็นแค่ cache ในหน่วยความจำ
 * (เดิม mutate ทุกครั้ง JSON.stringify ทั้งก้อนลง localStorage = หน้าเว็บกระตุก) · ล้างข้อมูลเดโมเก่าที่ค้างในเครื่องด้วย
 */
export function configureStore(opts: { persist: boolean }) {
  persistEnabled = opts.persist;
  if (!persistEnabled) {
    state = state ?? emptyState();
    try {
      storage().removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}
let version = 0;
const listeners = new Set<Listener>();
const memory = new Map<string, string>();

function storage(kind: 'local' | 'session' = 'local') {
  try {
    if (kind === 'local' && typeof localStorage !== 'undefined') return localStorage;
    if (kind === 'session' && typeof sessionStorage !== 'undefined') return sessionStorage;
  } catch {
    /* blocked */
  }
  return {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
  };
}

function load(): DemoState {
  if (state) return state;
  if (!persistEnabled) return (state = emptyState());
  try {
    const raw = storage().getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === 3) {
        state = parsed;
        return state;
      }
    }
  } catch {
    /* corrupted → reseed */
  }
  state = createSeed();
  persist();
  return state;
}

function persist() {
  if (!persistEnabled) return;
  try {
    storage().setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota (เช่นสลิปรูปใหญ่) — เก็บในหน่วยความจำต่อ */
  }
}

/** อ่าน state ปัจจุบัน (อย่าแก้ตรง — ใช้ mutate) */
export function getState(): DemoState {
  return load();
}

/** แก้ state แล้ว persist + แจ้ง subscriber */
export function mutate<T>(fn: (s: DemoState) => T): T {
  const s = load();
  const result = fn(s);
  version++;
  persist();
  listeners.forEach((l) => l());
  return result;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** ใช้กับ useSyncExternalStore */
export function getVersion(): number {
  return version;
}

export function resetDemo(): void {
  state = createSeed();
  version++;
  persist();
  listeners.forEach((l) => l());
}

export function getSessionUserId(): string | null {
  return storage('session').getItem(SESSION_KEY) ?? storage().getItem(SESSION_KEY);
}

/** remember = false → เก็บแค่ใน tab นี้ (sessionStorage) ปิดเบราว์เซอร์แล้วหลุด */
export function setSessionUserId(id: string | null, remember = true): void {
  storage().removeItem(SESSION_KEY);
  storage('session').removeItem(SESSION_KEY);
  if (id) storage(remember ? 'local' : 'session').setItem(SESSION_KEY, id);
  version++;
  listeners.forEach((l) => l());
}
