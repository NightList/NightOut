import {
  ArrowLeft,
  CalendarPlus,
  Crosshair,
  Faders,
  MagnifyingGlass,
  Minus,
  NavigationArrow,
  Plus,
  X,
} from '@phosphor-icons/react';
import { CATEGORY_LABELS, listBars, type BarFilter, type BarWithTier } from '@/services/data';
import type { BarCategory, CrowdStatus } from '@nightout/types';
import { useThemeMode } from '@nightout/ui';
import { Button, Checkbox, Drawer, Input, Segmented } from 'antd';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, useMapEvents } from 'react-leaflet';
import { Link, useNavigate } from 'react-router';
import { useDemo } from '@/hooks/useDemo';
import { BarRating } from '@/ui/components/barRating';
import { directionsUrl } from '@/ui/components/barMap';
import { CrowdBadge } from '@/ui/components/crowdBadge';
import { PRBadge } from '@/ui/components/prBadge';
import { baht } from '@/ui/utils/format';
import { barImage } from '@/ui/utils/barImage';
import { MapBaseLayer } from '@/ui/components/mapBaseLayer';
import { barPin, meIcon } from './components/barPin';

const BANGKOK: [number, number] = [13.745, 100.56];

const fab =
  'grid size-12 place-items-center rounded-full border border-border bg-surface/95 text-text shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur transition hover:border-gold hover:text-gold-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

function ClearOnMapClick({ onClear }: { onClear: () => void }) {
  useMapEvents({ click: onClear });
  return null;
}

/**
 * /map — แผนที่เต็มจอ (แบบตัวอย่างที่ผู้ใช้ส่งมา)
 * หมุดวงกลมรูปร้าน · จุดฟ้าตำแหน่งของฉัน · ปุ่มลอย ย้อนกลับ/ค้นหา/ตัวกรอง (ซ้ายบน) · ซูม (ขวาบน)
 * แตะหมุด → การ์ดร้านเลื่อนขึ้นจากล่าง (ดูร้าน / จอง / นำทาง)
 */
