import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntdApp, ConfigProvider } from 'antd';
import thTH from 'antd/locale/th_TH';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import type { ThemeMode } from '@nightout/types';
import { getAntdTheme } from './antd-theme';
import { colors, type ResolvedTheme } from './tokens';

export const THEME_STORAGE_KEY = 'nightout-theme';

interface ThemeContextValue {
  /** ค่าที่ผู้ใช้เลือก */
  mode: ThemeMode;
  /** ธีมที่ใช้จริงหลังแปลง SYSTEM */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** สลับ light ↔ dark พร้อม circular reveal จากตำแหน่ง origin */
  toggle: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'LIGHT' || v === 'DARK' || v === 'SYSTEM') return v;
  } catch {
    /* storage ถูกปิด */
  }
  return 'DARK';
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'SYSTEM') return systemPrefersDark() ? 'dark' : 'light';
  return mode === 'DARK' ? 'dark' : 'light';
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function applyToDocument(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', colors[theme].background);
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** บังคับธีม เช่น Staff Scanner ต้องเป็น dark เสมอ */
  forcedTheme?: ResolvedTheme;
}

/**
 * ThemeProvider = Light/Dark/System + antd ConfigProvider (Midnight Gold) + CSS layer ร่วมกับ Tailwind
 */
export function ThemeProvider({ children, forcedTheme }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  const resolved: ResolvedTheme =
    forcedTheme ?? (mode === 'SYSTEM' ? (systemDark ? 'dark' : 'light') : resolve(mode));

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applyToDocument(resolved);
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback<ThemeContextValue['toggle']>(
    (origin) => {
      const next: ThemeMode = resolved === 'dark' ? 'LIGHT' : 'DARK';
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };

      // Fallback: ไม่มี View Transitions หรือผู้ใช้ปิด motion
      if (!doc.startViewTransition || prefersReducedMotion()) {
        document.documentElement.classList.add('theme-transition');
        setMode(next);
        window.setTimeout(() => document.documentElement.classList.remove('theme-transition'), 300);
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? 0;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = doc.startViewTransition(() => {
        flushSync(() => setMode(next));
        applyToDocument(next === 'DARK' ? 'dark' : 'light');
      });
      void transition.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          {
            duration: 400,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      });
    },
    [resolved, setMode],
  );

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  );
  const antdTheme = useMemo(() => getAntdTheme(resolved), [resolved]);

  return (
    <ThemeContext.Provider value={value}>
      <StyleProvider layer>
        <ConfigProvider theme={antdTheme} locale={thTH}>
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </StyleProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used inside <ThemeProvider>');
  return ctx;
}
