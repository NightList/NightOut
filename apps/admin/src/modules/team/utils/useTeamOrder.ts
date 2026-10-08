import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Db } from '@nightout/types';
import { useMemo, useState } from 'react';
import { useAdminAction } from '@/services/adminData';

/**
 * ลากเรียงลำดับทีมงาน → PUT /admin/team-members/order (เฉพาะซูเปอร์แอดมิน)
 * ลำดับใหม่แสดงทันทีระหว่างรอ API (ผูกกับ rows ชุดที่ลาก — ได้ rows ใหม่จาก refetch แล้วทิ้งเอง · API พลาด = กลับลำดับเดิม)
 */
export function useTeamOrder(rows: Db.AdminTeamMember[]) {
  const act = useAdminAction();
  const [draft, setDraft] = useState<{ base: Db.AdminTeamMember[]; ids: string[] } | null>(null);

  const ordered = useMemo(() => {
    if (!draft || draft.base !== rows) return rows;
    const byId = new Map(rows.map((r) => [r.id, r]));
    return draft.ids.flatMap((id) => byId.get(id) ?? []);
  }, [draft, rows]);

  const sensors = useSensors(
    // ขยับเกิน 4px ถึงเริ่มลาก — คลิกปุ่มจับเฉย ๆ ไม่นับ
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = ordered.map((r) => r.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setDraft({ base: rows, ids: next });
    act.mutate(
      {
        method: 'PUT',
        path: 'team-members/order',
        body: { ids: next },
        success: 'เปลี่ยนลำดับแล้ว',
      },
      { onError: () => setDraft(null) },
    );
  };

  return { ordered, sensors, onDragEnd, saving: act.isPending };
}
