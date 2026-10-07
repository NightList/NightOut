import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical } from '@phosphor-icons/react';
import { Button } from 'antd';
import { createContext, useContext, useMemo, type CSSProperties, type HTMLAttributes } from 'react';

/**
 * แถวตารางที่ลากเรียงได้ (dnd-kit ตาม demo "Drag sorting with handler" ของ antd)
 * ใช้คู่กับ <Table components={{ body: { row: SortableRow } }}> ใน DndContext + SortableContext
 * ลากได้เฉพาะที่ปุ่มจับ (<DragHandle />) — คลิกส่วนอื่นของแถว (สวิตช์ ปุ่มแก้) ไม่ติดลาก
 */

interface RowContextValue {
  setActivatorNodeRef?: (el: HTMLElement | null) => void;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  disabled?: boolean;
}

const RowContext = createContext<RowContextValue>({});

/** ปุ่มจับลาก — เมาส์/นิ้ว ลากได้เลย · คีย์บอร์ด: Tab มาที่ปุ่ม → Space ยก → ลูกศรขึ้น/ลง → Space วาง (Esc ยกเลิก) */
export function DragHandle({ label }: { label: string }) {
  const { setActivatorNodeRef, attributes, listeners, disabled } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      ref={setActivatorNodeRef}
      icon={<DotsSixVertical size={18} weight="bold" />}
      aria-label={label}
      disabled={disabled}
      className="!cursor-grab touch-none active:!cursor-grabbing"
      {...attributes}
      {...listeners}
    />
  );
}

type RowProps = HTMLAttributes<HTMLTableRowElement> & { 'data-row-key': string };

/** ตั้ง disabled ผ่าน SortableDisabledContext (เช่นระหว่างบันทึกลำดับ หรือผู้ใช้ไม่มีสิทธิ์) */
export const SortableDisabledContext = createContext(false);

export function SortableRow(props: RowProps) {
  // แถวที่ไม่มี key (เช่นแถว "ยังไม่มีทีมงาน") ไม่ต้องลาก
  return props['data-row-key'] ? <SortableRowInner {...props} /> : <tr {...props} />;
}

function SortableRowInner(props: RowProps) {
  const disabled = useContext(SortableDisabledContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props['data-row-key'], disabled });

  const style: CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging
      ? { position: 'relative', zIndex: 10, boxShadow: 'var(--ant-box-shadow-secondary)' }
      : {}),
  };
  const ctx = useMemo(
    () => ({ setActivatorNodeRef, attributes, listeners, disabled }),
    [setActivatorNodeRef, attributes, listeners, disabled],
  );

  return (
    <RowContext.Provider value={ctx}>
      <tr {...props} ref={setNodeRef} style={style} />
    </RowContext.Provider>
  );
}
