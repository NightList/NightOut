import type { BarWithTier } from '@/services/data';
import { CornersIn, CornersOut } from '@phosphor-icons/react';
import { Modal } from 'antd';
import { divIcon, type LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router';
import { useEffect, useState } from 'react';
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
  expandable = false,
}: {
  bars: BarWithTier[];
  className?: string;
  interactive?: boolean;
  expandable?: boolean;
}) {
  const { resolved } = useThemeMode();
  const [expanded, setExpanded] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  if (bars.length === 0) return null;
  const single = bars.length === 1;
  const bounds: LatLngBoundsExpression | null = single
    ? null
    : bars.map((b) => [b.lat, b.lng] as [number, number]);
  const renderMap = () => (
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
  );

  return (
    <>
      <div className={`relative overflow-hidden rounded-2xl border border-border ${className}`}>
        {!expanded && renderMap()}
        {expandable && (
          <button
            type="button"
            aria-label="ขยายแผนที่เต็มจอ"
            onClick={() => setExpanded(true)}
            className="absolute right-3 top-3 z-[500] grid size-11 touch-manipulation place-items-center rounded-full bg-black/65 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <CornersOut size={22} aria-hidden="true" />
          </button>
        )}
      </div>
      {expandable && (
        <Modal
          open={expanded}
          onCancel={() => {
            setExpanded(false);
            setModalReady(false);
          }}
          afterOpenChange={setModalReady}
          destroyOnHidden
          footer={null}
          closeIcon={<CornersIn size={22} aria-hidden="true" />}
          title={<span className="sr-only">แผนที่ร้านแบบเต็มจอ</span>}
          width="100%"
          style={{ top: 0, maxWidth: 'none', margin: 0, paddingBottom: 0 }}
          styles={{
            container: { height: '100dvh', padding: 0, borderRadius: 0, overflow: 'hidden' },
            header: { margin: 0 },
            body: { height: '100%' },
            close: {
              top: 'max(0.75rem, env(safe-area-inset-top))',
              width: 44,
              height: 44,
              color: '#fff',
              background: 'rgb(0 0 0 / 65%)',
              backdropFilter: 'blur(4px)',
            },
          }}
        >
          {expanded && modalReady && renderMap()}
        </Modal>
      )}
    </>
  );
}
