import { ArrowDown, ArrowUp, X } from '@phosphor-icons/react';
import { HOME_POPULAR_MAX, type UpdateHomePopularBody } from '@nightout/contracts';
import type { Db } from '@nightout/types';
import { Button, Card, Select, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useAdminAction } from '@/services/adminData';
import { SectionHeadingForm } from './sectionHeadingForm';
import { useHomePopular, useBars, homePopularAction } from '../api';

const sameOrder = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * ร้านยอดนิยมบนหน้าแรก — หัวข้อ section + ร้านที่ปักไว้ (สูงสุด HOME_POPULAR_MAX · เรียงลำดับได้)
 * ช่องที่ว่างหน้าเว็บเติมด้วยร้านคะแนนรีวิวสูงสุดเอง · บันทึกทั้งรายการด้วย PUT /admin/home-popular
 */
export function PopularCard({ content }: { content: Db.AdminHomeContent | undefined }) {
  const pinned = useHomePopular();
  const bars = useBars();
  const act = useAdminAction();
  const savedIds = useMemo(() => (pinned.data ?? []).map((p) => p.bar_id), [pinned.data]);
  // draft = รายการที่แก้แต่ยังไม่บันทึก · null = ใช้ของที่บันทึกไว้
  const [draft, setDraft] = useState<string[] | null>(null);
  const ids = draft ?? savedIds;
  const setIds = (next: string[] | ((cur: string[]) => string[])) =>
    setDraft(typeof next === 'function' ? next(ids) : next);

  // ชื่อร้าน: จาก admin_bars ก่อน (สดกว่า) · ร้านที่ปักแต่ไม่ APPROVED แล้วมีแค่ใน admin_home_popular
  const barById = useMemo(() => {
    const m = new Map<string, { name: string; status: Db.AdminHomePopular['status'] }>();
    for (const p of pinned.data ?? []) m.set(p.bar_id, { name: p.name, status: p.status });
    for (const b of bars.data ?? []) m.set(b.id, { name: b.name, status: b.status });
    return m;
  }, [pinned.data, bars.data]);
  const options = useMemo(
    () => (bars.data ?? []).filter((b) => b.status === 'APPROVED').map((b) => ({ value: b.id, label: b.name })),
    [bars.data],
  );

  const dirty = !sameOrder(ids, savedIds);
  const notApproved = ids.filter((id) => barById.get(id)?.status !== 'APPROVED');

  const move = (from: number, to: number) =>
    setIds((cur) => {
      const next = [...cur];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x!);
      return next;
    });

  const save = async () => {
    const body: UpdateHomePopularBody = { bar_ids: ids };
    await act
      .mutateAsync({ ...homePopularAction(body), success: 'บันทึกร้านยอดนิยมแล้ว' })      .catch(() => undefined); // useAdminAction แจ้งเหตุผลแล้ว
  };

  return (
    <Card
      title="ร้านยอดนิยม"
      loading={pinned.isLoading}
      extra={
        <Button
          type="primary"
          loading={act.isPending}
          disabled={!dirty || notApproved.length > 0}
          onClick={() => void save()}
        >
          บันทึกร้าน
        </Button>
      }
    >
      <SectionHeadingForm
        content={content}
        fields={{ eyebrow: 'popular_eyebrow', title: 'popular_title' }}
        placeholders={{ eyebrow: 'คะแนนรีวิวสูงสุด', title: 'ร้านยอดนิยม' }}
      />

      <p className="mb-3 text-sm opacity-70">
        เลือกร้านที่จะขึ้นก่อนได้สูงสุด {HOME_POPULAR_MAX} ร้าน ช่องที่ว่างจะเติมด้วยร้านคะแนนรีวิวสูงสุดให้เอง
      </p>
      <Select
        mode="multiple"
        showSearch={{ optionFilterProp: 'label' }}
        maxCount={HOME_POPULAR_MAX}
        loading={bars.isLoading}
        options={options}
        value={ids}
        onChange={setIds}
        placeholder="ค้นหาชื่อร้าน (เฉพาะร้านที่อนุมัติแล้ว)"
        // รายการที่เลือกแสดงด้านล่างพร้อมปุ่มเรียง — ในช่องแสดงแค่จำนวน
        maxTagCount={0}
        maxTagPlaceholder={() => `เลือกแล้ว ${ids.length}/${HOME_POPULAR_MAX} ร้าน`}
        className="mb-4 w-full"
        aria-label="เลือกร้านยอดนิยม"
      />

      {ids.length === 0 ? (
        <Typography.Text type="secondary">ยังไม่ได้ปักร้าน — หน้าแรกเรียงตามคะแนนรีวิวทั้ง {HOME_POPULAR_MAX} ช่อง</Typography.Text>
      ) : (
        <ol className="m-0 list-none space-y-2 p-0">
          {ids.map((id, i) => {
            const bar = barById.get(id);
            const name = bar?.name ?? 'ร้านที่ไม่พบแล้ว';
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-lg border border-solid border-black/10 px-3 py-2 dark:border-white/10"
              >
                <span className="w-6 text-center font-semibold tabular-nums opacity-60">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {bar?.status !== 'APPROVED' && <Tag color="error">ไม่แสดงบนเว็บ — เอาออกก่อนบันทึก</Tag>}
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowUp size={16} />}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  aria-label={`เลื่อน ${name} ขึ้น`}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDown size={16} />}
                  disabled={i === ids.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={`เลื่อน ${name} ลง`}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<X size={16} />}
                  onClick={() => setIds((cur) => cur.filter((x) => x !== id))}
                  aria-label={`เอา ${name} ออก`}
                />
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
