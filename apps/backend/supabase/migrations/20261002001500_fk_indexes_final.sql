-- =====================================================================
-- NightOut · ปิดท้าย — index บน FK ทุกตัวที่ยังไม่มี (ข้อ 3.4.1) · เปิด RLS ตารางเฟส 2 · ห้ามเขียนจากหน้าบ้าน
-- รายการ index สร้างจาก catalog (FK ที่ยังไม่มี index นำหน้าด้วยคอลัมน์เดียวกัน)
-- migration ใหม่ในอนาคต: เพิ่ม index ให้ FK ที่สร้าง + enable RLS + revoke write เหมือนไฟล์นี้
-- =====================================================================
set search_path = public, extensions;

create index if not exists bar_credit_ledger_bar_id_fk on public.bar_credit_ledger (bar_id);
create index if not exists bar_credit_ledger_created_by_fk on public.bar_credit_ledger (created_by);
create index if not exists bar_credit_ledger_deposit_id_fk on public.bar_credit_ledger (deposit_id);
create index if not exists bar_fees_bar_id_fk on public.bar_fees (bar_id);
create index if not exists bar_links_bar_id_fk on public.bar_links (bar_id);
create index if not exists bar_media_bar_id_fk on public.bar_media (bar_id);
create index if not exists bar_payout_accounts_verified_by_fk on public.bar_payout_accounts (verified_by);
create index if not exists bar_payouts_bar_id_fk on public.bar_payouts (bar_id);
create index if not exists bar_payouts_paid_by_fk on public.bar_payouts (paid_by);
create index if not exists bar_payouts_payout_account_id_fk on public.bar_payouts (payout_account_id);
create index if not exists bar_promotions_moderated_by_fk on public.bar_promotions (moderated_by);
create index if not exists bar_safety_features_feature_key_fk on public.bar_safety_features (feature_key);
create index if not exists bar_safety_features_verified_by_fk on public.bar_safety_features (verified_by);
create index if not exists bar_staff_invited_by_fk on public.bar_staff (invited_by);
create index if not exists bar_styles_style_id_fk on public.bar_styles (style_id);
create index if not exists bar_verifications_bar_id_fk on public.bar_verifications (bar_id);
create index if not exists bar_verifications_reviewed_by_fk on public.bar_verifications (reviewed_by);
create index if not exists bars_district_id_fk on public.bars (district_id);
create index if not exists bars_owner_id_fk on public.bars (owner_id);
create index if not exists billing_events_booking_id_bar_id_fk on public.billing_events (booking_id, bar_id);
create index if not exists billing_events_commission_rule_id_fk on public.billing_events (commission_rule_id);
create index if not exists billing_events_invoice_id_fk on public.billing_events (invoice_id);
create index if not exists booking_package_snapshots_package_id_fk on public.booking_package_snapshots (package_id);
create index if not exists booking_promotions_promotion_id_fk on public.booking_promotions (promotion_id);
create index if not exists booking_qr_tokens_booking_id_fk on public.booking_qr_tokens (booking_id);
create index if not exists booking_share_joins_user_id_fk on public.booking_share_joins (user_id);
create index if not exists booking_shares_booking_id_fk on public.booking_shares (booking_id);
create index if not exists booking_status_history_changed_by_fk on public.booking_status_history (changed_by);
create index if not exists bookings_table_id_zone_id_fk on public.bookings (table_id, zone_id);
create index if not exists bookings_zone_id_bar_id_fk on public.bookings (zone_id, bar_id);
create index if not exists checkins_checked_in_by_fk on public.checkins (checked_in_by);
create index if not exists checkins_qr_token_id_fk on public.checkins (qr_token_id);
create index if not exists checkins_table_id_fk on public.checkins (table_id);
create index if not exists commission_rules_created_by_fk on public.commission_rules (created_by);
create index if not exists crowd_status_logs_updated_by_fk on public.crowd_status_logs (updated_by);
create index if not exists deposits_booking_id_bar_id_fk on public.deposits (booking_id, bar_id);
create index if not exists deposits_payout_id_fk on public.deposits (payout_id);
create index if not exists deposits_verified_by_fk on public.deposits (verified_by);
create index if not exists editor_picks_bar_id_fk on public.editor_picks (bar_id);
create index if not exists editor_picks_pinned_by_fk on public.editor_picks (pinned_by);
create index if not exists favorites_bar_id_fk on public.favorites (bar_id);
create index if not exists menu_categories_bar_id_fk on public.menu_categories (bar_id);
create index if not exists menu_items_category_id_fk on public.menu_items (category_id);
create index if not exists notifications_bar_id_fk on public.notifications (bar_id);
create index if not exists notifications_booking_id_fk on public.notifications (booking_id);
create index if not exists platform_settings_updated_by_fk on public.platform_settings (updated_by);
create index if not exists price_package_items_menu_item_id_fk on public.price_package_items (menu_item_id);
create index if not exists price_package_items_package_id_fk on public.price_package_items (package_id);
create index if not exists price_packages_bar_id_fk on public.price_packages (bar_id);
create index if not exists promoted_listing_payments_promoted_listing_id_fk on public.promoted_listing_payments (promoted_listing_id);
create index if not exists promoted_listing_payments_verified_by_fk on public.promoted_listing_payments (verified_by);
create index if not exists promoted_listings_approved_by_fk on public.promoted_listings (approved_by);
create index if not exists promoted_listings_bar_id_fk on public.promoted_listings (bar_id);
create index if not exists promoted_listings_district_id_fk on public.promoted_listings (district_id);
create index if not exists promoted_listings_package_id_fk on public.promoted_listings (package_id);
create index if not exists review_media_review_id_fk on public.review_media (review_id);
create index if not exists review_moderation_logs_admin_id_fk on public.review_moderation_logs (admin_id);
create index if not exists review_moderation_logs_review_id_fk on public.review_moderation_logs (review_id);
create index if not exists review_reports_reporter_id_fk on public.review_reports (reporter_id);
create index if not exists reviews_booking_id_bar_id_fk on public.reviews (booking_id, bar_id);
create index if not exists reviews_user_id_fk on public.reviews (user_id);
create index if not exists safety_reports_bar_id_fk on public.safety_reports (bar_id);
create index if not exists safety_reports_feature_key_fk on public.safety_reports (feature_key);
create index if not exists safety_reports_resolved_by_fk on public.safety_reports (resolved_by);
create index if not exists safety_reports_user_id_fk on public.safety_reports (user_id);
create index if not exists table_zones_bar_id_fk on public.table_zones (bar_id);
create index if not exists tier_scores_district_id_fk on public.tier_scores (district_id);

-- เปิด RLS ทุกตาราง (รวมตารางเฟส 2)
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- การเขียนทั้งหมดผ่าน NestJS (service role) — หน้าบ้านอ่านอย่างเดียว
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
