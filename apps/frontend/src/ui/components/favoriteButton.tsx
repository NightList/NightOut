import { Heart } from '@phosphor-icons/react';
import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { favorites } from '@/services/data';
import { App, Button } from 'antd';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '@/services/auth';
import { useAuthModal } from './authModal';
import { useDemo } from '@/hooks/useDemo';

/** POST /me/favorites/:barId/toggle — คืน true = เพิ่มเป็นร้านโปรด · backend: domains/account */
const toggleFavorite = async (barId: string) => (await Rest.post<C.ToggleFavoriteResult>(`/me/favorites/${barId}/toggle`)).favorite;

export function FavoriteButton({ barId, className }: { barId: string; className?: string }) {
  useDemo();
  const { user } = useAuth();
  const { message } = App.useApp();
  const { openLogin } = useAuthModal();
  const [busy, setBusy] = useState(false);
  const active = favorites().includes(barId);
  return (
    <Button
      shape="circle"
      className={className}
      aria-label={active ? 'เอาออกจากร้านโปรด' : 'บันทึกเป็นร้านโปรด'}
      aria-pressed={active}
      loading={busy}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return openLogin();
        setBusy(true);
        try {
          const added = await toggleFavorite(barId);
          message.success(added ? 'บันทึกเป็นร้านโปรดแล้ว' : 'เอาออกจากร้านโปรดแล้ว');
        } catch (err) {
          message.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
      icon={
        <motion.span
          key={String(active)}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 0.3 }}
          className="inline-flex"
        >
          <Heart
            weight={active ? 'fill' : 'regular'}
            className={active ? 'text-gold' : undefined}
          />
        </motion.span>
      }
    />
  );
}
