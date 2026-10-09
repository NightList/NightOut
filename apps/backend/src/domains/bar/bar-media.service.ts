import { Injectable } from '@nestjs/common';
import type * as C from '@nightout/contracts';
import { SupabaseService } from '../../supabase/supabase.service';

const BUCKET = 'bar-media';

/** ผลจากฟังก์ชันเขียนรูปใน DB — `removed_paths` = ไฟล์ที่ไม่มีแถวไหนอ้างแล้ว (ลบจาก Storage แล้วไม่ส่งกลับหน้าเว็บ) */
type WithRemoved<T> = T & { removed_paths?: string[] };

/**
 * รูปร้าน (ปก + แกลเลอรี) และรูปเมนู — ใช้ร่วม merchant + admin controller
 * DB ไม่รู้โดเมน Storage → สร้าง URL ปกที่นี่ · เขียนเสร็จแล้วลบไฟล์ที่ไม่ใช้ออกจาก bucket bar-media
 */
@Injectable()
export class BarMediaService {
  constructor(private readonly db: SupabaseService) {}

  /** rpc app_set_bar_media / admin_set_bar_media */
  async setGallery(
    fn: 'app_set_bar_media' | 'admin_set_bar_media',
    actor: string,
    bar: string,
    b: C.BarMediaBody,
  ): Promise<C.BarMediaResult> {
    const r = await this.db.rpc<WithRemoved<C.BarMediaResult>>(fn, {
      p_actor: actor,
      p_bar: bar,
      p_paths: b.paths,
      p_cover_path: b.cover_path,
      p_cover_url: b.cover_path ? this.db.publicUrl(BUCKET, b.cover_path) : null,
    });
    return this.cleanup(r);
  }

  /** rpc app_set_menu — เมนูทั้งชุด (รูปที่ถูกแทน/ลบ → ลบไฟล์) */
  async setMenu(
    actor: string,
    bar: string,
    b: C.MenuBody,
  ): Promise<{ bar_id: string; count: number }> {
    return this.cleanup(
      await this.db.rpc<WithRemoved<{ bar_id: string; count: number }>>('app_set_menu', {
        p_actor: actor,
        p_bar: bar,
        p_items: b.items,
      }),
    );
  }

  /** rpc admin_set_menu_item_image */
  async setMenuItemImage(
    actor: string,
    item: string,
    b: C.MenuItemImageBody,
  ): Promise<C.MenuItemImageResult> {
    return this.cleanup(
      await this.db.rpc<WithRemoved<C.MenuItemImageResult>>('admin_set_menu_item_image', {
        p_actor: actor,
        p_item: item,
        p_path: b.path,
      }),
    );
  }

  private async cleanup<T extends object>(r: WithRemoved<T>): Promise<T> {
    const { removed_paths = [], ...rest } = r;
    await this.db.removeObjects(BUCKET, removed_paths);
    return rest as T;
  }
}
