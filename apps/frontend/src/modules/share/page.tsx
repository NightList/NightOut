import { CalendarCheck, MapPin, UsersThree } from '@phosphor-icons/react';
import { getBarBySlug } from '@/services/data';
import { useShareCard } from './api';
import { Button, Card, Spin } from 'antd';
import { Link, useParams } from 'react-router';
import { BarCover } from '@/ui/components/barCard';
import { dateTime } from '@/ui/utils/format';
import { NotFoundResult } from '@/ui/components/notFoundResult';

/** /share/:token — บัตรจองสาธารณะ (rpc get_share_card · ไม่มีข้อมูลส่วนตัว / QR เช็กอิน) */
export function SharePage() {
  const { token = '' } = useParams();
  const { data: card, isLoading } = useShareCard(token);
  if (isLoading) return <Spin fullscreen />;
  if (!card) return <NotFoundResult title="ลิงก์นี้หมดอายุหรือไม่ถูกต้อง" kind="home" />;
  const bar = getBarBySlug(card.bar_slug);
  return (
    <div className="mx-auto max-w-md">
      <Card cover={bar ? <BarCover bar={bar} className="h-40" /> : undefined}>
        <p className="text-sm text-muted">{card.host_first_name} ชวนคุณไป</p>
        <h1 className="font-display text-3xl font-bold">{card.bar_name}</h1>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2">
            <CalendarCheck className="text-gold-text" /> {dateTime(card.booking_datetime)}
          </li>
          <li className="flex items-center gap-2">
            <UsersThree className="text-gold-text" /> {card.pax} คน · {card.zone_name}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="text-gold-text" /> {card.address}
          </li>
        </ul>
        <div className="mt-6 grid gap-3">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${card.lat},${card.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button block type="primary" size="large">
              เปิดแผนที่
            </Button>
          </a>
          <Link to={`/bars/${card.bar_slug}`}>
            <Button block size="large">
              ดูหน้าร้าน
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
