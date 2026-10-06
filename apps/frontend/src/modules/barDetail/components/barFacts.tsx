import { Descriptions } from 'antd';
import type { BarWithTier } from '@/services/data';
import { baht } from '@/ui/utils/format';

/** ข้อมูลหลักของร้าน: ที่อยู่ ราคาเฉลี่ย ค่าบริการ เวลาเก็บโต๊ะ มัดจำ */
export function BarFacts({ bar }: { bar: BarWithTier }) {
  return (
    <Descriptions
      column={{ xs: 1, sm: 2 }}
      items={[
        { key: 'a', label: 'ที่อยู่', children: bar.address },
        { key: 'p', label: 'ราคาเฉลี่ย', children: `~${baht(bar.avgPerPerson)} / คน` },
        {
          key: 's',
          label: 'Service charge / VAT',
          children: `${bar.fees.serviceChargeRate}% / ${bar.fees.vatRate}%`,
        },
        { key: 'o', label: 'ค่าอื่นๆ', children: bar.fees.otherFees ? baht(bar.fees.otherFees) : 'ไม่มี' },
        { key: 'g', label: 'เก็บโต๊ะให้', children: `${bar.gracePeriodMinutes} นาทีหลังเวลาจอง` },
        {
          key: 'd',
          label: 'มัดจำ',
          children: `${baht(bar.deposit.amount)} / ${bar.deposit.unit === 'PER_PERSON' ? 'คน' : 'โต๊ะ'} · โอนเข้า NightOut`,
        },
      ]}
    />
  );
}
