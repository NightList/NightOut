import { Tooltip } from 'antd';
import type { Db } from '@nightout/types';
import { teamContactLinks } from '../utils/teamContacts';

/** ช่องทางติดต่อของทีมงาน — ไอคอนวงกลม 44px อย่างเดียว (ชื่อช่องทางอยู่ใน Tooltip + aria-label) · ไม่มีเลย → ไม่แสดงอะไร */
export function TeamContactLinks({ contacts }: { contacts: Db.TeamContacts | null | undefined }) {
  const links = teamContactLinks(contacts);
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2.5">
      {links.map(({ key, label, href, icon: Icon, external }) => (
        <li key={key}>
          <Tooltip title={label}>
            <a
              href={href}
              aria-label={label}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="team-contact grid size-11 place-items-center rounded-full"
            >
              <Icon weight="regular" className="size-5" aria-hidden="true" />
            </a>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
