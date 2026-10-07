import {
  Armchair,
  BeerStein,
  Buildings,
  Champagne,
  Brandy,
  Crown,
  DiscoBall,
  Fire,
  ForkKnife,
  Heart,
  Martini,
  MicrophoneStage,
  MoonStars,
  MusicNotes,
  Sparkle,
  Tree,
  UsersThree,
  Wine,
  type Icon,
} from '@phosphor-icons/react';

/**
 * ไอคอนของการ์ดหมวดหน้าแรก — key ตรงกับ HOME_CATEGORY_ICON_KEYS ใน @nightout/contracts (site-content)
 * ใช้ทั้งเว็บลูกค้า (การ์ด) และ Backoffice (ตัวเลือกไอคอน) · `label` = ชื่อไทยในตัวเลือก
 */
export const HOME_CATEGORY_ICONS: Record<string, { icon: Icon; label: string }> = {
  crown: { icon: Crown, label: 'มงกุฎ' },
  martini: { icon: Martini, label: 'มาร์ตินี่' },
  'fork-knife': { icon: ForkKnife, label: 'มีด-ส้อม' },
  'music-notes': { icon: MusicNotes, label: 'โน้ตเพลง' },
  buildings: { icon: Buildings, label: 'ตึก' },
  armchair: { icon: Armchair, label: 'โซฟา' },
  tree: { icon: Tree, label: 'ต้นไม้' },
  'disco-ball': { icon: DiscoBall, label: 'ดิสโก้บอล' },
  'beer-stein': { icon: BeerStein, label: 'เบียร์' },
  wine: { icon: Wine, label: 'ไวน์' },
  champagne: { icon: Champagne, label: 'แชมเปญ' },
  'microphone-stage': { icon: MicrophoneStage, label: 'ไมค์' },
  cocktail: { icon: Brandy, label: 'แก้วค็อกเทล' },
  'moon-stars': { icon: MoonStars, label: 'พระจันทร์' },
  fire: { icon: Fire, label: 'ไฟ' },
  heart: { icon: Heart, label: 'หัวใจ' },
  'users-three': { icon: UsersThree, label: 'กลุ่มเพื่อน' },
  sparkle: { icon: Sparkle, label: 'ประกาย' },
};

/** key → ไอคอน (key ที่ไม่รู้จัก → ประกาย) */
export const homeCategoryIcon = (key: string): Icon => HOME_CATEGORY_ICONS[key]?.icon ?? Sparkle;
