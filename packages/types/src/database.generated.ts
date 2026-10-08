export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          ip_hash: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          ip_hash?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_phones: {
        Row: {
          banned_by: string | null
          created_at: string
          phone_e164: string
          reason: string
          user_id: string | null
        }
        Insert: {
          banned_by?: string | null
          created_at?: string
          phone_e164: string
          reason: string
          user_id?: string | null
        }
        Update: {
          banned_by?: string | null
          created_at?: string
          phone_e164?: string
          reason?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banned_phones_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banned_phones_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banned_phones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banned_phones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_booking_settings: {
        Row: {
          bar_id: string
          created_at: string
          deposit_amount: number
          deposit_policy: string | null
          deposit_timeout_minutes: number
          deposit_unit: Database["public"]["Enums"]["deposit_unit"]
          grace_minutes: number
          max_advance_days: number
          max_pax_per_booking: number
          min_advance_minutes: number
          pending_timeout_minutes: number
          refund_before_hours: number
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          deposit_amount?: number
          deposit_policy?: string | null
          deposit_timeout_minutes?: number
          deposit_unit?: Database["public"]["Enums"]["deposit_unit"]
          grace_minutes?: number
          max_advance_days?: number
          max_pax_per_booking?: number
          min_advance_minutes?: number
          pending_timeout_minutes?: number
          refund_before_hours?: number
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          deposit_amount?: number
          deposit_policy?: string | null
          deposit_timeout_minutes?: number
          deposit_unit?: Database["public"]["Enums"]["deposit_unit"]
          grace_minutes?: number
          max_advance_days?: number
          max_pax_per_booking?: number
          min_advance_minutes?: number
          pending_timeout_minutes?: number
          refund_before_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_booking_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_booking_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_booking_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_booking_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_booking_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_booking_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_booking_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_credit_ledger: {
        Row: {
          amount: number
          bar_id: string
          created_at: string
          created_by: string | null
          deposit_id: string | null
          id: string
          note: string | null
          reason: Database["public"]["Enums"]["credit_reason"]
          updated_at: string
        }
        Insert: {
          amount: number
          bar_id: string
          created_at?: string
          created_by?: string | null
          deposit_id?: string | null
          id?: string
          note?: string | null
          reason: Database["public"]["Enums"]["credit_reason"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bar_id?: string
          created_at?: string
          created_by?: string | null
          deposit_id?: string | null
          id?: string
          note?: string | null
          reason?: Database["public"]["Enums"]["credit_reason"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "admin_deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_fees: {
        Row: {
          active: boolean
          apply_order: number
          bar_id: string
          calc: Database["public"]["Enums"]["fee_calc"]
          created_at: string
          fee_type: Database["public"]["Enums"]["fee_type"]
          id: string
          label: string
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          apply_order?: number
          bar_id: string
          calc: Database["public"]["Enums"]["fee_calc"]
          created_at?: string
          fee_type: Database["public"]["Enums"]["fee_type"]
          id?: string
          label: string
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          apply_order?: number
          bar_id?: string
          calc?: Database["public"]["Enums"]["fee_calc"]
          created_at?: string
          fee_type?: Database["public"]["Enums"]["fee_type"]
          id?: string
          label?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "bar_fees_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_fees_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_fees_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_fees_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_fees_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_fees_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_fees_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_hours: {
        Row: {
          bar_id: string
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          bar_id: string
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          bar_id?: string
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_links: {
        Row: {
          bar_id: string
          created_at: string
          id: string
          sort_order: number
          type: Database["public"]["Enums"]["link_type"]
          updated_at: string
          url: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: string
          sort_order?: number
          type: Database["public"]["Enums"]["link_type"]
          updated_at?: string
          url: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["link_type"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_links_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_links_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_links_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_links_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_links_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_links_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_links_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_live_status: {
        Row: {
          bar_id: string
          created_at: string
          crowd_updated_at: string | null
          current_crowd: Database["public"]["Enums"]["crowd_status"] | null
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          crowd_updated_at?: string | null
          current_crowd?: Database["public"]["Enums"]["crowd_status"] | null
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          crowd_updated_at?: string | null
          current_crowd?: Database["public"]["Enums"]["crowd_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_live_status_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_live_status_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_live_status_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_live_status_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_live_status_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_live_status_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_live_status_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_media: {
        Row: {
          bar_id: string
          caption: string | null
          created_at: string
          duration_sec: number | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          sort_order: number
          storage_path: string
          updated_at: string
          width: number | null
        }
        Insert: {
          bar_id: string
          caption?: string | null
          created_at?: string
          duration_sec?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          storage_path: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          bar_id?: string
          caption?: string | null
          created_at?: string
          duration_sec?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          storage_path?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_media_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_media_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_media_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_media_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_media_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_media_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_media_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_payout_accounts: {
        Row: {
          account_name: string
          account_no_enc: string
          account_no_last4: string
          bank_code: string
          bar_id: string
          created_at: string
          id: string
          is_default: boolean
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_name: string
          account_no_enc: string
          account_no_last4: string
          bank_code: string
          bar_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_name?: string
          account_no_enc?: string
          account_no_last4?: string
          bank_code?: string
          bar_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_payout_accounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payout_accounts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_payouts: {
        Row: {
          amount: number
          bar_id: string
          commission_deducted: number
          created_at: string
          id: string
          paid_at: string | null
          paid_by: string | null
          payout_account_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          transfer_ref: string | null
          transfer_slip_path: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bar_id: string
          commission_deducted?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payout_account_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          transfer_ref?: string | null
          transfer_slip_path?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bar_id?: string
          commission_deducted?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payout_account_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          transfer_ref?: string | null
          transfer_slip_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_payouts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_payouts_payout_account_id_fkey"
            columns: ["payout_account_id"]
            isOneToOne: false
            referencedRelation: "bar_payout_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_pr_counts: {
        Row: {
          bar_id: string
          created_at: string
          gender: Database["public"]["Enums"]["pr_gender"]
          pr_count: number
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          gender: Database["public"]["Enums"]["pr_gender"]
          pr_count: number
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          gender?: Database["public"]["Enums"]["pr_gender"]
          pr_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_pr_counts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_pr_counts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_pr_counts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_pr_counts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_pr_counts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_pr_counts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_pr_counts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_promotions: {
        Row: {
          active: boolean
          bar_id: string
          created_at: string
          cutoff_time: string | null
          days_of_week: number[]
          description: string | null
          discount_percent: number | null
          id: string
          max_per_night: number | null
          min_pax: number | null
          moderated_by: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          perk_type: Database["public"]["Enums"]["perk_type"]
          sort_order: number
          title: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          bar_id: string
          created_at?: string
          cutoff_time?: string | null
          days_of_week?: number[]
          description?: string | null
          discount_percent?: number | null
          id?: string
          max_per_night?: number | null
          min_pax?: number | null
          moderated_by?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          perk_type: Database["public"]["Enums"]["perk_type"]
          sort_order?: number
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          bar_id?: string
          created_at?: string
          cutoff_time?: string | null
          days_of_week?: number[]
          description?: string | null
          discount_percent?: number | null
          id?: string
          max_per_night?: number | null
          min_pax?: number | null
          moderated_by?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          perk_type?: Database["public"]["Enums"]["perk_type"]
          sort_order?: number
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_promotions_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_safety_features: {
        Row: {
          bar_id: string
          created_at: string
          evidence_path: string | null
          feature_key: string
          id: string
          note: string | null
          source: Database["public"]["Enums"]["safety_source"]
          updated_at: string
          value: Database["public"]["Enums"]["safety_value"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bar_id: string
          created_at?: string
          evidence_path?: string | null
          feature_key: string
          id?: string
          note?: string | null
          source?: Database["public"]["Enums"]["safety_source"]
          updated_at?: string
          value?: Database["public"]["Enums"]["safety_value"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bar_id?: string
          created_at?: string
          evidence_path?: string | null
          feature_key?: string
          id?: string
          note?: string | null
          source?: Database["public"]["Enums"]["safety_source"]
          updated_at?: string
          value?: Database["public"]["Enums"]["safety_value"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_safety_features_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "safety_features"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "bar_safety_features_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_safety_features_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_special_hours: {
        Row: {
          bar_id: string
          close_time: string | null
          created_at: string
          date: string
          id: string
          is_closed: boolean
          note: string | null
          open_time: string | null
          updated_at: string
        }
        Insert: {
          bar_id: string
          close_time?: string | null
          created_at?: string
          date: string
          id?: string
          is_closed?: boolean
          note?: string | null
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          bar_id?: string
          close_time?: string | null
          created_at?: string
          date?: string
          id?: string
          is_closed?: boolean
          note?: string | null
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_special_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_special_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_special_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_special_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_special_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_special_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_special_hours_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_staff: {
        Row: {
          accepted_at: string | null
          bar_id: string
          created_at: string
          invited_at: string
          invited_by: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["bar_staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          bar_id: string
          created_at?: string
          invited_at?: string
          invited_by?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["bar_staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          bar_id?: string
          created_at?: string
          invited_at?: string
          invited_by?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["bar_staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_staff_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_stats: {
        Row: {
          avg_price_per_person: number | null
          bar_id: string
          checkin_count: number
          created_at: string
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          is_new: boolean
          rating_avg: number | null
          rating_count: number
          safety_score: number | null
          score: number | null
          updated_at: string
        }
        Insert: {
          avg_price_per_person?: number | null
          bar_id: string
          checkin_count?: number
          created_at?: string
          current_stars?: number | null
          current_tier?: Database["public"]["Enums"]["tier_letter"] | null
          is_new?: boolean
          rating_avg?: number | null
          rating_count?: number
          safety_score?: number | null
          score?: number | null
          updated_at?: string
        }
        Update: {
          avg_price_per_person?: number | null
          bar_id?: string
          checkin_count?: number
          created_at?: string
          current_stars?: number | null
          current_tier?: Database["public"]["Enums"]["tier_letter"] | null
          is_new?: boolean
          rating_avg?: number | null
          rating_count?: number
          safety_score?: number | null
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_stats_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_stats_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_stats_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_stats_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_stats_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_stats_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_stats_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_styles: {
        Row: {
          bar_id: string
          created_at: string
          style_id: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          style_id: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_styles_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_styles_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_styles_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_styles_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_styles_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_styles_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_styles_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_styles_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_verifications: {
        Row: {
          bar_id: string
          created_at: string
          document_type: string
          id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          storage_path: string
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          document_type: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          storage_path: string
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          document_type?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_verifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bars: {
        Row: {
          address: string
          approved_at: string | null
          category: Database["public"]["Enums"]["bar_category"]
          cover_image_url: string | null
          cover_style: string | null
          created_at: string
          description: string | null
          district_id: string | null
          id: string
          lat: number
          lng: number
          location: unknown
          name: string
          owner_id: string | null
          perks: string[]
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["bar_status"]
          status_reason: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address: string
          approved_at?: string | null
          category: Database["public"]["Enums"]["bar_category"]
          cover_image_url?: string | null
          cover_style?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          id?: string
          lat: number
          lng: number
          location?: unknown
          name: string
          owner_id?: string | null
          perks?: string[]
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["bar_status"]
          status_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          approved_at?: string | null
          category?: Database["public"]["Enums"]["bar_category"]
          cover_image_url?: string | null
          cover_style?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          id?: string
          lat?: number
          lng?: number
          location?: unknown
          name?: string
          owner_id?: string | null
          perks?: string[]
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["bar_status"]
          status_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bars_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bars_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bars_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount: number
          bar_id: string
          base_amount: number
          booking_id: string
          commission_rule_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["billing_event_type"]
          id: string
          invoice_id: string | null
          period: string
          status: Database["public"]["Enums"]["billing_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          bar_id: string
          base_amount?: number
          booking_id: string
          commission_rule_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["billing_event_type"]
          id?: string
          invoice_id?: string | null
          period: string
          status?: Database["public"]["Enums"]["billing_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bar_id?: string
          base_amount?: number
          booking_id?: string
          commission_rule_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["billing_event_type"]
          id?: string
          invoice_id?: string | null
          period?: string
          status?: Database["public"]["Enums"]["billing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_booking_same_bar"
            columns: ["booking_id", "bar_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id", "bar_id"]
          },
          {
            foreignKeyName: "billing_events_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_deposit_consents: {
        Row: {
          accepted_at: string
          booking_id: string
          deposit_amount: number
          deposit_policy: string | null
          grace_minutes: number
          ip: unknown
          refund_before_hours: number
          terms_text: string
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          booking_id: string
          deposit_amount: number
          deposit_policy?: string | null
          grace_minutes: number
          ip?: unknown
          refund_before_hours: number
          terms_text: string
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          booking_id?: string
          deposit_amount?: number
          deposit_policy?: string | null
          grace_minutes?: number
          ip?: unknown
          refund_before_hours?: number
          terms_text?: string
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_deposit_consents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_deposit_consents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_deposit_consents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_deposit_consents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_deposit_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_deposit_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_package_snapshots: {
        Row: {
          booking_id: string
          created_at: string
          fees: Json
          id: string
          items: Json
          package_id: string | null
          package_name: string
          package_price: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          fees?: Json
          id?: string
          items?: Json
          package_id?: string | null
          package_name: string
          package_price: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          fees?: Json
          id?: string
          items?: Json
          package_id?: string | null
          package_name?: string
          package_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_package_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_package_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_package_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_package_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_package_snapshots_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "price_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_price_snapshots: {
        Row: {
          booking_id: string
          created_at: string
          estimated_total: number
          id: string
          items: Json
          other_fees: Json
          per_person: number
          service_charge_rate: number
          subtotal: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          estimated_total: number
          id?: string
          items?: Json
          other_fees?: Json
          per_person: number
          service_charge_rate?: number
          subtotal: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          estimated_total?: number
          id?: string
          items?: Json
          other_fees?: Json
          per_person?: number
          service_charge_rate?: number
          subtotal?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_price_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_price_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_price_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_price_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_promotions: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          perk_snapshot: Json
          promotion_id: string | null
          redeemed_at: string | null
          title_snapshot: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          perk_snapshot: Json
          promotion_id?: string | null
          redeemed_at?: string | null
          title_snapshot: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          perk_snapshot?: Json
          promotion_id?: string | null
          redeemed_at?: string | null
          title_snapshot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_promotions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_promotions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_promotions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_promotions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_promotions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "admin_bar_promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_promotions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "bar_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_qr_tokens: {
        Row: {
          booking_id: string
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          revoked_at: string | null
          updated_at: string
          used_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          revoked_at?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          revoked_at?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_qr_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_qr_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_qr_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_qr_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_share_joins: {
        Row: {
          created_at: string
          guest_name: string | null
          id: string
          share_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_name?: string | null
          id?: string
          share_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_name?: string | null
          id?: string
          share_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_share_joins_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "booking_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_share_joins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_share_joins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_shares: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          revoked_at: string | null
          share_token: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          share_token?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          share_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_shares_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_shares_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_shares_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_shares_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: number
          reason: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: never
          reason?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: never
          reason?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          auto_cancel_at: string
          bar_id: string
          booking_datetime: string
          cancel_reason: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          code: string
          completed_at: string | null
          confirmed_at: string | null
          contact_phone: string | null
          created_at: string
          customer_note: string | null
          deposit_policy_snapshot: string | null
          deposit_required: number
          expires_at: string | null
          grace_minutes: number
          id: string
          pax: number
          request_pr: Database["public"]["Enums"]["pr_gender"] | null
          reserved_from: string
          reserved_period: unknown
          reserved_until: string
          status: Database["public"]["Enums"]["booking_status"]
          table_id: string | null
          updated_at: string
          user_id: string
          zone_id: string
        }
        Insert: {
          auto_cancel_at: string
          bar_id: string
          booking_datetime: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          code: string
          completed_at?: string | null
          confirmed_at?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_note?: string | null
          deposit_policy_snapshot?: string | null
          deposit_required?: number
          expires_at?: string | null
          grace_minutes: number
          id?: string
          pax: number
          request_pr?: Database["public"]["Enums"]["pr_gender"] | null
          reserved_from: string
          reserved_period?: unknown
          reserved_until: string
          status?: Database["public"]["Enums"]["booking_status"]
          table_id?: string | null
          updated_at?: string
          user_id: string
          zone_id: string
        }
        Update: {
          auto_cancel_at?: string
          bar_id?: string
          booking_datetime?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          code?: string
          completed_at?: string | null
          confirmed_at?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_note?: string | null
          deposit_policy_snapshot?: string | null
          deposit_required?: number
          expires_at?: string | null
          grace_minutes?: number
          id?: string
          pax?: number
          request_pr?: Database["public"]["Enums"]["pr_gender"] | null
          reserved_from?: string
          reserved_period?: unknown
          reserved_until?: string
          status?: Database["public"]["Enums"]["booking_status"]
          table_id?: string | null
          updated_at?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_table_belongs_to_zone"
            columns: ["table_id", "zone_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id", "zone_id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_zone_belongs_to_bar"
            columns: ["zone_id", "bar_id"]
            isOneToOne: false
            referencedRelation: "table_zones"
            referencedColumns: ["id", "bar_id"]
          },
        ]
      }
      checkins: {
        Row: {
          actual_pax: number | null
          actual_spend: number | null
          booking_id: string
          checked_in_at: string
          checked_in_by: string
          created_at: string
          id: string
          id_checked: boolean
          method: Database["public"]["Enums"]["checkin_method"]
          qr_token_id: string | null
          table_id: string | null
          updated_at: string
        }
        Insert: {
          actual_pax?: number | null
          actual_spend?: number | null
          booking_id: string
          checked_in_at?: string
          checked_in_by: string
          created_at?: string
          id?: string
          id_checked?: boolean
          method: Database["public"]["Enums"]["checkin_method"]
          qr_token_id?: string | null
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_pax?: number | null
          actual_spend?: number | null
          booking_id?: string
          checked_in_at?: string
          checked_in_by?: string
          created_at?: string
          id?: string
          id_checked?: boolean
          method?: Database["public"]["Enums"]["checkin_method"]
          qr_token_id?: string | null
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_qr_token_id_fkey"
            columns: ["qr_token_id"]
            isOneToOne: false
            referencedRelation: "booking_qr_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          bar_id: string
          calculation_type: Database["public"]["Enums"]["commission_calc"]
          charge_on_no_show: boolean
          created_at: string
          created_by: string
          effective_from: string
          effective_to: string | null
          id: string
          no_show_rate: number | null
          rate: number
          updated_at: string
        }
        Insert: {
          bar_id: string
          calculation_type: Database["public"]["Enums"]["commission_calc"]
          charge_on_no_show?: boolean
          created_at?: string
          created_by: string
          effective_from: string
          effective_to?: string | null
          id?: string
          no_show_rate?: number | null
          rate: number
          updated_at?: string
        }
        Update: {
          bar_id?: string
          calculation_type?: Database["public"]["Enums"]["commission_calc"]
          charge_on_no_show?: boolean
          created_at?: string
          created_by?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          no_show_rate?: number | null
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crowd_status_logs: {
        Row: {
          bar_id: string
          created_at: string
          id: number
          status: Database["public"]["Enums"]["crowd_status"]
          updated_by: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: never
          status: Database["public"]["Enums"]["crowd_status"]
          updated_by: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: never
          status?: Database["public"]["Enums"]["crowd_status"]
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowd_status_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_status_logs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          bar_id: string
          booking_id: string
          created_at: string
          id: string
          payout_id: string | null
          refund_reason: string | null
          refund_ref: string | null
          refund_requested_at: string | null
          refund_requested_by: string | null
          refunded_at: string | null
          reject_code: string | null
          reject_reason: string | null
          settled_at: string | null
          settlement: Database["public"]["Enums"]["deposit_settlement"]
          slip_amount: number | null
          slip_deleted_at: string | null
          slip_paid_at: string | null
          slip_path: string | null
          slip_ref: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          bar_id: string
          booking_id: string
          created_at?: string
          id?: string
          payout_id?: string | null
          refund_reason?: string | null
          refund_ref?: string | null
          refund_requested_at?: string | null
          refund_requested_by?: string | null
          refunded_at?: string | null
          reject_code?: string | null
          reject_reason?: string | null
          settled_at?: string | null
          settlement?: Database["public"]["Enums"]["deposit_settlement"]
          slip_amount?: number | null
          slip_deleted_at?: string | null
          slip_paid_at?: string | null
          slip_path?: string | null
          slip_ref?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          bar_id?: string
          booking_id?: string
          created_at?: string
          id?: string
          payout_id?: string | null
          refund_reason?: string | null
          refund_ref?: string | null
          refund_requested_at?: string | null
          refund_requested_by?: string | null
          refunded_at?: string | null
          reject_code?: string | null
          reject_reason?: string | null
          settled_at?: string | null
          settlement?: Database["public"]["Enums"]["deposit_settlement"]
          slip_amount?: number | null
          slip_deleted_at?: string | null
          slip_paid_at?: string | null
          slip_path?: string | null
          slip_ref?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_booking_same_bar"
            columns: ["booking_id", "bar_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id", "bar_id"]
          },
          {
            foreignKeyName: "deposits_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "bar_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_refund_requested_by_fkey"
            columns: ["refund_requested_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_refund_requested_by_fkey"
            columns: ["refund_requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name_th: string
          province_th: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name_th: string
          province_th?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name_th?: string
          province_th?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          bar_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      home_categories: {
        Row: {
          badge: string | null
          hint: string
          image_url: string
          link_to: string
          slot: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          hint?: string
          image_url: string
          link_to: string
          slot: string
          sort_order: number
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          hint?: string
          image_url?: string
          link_to?: string
          slot?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_content: {
        Row: {
          categories_eyebrow: string
          categories_title: string
          hero_image_url: string | null
          hero_search_placeholder: string
          hero_subtitle: string
          hero_title_highlight: string
          hero_title_lead: string
          hero_title_tail: string
          id: boolean
          popular_eyebrow: string
          popular_title: string
          updated_at: string
        }
        Insert: {
          categories_eyebrow?: string
          categories_title: string
          hero_image_url?: string | null
          hero_search_placeholder: string
          hero_subtitle?: string
          hero_title_highlight: string
          hero_title_lead: string
          hero_title_tail?: string
          id?: boolean
          popular_eyebrow?: string
          popular_title?: string
          updated_at?: string
        }
        Update: {
          categories_eyebrow?: string
          categories_title?: string
          hero_image_url?: string | null
          hero_search_placeholder?: string
          hero_subtitle?: string
          hero_title_highlight?: string
          hero_title_lead?: string
          hero_title_tail?: string
          id?: boolean
          popular_eyebrow?: string
          popular_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_popular_bars: {
        Row: {
          bar_id: string
          created_at: string
          sort_order: number
        }
        Insert: {
          bar_id: string
          created_at?: string
          sort_order: number
        }
        Update: {
          bar_id?: string
          created_at?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          bar_id: string
          created_at: string
          id: string
          issued_at: string | null
          number: string
          paid_at: string | null
          pdf_path: string | null
          period: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: string
          issued_at?: string | null
          number: string
          paid_at?: string | null
          pdf_path?: string | null
          period: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: string
          issued_at?: string | null
          number?: string
          paid_at?: string | null
          pdf_path?: string | null
          period?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: number
          job: string
          processed: number
          started_at: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: never
          job: string
          processed?: number
          started_at?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: never
          job?: string
          processed?: number
          started_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content_url: string
          created_at: string
          doc_type: Database["public"]["Enums"]["consent_type"]
          id: string
          is_current: boolean
          published_at: string
          updated_at: string
          version: string
        }
        Insert: {
          content_url: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["consent_type"]
          id?: string
          is_current?: boolean
          published_at?: string
          updated_at?: string
          version: string
        }
        Update: {
          content_url?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["consent_type"]
          id?: string
          is_current?: boolean
          published_at?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          bar_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          bar_id: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_available: boolean
          name: string
          price: number
          sort_order: number
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          bar_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_available?: boolean
          name: string
          price: number
          sort_order?: number
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          bar_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_available?: boolean
          name?: string
          price?: number
          sort_order?: number
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          device_label: string | null
          id: string
          line_user_id: string | null
          opted_in_at: string | null
          opted_out_at: string | null
          push_subscription: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          device_label?: string | null
          id?: string
          line_user_id?: string | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          push_subscription?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          device_label?: string | null
          id?: string
          line_user_id?: string | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          push_subscription?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempt_count: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          last_error: string | null
          next_retry_at: string
          notification_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string
          notification_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string
          notification_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          bar_id: string | null
          body: string
          booking_id: string | null
          created_at: string
          dedupe_key: string | null
          event_type: string
          id: string
          payload: Json
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bar_id?: string | null
          body: string
          booking_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_type: string
          id?: string
          payload?: Json
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bar_id?: string | null
          body?: string
          booking_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_type?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_bar_fk"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_bar_fk"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_bar_fk"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_bar_fk"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_bar_fk"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_bar_fk"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_bar_fk"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_package_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          name_snapshot: string
          package_id: string
          quantity: number
          sort_order: number
          unit_price_snapshot: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name_snapshot: string
          package_id: string
          quantity: number
          sort_order?: number
          unit_price_snapshot: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name_snapshot?: string
          package_id?: string
          quantity?: number
          sort_order?: number
          unit_price_snapshot?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_package_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "price_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      price_packages: {
        Row: {
          active: boolean
          bar_id: string
          created_at: string
          description: string | null
          fees_included: boolean
          id: string
          name: string
          pax_max: number
          pax_min: number
          total_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bar_id: string
          created_at?: string
          description?: string | null
          fees_included?: boolean
          id?: string
          name: string
          pax_max: number
          pax_min: number
          total_price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bar_id?: string
          created_at?: string
          description?: string | null
          fees_included?: boolean
          id?: string
          name?: string
          pax_max?: number
          pax_min?: number
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_packages_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_packages_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_packages_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_packages_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_packages_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_packages_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_packages_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      promoted_listing_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          promoted_listing_id: string
          slip_path: string
          slip_ref: string | null
          status: Database["public"]["Enums"]["slip_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          promoted_listing_id: string
          slip_path: string
          slip_ref?: string | null
          status?: Database["public"]["Enums"]["slip_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          promoted_listing_id?: string
          slip_path?: string
          slip_ref?: string | null
          status?: Database["public"]["Enums"]["slip_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoted_listing_payments_promoted_listing_id_fkey"
            columns: ["promoted_listing_id"]
            isOneToOne: false
            referencedRelation: "admin_promoted_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listing_payments_promoted_listing_id_fkey"
            columns: ["promoted_listing_id"]
            isOneToOne: false
            referencedRelation: "promoted_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listing_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listing_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promoted_listing_stats: {
        Row: {
          bookings: number
          clicks: number
          created_at: string
          date: string
          impressions: number
          promoted_listing_id: string
          updated_at: string
        }
        Insert: {
          bookings?: number
          clicks?: number
          created_at?: string
          date: string
          impressions?: number
          promoted_listing_id: string
          updated_at?: string
        }
        Update: {
          bookings?: number
          clicks?: number
          created_at?: string
          date?: string
          impressions?: number
          promoted_listing_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoted_listing_stats_promoted_listing_id_fkey"
            columns: ["promoted_listing_id"]
            isOneToOne: false
            referencedRelation: "admin_promoted_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listing_stats_promoted_listing_id_fkey"
            columns: ["promoted_listing_id"]
            isOneToOne: false
            referencedRelation: "promoted_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      promoted_listings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bar_id: string
          category: Database["public"]["Enums"]["bar_category"] | null
          created_at: string
          creative: Json | null
          district_id: string | null
          ends_at: string
          id: string
          package_id: string
          placement: Database["public"]["Enums"]["promo_placement"]
          price_paid: number
          reject_reason: string | null
          starts_at: string
          status: Database["public"]["Enums"]["promoted_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bar_id: string
          category?: Database["public"]["Enums"]["bar_category"] | null
          created_at?: string
          creative?: Json | null
          district_id?: string | null
          ends_at: string
          id?: string
          package_id: string
          placement: Database["public"]["Enums"]["promo_placement"]
          price_paid: number
          reject_reason?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["promoted_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bar_id?: string
          category?: Database["public"]["Enums"]["bar_category"] | null
          created_at?: string
          creative?: Json | null
          district_id?: string | null
          ends_at?: string
          id?: string
          package_id?: string
          placement?: Database["public"]["Enums"]["promo_placement"]
          price_paid?: number
          reject_reason?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["promoted_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoted_listings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_listings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "promotion_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_packages: {
        Row: {
          active: boolean
          created_at: string
          duration_days: number
          id: string
          max_slots_per_area: number
          name: string
          placement: Database["public"]["Enums"]["promo_placement"]
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_days: number
          id?: string
          max_slots_per_area?: number
          name: string
          placement: Database["public"]["Enums"]["promo_placement"]
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_days?: number
          id?: string
          max_slots_per_area?: number
          name?: string
          placement?: Database["public"]["Enums"]["promo_placement"]
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      review_media: {
        Row: {
          created_at: string
          duration_sec: number | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          review_id: string
          size_bytes: number | null
          sort_order: number
          storage_path: string
          thumb_path: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          review_id: string
          size_bytes?: number | null
          sort_order?: number
          storage_path: string
          thumb_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          review_id?: string
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string
          thumb_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "admin_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "my_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_moderation_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["review_status"] | null
          id: number
          reason: string | null
          review_id: string
          to_status: Database["public"]["Enums"]["review_status"] | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["review_status"] | null
          id?: never
          reason?: string | null
          review_id: string
          to_status?: Database["public"]["Enums"]["review_status"] | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["review_status"] | null
          id?: never
          reason?: string | null
          review_id?: string
          to_status?: Database["public"]["Enums"]["review_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "review_moderation_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_moderation_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_moderation_logs_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "admin_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_moderation_logs_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "my_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_moderation_logs_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_moderation_logs_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string
          reporter_id: string
          review_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reporter_id: string
          review_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "admin_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "my_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          bar_id: string
          booking_id: string
          comment: string | null
          created_at: string
          has_media: boolean
          id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bar_id: string
          booking_id: string
          comment?: string | null
          created_at?: string
          has_media?: boolean
          id?: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bar_id?: string
          booking_id?: string
          comment?: string | null
          created_at?: string
          has_media?: boolean
          id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_same_bar"
            columns: ["booking_id", "bar_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id", "bar_id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          can_enter_backoffice: boolean
          code: Database["public"]["Enums"]["user_role"]
          created_at: string
          label_th: string
          sort_order: number
        }
        Insert: {
          can_enter_backoffice?: boolean
          code: Database["public"]["Enums"]["user_role"]
          created_at?: string
          label_th: string
          sort_order: number
        }
        Update: {
          can_enter_backoffice?: boolean
          code?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          label_th?: string
          sort_order?: number
        }
        Relationships: []
      }
      safety_features: {
        Row: {
          created_at: string
          icon: string
          id: string
          key: string
          name_th: string
          sort_order: number
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          key: string
          name_th: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          key?: string
          name_th?: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      safety_reports: {
        Row: {
          bar_id: string
          booking_id: string
          comment: string | null
          created_at: string
          feature_key: string
          id: string
          is_accurate: boolean
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["safety_report_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bar_id: string
          booking_id: string
          comment?: string | null
          created_at?: string
          feature_key: string
          id?: string
          is_accurate: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["safety_report_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bar_id?: string
          booking_id?: string
          comment?: string | null
          created_at?: string
          feature_key?: string
          id?: string
          is_accurate?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["safety_report_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_reports_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "safety_features"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "safety_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      styles: {
        Row: {
          active: boolean
          created_at: string
          icon: string
          id: string
          key: string
          name_th: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon: string
          id?: string
          key: string
          name_th: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          key?: string
          name_th?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      table_zones: {
        Row: {
          active: boolean
          allow_zone_only_booking: boolean
          bar_id: string
          capacity_pax: number
          created_at: string
          default_duration_minutes: number
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          allow_zone_only_booking?: boolean
          bar_id: string
          capacity_pax: number
          created_at?: string
          default_duration_minutes?: number
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          allow_zone_only_booking?: boolean
          bar_id?: string
          capacity_pax?: number
          created_at?: string
          default_duration_minutes?: number
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_zones_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_zones_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_zones_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_zones_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_zones_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_zones_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_zones_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          seats: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          seats: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          seats?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "table_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean
          bio: string | null
          contacts: Json
          created_at: string
          full_name: string | null
          id: string
          nickname: string
          photo_url: string | null
          roles: string[]
          skills: string[]
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          contacts?: Json
          created_at?: string
          full_name?: string | null
          id?: string
          nickname: string
          photo_url?: string | null
          roles?: string[]
          skills?: string[]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          contacts?: Json
          created_at?: string
          full_name?: string | null
          id?: string
          nickname?: string
          photo_url?: string | null
          roles?: string[]
          skills?: string[]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tier_scores: {
        Row: {
          bar_id: string
          category: Database["public"]["Enums"]["bar_category"]
          checkin_count: number
          checkin_score: number
          computed_at: string
          created_at: string
          district_id: string | null
          id: string
          is_new: boolean
          period_start: string
          period_type: Database["public"]["Enums"]["rank_period"]
          prev_stars: number | null
          price_info_score: number
          rank_in_category: number | null
          rank_in_district: number | null
          review_count: number
          review_score: number
          safety_score: number
          stars: number | null
          tier: Database["public"]["Enums"]["tier_letter"] | null
          total_score: number
          updated_at: string
        }
        Insert: {
          bar_id: string
          category: Database["public"]["Enums"]["bar_category"]
          checkin_count?: number
          checkin_score: number
          computed_at?: string
          created_at?: string
          district_id?: string | null
          id?: string
          is_new: boolean
          period_start: string
          period_type: Database["public"]["Enums"]["rank_period"]
          prev_stars?: number | null
          price_info_score: number
          rank_in_category?: number | null
          rank_in_district?: number | null
          review_count?: number
          review_score: number
          safety_score: number
          stars?: number | null
          tier?: Database["public"]["Enums"]["tier_letter"] | null
          total_score: number
          updated_at?: string
        }
        Update: {
          bar_id?: string
          category?: Database["public"]["Enums"]["bar_category"]
          checkin_count?: number
          checkin_score?: number
          computed_at?: string
          created_at?: string
          district_id?: string | null
          id?: string
          is_new?: boolean
          period_start?: string
          period_type?: Database["public"]["Enums"]["rank_period"]
          prev_stars?: number | null
          price_info_score?: number
          rank_in_category?: number | null
          rank_in_district?: number | null
          review_count?: number
          review_score?: number
          safety_score?: number
          stars?: number | null
          tier?: Database["public"]["Enums"]["tier_letter"] | null
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_scores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_scores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_scores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_scores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_scores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_scores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_scores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_scores_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          granted: boolean
          granted_at: string
          id: string
          ip_hash: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          granted: boolean
          granted_at?: string
          id?: string
          ip_hash?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
          version: string
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_hash?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flags: {
        Row: {
          booking_id: string | null
          cleared_at: string | null
          cleared_by: string | null
          created_at: string
          created_by: string | null
          deposit_id: string | null
          id: string
          kind: string
          note: string | null
          phone_e164: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          created_at?: string
          created_by?: string | null
          deposit_id?: string | null
          id?: string
          kind: string
          note?: string | null
          phone_e164?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          created_at?: string
          created_by?: string | null
          deposit_id?: string | null
          id?: string
          kind?: string
          note?: string | null
          phone_e164?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flags_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "my_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_cleared_by_fkey"
            columns: ["cleared_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_cleared_by_fkey"
            columns: ["cleared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: true
            referencedRelation: "admin_deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: true
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          budget_per_person: number | null
          created_at: string
          preferred_district_ids: string[]
          preferred_style_ids: string[]
          reduced_motion: boolean | null
          theme: Database["public"]["Enums"]["theme_mode"]
          updated_at: string
          user_id: string
          usual_pax: number | null
        }
        Insert: {
          budget_per_person?: number | null
          created_at?: string
          preferred_district_ids?: string[]
          preferred_style_ids?: string[]
          reduced_motion?: boolean | null
          theme?: Database["public"]["Enums"]["theme_mode"]
          updated_at?: string
          user_id: string
          usual_pax?: number | null
        }
        Update: {
          budget_per_person?: number | null
          created_at?: string
          preferred_district_ids?: string[]
          preferred_style_ids?: string[]
          reduced_motion?: boolean | null
          theme?: Database["public"]["Enums"]["theme_mode"]
          updated_at?: string
          user_id?: string
          usual_pax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_verification_method:
            | Database["public"]["Enums"]["age_verification_method"]
            | null
          age_verified: boolean
          age_verified_at: string | null
          anonymized_at: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          birthdate: string
          created_at: string
          deleted_at: string | null
          display_name: string
          email: string
          id: string
          onboarded_at: string | null
          phone_e164: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          age_verification_method?:
            | Database["public"]["Enums"]["age_verification_method"]
            | null
          age_verified?: boolean
          age_verified_at?: string | null
          anonymized_at?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          birthdate: string
          created_at?: string
          deleted_at?: string | null
          display_name: string
          email: string
          id: string
          onboarded_at?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          age_verification_method?:
            | Database["public"]["Enums"]["age_verification_method"]
            | null
          age_verified?: boolean
          age_verified_at?: string | null
          anonymized_at?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          birthdate?: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email?: string
          id?: string
          onboarded_at?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      admin_audit_logs: {
        Row: {
          action: string | null
          actor: Json | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          after: Json | null
          before: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: number | null
        }
        Relationships: []
      }
      admin_bar_promotions: {
        Row: {
          active: boolean | null
          bar: Json | null
          created_at: string | null
          cutoff_time: string | null
          days_of_week: number[] | null
          description: string | null
          id: string | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      admin_bars: {
        Row: {
          address: string | null
          approved_at: string | null
          category: Database["public"]["Enums"]["bar_category"] | null
          checkin_count: number | null
          created_at: string | null
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          district: Json | null
          id: string | null
          is_new: boolean | null
          is_promoted: boolean | null
          name: string | null
          owner: Json | null
          promoted_until: string | null
          rating_avg: number | null
          rating_count: number | null
          safety_score: number | null
          score: number | null
          slug: string | null
          status: Database["public"]["Enums"]["bar_status"] | null
          status_reason: string | null
        }
        Relationships: []
      }
      admin_billing_events: {
        Row: {
          amount: number | null
          bar: Json | null
          base_amount: number | null
          booking_code: string | null
          created_at: string | null
          event_type: Database["public"]["Enums"]["billing_event_type"] | null
          id: string | null
          period: string | null
          status: Database["public"]["Enums"]["billing_status"] | null
        }
        Relationships: []
      }
      admin_bookings: {
        Row: {
          bar: Json | null
          booking_datetime: string | null
          code: string | null
          contact_phone: string | null
          created_at: string | null
          customer: Json | null
          deposit_consent: Json | null
          deposit_required: number | null
          id: string | null
          pax: number | null
          status: Database["public"]["Enums"]["booking_status"] | null
          status_history: Json | null
          table_name: string | null
          zone_name: string | null
        }
        Relationships: []
      }
      admin_deposits: {
        Row: {
          amount: number | null
          bar: Json | null
          booking: Json | null
          created_at: string | null
          customer: Json | null
          customer_banned: boolean | null
          customer_fake_slip_count: number | null
          id: string | null
          payout_account: Json | null
          refund_reason: string | null
          refund_requested_at: string | null
          refund_requested_by_name: string | null
          reject_code: string | null
          reject_reason: string | null
          settled_at: string | null
          settlement: Database["public"]["Enums"]["deposit_settlement"] | null
          slip_path: string | null
          slip_ref: string | null
          status: Database["public"]["Enums"]["deposit_status"] | null
          verified_at: string | null
        }
        Relationships: []
      }
      admin_home_categories: {
        Row: {
          badge: string | null
          hint: string | null
          image_url: string | null
          link_to: string | null
          slot: string | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          hint?: string | null
          image_url?: string | null
          link_to?: string | null
          slot?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          hint?: string | null
          image_url?: string | null
          link_to?: string | null
          slot?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_home_content: {
        Row: {
          categories_eyebrow: string | null
          categories_title: string | null
          hero_image_url: string | null
          hero_search_placeholder: string | null
          hero_subtitle: string | null
          hero_title_highlight: string | null
          hero_title_lead: string | null
          hero_title_tail: string | null
          popular_eyebrow: string | null
          popular_title: string | null
          updated_at: string | null
        }
        Insert: {
          categories_eyebrow?: string | null
          categories_title?: string | null
          hero_image_url?: string | null
          hero_search_placeholder?: string | null
          hero_subtitle?: string | null
          hero_title_highlight?: string | null
          hero_title_lead?: string | null
          hero_title_tail?: string | null
          popular_eyebrow?: string | null
          popular_title?: string | null
          updated_at?: string | null
        }
        Update: {
          categories_eyebrow?: string | null
          categories_title?: string | null
          hero_image_url?: string | null
          hero_search_placeholder?: string | null
          hero_subtitle?: string | null
          hero_title_highlight?: string | null
          hero_title_lead?: string | null
          hero_title_tail?: string | null
          popular_eyebrow?: string | null
          popular_title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_home_popular: {
        Row: {
          bar_id: string | null
          name: string | null
          slug: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["bar_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_promoted_listings: {
        Row: {
          bar: Json | null
          created_at: string | null
          ends_at: string | null
          id: string | null
          latest_payment: Json | null
          package: Json | null
          placement: Database["public"]["Enums"]["promo_placement"] | null
          price_paid: number | null
          reject_reason: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["promoted_status"] | null
        }
        Relationships: []
      }
      admin_reviews: {
        Row: {
          author_name: string | null
          bar: Json | null
          comment: string | null
          created_at: string | null
          id: string | null
          open_report_count: number | null
          rating: number | null
          reports: Json | null
          status: Database["public"]["Enums"]["review_status"] | null
        }
        Relationships: []
      }
      admin_safety_queue: {
        Row: {
          bar: Json | null
          evidence_path: string | null
          feature_key: string | null
          id: string | null
          name_th: string | null
          note: string | null
          open_inaccurate_reports: number | null
          source: Database["public"]["Enums"]["safety_source"] | null
          updated_at: string | null
          value: Database["public"]["Enums"]["safety_value"] | null
          verified_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_safety_features_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "safety_features"
            referencedColumns: ["key"]
          },
        ]
      }
      admin_team_members: {
        Row: {
          active: boolean | null
          bio: string | null
          contacts: Json | null
          created_at: string | null
          full_name: string | null
          id: string | null
          nickname: string | null
          photo_url: string | null
          roles: string[] | null
          skills: string[] | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bio?: string | null
          contacts?: Json | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          nickname?: string | null
          photo_url?: string | null
          roles?: string[] | null
          skills?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bio?: string | null
          contacts?: Json | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          nickname?: string | null
          photo_url?: string | null
          roles?: string[] | null
          skills?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          banned_phones: Json | null
          bars: Json | null
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          fake_slip_count: number | null
          id: string | null
          phone_e164: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_phones?: never
          bars?: never
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          fake_slip_count?: never
          id?: string | null
          phone_e164?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_phones?: never
          bars?: never
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          fake_slip_count?: never
          id?: string | null
          phone_e164?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["code"]
          },
        ]
      }
      bar_cards: {
        Row: {
          avg_price_per_person: number | null
          category: Database["public"]["Enums"]["bar_category"] | null
          checkin_count: number | null
          cover_image_url: string | null
          cover_style: string | null
          crowd_updated_at: string | null
          current_crowd: Database["public"]["Enums"]["crowd_status"] | null
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          district: Json | null
          has_pr: boolean | null
          id: string | null
          is_new: boolean | null
          is_promoted: boolean | null
          lat: number | null
          lng: number | null
          name: string | null
          pr_counts: Json | null
          rating_avg: number | null
          rating_count: number | null
          safety_score: number | null
          score: number | null
          slug: string | null
          styles: Json | null
        }
        Relationships: []
      }
      bar_credit_balance: {
        Row: {
          balance: number | null
          bar_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_credit_ledger_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_detail: {
        Row: {
          address: string | null
          avg_price_per_person: number | null
          booking_settings: Json | null
          category: Database["public"]["Enums"]["bar_category"] | null
          checkin_count: number | null
          cover_image_url: string | null
          cover_style: string | null
          crowd_updated_at: string | null
          current_crowd: Database["public"]["Enums"]["crowd_status"] | null
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          description: string | null
          district: Json | null
          fees: Json | null
          has_pr: boolean | null
          hours: Json | null
          id: string | null
          is_new: boolean | null
          is_promoted: boolean | null
          lat: number | null
          links: Json | null
          lng: number | null
          media: Json | null
          menu: Json | null
          name: string | null
          packages: Json | null
          perks: string[] | null
          phone: string | null
          pr_counts: Json | null
          promotions: Json | null
          rating_avg: number | null
          rating_count: number | null
          safety: Json | null
          safety_score: number | null
          score: number | null
          slug: string | null
          special_hours: Json | null
          styles: Json | null
          zones: Json | null
        }
        Relationships: []
      }
      booking_detail: {
        Row: {
          auto_cancel_at: string | null
          bar: Json | null
          booking_datetime: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          checkin: Json | null
          code: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_name: string | null
          customer_note: string | null
          deposit: Json | null
          deposit_policy_snapshot: string | null
          deposit_required: number | null
          expires_at: string | null
          grace_minutes: number | null
          has_review: boolean | null
          id: string | null
          is_mine: boolean | null
          package: Json | null
          pax: number | null
          price_estimate: Json | null
          promotion: Json | null
          request_pr: Database["public"]["Enums"]["pr_gender"] | null
          reserved_from: string | null
          reserved_until: string | null
          share_token: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          status_history: Json | null
          table: Json | null
          updated_at: string | null
          user_id: string | null
          zone: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      my_bar_detail: {
        Row: {
          address: string | null
          avg_price_per_person: number | null
          booking_settings: Json | null
          category: Database["public"]["Enums"]["bar_category"] | null
          checkin_count: number | null
          cover_image_url: string | null
          cover_style: string | null
          created_at: string | null
          crowd_updated_at: string | null
          current_crowd: Database["public"]["Enums"]["crowd_status"] | null
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          description: string | null
          district: Json | null
          fees: Json | null
          has_pr: boolean | null
          hours: Json | null
          id: string | null
          is_new: boolean | null
          is_promoted: boolean | null
          lat: number | null
          links: Json | null
          lng: number | null
          menu: Json | null
          name: string | null
          packages: Json | null
          payout_account: Json | null
          perks: string[] | null
          phone: string | null
          pr_counts: Json | null
          promotions: Json | null
          rating_avg: number | null
          rating_count: number | null
          safety: Json | null
          safety_score: number | null
          score: number | null
          slug: string | null
          staff_role: Database["public"]["Enums"]["bar_staff_role"] | null
          status: Database["public"]["Enums"]["bar_status"] | null
          status_reason: string | null
          styles: Json | null
          updated_at: string | null
          zones: Json | null
        }
        Relationships: []
      }
      my_bars: {
        Row: {
          category: Database["public"]["Enums"]["bar_category"] | null
          checkin_count: number | null
          cover_image_url: string | null
          cover_style: string | null
          created_at: string | null
          crowd_updated_at: string | null
          current_crowd: Database["public"]["Enums"]["crowd_status"] | null
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          district: Json | null
          id: string | null
          is_new: boolean | null
          name: string | null
          rating_avg: number | null
          rating_count: number | null
          slug: string | null
          staff_role: Database["public"]["Enums"]["bar_staff_role"] | null
          status: Database["public"]["Enums"]["bar_status"] | null
          status_reason: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      my_bookings: {
        Row: {
          auto_cancel_at: string | null
          bar: Json | null
          booking_datetime: string | null
          code: string | null
          created_at: string | null
          deposit_required: number | null
          expires_at: string | null
          id: string | null
          pax: number | null
          promotion_title: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          table_name: string | null
          updated_at: string | null
          zone_name: string | null
        }
        Relationships: []
      }
      my_favorites: {
        Row: {
          avg_price_per_person: number | null
          category: Database["public"]["Enums"]["bar_category"] | null
          checkin_count: number | null
          cover_image_url: string | null
          cover_style: string | null
          crowd_updated_at: string | null
          current_crowd: Database["public"]["Enums"]["crowd_status"] | null
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          district: Json | null
          favorited_at: string | null
          has_pr: boolean | null
          id: string | null
          is_new: boolean | null
          is_promoted: boolean | null
          lat: number | null
          lng: number | null
          name: string | null
          pr_counts: Json | null
          rating_avg: number | null
          rating_count: number | null
          safety_score: number | null
          score: number | null
          slug: string | null
          styles: Json | null
        }
        Relationships: []
      }
      my_reviews: {
        Row: {
          bar: Json | null
          bar_id: string | null
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          media: Json | null
          rating: number | null
          status: Database["public"]["Enums"]["review_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_same_bar"
            columns: ["booking_id", "bar_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id", "bar_id"]
          },
        ]
      }
      public_home_categories: {
        Row: {
          badge: string | null
          hint: string | null
          image_url: string | null
          link_to: string | null
          slot: string | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          hint?: string | null
          image_url?: string | null
          link_to?: string | null
          slot?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          hint?: string | null
          image_url?: string | null
          link_to?: string | null
          slot?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_home_content: {
        Row: {
          categories_eyebrow: string | null
          categories_title: string | null
          hero_image_url: string | null
          hero_search_placeholder: string | null
          hero_subtitle: string | null
          hero_title_highlight: string | null
          hero_title_lead: string | null
          hero_title_tail: string | null
          popular_eyebrow: string | null
          popular_title: string | null
          updated_at: string | null
        }
        Insert: {
          categories_eyebrow?: string | null
          categories_title?: string | null
          hero_image_url?: string | null
          hero_search_placeholder?: string | null
          hero_subtitle?: string | null
          hero_title_highlight?: string | null
          hero_title_lead?: string | null
          hero_title_tail?: string | null
          popular_eyebrow?: string | null
          popular_title?: string | null
          updated_at?: string | null
        }
        Update: {
          categories_eyebrow?: string | null
          categories_title?: string | null
          hero_image_url?: string | null
          hero_search_placeholder?: string | null
          hero_subtitle?: string | null
          hero_title_highlight?: string | null
          hero_title_lead?: string | null
          hero_title_tail?: string | null
          popular_eyebrow?: string | null
          popular_title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_home_popular: {
        Row: {
          bar_id: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_popular_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      public_reviews: {
        Row: {
          bar_id: string | null
          comment: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          media: Json | null
          rating: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "admin_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bar_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "my_favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      public_team: {
        Row: {
          bio: string | null
          contacts: Json | null
          full_name: string | null
          id: string | null
          nickname: string | null
          photo_url: string | null
          roles: string[] | null
          skills: string[] | null
          sort_order: number | null
        }
        Insert: {
          bio?: string | null
          contacts?: Json | null
          full_name?: string | null
          id?: string | null
          nickname?: string | null
          photo_url?: string | null
          roles?: string[] | null
          skills?: string[] | null
          sort_order?: number | null
        }
        Update: {
          bio?: string | null
          contacts?: Json | null
          full_name?: string | null
          id?: string | null
          nickname?: string | null
          photo_url?: string | null
          roles?: string[] | null
          skills?: string[] | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assert: { Args: { p_actor: string }; Returns: undefined }
      admin_audit: {
        Args: {
          p_action: string
          p_actor: string
          p_after: Json
          p_before: Json
          p_entity: string
          p_id: string
        }
        Returns: undefined
      }
      admin_booking_contact_phone: {
        Args: { p_booking: string }
        Returns: string
      }
      admin_dashboard: {
        Args: never
        Returns: {
          bars_pending: number
          bookings_today: number
          deposits_to_verify: number
          payouts_pending: number
          promo_slips_pending: number
          reviews_reported: number
        }[]
      }
      admin_delete_team_member: {
        Args: { p_actor: string; p_id: string }
        Returns: Json
      }
      admin_delete_user: {
        Args: { p_actor: string; p_user: string }
        Returns: Json
      }
      admin_finish_new_user: {
        Args: {
          p_actor: string
          p_bar?: string
          p_bar_role?: Database["public"]["Enums"]["bar_staff_role"]
          p_role: Database["public"]["Enums"]["user_role"]
          p_user: string
        }
        Returns: Json
      }
      admin_moderate_bar_promotion: {
        Args: {
          p_actor: string
          p_approve: boolean
          p_promotion: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_moderate_review: {
        Args: {
          p_action: string
          p_actor: string
          p_reason?: string
          p_review: string
        }
        Returns: Json
      }
      admin_reorder_team_members: {
        Args: { p_actor: string; p_ids: string[] }
        Returns: Json
      }
      admin_review_deposit: {
        Args: {
          p_actor: string
          p_approve: boolean
          p_deposit: string
          p_reason?: string
          p_reason_code?: string
        }
        Returns: Json
      }
      admin_review_promotion: {
        Args: {
          p_actor: string
          p_approve: boolean
          p_listing: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_save_home_category: {
        Args: { p: Json; p_actor: string; p_slot: string }
        Returns: Json
      }
      admin_save_home_content: {
        Args: { p: Json; p_actor: string }
        Returns: Json
      }
      admin_save_home_popular: {
        Args: { p_actor: string; p_bar_ids: string[] }
        Returns: Json
      }
      admin_save_team_member: {
        Args: { p: Json; p_actor: string; p_id: string }
        Returns: Json
      }
      admin_set_bar_status: {
        Args: {
          p_actor: string
          p_bar: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["bar_status"]
        }
        Returns: Json
      }
      admin_set_user_role: {
        Args: {
          p_actor: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_user: string
        }
        Returns: Json
      }
      admin_settle_deposit: {
        Args: {
          p_actor: string
          p_deposit: string
          p_how: Database["public"]["Enums"]["deposit_settlement"]
        }
        Returns: Json
      }
      admin_unban_user: {
        Args: { p_actor: string; p_reason?: string; p_user: string }
        Returns: Json
      }
      admin_update_user_account: {
        Args: { p: Json; p_actor: string; p_user: string }
        Returns: Json
      }
      admin_verify_safety: {
        Args: { p_actor: string; p_feature: string }
        Returns: Json
      }
      app_add_review: {
        Args: {
          p_actor: string
          p_booking: string
          p_comment: string
          p_media?: Json
          p_rating: number
          p_review_id: string
        }
        Returns: Json
      }
      app_assert_manager: {
        Args: { p_actor: string; p_bar: string }
        Returns: Database["public"]["Enums"]["bar_staff_role"]
      }
      app_assert_user: {
        Args: { p_actor: string }
        Returns: {
          age_verification_method:
            | Database["public"]["Enums"]["age_verification_method"]
            | null
          age_verified: boolean
          age_verified_at: string | null
          anonymized_at: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          birthdate: string
          created_at: string
          deleted_at: string | null
          display_name: string
          email: string
          id: string
          onboarded_at: string | null
          phone_e164: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      app_audit: {
        Args: {
          p_action: string
          p_actor: string
          p_after: Json
          p_entity: string
          p_id: string
        }
        Returns: undefined
      }
      app_cancel_booking: {
        Args: { p_actor: string; p_booking: string; p_reason?: string }
        Returns: Json
      }
      app_check_in: {
        Args: { p_actor: string; p_bar: string; p_code: string }
        Returns: Json
      }
      app_create_booking: {
        Args: {
          p_actor: string
          p_bar: string
          p_consent?: Json
          p_contact_phone?: string
          p_datetime: string
          p_note?: string
          p_pax: number
          p_promotion?: string
          p_zone: string
        }
        Returns: Json
      }
      app_create_booking_core: {
        Args: {
          p_actor: string
          p_bar: string
          p_datetime: string
          p_note?: string
          p_pax: number
          p_promotion?: string
          p_zone: string
        }
        Returns: Json
      }
      app_delete_account: { Args: { p_actor: string }; Returns: Json }
      app_fmt: { Args: { p_at: string }; Returns: string }
      app_invite_staff: {
        Args: {
          p_actor: string
          p_bar: string
          p_email: string
          p_role: Database["public"]["Enums"]["bar_staff_role"]
        }
        Returns: Json
      }
      app_mark_notifications_read: {
        Args: { p_actor: string; p_ids?: string[] }
        Returns: Json
      }
      app_merchant_join: { Args: { p: Json; p_actor: string }; Returns: Json }
      app_notify: {
        Args: {
          p_bar?: string
          p_body: string
          p_booking?: string
          p_dedupe?: string
          p_event: string
          p_link: string
          p_title: string
          p_user: string
        }
        Returns: undefined
      }
      app_notify_admins: {
        Args: {
          p_bar?: string
          p_body: string
          p_booking?: string
          p_event: string
          p_link: string
          p_title: string
        }
        Returns: undefined
      }
      app_notify_team: {
        Args: {
          p_bar: string
          p_body: string
          p_booking?: string
          p_event: string
          p_link: string
          p_title: string
        }
        Returns: undefined
      }
      app_order_promotion: {
        Args: {
          p_actor: string
          p_bar: string
          p_package: string
          p_slip_path: string
        }
        Returns: Json
      }
      app_remove_staff: {
        Args: { p_actor: string; p_bar: string; p_user: string }
        Returns: Json
      }
      app_report_review: {
        Args: {
          p_actor: string
          p_detail?: string
          p_reason: string
          p_review: string
        }
        Returns: Json
      }
      app_respond_invite: {
        Args: { p_accept: boolean; p_actor: string; p_bar: string }
        Returns: Json
      }
      app_set_bar_promotions: {
        Args: { p_actor: string; p_bar: string; p_items: Json }
        Returns: Json
      }
      app_set_crowd: {
        Args: {
          p_actor: string
          p_bar: string
          p_status: Database["public"]["Enums"]["crowd_status"]
        }
        Returns: Json
      }
      app_set_fees: {
        Args: {
          p_actor: string
          p_bar: string
          p_other: number
          p_service_charge: number
          p_vat: number
        }
        Returns: Json
      }
      app_set_menu: {
        Args: { p_actor: string; p_bar: string; p_items: Json }
        Returns: Json
      }
      app_set_payout_account: {
        Args: {
          p_account_name: string
          p_account_no_enc: string
          p_actor: string
          p_bank_code: string
          p_bar: string
          p_last4: string
        }
        Returns: Json
      }
      app_set_safety: {
        Args: {
          p_actor: string
          p_bar: string
          p_key: string
          p_value: Database["public"]["Enums"]["safety_value"]
        }
        Returns: Json
      }
      app_set_safety_evidence: {
        Args: { p_actor: string; p_bar: string; p_key: string; p_path: string }
        Returns: Json
      }
      app_set_zones: {
        Args: { p_actor: string; p_bar: string; p_zones: Json }
        Returns: Json
      }
      app_submit_deposit: {
        Args: {
          p_actor: string
          p_booking: string
          p_slip_path: string
          p_slip_ref?: string
        }
        Returns: Json
      }
      app_team_move_booking: {
        Args: {
          p_actor: string
          p_booking: string
          p_reason?: string
          p_table?: string
          p_zone: string
        }
        Returns: Json
      }
      app_team_refund_deposit: {
        Args: { p_actor: string; p_booking: string; p_reason: string }
        Returns: Json
      }
      app_team_role: {
        Args: { p_actor: string; p_bar: string }
        Returns: Database["public"]["Enums"]["bar_staff_role"]
      }
      app_team_set_booking_status: {
        Args: {
          p_actor: string
          p_booking: string
          p_reason?: string
          p_to: Database["public"]["Enums"]["booking_status"]
        }
        Returns: Json
      }
      app_toggle_favorite: {
        Args: { p_actor: string; p_bar: string }
        Returns: Json
      }
      app_update_bar_info: {
        Args: { p: Json; p_actor: string; p_bar: string }
        Returns: Json
      }
      app_update_booking_settings: {
        Args: { p: Json; p_actor: string; p_bar: string }
        Returns: Json
      }
      app_update_profile: { Args: { p: Json; p_actor: string }; Returns: Json }
      apply_fake_slip_flag: {
        Args: { p_actor: string; p_deposit: string }
        Returns: Json
      }
      assert_keeps_super_admin: { Args: { p_user: string }; Returns: undefined }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      bar_booking_table_options: {
        Args: { p_booking: string }
        Returns: {
          available: boolean
          is_current: boolean
          seats: number
          table_id: string
          table_name: string
          zone_id: string
          zone_name: string
          zone_remaining_pax: number
        }[]
      }
      bar_deposit_ledger: {
        Args: { p_bar: string }
        Returns: {
          amount: number
          booking_code: string
          booking_datetime: string
          booking_id: string
          created_at: string
          customer_name: string
          deposit_id: string
          settled_at: string
          settlement: Database["public"]["Enums"]["deposit_settlement"]
          status: Database["public"]["Enums"]["deposit_status"]
          verified_at: string
        }[]
      }
      bar_is_promoted: { Args: { p_bar: string }; Returns: boolean }
      bar_is_public: { Args: { p_bar: string }; Returns: boolean }
      bar_team: {
        Args: { p_bar: string }
        Returns: {
          accepted_at: string
          display_name: string
          email: string
          invited_at: string
          role: Database["public"]["Enums"]["bar_staff_role"]
          user_id: string
        }[]
      }
      booking_ban_check: {
        Args: { p_phone?: string; p_user: string }
        Returns: undefined
      }
      booking_customer_name: {
        Args: { p_bar: string; p_user: string }
        Returns: string
      }
      booking_deposit_summary: { Args: { p_booking: string }; Returns: Json }
      booking_transition_allowed: {
        Args: {
          f: Database["public"]["Enums"]["booking_status"]
          t: Database["public"]["Enums"]["booking_status"]
        }
        Returns: boolean
      }
      deposit_reject_label: { Args: { p_code: string }; Returns: string }
      get_share_card: {
        Args: { p_token: string }
        Returns: {
          address: string
          bar_name: string
          bar_slug: string
          booking_datetime: string
          going_count: number
          host_first_name: string
          lat: number
          lng: number
          pax: number
          status: Database["public"]["Enums"]["booking_status"]
          zone_name: string
        }[]
      }
      home_category_check: {
        Args: { r: Database["public"]["Tables"]["home_categories"]["Row"] }
        Returns: undefined
      }
      home_content_check: {
        Args: { r: Database["public"]["Tables"]["home_content"]["Row"] }
        Returns: undefined
      }
      home_image_ok: { Args: { u: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_bar_member: { Args: { p_bar: string }; Returns: boolean }
      is_bar_member_path: { Args: { p_folder: string }; Returns: boolean }
      my_invites: {
        Args: never
        Returns: {
          bar_id: string
          bar_name: string
          invited_at: string
          invited_by: string
          role: Database["public"]["Enums"]["bar_staff_role"]
        }[]
      }
      nearby_bars: {
        Args: { p_lat: number; p_lng: number; p_radius_m?: number }
        Returns: {
          avg_price_per_person: number
          category: Database["public"]["Enums"]["bar_category"]
          checkin_count: number
          cover_image_url: string
          cover_style: string
          crowd_updated_at: string
          current_crowd: Database["public"]["Enums"]["crowd_status"]
          current_stars: number
          current_tier: Database["public"]["Enums"]["tier_letter"]
          distance_m: number
          district: Json
          has_pr: boolean
          id: string
          is_new: boolean
          is_promoted: boolean
          lat: number
          lng: number
          name: string
          pr_counts: Json
          rating_avg: number
          rating_count: number
          safety_score: number
          score: number
          slug: string
          styles: Json
        }[]
      }
      recompute_safety_score: { Args: { p_bar: string }; Returns: undefined }
      review_author_name: { Args: { p_user: string }; Returns: string }
      review_media_path_is_public: {
        Args: { p_name: string }
        Returns: boolean
      }
      role_enters_backoffice: {
        Args: { p_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      run_booking_timeouts: { Args: never; Returns: Json }
      run_retention_jobs: { Args: never; Returns: Json }
      search_bars: {
        Args: {
          p_category?: Database["public"]["Enums"]["bar_category"]
          p_district_id?: string
          p_keyword?: string
          p_limit?: number
          p_offset?: number
          p_pr_gender?: Database["public"]["Enums"]["pr_gender"]
          p_style_ids?: string[]
        }
        Returns: {
          avg_price_per_person: number | null
          category: Database["public"]["Enums"]["bar_category"] | null
          checkin_count: number | null
          cover_image_url: string | null
          cover_style: string | null
          crowd_updated_at: string | null
          current_crowd: Database["public"]["Enums"]["crowd_status"] | null
          current_stars: number | null
          current_tier: Database["public"]["Enums"]["tier_letter"] | null
          district: Json | null
          has_pr: boolean | null
          id: string | null
          is_new: boolean | null
          is_promoted: boolean | null
          lat: number | null
          lng: number | null
          name: string | null
          pr_counts: Json | null
          rating_avg: number | null
          rating_count: number | null
          safety_score: number | null
          score: number | null
          slug: string | null
          styles: Json | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bar_cards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      super_admin_assert: { Args: { p_actor: string }; Returns: undefined }
      team_member_check: {
        Args: { r: Database["public"]["Tables"]["team_members"]["Row"] }
        Returns: undefined
      }
      team_member_is_own: {
        Args: { p_actor: string; p_contacts: Json }
        Returns: boolean
      }
      zone_availability: {
        Args: { p_bar: string; p_datetime: string }
        Returns: {
          capacity_pax: number
          free_tables: number
          full: boolean
          remaining_pax: number
          total_tables: number
          zone_id: string
          zone_name: string
        }[]
      }
      zone_remaining_pax: {
        Args: {
          p_exclude?: string
          p_from: string
          p_until: string
          p_zone: string
        }
        Returns: number
      }
    }
    Enums: {
      age_verification_method: "SELF_DECLARED" | "ID_CHECK_AT_VENUE" | "EKYC"
      bar_category: "PUB_BAR" | "CHILL" | "RESTAURANT"
      bar_staff_role: "OWNER" | "MANAGER" | "STAFF"
      bar_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "SUSPENDED"
      billing_event_type: "CHECK_IN" | "NO_SHOW"
      billing_status: "PENDING" | "INVOICED" | "PAID" | "WAIVED"
      booking_status:
        | "PENDING"
        | "AWAITING_DEPOSIT"
        | "DEPOSIT_SUBMITTED"
        | "CONFIRMED"
        | "REJECTED"
        | "CANCELLED_BY_CUSTOMER"
        | "CANCELLED_BY_MERCHANT"
        | "CHECKED_IN"
        | "COMPLETED"
        | "NO_SHOW"
        | "EXPIRED"
      checkin_method: "QR" | "MANUAL"
      commission_calc: "PERCENTAGE" | "FIXED" | "FIXED_PER_PERSON"
      consent_type:
        | "TERMS"
        | "PRIVACY"
        | "COOKIE"
        | "AGE_CONFIRMATION"
        | "LOCATION"
        | "MARKETING"
        | "LINE_NOTIFICATION"
      credit_reason: "DEPOSIT_TO_CREDIT" | "CREDIT_USED" | "ADJUSTMENT"
      crowd_status: "AVAILABLE" | "ALMOST_FULL" | "FULL"
      delivery_status: "QUEUED" | "SENT" | "FAILED" | "RETRYING"
      deposit_settlement:
        | "NONE"
        | "HELD"
        | "PAYOUT_PENDING"
        | "PAID_OUT"
        | "CREDIT"
        | "REFUND_PENDING"
        | "REFUNDED"
      deposit_status: "SUBMITTED" | "VERIFIED" | "REJECTED"
      deposit_unit: "PER_TABLE" | "PER_PERSON"
      fee_calc: "PERCENTAGE" | "FIXED_PER_TABLE" | "FIXED_PER_PERSON"
      fee_type: "SERVICE_CHARGE" | "VAT" | "CORKAGE" | "ENTRY" | "OTHER"
      invoice_status: "DRAFT" | "ISSUED" | "PAID" | "VOID"
      link_type:
        | "INSTAGRAM"
        | "TIKTOK"
        | "FACEBOOK"
        | "LINE_OA"
        | "WEBSITE"
        | "REVIEW_CLIP"
      media_kind: "IMAGE" | "VIDEO"
      moderation_status: "PENDING" | "APPROVED" | "REJECTED"
      notification_channel: "LINE" | "WEB_PUSH" | "IN_APP" | "EMAIL"
      payout_status: "DRAFT" | "PENDING" | "PAID" | "CANCELLED"
      perk_type:
        | "FOOD_DISCOUNT"
        | "FREE_APPETIZER"
        | "FREE_SOFT_DRINK"
        | "WAIVE_ENTRY"
        | "WAIVE_TABLE_FEE"
        | "SPECIAL_ZONE"
        | "OTHER"
      pr_gender: "MALE" | "FEMALE" | "LGBTQ"
      promo_placement: "HOME_BANNER" | "HOME_RECOMMENDED" | "SEARCH_TOP"
      promoted_status:
        | "PENDING_PAYMENT"
        | "PAYMENT_SUBMITTED"
        | "ACTIVE"
        | "EXPIRED"
        | "REJECTED"
        | "CANCELLED"
      rank_period: "WEEKLY" | "MONTHLY"
      report_status: "OPEN" | "ACTIONED" | "DISMISSED"
      review_status: "PUBLISHED" | "HIDDEN" | "REMOVED"
      safety_report_status: "OPEN" | "CONFIRMED" | "DISMISSED"
      safety_source: "SELF_DECLARED" | "ADMIN_VERIFIED"
      safety_value: "YES" | "NO" | "UNKNOWN"
      slip_status: "SUBMITTED" | "VERIFIED" | "REJECTED"
      theme_mode: "LIGHT" | "DARK" | "SYSTEM"
      tier_letter: "S" | "A" | "B" | "C"
      user_role: "CUSTOMER" | "MERCHANT" | "STAFF" | "ADMIN" | "SUPER_ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      age_verification_method: ["SELF_DECLARED", "ID_CHECK_AT_VENUE", "EKYC"],
      bar_category: ["PUB_BAR", "CHILL", "RESTAURANT"],
      bar_staff_role: ["OWNER", "MANAGER", "STAFF"],
      bar_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
      ],
      billing_event_type: ["CHECK_IN", "NO_SHOW"],
      billing_status: ["PENDING", "INVOICED", "PAID", "WAIVED"],
      booking_status: [
        "PENDING",
        "AWAITING_DEPOSIT",
        "DEPOSIT_SUBMITTED",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED_BY_CUSTOMER",
        "CANCELLED_BY_MERCHANT",
        "CHECKED_IN",
        "COMPLETED",
        "NO_SHOW",
        "EXPIRED",
      ],
      checkin_method: ["QR", "MANUAL"],
      commission_calc: ["PERCENTAGE", "FIXED", "FIXED_PER_PERSON"],
      consent_type: [
        "TERMS",
        "PRIVACY",
        "COOKIE",
        "AGE_CONFIRMATION",
        "LOCATION",
        "MARKETING",
        "LINE_NOTIFICATION",
      ],
      credit_reason: ["DEPOSIT_TO_CREDIT", "CREDIT_USED", "ADJUSTMENT"],
      crowd_status: ["AVAILABLE", "ALMOST_FULL", "FULL"],
      delivery_status: ["QUEUED", "SENT", "FAILED", "RETRYING"],
      deposit_settlement: [
        "NONE",
        "HELD",
        "PAYOUT_PENDING",
        "PAID_OUT",
        "CREDIT",
        "REFUND_PENDING",
        "REFUNDED",
      ],
      deposit_status: ["SUBMITTED", "VERIFIED", "REJECTED"],
      deposit_unit: ["PER_TABLE", "PER_PERSON"],
      fee_calc: ["PERCENTAGE", "FIXED_PER_TABLE", "FIXED_PER_PERSON"],
      fee_type: ["SERVICE_CHARGE", "VAT", "CORKAGE", "ENTRY", "OTHER"],
      invoice_status: ["DRAFT", "ISSUED", "PAID", "VOID"],
      link_type: [
        "INSTAGRAM",
        "TIKTOK",
        "FACEBOOK",
        "LINE_OA",
        "WEBSITE",
        "REVIEW_CLIP",
      ],
      media_kind: ["IMAGE", "VIDEO"],
      moderation_status: ["PENDING", "APPROVED", "REJECTED"],
      notification_channel: ["LINE", "WEB_PUSH", "IN_APP", "EMAIL"],
      payout_status: ["DRAFT", "PENDING", "PAID", "CANCELLED"],
      perk_type: [
        "FOOD_DISCOUNT",
        "FREE_APPETIZER",
        "FREE_SOFT_DRINK",
        "WAIVE_ENTRY",
        "WAIVE_TABLE_FEE",
        "SPECIAL_ZONE",
        "OTHER",
      ],
      pr_gender: ["MALE", "FEMALE", "LGBTQ"],
      promo_placement: ["HOME_BANNER", "HOME_RECOMMENDED", "SEARCH_TOP"],
      promoted_status: [
        "PENDING_PAYMENT",
        "PAYMENT_SUBMITTED",
        "ACTIVE",
        "EXPIRED",
        "REJECTED",
        "CANCELLED",
      ],
      rank_period: ["WEEKLY", "MONTHLY"],
      report_status: ["OPEN", "ACTIONED", "DISMISSED"],
      review_status: ["PUBLISHED", "HIDDEN", "REMOVED"],
      safety_report_status: ["OPEN", "CONFIRMED", "DISMISSED"],
      safety_source: ["SELF_DECLARED", "ADMIN_VERIFIED"],
      safety_value: ["YES", "NO", "UNKNOWN"],
      slip_status: ["SUBMITTED", "VERIFIED", "REJECTED"],
      theme_mode: ["LIGHT", "DARK", "SYSTEM"],
      tier_letter: ["S", "A", "B", "C"],
      user_role: ["CUSTOMER", "MERCHANT", "STAFF", "ADMIN", "SUPER_ADMIN"],
    },
  },
} as const
