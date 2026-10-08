import { barReviews } from '@/services/data';
import { reportReview } from './api';
import { StarRating } from '@nightout/ui';
import { App, Button, Card, Listy, Tag } from 'antd';
import { ListRow } from '@/ui/components/listRow';
import { PageHeader } from '@/ui/components/pageHeader';
import { timeAgo } from '@/ui/utils/format';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { BarRating } from '@/ui/components/barRating';

export function MerchantReviewsPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const reviews = barReviews(bar.id);
  return (
    <div>
      <PageHeader title="รีวิว" subtitle={<BarRating bar={bar} />} />
      <Card>
        <Listy
          items={reviews}
          rowKey="id"
          itemRender={(r) => (
            <ListRow
              actions={[
                r.reported ? (
                  <Tag key="r" color="orange">
                    รายงานแล้ว
                  </Tag>
                ) : (
                  <Button
                    key="r"

                    onClick={async () => {
                      try {
                        await reportReview(r.id, 'OTHER', 'ร้านรายงานรีวิว');
                        message.success('ส่งให้ทีม NightOut ตรวจแล้ว');
                      } catch (e) {
                        message.error((e as Error).message);
                      }
                    }}
                  >
                    รายงานรีวิว
                  </Button>
                ),
              ]}
              title={
                <span>
                  {r.userName} · <StarRating value={r.rating} size={12} showValue={false} />
                </span>
              }
              description={
                <>
                  {r.comment} · <span className="text-xs">{timeAgo(r.createdAt)}</span>
                </>
              }
            />
          )}
        />
      </Card>
    </div>
  );
}
