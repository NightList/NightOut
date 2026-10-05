import { getBar, myReviews } from '@/services/data';
import { StarRating } from '@nightout/ui';
import { Card, Empty } from 'antd';
import { Link } from 'react-router';
import { PageHeader } from '@/ui/components/pageHeader';
import { useDemo } from '@/hooks/useDemo';
import { timeAgo } from '@/ui/utils/format';

export function MyReviewsPage() {
  useDemo();
  const reviews = myReviews();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="รีวิวของฉัน" />
      {reviews.length === 0 ? (
        <Empty description="ยังไม่มีรีวิว — รีวิวได้หลังเช็กอินที่ร้าน" />
      ) : (
        <div className="grid gap-3">
          {reviews.map((r) => {
            const bar = getBar(r.barId);
            return (
              <Card
                key={r.id}

                title={<Link to={`/bars/${bar?.slug}`}>{bar?.name}</Link>}
                extra={<span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>}
              >
                <StarRating value={r.rating} showValue={false} />
                <p className="mt-2">{r.comment}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
