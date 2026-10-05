import type { Review } from '@/services/data';
import { StarRating } from '@nightout/ui';
import { Avatar, Button, Listy } from 'antd';
import { ListRow } from '@/ui/components/listRow';
import { Link } from 'react-router';
import { timeAgo } from '@/ui/utils/format';
import { ReviewMediaGallery } from './reviewMediaGallery';

export function ReviewList({ reviews, more }: { reviews: Review[]; more?: string }) {
  return (
    <div>
      <Listy
        items={reviews}
        rowKey="id"
        itemRender={(r) => (
          <ListRow
            avatar={<Avatar className="!bg-purple">{r.userName.slice(-2)}</Avatar>}
            title={
              <span className="flex flex-wrap items-center gap-2">
                {r.userName} <StarRating value={r.rating} size={12} showValue={false} />
                <span className="text-xs font-normal text-muted">
                  {timeAgo(r.createdAt)} · เช็กอินจริง
                </span>
              </span>
            }
            description={
              <>
                {r.comment}
                {r.media?.length ? <ReviewMediaGallery media={r.media} /> : null}
              </>
            }
          />
        )}
      />
      {more && (
        <Link to={more}>
          <Button type="link">ดูรีวิวทั้งหมด →</Button>
        </Link>
      )}
    </div>
  );
}
