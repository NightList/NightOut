/**
 * Raster tiles สำรอง — ใช้เมื่อโหลดสไตล์ vector (OpenFreeMap) ไม่ได้ หรือเมื่อตั้ง env
 *   VITE_MAP_TILE_URL_LIGHT, VITE_MAP_TILE_URL_DARK (+ VITE_MAP_TILE_ATTRIBUTION)
 * เพื่อบังคับใช้ผู้ให้บริการ raster ที่มี key (MapTiler / Stadia ฯลฯ)
 * ค่าสำรองเริ่มต้นคือ OpenStreetMap + CSS filter (.nl-map-tiles ใน index.css)
 */
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const env = import.meta.env;
const loadTimeout = Number(env.VITE_MAP_LOAD_TIMEOUT_MS);
export const MAP_LOAD_TIMEOUT_MS =
  Number.isFinite(loadTimeout) && loadTimeout > 0 ? loadTimeout : 15000;

/** ตั้ง env raster ไว้ = บังคับใช้ raster แทนสไตล์แบบ Google */
export const MAP_USE_RASTER = !!env.VITE_MAP_TILE_URL_LIGHT;

export const MAP_TILES = {
  light: env.VITE_MAP_TILE_URL_LIGHT || OSM,
  dark: env.VITE_MAP_TILE_URL_DARK || env.VITE_MAP_TILE_URL_LIGHT || OSM,
} as const;

export const MAP_ATTRIBUTION =
  env.VITE_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** className ของ raster TileLayer — ใส่ filter เฉพาะตอนใช้ OSM สำรอง */
export const tileClass = (theme: 'light' | 'dark') =>
  MAP_USE_RASTER ? undefined : `nl-map-tiles nl-map-tiles--${theme}`;
