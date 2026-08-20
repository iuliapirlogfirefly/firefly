export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string;
          display_name: string | null;
          avatar_url: string | null;
          preferred_locale: string;
          newsletter_opt_in: boolean;
          is_suspended: boolean;
          suspended_at: string | null;
          nearby_events_opt_in: boolean;
          nearby_lat: number | null;
          nearby_lng: number | null;
          nearby_radius_km: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_locale?: string;
          newsletter_opt_in?: boolean;
          is_suspended?: boolean;
          suspended_at?: string | null;
          nearby_events_opt_in?: boolean;
          nearby_lat?: number | null;
          nearby_lng?: number | null;
          nearby_radius_km?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_locale?: string;
          newsletter_opt_in?: boolean;
          is_suspended?: boolean;
          suspended_at?: string | null;
          nearby_events_opt_in?: boolean;
          nearby_lat?: number | null;
          nearby_lng?: number | null;
          nearby_radius_km?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_accounts: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          status: string;
          name: string;
          legal_name: string | null;
          cui: string | null;
          billing_address: string | null;
          billing_city: string | null;
          billing_county: string | null;
          billing_postal_code: string | null;
          billing_country: string;
          stripe_customer_id: string | null;
          rejection_reason: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          status?: string;
          name: string;
          legal_name?: string | null;
          cui?: string | null;
          billing_address?: string | null;
          billing_city?: string | null;
          billing_county?: string | null;
          billing_postal_code?: string | null;
          billing_country?: string;
          stripe_customer_id?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          type?: string;
          status?: string;
          name?: string;
          legal_name?: string | null;
          cui?: string | null;
          billing_address?: string | null;
          billing_city?: string | null;
          billing_county?: string | null;
          billing_postal_code?: string | null;
          billing_country?: string;
          stripe_customer_id?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          business_account_id: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          translations: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_account_id: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          translations?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_account_id?: string;
          name?: string;
          address?: string;
          lat?: number;
          lng?: number;
          translations?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          business_account_id: string | null;
          venue_id: string | null;
          slug: string;
          status: string;
          source: string;
          starts_at: string;
          ends_at: string | null;
          genre: string;
          event_type: string;
          price: number | null;
          ticket_url: string | null;
          website_url: string | null;
          special_guest: string | null;
          cover_image_url: string | null;
          images: string[];
          translations: Json;
          is_promoted: boolean;
          promotion_intensity: number;
          rejection_reason: string | null;
          lat: number;
          lng: number;
          address: string | null;
          venue_name: string | null;
          search_vector: unknown;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_account_id?: string | null;
          venue_id?: string | null;
          slug: string;
          status?: string;
          source?: string;
          starts_at: string;
          ends_at?: string | null;
          genre: string;
          event_type: string;
          price?: number | null;
          ticket_url?: string | null;
          website_url?: string | null;
          special_guest?: string | null;
          cover_image_url?: string | null;
          images?: string[];
          translations?: Json;
          is_promoted?: boolean;
          promotion_intensity?: number;
          rejection_reason?: string | null;
          lat: number;
          lng: number;
          address?: string | null;
          venue_name?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_account_id?: string | null;
          venue_id?: string | null;
          slug?: string;
          status?: string;
          source?: string;
          starts_at?: string;
          ends_at?: string | null;
          genre?: string;
          event_type?: string;
          price?: number | null;
          ticket_url?: string | null;
          website_url?: string | null;
          special_guest?: string | null;
          cover_image_url?: string | null;
          images?: string[];
          translations?: Json;
          is_promoted?: boolean;
          promotion_intensity?: number;
          rejection_reason?: string | null;
          lat?: number;
          lng?: number;
          address?: string | null;
          venue_name?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_saves: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      event_reminders: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          remind_at: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          remind_at: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          remind_at?: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      nearby_event_notifications: {
        Row: {
          user_id: string;
          event_id: string;
          sent_at: string;
        };
        Insert: {
          user_id: string;
          event_id: string;
          sent_at?: string;
        };
        Update: {
          user_id?: string;
          event_id?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          business_account_id: string;
          profile_id: string;
          subject: string;
          body: string;
          status: string;
          created_at: string;
          read_at: string | null;
          read_by: string | null;
        };
        Insert: {
          id?: string;
          business_account_id: string;
          profile_id: string;
          subject: string;
          body: string;
          status?: string;
          created_at?: string;
          read_at?: string | null;
          read_by?: string | null;
        };
        Update: {
          id?: string;
          business_account_id?: string;
          profile_id?: string;
          subject?: string;
          body?: string;
          status?: string;
          created_at?: string;
          read_at?: string | null;
          read_by?: string | null;
        };
        Relationships: [];
      };
      feed_posts: {
        Row: {
          id: string;
          business_account_id: string | null;
          category: string;
          status: string;
          translations: Json;
          media_url: string | null;
          published_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_account_id?: string | null;
          category: string;
          status?: string;
          translations?: Json;
          media_url?: string | null;
          published_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_account_id?: string | null;
          category?: string;
          status?: string;
          translations?: Json;
          media_url?: string | null;
          published_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      promotions: {
        Row: {
          id: string;
          business_account_id: string;
          type: string;
          target_id: string;
          expires_at: string;
          stripe_payment_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_account_id: string;
          type: string;
          target_id: string;
          expires_at: string;
          stripe_payment_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_account_id?: string;
          type?: string;
          target_id?: string;
          expires_at?: string;
          stripe_payment_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          business_account_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string;
          status: string;
          billing_type: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          terms_accepted_at: string | null;
          quota_promoted_events: number;
          quota_feed_posts: number;
          quota_newsletters: number;
          quota_social_posts: number;
          used_promoted_events: number;
          used_feed_posts: number;
          used_newsletters: number;
          used_social_posts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_account_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id: string;
          status?: string;
          billing_type?: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          terms_accepted_at?: string | null;
          quota_promoted_events?: number;
          quota_feed_posts?: number;
          quota_newsletters?: number;
          quota_social_posts?: number;
          used_promoted_events?: number;
          used_feed_posts?: number;
          used_newsletters?: number;
          used_social_posts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_account_id?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string;
          status?: string;
          billing_type?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          terms_accepted_at?: string | null;
          quota_promoted_events?: number;
          quota_feed_posts?: number;
          quota_newsletters?: number;
          quota_social_posts?: number;
          used_promoted_events?: number;
          used_feed_posts?: number;
          used_newsletters?: number;
          used_social_posts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          type: string;
          entity_type: string;
          entity_id: string;
          user_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          entity_type: string;
          entity_id: string;
          user_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          entity_type?: string;
          entity_id?: string;
          user_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          processed_at: string;
        };
        Insert: {
          id?: string;
          stripe_event_id: string;
          processed_at?: string;
        };
        Update: {
          id?: string;
          stripe_event_id?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      event_duplicate_dismissals: {
        Row: {
          id: string;
          event_id_a: string;
          event_id_b: string;
          dismissed_by: string | null;
          dismissed_at: string;
        };
        Insert: {
          id?: string;
          event_id_a: string;
          event_id_b: string;
          dismissed_by?: string | null;
          dismissed_at?: string;
        };
        Update: {
          id?: string;
          event_id_a?: string;
          event_id_b?: string;
          dismissed_by?: string | null;
          dismissed_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          business_account_id: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          type: string;
          product_type: string;
          amount_cents: number;
          currency: string;
          status: string;
          paid_at: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_account_id: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          type: string;
          product_type: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          paid_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_account_id?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          type?: string;
          product_type?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          paid_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
    Functions: {
      events_within_distance: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_distance_km: number;
        };
        Returns: Database["public"]["Tables"]["events"]["Row"][];
      };
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
