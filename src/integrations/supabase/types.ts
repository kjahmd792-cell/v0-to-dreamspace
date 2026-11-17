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
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_invites: {
        Row: {
          code_hash: string
          company_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
          role: string
        }
        Insert: {
          code_hash: string
          company_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          role: string
        }
        Update: {
          code_hash?: string
          company_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          role?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      company_orders: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string
          delivery_address: string
          delivery_proof: Json | null
          delivery_status: string | null
          id: string
          invoice_id: string | null
          items: Json
          note: string | null
          order_status: string
          paid_cents: number
          payment_method: string
          payment_status: string
          pharmacy: string
          pharmacy_phone: string
          pharmacy_user_id: string
          recipient_name: string
          region: string
          rejection_reason: string | null
          requested_delivery_window: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string
          delivery_address: string
          delivery_proof?: Json | null
          delivery_status?: string | null
          id: string
          invoice_id?: string | null
          items: Json
          note?: string | null
          order_status?: string
          paid_cents?: number
          payment_method: string
          payment_status?: string
          pharmacy: string
          pharmacy_phone: string
          pharmacy_user_id: string
          recipient_name: string
          region: string
          rejection_reason?: string | null
          requested_delivery_window: string
          total_cents: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          delivery_address?: string
          delivery_proof?: Json | null
          delivery_status?: string | null
          id?: string
          invoice_id?: string | null
          items?: Json
          note?: string | null
          order_status?: string
          paid_cents?: number
          payment_method?: string
          payment_status?: string
          pharmacy?: string
          pharmacy_phone?: string
          pharmacy_user_id?: string
          recipient_name?: string
          region?: string
          rejection_reason?: string | null
          requested_delivery_window?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_pharmacies: {
        Row: {
          company_id: string
          created_at: string
          pharmacy_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          pharmacy_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          pharmacy_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_products: {
        Row: {
          active: boolean
          category: string
          code: string
          company_id: string
          created_at: string
          expiry: string
          id: string
          manufacturer: string
          name: string
          pack: string
          price_cents: number
          reserved: number
          scientific_name: string
          stock: number
          tag: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          company_id: string
          created_at?: string
          expiry: string
          id: string
          manufacturer: string
          name: string
          pack: string
          price_cents: number
          reserved?: number
          scientific_name: string
          stock: number
          tag?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          company_id?: string
          created_at?: string
          expiry?: string
          id?: string
          manufacturer?: string
          name?: string
          pack?: string
          price_cents?: number
          reserved?: number
          scientific_name?: string
          stock?: number
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_stock_movements: {
        Row: {
          changed_by: string
          company_id: string
          created_at: string
          delta: number
          id: string
          product_id: string
          reason: string
        }
        Insert: {
          changed_by: string
          company_id: string
          created_at?: string
          delta: number
          id: string
          product_id: string
          reason: string
        }
        Update: {
          changed_by?: string
          company_id?: string
          created_at?: string
          delta?: number
          id?: string
          product_id?: string
          reason?: string
        }
        Relationships: []
      }
      legacy_user_map: {
        Row: {
          auth_user_id: string | null
          email: string
          imported_at: string
          legacy_user_id: string
          name: string | null
        }
        Insert: {
          auth_user_id?: string | null
          email: string
          imported_at?: string
          legacy_user_id: string
          name?: string | null
        }
        Update: {
          auth_user_id?: string | null
          email?: string
          imported_at?: string
          legacy_user_id?: string
          name?: string | null
        }
        Relationships: []
      }
      pharmacy_catalog_seed: {
        Row: {
          category: string
          code: string
          expiry: string
          id: string
          manufacturer: string
          name: string
          pack: string
          price_cents: number
          scientific_name: string
          sort_order: number
          stock: number
          tag: string | null
        }
        Insert: {
          category: string
          code: string
          expiry: string
          id: string
          manufacturer: string
          name: string
          pack: string
          price_cents: number
          scientific_name: string
          sort_order?: number
          stock: number
          tag?: string | null
        }
        Update: {
          category?: string
          code?: string
          expiry?: string
          id?: string
          manufacturer?: string
          name?: string
          pack?: string
          price_cents?: number
          scientific_name?: string
          sort_order?: number
          stock?: number
          tag?: string | null
        }
        Relationships: []
      }
      pharmacy_orders: {
        Row: {
          assigned_to: string | null
          created_at: string
          delivery_address: string
          delivery_proof: Json | null
          delivery_status: string | null
          id: string
          invoice_id: string | null
          items: Json
          note: string | null
          order_status: string
          paid_cents: number
          payment_method: string
          payment_status: string
          pharmacy: string
          pharmacy_phone: string
          recipient_name: string
          region: string
          rejection_reason: string | null
          requested_delivery_window: string
          total_cents: number
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          delivery_address: string
          delivery_proof?: Json | null
          delivery_status?: string | null
          id: string
          invoice_id?: string | null
          items: Json
          note?: string | null
          order_status?: string
          paid_cents?: number
          payment_method: string
          payment_status?: string
          pharmacy: string
          pharmacy_phone: string
          recipient_name: string
          region: string
          rejection_reason?: string | null
          requested_delivery_window: string
          total_cents: number
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          delivery_address?: string
          delivery_proof?: Json | null
          delivery_status?: string | null
          id?: string
          invoice_id?: string | null
          items?: Json
          note?: string | null
          order_status?: string
          paid_cents?: number
          payment_method?: string
          payment_status?: string
          pharmacy?: string
          pharmacy_phone?: string
          recipient_name?: string
          region?: string
          rejection_reason?: string | null
          requested_delivery_window?: string
          total_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      pharmacy_products: {
        Row: {
          category: string
          code: string
          created_at: string
          expiry: string
          id: string
          manufacturer: string
          name: string
          pack: string
          price_cents: number
          reserved: number
          scientific_name: string
          stock: number
          tag: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          expiry: string
          id: string
          manufacturer: string
          name: string
          pack: string
          price_cents: number
          reserved?: number
          scientific_name: string
          stock: number
          tag?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          expiry?: string
          id?: string
          manufacturer?: string
          name?: string
          pack?: string
          price_cents?: number
          reserved?: number
          scientific_name?: string
          stock?: number
          tag?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pharmacy_profiles: {
        Row: {
          contact_name: string
          created_at: string
          license_number: string
          pharmacy_name: string
          phone: string
          region: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          license_number: string
          pharmacy_name: string
          phone: string
          region: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          license_number?: string
          pharmacy_name?: string
          phone?: string
          region?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_pharmacy_order: { Args: { p_order_id: string }; Returns: Json }
      complete_pharmacy_registration: {
        Args: {
          p_contact_name: string
          p_license_number: string
          p_pharmacy_name: string
          p_phone: string
          p_region: string
        }
        Returns: undefined
      }
      create_pharmacy_order: {
        Args: { p_cart: Json; p_details: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
