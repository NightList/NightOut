import L from 'leaflet';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Map as LibreMap } from 'maplibre-gl';
import { TileLayer, useMap } from 'react-leaflet';
import { loadGoogleStyle } from '@/ui/utils/mapStyle';
import {
  MAP_ATTRIBUTION,
  MAP_LOAD_TIMEOUT_MS,
  MAP_TILES,
  MAP_USE_RASTER,
  tileClass,
} from '@/ui/utils/mapTiles';
// MapLibre v6 หา worker จาก import.meta.url ของตัวเอง — Vite (dev: pre-bundle / build: hash) ทำให้ path เพี้ยน
// → "Worker failed to load" · ให้ Vite bundle worker เป็นไฟล์ของตัวเอง แล้วบอก URL ให้ MapLibre ตรงๆ
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

const VECTOR_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

/**
 * พื้นแผนที่ของทุกหน้า
 * ค่าเริ่มต้น: vector tiles (OpenFreeMap) + สีแบบ Google Maps ตามธีม — ฟรี ไม่ต้องมี key
 * ถ้าโหลดสไตล์ไม่ได้ หรือตั้ง VITE_MAP_TILE_URL_* ไว้ → ใช้ raster tiles แทน
 */
export function MapBaseLayer({ theme }: { theme: 'light' | 'dark' }) {
  const map = useMap();
  const [failed, setFailed] = useState(false);
  const [rasterFailed, setRasterFailed] = useState(false);

  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const container = map.getContainer();
        if (container.clientWidth && container.clientHeight) {
          map.invalidateSize({ pan: false, debounceMoveend: true });
        }
      });
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);

  useEffect(() => {
    if (MAP_USE_RASTER || failed) return;
    let layer: L.MaplibreGL | null = null;
    let gl: LibreMap | undefined;
    let frame = 0;
    let cancelled = false;
    const fallback = (reason?: unknown) => {
      if (!cancelled) {
        console.warn('Vector map unavailable; using raster fallback', reason);
        setFailed(true);
      }
    };
    const timeout = window.setTimeout(fallback, MAP_LOAD_TIMEOUT_MS);
    const loaded = () => window.clearTimeout(timeout);
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => gl?.resize());
    };
    // maplibre-gl (~1MB) โหลดเฉพาะตอนมีแผนที่บนจอ — ไม่ถ่วงหน้าร้าน/หน้าค้นหาตอนเปิด
    Promise.all([
      loadGoogleStyle(theme),
      import('maplibre-gl').then((m) => m.setWorkerUrl(maplibreWorkerUrl)),
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
      .then(([style]) => {
        if (cancelled) return;
        layer = L.maplibreGL({ style, attributionControl: false });
        layer.addTo(map);
        gl = layer.getMaplibreMap();
        gl.on('load', loaded);
        gl.on('error', fallback);
        gl.on('webglcontextlost', fallback);
        map.on('resize', resize);
        resize();
        map.attributionControl?.addAttribution(VECTOR_ATTRIBUTION);
      })
      .catch(fallback);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
      map.off('resize', resize);
      gl?.off('load', loaded);
      gl?.off('error', fallback);
      gl?.off('webglcontextlost', fallback);
      if (layer && map.hasLayer(layer)) {
        try {
          map.removeLayer(layer);
        } catch (error) {
          console.warn('Map layer cleanup failed', error);
        }
      }
      map.attributionControl?.removeAttribution(VECTOR_ATTRIBUTION);
    };
  }, [map, theme, failed]);

  if (MAP_USE_RASTER || failed) {
    return (
      <>
        <TileLayer
          key={theme}
          url={MAP_TILES[theme]}
          attribution={MAP_ATTRIBUTION}
          className={tileClass(theme)}
          maxZoom={19}
          eventHandlers={{
            tileerror: () => setRasterFailed(true),
            tileload: () => setRasterFailed(false),
          }}
        />
        {rasterFailed &&
          createPortal(
            <div
              role="status"
              className="pointer-events-none absolute inset-x-3 bottom-8 z-[500] rounded-lg bg-surface/95 p-2 text-center text-sm text-text"
            >
              แผนที่บางส่วนโหลดไม่สำเร็จ ลองซูมหรือเลื่อนแผนที่อีกครั้ง
            </div>,
            map.getContainer(),
          )}
      </>
    );
  }
  return null;
}
