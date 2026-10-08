import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { prefersLightweight } from '../utils/prefersLightweight';
import './skyBackdrop.css';

/**
 * ภาพดวงจันทร์ใหญ่เหนือทะเลสาบ + สกายไลน์ (ต้นฉบับ 1672×941 → อัปสเกล Real-ESRGAN ×4 แล้วย่อเป็น 3 ขนาด
 * 3840 / 2560 / 1280 ให้เบราว์เซอร์เลือกตามหน้าจอ)
 */
const SKY = '/images/home/hero-night.jpg';
const SKY_SET =
  '/images/home/hero-night-1280.jpg 1280w, /images/home/hero-night-2560.jpg 2560w, /images/home/hero-night.jpg 3840w';
/**
 * ความกว้างที่ภาพแสดงจริง = กล่อง 16:9 แบบ cover (ดู .sky-layer) ซึ่งกว้างกว่าจอเมื่อ Hero สูงกว่า 16:9
 * - < 640px: กล่องกว้างราว 1000px แต่เห็นแค่ ~40% → ตั้ง 700px โดยตั้งใจ (ประหยัดเน็ต แลกกับคมน้อยลงเล็กน้อย)
 * - 640–1099px: Hero สูง ~620px → กล่องกว้าง ~1100px (กว้างกว่าจอ)
 * - ≥ 1100px: กล่องกว้างเท่าจอ
 */
const SKY_SIZES = '(max-width: 639px) 700px, (max-width: 1099px) 1100px, 100vw';

/** ระบบพิกัดของ SVG ด้านล่าง (16:9 เท่าภาพ · อยู่ในกล่องเดียวกับภาพ จึงทับตรงกับภาพเสมอ) */
const W = 736;
const H = 414;

/** จุดที่ระยิบ: ตำแหน่ง + คาบ (วินาที) + เฟสเริ่ม (วินาที · ติดลบ = เริ่มกลางรอบ ไม่ระยิบพร้อมกัน) */
type Twinkle = readonly [x: number, y: number, period: number, phase: number];
/** แสงบนผิวน้ำ: เหมือน Twinkle แต่มีความยาวเส้น */
type Glint = readonly [x: number, y: number, length: number, period: number, phase: number];

/** ส่งคาบ/เฟสให้ CSS (skyBackdrop.css อ่านเป็น --d / --t) */
const timing = (period: number, phase: number) =>
  ({ '--d': `${period}s`, '--t': `${phase}s` }) as CSSProperties;

/** ดาวบนฟ้า/ผิวดวงจันทร์ — อยู่ในโซนที่เห็นทั้งจอใหญ่และมือถือ */
const STARS: readonly Twinkle[] = [
  [96, 128, 5.4, -1.2],
  [150, 104, 6.9, -3.6],
  [232, 118, 4.8, -0.6],
  [268, 168, 7.2, -5.1],
  [352, 132, 6.2, -2.4],
  [402, 152, 5.0, -4.2],
  [452, 118, 7.5, -1.9],
  [388, 204, 5.8, -3.1],
  [492, 196, 6.6, -0.3],
  [430, 226, 4.9, -4.7],
  [596, 124, 6.0, -2.8],
  [648, 152, 7.1, -0.9],
  [704, 118, 5.2, -3.9],
  [616, 206, 6.4, -1.5],
];

/** ไฟตึกริมขอบฟ้า — ระยิบเป็นสีทอง */
const CITY: readonly Twinkle[] = [
  [318, 247, 5.6, -1.0],
  [433, 244, 6.8, -3.3],
  [533, 238, 4.9, -0.5],
  [565, 244, 7.0, -4.4],
  [622, 241, 5.3, -2.1],
  [650, 246, 6.1, -3.7],
  [724, 245, 5.7, -1.4],
];

/** แสงสะท้อนบนผิวน้ำ — ใต้ลำแสงสีทองซ้ายและใต้สกายไลน์ขวา */
const GLINTS: readonly Glint[] = [
  [196, 288, 96, 7.5, -1.5],
  [236, 300, 72, 6.2, -3.8],
  [262, 294, 104, 8.1, -0.7],
  [214, 318, 62, 6.8, -5.0],
  [286, 330, 84, 7.9, -2.6],
  [512, 276, 124, 8.4, -4.1],
  [622, 284, 84, 6.6, -1.0],
  [694, 272, 52, 7.2, -3.0],
];

