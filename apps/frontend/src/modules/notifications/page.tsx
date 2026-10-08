import { Bell } from '@phosphor-icons/react';
import { myNotifications } from '@/services/data';
import { markAllRead } from './api';
import { App, Badge, Button, Empty, Listy } from 'antd';
import { ListRow } from '@/ui/components/listRow';
import { Link } from 'react-router';
import { PageHeader } from '@/ui/components/pageHeader';
import { useDemo } from '@/hooks/useDemo';
import { timeAgo } from '@/ui/utils/format';

export function NotificationsPage() {
  useDemo();
  const { message } = App.useApp();
  const items = myNotifications();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="แจ้งเตือน"
        extra={
          <Button
            disabled={!items.some((n) => !n.readAt)}
            onClick={() => void markAllRead().catch((e: Error) => message.error(e.message))}
          >
            อ่านทั้งหมดแล้ว
          </Button>
        }
      />
      {items.length === 0 ? (
        <Empty description="ยังไม่มีแจ้งเตือน" />
      ) : (
        <Listy
          items={items}
          rowKey="id"
          itemRender={(n) => (
            <ListRow
              avatar={
                <Badge dot={!n.readAt}>
                  <Bell size={22} className="text-gold-text" />
                </Badge>
              }
              title={n.link ? <Link to={n.link}>{n.title}</Link> : n.title}
              description={
                <>
                  {n.body} · <span className="text-xs">{timeAgo(n.createdAt)}</span>
                </>
              }
            />
          )}
        />
      )}
    </div>
  );
}
