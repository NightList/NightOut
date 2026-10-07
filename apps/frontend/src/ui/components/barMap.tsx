import type { BarWithTier } from '@/services/data';
import { divIcon, type LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router';
import { useEffect } from 'react';
import { useThemeMode } from '@nightout/ui';
import { MapBaseLayer } from './mapBaseLayer';
import { barImage } from '@/ui/utils/barImage';

const escapeAttribute = (value: string) =>
  value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);

/** หมุดรูปหน้าร้านแบบวงกลม */
const pin = (bar: BarWithTier) =>
  divIcon({
    className: '',
    html: `<div class="nl-pin"><img src="${escapeAttribute(barImage(bar))}" alt="" /></div>`,
    iconSize: [36, 45],
    iconAnchor: [18, 45],
    popupAnchor: [0, -43],
  });

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [map, bounds]);
  return null;
}

/** ลิงก์นำทางไป Google Maps (เปิดแอปบนมือถือ) */
export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/**
 * แผนที่ร้าน — OpenStreetMap ผ่าน Leaflet (ฟรี ไม่ต้องมี key)
 * bars 1 ร้าน = หน้าร้าน · หลายร้าน = หน้าค้นหา (fit ให้เห็นทุกหมุด)
 */
export function BarMap({
  bars,
  className = 'h-72',
  interactive = true,
}: {
  bars: BarWithTier[];
  className?: string;
  interactive?: boolean;
}) {
  const { resolved } = useThemeMode();
  if (bars.length === 0) return null;
  const single = bars.length === 1;
  const bounds: LatLngBoundsExpression | null = single
    ? null
    : bars.map((b) => [b.lat, b.lng] as [number, number]);
  return (
    <div className={`overflow-hidden rounded-2xl border border-border ${className}`}>
      <MapContainer
        center={[bars[0]!.lat, bars[0]!.lng]}
        zoom={single ? 16 : 12}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="size-full"
      >
        <MapBaseLayer theme={resolved} />
        <FitBounds bounds={bounds} />
        {bars.map((b) => (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={pin(b)}>
            <Popup>
              <div className="min-w-40">
                <p className="font-semibold">{b.name}</p>
                <p className="text-xs text-muted">{b.district}</p>
                <div className="mt-1.5 flex gap-3 text-xs">
                  {!single && <Link to={`/bars/${b.slug}`}>ดูร้าน</Link>}
                  <a href={directionsUrl(b.lat, b.lng)} target="_blank" rel="noreferrer noopener">
                    นำทาง
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