/**
 * พื้นหลัง Hero — ภาพดวงจันทร์ใหญ่เหนือผืนน้ำยามค่ำ + motion ละมุน (ไม่มีวิดีโอ)
 * - ภาพขึ้นทันทีเป็น LCP · โทนน้ำเงินเข้ม + ลำแสงทองเข้ากับธีม Midnight Gold อยู่แล้ว จึงไม่ปรับสี
 * - ชั้นภาพลอยซ้าย-ขวา ±10px ช้ามาก · ดาว/ไฟตึกระยิบ · แสงบนผิวน้ำพริ้ว · ดาวตกนานๆ ครั้ง (ดู skyBackdrop.css)
 * - หยุดเมื่อพ้นจอ/สลับแท็บ · prefers-reduced-motion (CSS) หรือเน็ตช้า/ประหยัดเน็ต → ภาพนิ่ง
 * - imageUrl = ภาพที่แอดมินอัปโหลด (Backoffice → หน้าแรก) → ไม่มีชั้น SVG เพราะพิกัดดาว/ไฟตึกผูกกับภาพตั้งต้น (ภาพยังลอยช้าๆ ได้)
 * - pending = ยังไม่รู้ว่าจะใช้ภาพไหน → แสดงแค่พื้นสีกลางคืน ไม่โหลดภาพตั้งต้นทิ้ง (เปิดครั้งแรกที่ยังไม่มี cache)
 */
export function SkyBackdrop({
  imageUrl,
  pending = false,
}: {
  imageUrl?: string | null;
  pending?: boolean;
}) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [still] = useState(() => prefersLightweight());
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce || still) return;
    let onScreen = true;
    const sync = () => setPaused(!onScreen || document.hidden);
    const io = new IntersectionObserver(([e]) => {
      onScreen = !!e?.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [reduce, still]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-still={still || !!reduce}
      data-paused={paused}
      className="sky absolute inset-0 -z-10 isolate overflow-hidden bg-[#07070d] [--sky-x:0.5] max-sm:[--sky-x:0.33]"
    >
      {/* ชั้นภาพ 16:9 ขนาด "cover" คำนวณด้วย container units (ดู skyBackdrop.css) แล้ววางด้วย --sky-x (0 = ชิดซ้าย · 1 = ชิดขวา)
          ภาพและ SVG อยู่ในกล่องสัดส่วนเดียวกัน ตำแหน่งดาว/ไฟจึงตรงกับภาพทุกขนาดจอ */}
      <div className="sky-layer">
        {!pending && (
          <img
            key={imageUrl ?? SKY}
            src={imageUrl ?? SKY}
            alt=""
            srcSet={imageUrl ? undefined : SKY_SET}
            sizes={imageUrl ? undefined : SKY_SIZES}
            width={3840}
            height={2160}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {!pending && !still && !imageUrl && (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 size-full"
            focusable="false"
          >
            <defs>
              <radialGradient id="sky-star-glow">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="0.35" stopColor="#cfe0ff" stopOpacity="0.35" />
                <stop offset="1" stopColor="#cfe0ff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="sky-lamp-glow">
                <stop offset="0" stopColor="#ffd77a" stopOpacity="0.95" />
                <stop offset="0.35" stopColor="#e8b64c" stopOpacity="0.35" />
                <stop offset="1" stopColor="#e8b64c" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sky-glint-fill" x1="0" x2="1">
                <stop offset="0" stopColor="#ffd77a" stopOpacity="0" />
                <stop offset="0.5" stopColor="#ffe39a" stopOpacity="0.9" />
                <stop offset="1" stopColor="#ffd77a" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="sky-meteor-tail" x1="0" x2="1">
                <stop offset="0" stopColor="#ffe39a" stopOpacity="0" />
                <stop offset="1" stopColor="#fff4d6" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {STARS.map(([x, y, period, phase]) => (
              <circle
                key={`s${x}-${y}`}
                className="sky-twinkle"
                cx={x}
                cy={y}
                r={3.2}
                fill="url(#sky-star-glow)"
                style={timing(period, phase)}
              />
            ))}
            {CITY.map(([x, y, period, phase]) => (
              <circle
                key={`c${x}-${y}`}
                className="sky-twinkle"
                cx={x}
                cy={y}
                r={3.6}
                fill="url(#sky-lamp-glow)"
                style={timing(period, phase)}
              />
            ))}
            {GLINTS.map(([x, y, length, period, phase]) => (
              <rect
                key={`g${x}-${y}`}
                className="sky-glint"
                x={x}
                y={y}
                width={length}
                height={1.2}
                rx={0.6}
                fill="url(#sky-glint-fill)"
                style={timing(period, phase)}
              />
            ))}
            {/* ดาวตก: อยู่ขวาของโซนพาดหัว วิ่งลงซ้ายสั้นๆ */}
            <g transform="translate(700 112) rotate(158)">
              <line
                className="sky-meteor"
                x1="-44"
                y1="0"
                x2="0"
                y2="0"
                stroke="url(#sky-meteor-tail)"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
            </g>
          </svg>
        )}
      </div>
      {/* เข้มเฉพาะกลางภาพที่พาดหัว+ช่องค้นหาวางอยู่ ให้ contrast ไม่ต่ำกว่าเดิม (ปล่อยขอบให้เห็นดวงจันทร์/ลำแสง) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 58% 62% at 50% 46%, rgba(7,7,13,.58) 0%, rgba(7,7,13,.3) 55%, rgba(7,7,13,.06) 100%)',
        }}
      />
    </div>
  );
}
