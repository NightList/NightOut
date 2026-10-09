import { barBookings } from '@/services/data';
import { Button, Card, Col, Row, Statistic, Table } from 'antd';
import { Link } from 'react-router';
import { BookingStatusTag } from '@/ui/components/bookingStatusTag';
import { CrowdBadge } from '@/ui/components/crowdBadge';
import { PageHeader } from '@/ui/components/pageHeader';
import { dateTime } from '@/ui/utils/format';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { BarRating } from '@/ui/components/barRating';

export function MerchantDashboardPage() {
  const bar = useMerchantBar();
  const all = barBookings(bar.id);
  const today = all.filter(
    (b) => new Date(b.datetime).toDateString() === new Date().toDateString(),
  );
  const done = all.filter((b) => ['CHECKED_IN', 'COMPLETED', 'NO_SHOW'].includes(b.status));
  const showRate = done.length
    ? Math.round((done.filter((b) => b.status !== 'NO_SHOW').length / done.length) * 100)
    : 100;
  const pending = all.filter((b) => ['PENDING', 'DEPOSIT_SUBMITTED'].includes(b.status));

  return (
    <div>
      <PageHeader
        title="แดชบอร์ด"
        subtitle={<CrowdBadge crowd={bar.crowd} updatedAt={bar.crowdUpdatedAt} showTime />}
        extra={
          <Link to="/merchant/tonight">
            <Button type="primary">เปิด Scanner คืนนี้</Button>
          </Link>
        }
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="จองวันนี้" value={today.length} suffix="โต๊ะ" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="รอดำเนินการ"
              value={pending.length}
              styles={{ content: { color: 'var(--gold-text)' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="อัตรามาตามนัด" value={showRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <p className="mb-1 text-sm text-muted">ระดับร้าน</p>
            <BarRating bar={bar} compact />
          </Card>
        </Col>
      </Row>
      <Card
        title="การจองวันนี้"
        className="!mt-6"
        extra={<Link to="/merchant/bookings">ทั้งหมด →</Link>}
      >
        <Table
          rowKey="id"
          scroll={{ x: 560 }}
          pagination={false}
          dataSource={today}
          locale={{ emptyText: 'ยังไม่มีการจองวันนี้' }}
          columns={[
            { title: 'เวลา', dataIndex: 'datetime', render: (v: string) => dateTime(v) },
            { title: 'ลูกค้า', dataIndex: 'userName' },
            { title: 'คน', dataIndex: 'pax', width: 60 },
            { title: 'สถานะ', dataIndex: 'status', render: (s) => <BookingStatusTag status={s} /> },
          ]}
        />
      </Card>
    </div>
  );
}
