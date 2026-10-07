import { PageContainer } from '@ant-design/pro-components';
import { ArrowSquareOut, PencilSimple } from '@phosphor-icons/react';
import type { Db } from '@nightout/types';
import { Button, Card } from 'antd';
import { useState } from 'react';
import { useAdminView } from '@/services/adminData';
import { LoadError } from '@/ui/components/LoadError';
import { webSrc } from '@/ui/utils/image';
import { CategoryDrawer } from './form/categoryDrawer';
import { HeroForm } from './form/heroForm';
import { SLOT_LABELS, SLOT_SPAN } from './utils/slots';

/** หน้าแรกบนเว็บลูกค้า (deploy: โดเมนเดียวกัน · dev: คนละ port) */
const HOME_URL = import.meta.env.DEV ? 'http://localhost:5173/' : '/';

/**
 * หน้าแรก — แก้ Hero และการ์ดหมวด "คืนนี้อยากได้ฟีลไหน" ของเว็บลูกค้า
 * บันทึกแล้วขึ้นเว็บทันที (ลูกค้าที่เปิดหน้าอยู่เห็นเมื่อโหลดใหม่/กลับมาที่แท็บ) · ทุกการแก้ลง Audit Log
 */
export function HomeContentPage() {
  const content = useAdminView('admin_home_content');
  const categories = useAdminView('admin_home_categories', { order: { column: 'sort_order', ascending: true } });
  const [editing, setEditing] = useState<Db.AdminHomeCategory | null>(null);

  return (
    <PageContainer
      title="หน้าแรก"
      subTitle="แก้แล้วขึ้นเว็บทันที"
      extra={
        <Button href={HOME_URL} target="_blank" rel="noreferrer" icon={<ArrowSquareOut size={16} />}>
          ดูหน้าแรก
        </Button>
      }
    >
      <LoadError error={content.error ?? categories.error} onRetry={() => void (content.refetch(), categories.refetch())} />
      <div className="space-y-6">
        <HeroForm content={content.data?.[0]} />

        <Card title="การ์ดหมวด" loading={categories.isLoading}>
          <p className="mb-4 text-sm opacity-70">ตำแหน่งบนกริดตายตัว กดการ์ดเพื่อแก้ภาพ ชื่อ คำอธิบาย ป้าย หรือลิงก์</p>
          <ul className="grid auto-rows-[120px] grid-cols-2 gap-3 lg:grid-cols-4">
            {(categories.data ?? []).map((c) => {
              return (
                <li key={c.slot} className={SLOT_SPAN[c.slot] ?? ''}>
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    aria-label={`แก้การ์ด ${c.title} (${SLOT_LABELS[c.slot] ?? c.slot})`}
                    className="group relative flex size-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl border-0 bg-[#14121c] bg-cover bg-center p-3 text-left text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b64c]"
                    style={{ backgroundImage: `url("${webSrc(c.image_url)}")` }}
                  >
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                    <span className="relative flex justify-end">
                      <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        <PencilSimple size={12} /> แก้
                      </span>
                    </span>
                    <span className="relative min-w-0">
                      {c.badge && (
                        <span className="mb-1 inline-block rounded-full bg-[#e8b64c] px-2 text-[11px] font-semibold text-[#07070d]">
                          {c.badge}
                        </span>
                      )}
                      <span className="block truncate font-semibold">{c.title}</span>
                      <span className="block truncate text-xs text-white/70">{c.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <CategoryDrawer category={editing} onClose={() => setEditing(null)} />
    </PageContainer>
  );
}
