import { theme as antdTheme, type ThemeConfig } from 'antd';
import { colors, radius, type ResolvedTheme } from './tokens';

/** สร้าง antd ThemeConfig จาก Midnight Gold tokens */
export function getAntdTheme(mode: ResolvedTheme): ThemeConfig {
  const c = colors[mode];
  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    cssVar: { key: 'nightout' },
    token: {
      colorPrimary: c.gold,
      colorInfo: c.purple,
      colorLink: c.link,
      colorBgBase: c.background,
      colorBgLayout: c.background,
      colorBgContainer: mode === 'dark' ? c.card : c.surface,
      colorBgElevated: mode === 'dark' ? c.card : c.surface,
      colorBorder: c.border,
      colorBorderSecondary: c.border,
      colorTextBase: c.text,
      colorTextSecondary: c.muted,
      colorSuccess: c.crowdAvailable,
      colorWarning: c.crowdAlmostFull,
      colorError: c.crowdFull,
      borderRadius: radius.base,
      fontFamily:
        "'IBM Plex Sans Thai', 'Noto Sans Thai', system-ui, -apple-system, 'Segoe UI', sans-serif",
    },
    components: {
      // ปุ่มหลักสีทอง ตัวอักษรเข้ม (contrast ผ่าน AA)
      Button: { primaryColor: c.onGold, fontWeight: 600 },
      Layout: { headerBg: c.surface, bodyBg: c.background, siderBg: c.surface },
      Rate: { starColor: c.goldText },
    },
  };
}
