import type { StyleSpecification, LayerSpecification } from 'maplibre-gl';
import { MAP_LOAD_TIMEOUT_MS } from './mapTiles';

/**
 * สไตล์แผนที่แบบ Google Maps (vector tiles ฟรีจาก OpenFreeMap — ไม่ต้องมี API key ไม่จำกัดจำนวน)
 * โหลด style "positron" ของ OpenFreeMap แล้วแทนสีทีละ layer ให้ตรงกับพาเลตของ Google
 *   light = Google Maps ปกติ (พื้นเทาอ่อน ถนนขาว ทางด่วนเหลือง น้ำฟ้า สวนเขียว)
 *   dark  = Google Maps โหมดกลางคืน (พื้นน้ำเงินเทา #242f3e ถนน #38414e ทางด่วน #746855 น้ำ #17263c)
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

interface Palette {
  land: string;
  residential: string;
  park: string;
  water: string;
  waterLabel: string;
  building: string;
  buildingOutline: string;
  road: string;
  roadCasing: string;
  major: string;
  majorCasing: string;
  highway: string;
  highwayCasing: string;
  rail: string;
  boundary: string;
  label: string;
  labelMuted: string;
  roadLabel: string;
  halo: string;
}

export const GOOGLE_PALETTE: Record<'light' | 'dark', Palette> = {
  light: {
    land: '#f5f5f3',
    residential: '#f1f1ef',
    park: '#cfe8d0',
    water: '#aadaff',
    waterLabel: '#5a8fbf',
    building: '#e9e7e4',
    buildingOutline: '#dcd9d6',
    road: '#ffffff',
    roadCasing: '#dadce0',
    major: '#ffffff',
    majorCasing: '#d4d6d9',
    highway: '#fde293',
    highwayCasing: '#f2c14b',
    rail: '#c9c9c9',
    boundary: '#9e9e9e',
    label: '#3c4043',
    labelMuted: '#70757a',
    roadLabel: '#5f6368',
    halo: '#ffffff',
  },
  dark: {
    land: '#242f3e',
    residential: '#263241',
    park: '#263c3f',
    water: '#17263c',
    waterLabel: '#515c6d',
    building: '#2b3747',
    buildingOutline: '#303c4c',
    road: '#38414e',
    roadCasing: '#212a37',
    major: '#3f4a5a',
    majorCasing: '#212a37',
    highway: '#746855',
    highwayCasing: '#1f2835',
    rail: '#2f3948',
    boundary: '#4b6878',
    label: '#d59563',
    labelMuted: '#9ca5b3',
    roadLabel: '#9ca5b3',
    halo: '#17263c',
  },
};

type Paint = Record<string, unknown>;

/** แทนสี 1 layer ตาม id ของ positron */
function recolor(layer: LayerSpecification, p: Palette): LayerSpecification {
  const id = layer.id;
  const paint = { ...(('paint' in layer ? layer.paint : {}) as Paint) };
  const set = (k: string, v: unknown) => {
    paint[k] = v;
  };

  if (layer.type === 'background') set('background-color', p.land);
  else if (id === 'park' || id === 'landcover_wood') set('fill-color', p.park);
  else if (id === 'water') set('fill-color', p.water);
  else if (id === 'waterway') set('line-color', p.water);
  else if (id === 'landuse_residential') set('fill-color', p.residential);
  else if (id === 'building') {
    set('fill-color', p.building);
    set('fill-outline-color', p.buildingOutline);
  } else if (id === 'road_area_pier') set('fill-color', p.land);
  else if (id === 'road_pier') set('line-color', p.land);
  else if (id === 'aeroway-area' || id === 'aeroway-runway') {
    set(layer.type === 'fill' ? 'fill-color' : 'line-color', p.road);
  } else if (id.startsWith('aeroway')) set('line-color', p.roadCasing);
  else if (id.includes('motorway') && id.includes('casing')) set('line-color', p.highwayCasing);
  else if (id.includes('motorway')) set('line-color', p.highway);
  else if (id === 'highway_major_casing') set('line-color', p.majorCasing);
  else if (id === 'highway_major_inner' || id === 'highway_major_subtle')
    set('line-color', p.major);
  else if (id === 'highway_minor' || id === 'highway_path') set('line-color', p.road);
  else if (id.startsWith('railway')) set('line-color', id.includes('dashline') ? p.land : p.rail);
  else if (id.startsWith('boundary')) set('line-color', p.boundary);
  else if (layer.type === 'symbol') {
    const isWater = id.startsWith('water');
    const isRoad = id.startsWith('highway-name');
    set(
      'text-color',
      isWater ? p.waterLabel : isRoad ? p.roadLabel : id === 'label_other' ? p.labelMuted : p.label,
    );
    set('text-halo-color', p.halo);
    set('text-halo-width', 1.2);
  }
  return { ...layer, paint } as LayerSpecification;
}

const cache = new Map<string, Promise<StyleSpecification>>();

/** โหลด + แทนสี (cache ต่อธีม) — เอา layer ภาพนูนทวีป (ne2_shaded) ออก ให้พื้นเรียบแบบ Google */
export function loadGoogleStyle(theme: 'light' | 'dark'): Promise<StyleSpecification> {
  const hit = cache.get(theme);
  if (hit) return hit;
  const p = fetch(MAP_STYLE_URL, { signal: AbortSignal.timeout(MAP_LOAD_TIMEOUT_MS) })
    .then((r) => {
      if (!r.ok) throw new Error(`map style ${r.status}`);
      return r.json() as Promise<StyleSpecification>;
    })
    .then((style) => {
      const pal = GOOGLE_PALETTE[theme];
      const sources = { ...(style.sources as Record<string, unknown>) };
      delete sources.ne2_shaded;
      return {
        ...style,
        sources,
        layers: style.layers
          .filter((l) => !('source' in l) || l.source !== 'ne2_shaded')
          .map((l) => recolor(l, pal)),
      } as StyleSpecification;
    });
  p.catch(() => cache.delete(theme));
  cache.set(theme, p);
  return p;
}