export function MapPage() {
  useDemo();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { resolved } = useThemeMode();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [f, setF] = useState<BarFilter>({ q: '', category: 'ALL', crowd: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [me, setMe] = useState<[number, number] | null>(null);

  const bars = listBars(f);
  const selected = useMemo(
    () => bars.find((b) => b.id === selectedId) ?? null,
    [bars, selectedId],
  );
  const activeFilters =
    (f.category && f.category !== 'ALL' ? 1 : 0) + (f.hasPR ? 1 : 0) + (f.crowd?.length ?? 0);

  // ขอตำแหน่งครั้งแรก (ถ้าผู้ใช้อนุญาต) — ไม่อนุญาตก็ใช้กลางกรุงเทพ
  const locate = (fly: boolean) => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const ll: [number, number] = [p.coords.latitude, p.coords.longitude];
        setMe(ll);
        if (fly) map?.flyTo(ll, 15, { duration: reduce ? 0 : 0.8 });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  useEffect(() => {
    locate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (b: BarWithTier) => {
    setSelectedId(b.id);
    map?.panTo([b.lat, b.lng], { animate: !reduce });
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <MapContainer
        center={BANGKOK}
        zoom={13}
        zoomControl={false}
        attributionControl
        ref={setMap}
        className="size-full"
      >
        <MapBaseLayer theme={resolved} />
        <ClearOnMapClick onClear={() => setSelectedId(null)} />
        {bars.map((b) => (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={barPin(b, b.id === selectedId)}
            zIndexOffset={b.id === selectedId ? 1000 : b.promoted ? 100 : 0}
            eventHandlers={{ click: () => select(b) }}
            title={b.name}
            alt={b.name}
          />
        ))}
        {me && <Marker position={me} icon={meIcon} interactive={false} zIndexOffset={-100} />}
      </MapContainer>

      {/* ซ้ายบน: ย้อนกลับ · ค้นหา · ตัวกรอง */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="ย้อนกลับ"
          className={`${fab} pointer-events-auto`}
          onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <AnimatePresence initial={false} mode="popLayout">
          {searchOpen ? (
            <motion.div
              key="search"
              initial={reduce ? false : { width: 48, opacity: 0.6 }}
              animate={{ width: 'min(22rem, calc(100vw - 9rem))', opacity: 1 }}
              exit={reduce ? undefined : { width: 48, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="pointer-events-auto"
            >
              <Input
                autoFocus
                size="large"
                allowClear
                value={f.q}
                onChange={(e) => setF({ ...f, q: e.target.value })}
                placeholder="ชื่อร้าน ย่าน หรือสไตล์"
                prefix={<MagnifyingGlass />}
                suffix={
                  <button type="button" aria-label="ปิดค้นหา" onClick={() => setSearchOpen(false)}>
                    <X />
                  </button>
                }
                className="!h-12 !rounded-full !border-border !bg-surface/95 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur"
              />
            </motion.div>
          ) : (
            <motion.button
              key="search-btn"
              type="button"
              aria-label="ค้นหาร้าน"
              className={`${fab} pointer-events-auto`}
              onClick={() => setSearchOpen(true)}
            >
              <MagnifyingGlass size={20} weight="bold" />
            </motion.button>
          )}
        </AnimatePresence>
        <button
          type="button"
          aria-label="ตัวกรอง"
          className={`${fab} pointer-events-auto relative`}
          onClick={() => setFilterOpen(true)}
        >
          <Faders size={20} weight="bold" />
          {activeFilters > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-on-gold">
              {activeFilters}
            </span>
          )}
        </button>

        {/* ขวาบน: ซูม */}
        <div className="pointer-events-auto ml-auto flex flex-col gap-2">
          <button type="button" aria-label="ซูมเข้า" className={fab} onClick={() => map?.zoomIn()}>
            <Plus size={20} weight="bold" />
          </button>
          <button type="button" aria-label="ซูมออก" className={fab} onClick={() => map?.zoomOut()}>
            <Minus size={20} weight="bold" />
          </button>
          <button
            type="button"
            aria-label="ตำแหน่งของฉัน"
            className={`${fab} mt-2`}
            onClick={() => locate(true)}
          >
            <Crosshair size={20} weight="bold" className={me ? 'text-sky-400' : ''} />
          </button>
        </div>
      </div>

      {/* จำนวนร้าน */}
      {!selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[500] flex justify-center">
          <span className="rounded-full border border-border bg-surface/95 px-4 py-2 text-sm shadow-lg backdrop-blur">
            {bars.length} ร้านบนแผนที่
          </span>
        </div>
      )}

      {/* การ์ดร้านที่เลือก */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="absolute inset-x-0 bottom-0 z-[600] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="w-full max-w-md rounded-3xl border border-border bg-surface/95 p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <div className="flex gap-3">
                <div
                  className="size-16 shrink-0 rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${barImage(selected)})` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-lg font-semibold">{selected.name}</h2>
                    <button
                      type="button"
                      aria-label="ปิด"
                      className="text-muted hover:text-text"
                      onClick={() => setSelectedId(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
                    <BarRating bar={selected} compact />
                    <span aria-hidden>•</span>
                    {selected.district} · ~{baht(selected.avgPerPerson)}/คน
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <CrowdBadge crowd={selected.crowd} updatedAt={selected.crowdUpdatedAt} />
                    <PRBadge pr={selected.pr} compact />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                <Link to={`/bars/${selected.slug}`}>
                  <Button block>ดูร้าน</Button>
                </Link>
                <Link to={`/bars/${selected.slug}/book`}>
                  <Button block type="primary" icon={<CalendarPlus />}>
                    จองโต๊ะ
                  </Button>
                </Link>
                <a
                  href={directionsUrl(selected.lat, selected.lng)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Button aria-label="นำทาง" icon={<NavigationArrow />} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        placement="left"
        title="ตัวกรอง"
        size="default"
        footer={
          <div className="flex gap-2">
            <Button block onClick={() => setF({ q: f.q, category: 'ALL', crowd: [] })}>
              ล้าง
            </Button>
            <Button block type="primary" onClick={() => setFilterOpen(false)}>
              ดู {bars.length} ร้าน
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-muted">ประเภทร้าน</p>
            <Segmented
              block
              orientation="vertical"
              value={f.category}
              onChange={(v) => setF({ ...f, category: v as BarCategory | 'ALL' })}
              options={[
                { label: 'ทั้งหมด', value: 'ALL' },
                ...(['PUB_BAR', 'CHILL', 'RESTAURANT'] as const).map((c) => ({
                  label: CATEGORY_LABELS[c],
                  value: c,
                })),
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">ความแน่นตอนนี้</p>
            <Checkbox.Group
              value={f.crowd}
              onChange={(v) => setF({ ...f, crowd: v as CrowdStatus[] })}
              options={[
                { label: 'ว่าง', value: 'AVAILABLE' },
                { label: 'ใกล้เต็ม', value: 'ALMOST_FULL' },
                { label: 'เต็ม', value: 'FULL' },
              ]}
            />
          </div>
          <Checkbox
            checked={!!f.hasPR}
            onChange={(e) => setF({ ...f, hasPR: e.target.checked || undefined })}
          >
            เฉพาะร้านที่มี PR
          </Checkbox>
          <p className="text-xs text-muted">ขอบหมุด: เขียว = ว่าง · เหลือง = ใกล้เต็ม · แดง = เต็ม</p>
        </div>
      </Drawer>
    </div>
  );
}
