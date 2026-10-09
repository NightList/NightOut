import type { ReactNode } from 'react';

/** แถวรายการ (ใช้คู่กับ antd <Listy itemRender>) — แทน List.Item.Meta ที่ถูก deprecate */
export function ListRow({
  avatar,
  title,
  description,
  actions,
}: {
  avatar?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="list-row flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      {avatar && <div className="shrink-0 pt-0.5">{avatar}</div>}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm text-muted">{description}</div>}
      </div>
      {actions && (
        <div className="list-row-actions flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
