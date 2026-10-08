import { PageContainer } from '@ant-design/pro-components';
import type { Db } from '@nightout/types';
import { Button, Space, Table, Tabs, Tag } from 'antd';
import { PAGE_SIZE } from '@/configs/constants';
import { useAdminAction } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { RejectButton } from '@/ui/components/RejectButton';
import { SlipImage } from '@/ui/components/SlipImage';
import { StatusTag } from '@/ui/components/StatusTag';
import { baht, dateTime } from '@/ui/utils/format';
import { PLACEMENT, PROMO_STATUS } from '@/ui/utils/labels';
import { usePendingBarPromotions, usePromotedListings, moderateBarPromotionAction, reviewPromotionAction } from './api';

const DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/** ถ้อยคำโปรโมชันที่ร้านตั้ง (ลูกค้าเลือกตอนจอง) — ตรวจก่อนแสดง ห้ามชักชวนให้ดื่ม */
function BarPromotionReview() {
  const { data, isLoading, error, refetch } = usePendingBarPromotions();
  const act = useAdminAction();
  const moderate = (p: Db.AdminBarPromotion, approve: boolean, reason?: string) =>
    act.mutate({
      ...moderateBarPromotionAction(p.id, { approve, reason }),
      success: approve ? `อนุมัติโปร “${p.title}” แล้ว` : `แจ้ง ${p.bar.name} ว่าโปรไม่ผ่าน`,
    });
  return (
    <>
      <LoadError error={error} onRetry={() => void refetch()} />
      <p className="mb-3 text-sm text-muted">
        ถ้อยคำต้องเป็นสิทธิพิเศษของร้าน — ห้ามลดราคา/แจกฟรีเครื่องดื่มแอลกอฮอล์หรือชักชวนให้ดื่ม
        (พ.ร.บ.ควบคุมเครื่องดื่มแอลกอฮอล์)
      </p>
      <Table<Db.AdminBarPromotion>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: PAGE_SIZE }}
        scroll={{ x: 900 }}
        locale={{ emptyText: 'ไม่มีโปรรอตรวจ' }}
        columns={[
          { title: 'ร้าน', key: 'bar', render: (_, p) => p.bar.name },
          {
            title: 'โปร',
            key: 'title',
            render: (_, p) => (
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted">{p.description ?? '-'}</p>
              </div>
            ),
          },
          {
            title: 'เงื่อนไข',
            key: 'cond',
            render: (_, p) =>
              `${p.cutoff_time ? `เช็กอินก่อน ${p.cutoff_time.slice(0, 5)} น.` : 'ทั้งคืน'} · ${
                p.days_of_week.length >= 7 ? 'ทุกวัน' : p.days_of_week.map((d) => DAYS[d]).join(' ')
              }`,
          },
          {
            title: 'สถานะร้านตั้ง',
            dataIndex: 'active',
            render: (v: boolean) => (v ? <Tag color="green">เปิด</Tag> : <Tag>ปิด</Tag>),
          },
          {
            title: 'ส่งเมื่อ',
            dataIndex: 'updated_at',
            render: (v: string | null) => (v ? dateTime(v) : '-'),
          },
          {
            title: '',
            key: 'a',
            render: (_, p) => (
              <Space>
                <Button type="primary" loading={act.isPending} onClick={() => moderate(p, true)}>
                  ผ่าน
                </Button>
                <RejectButton
                  label="ไม่ผ่าน"
                  title="ถ้อยคำไม่ผ่าน?"
                  loading={act.isPending}
                  onReject={(reason) => moderate(p, false, reason)}
                />
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}

/** แพ็กเกจโปรโมทที่ร้านซื้อ — ตรวจสลิปแล้วเปิดแสดง · และถ้อยคำโปรโมชันของร้าน */
export function PromotionsPage() {
  const { data, isLoading, error, refetch } = usePromotedListings();
  const act = useAdminAction();
  const review = (p: Db.AdminPromotedListing, approve: boolean, reason?: string) =>
    act.mutate({
      ...reviewPromotionAction(p.id, { approve, reason }),
      success: approve ? `เปิดโปรโมท ${p.bar.name} แล้ว` : `แจ้ง ${p.bar.name} ว่าสลิปไม่ผ่าน`,
    });

  return (
    <PageContainer title="โปรโมท">
      <Tabs
        items={[
          {
            key: 'listings',
            label: 'แพ็กเกจโปรโมท',
            children: (
              <>
                <LoadError error={error} onRetry={() => void refetch()} />
                <Table<Db.AdminPromotedListing>
                  rowKey="id"
                  loading={isLoading}
                  dataSource={data}
                  pagination={{ pageSize: PAGE_SIZE }}
                  scroll={{ x: 1100 }}
                  locale={{ emptyText: 'ยังไม่มีร้านซื้อโปรโมท' }}
                  columns={[
                    { title: 'ร้าน', key: 'bar', render: (_, p) => p.bar.name },
                    {
                      title: 'แพ็กเกจ',
                      key: 'pkg',
                      render: (_, p) => `${p.package.name} · ${p.package.duration_days} วัน`,
                    },
                    {
                      title: 'ตำแหน่ง',
                      dataIndex: 'placement',
                      render: (v: Db.AdminPromotedListing['placement']) => PLACEMENT[v],
                    },
                    {
                      title: 'ราคา',
                      dataIndex: 'price_paid',
                      align: 'right',
                      render: (v: number) => baht(v),
                    },
                    {
                      title: 'ช่วงแสดง',
                      key: 'range',
                      render: (_, p) =>
                        p.starts_at && p.ends_at
                          ? `${dateTime(p.starts_at)} – ${dateTime(p.ends_at)}`
                          : '-',
                    },
                    {
                      title: 'สลิป',
                      key: 'slip',
                      render: (_, p) =>
                        p.latest_payment ? (
                          <SlipImage bucket="promo-slips" path={p.latest_payment.slip_path} />
                        ) : (
                          '-'
                        ),
                    },
                    {
                      title: 'สถานะ',
                      dataIndex: 'status',
                      filters: Object.entries(PROMO_STATUS).map(([value, l]) => ({
                        text: l.text,
                        value,
                      })),
                      onFilter: (v, p) => p.status === v,
                      render: (s: string) => <StatusTag map={PROMO_STATUS} value={s} />,
                    },
                    {
                      title: '',
                      key: 'a',
                      render: (_, p) =>
                        p.status === 'PAYMENT_SUBMITTED' && (
                          <Space>
                            <Button
                              type="primary"
                              loading={act.isPending}
                              onClick={() => review(p, true)}
                            >
                              สลิปผ่าน
                            </Button>
                            <RejectButton
                              label="ไม่ผ่าน"
                              title="สลิปไม่ผ่าน?"
                              loading={act.isPending}
                              onReject={(reason) => review(p, false, reason)}
                            />
                          </Space>
                        ),
                    },
                  ]}
                />
              </>
            ),
          },
          { key: 'texts', label: 'ถ้อยคำโปรของร้าน', children: <BarPromotionReview /> },
        ]}
      />
    </PageContainer>
  );
}
