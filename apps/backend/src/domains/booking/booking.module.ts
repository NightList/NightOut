import { Module } from '@nestjs/common';
import { SupabaseJwtGuard } from '../../auth/supabase-jwt.guard';
import { BookingMeController } from './booking.me.controller';
import { BookingMerchantController } from './booking.merchant.controller';
import { BookingPublicController } from './booking.public.controller';

/** โดเมน booking — จอง ยกเลิก สถานะ เช็กอิน ย้ายโต๊ะ โซนว่าง บัตรแชร์ · DB: app_create_booking(_core), app_cancel_booking, app_team_*, app_check_in, zone_availability, bar_booking_table_options, get_share_card */
@Module({ controllers: [BookingPublicController, BookingMeController, BookingMerchantController], providers: [SupabaseJwtGuard] })
export class BookingModule {}
