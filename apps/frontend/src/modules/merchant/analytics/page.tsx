import { barBookings } from '@/services/data';
import { Card, Col, Progress, Row, Statistic } from 'antd';
import { PageHeader } from '@/ui/components/pageHeader';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export function MerchantAnalyticsPage() {
  const bar = useMerchantBar();
  const all = barBookings(bar.id);
  const byDay = DAYS.map((d, i) => ({
    d,
    n: all.filter((b) => new Date(b.datetime).getDay() === i).length,
  }));
  const max = Math.max(1, ...byDay.map((x) => x.n));
  const pax = all.reduce((s, b) => s + b.pax, 0);
  const noShow = all.filter((b) => b.status === 'NO_SHOW').length;
  return (
    <div>
      <PageHeader title="สถิติ" subtitle="คำนวณจากการจองของร้านใน NightOut" />
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="การจองทั้งหมด" value={all.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="ลูกค้ารวม" value={pax} suffix="คน" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="No-show" value={noShow} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="ผ่านการโปรโมท" value={bar.promoted ? 'กำลังแสดง' : '-'} />
          </Card>
        </Col>
      </Row>
      <Card title="การจองแยกตามวัน" className="!mt-6">
        <ul className="space-y-2">
          {byDay.map((x) => (
            <li key={x.d} className="grid grid-cols-[40px_1fr_40px] items-center gap-3 text-sm">
              <span className="text-muted">{x.d}</span>
              <Progress
                percent={Math.round((x.n / max) * 100)}
                showInfo={false}
                strokeColor="var(--gold)"
              />
              <span className="text-right tabular-nums">{x.n}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
