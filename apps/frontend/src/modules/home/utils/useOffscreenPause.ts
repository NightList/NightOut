import { useEffect, useState, type RefObject } from 'react';

/**
 * true เมื่อ element พ้นจอหรือสลับแท็บอยู่ — ใช้ใส่ data-paused แล้วให้ CSS หยุด animation (animation-play-state)
 * logic เดียวกับพื้นหลัง Hero (skyBackdrop.tsx) · `enabled = false` = ไม่ต้องเฝ้า (เช่น ภาพนิ่งอยู่แล้ว)
 */
export function useOffscreenPause(ref: RefObject<Element | null>, enabled = true) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
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
  }, [ref, enabled]);

  return paused;
}
