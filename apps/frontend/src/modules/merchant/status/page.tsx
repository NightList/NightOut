import { Button, Card, Empty, Result, Steps } from 'antd';
import { Link } from 'react-router';
import { getBar } from '@/services/data';
import { useAuth } from '@/services/auth';
import { useDemo } from '@/hooks/useDemo';
import { PageHeader } from '@/ui/components/pageHeader';

const STEP = { DRAFT: 0, PENDING_REVIEW: 1, APPROVED: 2, REJECTED: 1, SUSPENDED: 2 } as const;

/** /merchant/status — สถานะการตรวจร้าน (จาก my_bar_detail) */
export function MerchantStatusPage() {
  useDemo();
  const { user } = useAuth();
  const bar = user?.barId ? getBar(user.barId) : null;
  if (!bar)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="สถานะการตรวจสอบ" />
        <Empty description="ยังไม่มีร้านที่สมัคร">
          <Link to="/merchant/join">
            <Button type="primary">สมัครเป็นร้านค้า</Button>
          </Link>
        </Empty>
      </div>
    );
  if (bar.status === 'REJECTED' || bar.status === 'SUSPENDED')
    return (
      <Result
        status="warning"
        title={bar.status === 'REJECTED' ? `${bar.name} ยังไม่ผ่านการตรวจ` : `${bar.name} ถูกระงับชั่วคราว`}
        subTitle={bar.statusReason ?? 'ติดต่อทีม NightOut เพื่อขอรายละเอียด'}
      />
    );
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="สถานะการตรวจสอบ" subtitle={bar.name} />
      <Card>
        <Steps
          orientation="vertical"
          current={STEP[bar.status]}
          items={[
            { title: 'ส่งข้อมูลแล้ว' },
            { title: 'ทีมกำลังตรวจสอบ', content: 'ปกติใช้เวลา 1–2 วันทำการ · ระหว่างนี้เตรียมเมนู โต๊ะ และตั้งค่าการจองได้' },
            { title: 'อนุมัติ & เปิดหน้าร้าน' },
          ]}
        />
        <Link to="/merchant">
          <Button type="primary" className="mt-4">
            ไปหน้าร้านของฉัน
          </Button>
        </Link>
      </Card>
    </div>
  );
}
