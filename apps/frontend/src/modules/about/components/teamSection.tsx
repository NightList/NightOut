import { Button } from 'antd';
import { useCallback, useState } from 'react';
import { useSiteTeam } from '../api';
import { TeamGrid } from './teamGrid';
import { TeamProfileDrawer } from './teamProfileDrawer';

const SKELETON_COUNT = 7;

/**
 * ทีมงาน (/about) — กริดเส้นทอง + การ์ดกระจก + แผงโปรไฟล์ · ข้อมูลจาก Supabase (view public_team)
 * โหลด = ช่องโหลด 7 ช่อง · error = ข้อความ + ปุ่มลองใหม่ · ไม่มีใครเลย = ซ่อนทั้งส่วน
 */
export function TeamSection() {
  const team = useSiteTeam();
  const members = team.data ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  if (team.isSuccess && members.length === 0) return null;

  return (
    <section aria-labelledby="team-title" className="relative mt-[clamp(48px,5vw,80px)]">
      <div
        aria-hidden="true"
        className="about-glow pointer-events-none absolute inset-x-0 -z-10 -top-40 h-[calc(100%+460px)] md:top-[-25.6vw] md:h-[max(100vw,1500px)]"
      />
      <div className="mx-auto w-full max-w-300 px-4 md:px-8">
        <h2
          id="team-title"
          className="font-kanit mb-[clamp(20px,2.6vw,40px)] text-[clamp(44px,5.6vw,92px)] font-semibold leading-none"
        >
          ทีมงาน
        </h2>

        {team.isError ? (
          <div role="alert" className="team-error flex flex-col items-start gap-4 p-6 md:p-8">
            <div className="flex flex-col gap-1">
              <p className="font-kanit text-lg font-medium text-white">
                โหลดรายชื่อทีมงานไม่สำเร็จ
              </p>
              <p className="text-sm text-white/65">ตรวจการเชื่อมต่ออินเทอร์เน็ต แล้วกดลองใหม่</p>
            </div>
            <Button type="primary" onClick={() => void team.refetch()} loading={team.isFetching}>
              ลองใหม่
            </Button>
          </div>
        ) : (
          <TeamGrid
            members={members}
            openIndex={open}
            onOpen={setOpen}
            skeleton={team.isPending ? SKELETON_COUNT : 0}
          />
        )}
      </div>

      <TeamProfileDrawer members={members} index={open} onClose={close} onNavigate={setOpen} />
    </section>
  );
}
