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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      copy_subscriptions: {
        Row: {
          allocated_usd: number
          created_at: string
          expert_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allocated_usd: number
          created_at?: string
          expert_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allocated_usd?: number
          created_at?: string
          expert_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_subscriptions_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_traders"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_traders: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          followers: number
          handle: string
          id: string
          min_copy_amount: number
          name: string
          sort_order: number
          specialty: string | null
          total_profit_usd: number
          win_rate: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers?: number
          handle: string
          id?: string
          min_copy_amount?: number
          name: string
          sort_order?: number
          specialty?: string | null
          total_profit_usd?: number
          win_rate?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers?: number
          handle?: string
          id?: string
          min_copy_amount?: number
          name?: string
          sort_order?: number
          specialty?: string | null
          total_profit_usd?: number
          win_rate?: number
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          id: string
          id_back_url: string | null
          id_front_url: string | null
          rejection_reason: string | null
          selfie_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          rejection_reason?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          rejection_reason?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_subscriptions: {
        Row: {
          amount_usd: number
          created_at: string
          ends_at: string | null
          expected_return_usd: number
          id: string
          plan_id: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          ends_at?: string | null
          expected_return_usd: number
          id?: string
          plan_id: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          ends_at?: string | null
          expected_return_usd?: number
          id?: string
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "trading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_level: string
          address: string | null
          avatar_url: string | null
          balance: number
          country: string | null
          created_at: string
          currency: string | null
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          profit: number
          status: string
          total_deposit: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_level?: string
          address?: string | null
          avatar_url?: string | null
          balance?: number
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          profit?: number
          status?: string
          total_deposit?: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_level?: string
          address?: string | null
          avatar_url?: string | null
          balance?: number
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          profit?: number
          status?: string
          total_deposit?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      tesla_cars: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          model: string
          price_usd: number
          range_mi: number | null
          sort_order: number
          tagline: string | null
          top_speed: number | null
          zero_to_sixty: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          model: string
          price_usd: number
          range_mi?: number | null
          sort_order?: number
          tagline?: string | null
          top_speed?: number | null
          zero_to_sixty?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          model?: string
          price_usd?: number
          range_mi?: number | null
          sort_order?: number
          tagline?: string | null
          top_speed?: number | null
          zero_to_sixty?: number | null
        }
        Relationships: []
      }
      tesla_orders: {
        Row: {
          address: string
          amount_usd: number
          buyer_name: string
          car_id: string
          created_at: string
          id: string
          payment_method: string
          phone: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          amount_usd: number
          buyer_name: string
          car_id: string
          created_at?: string
          id?: string
          payment_method: string
          phone: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          amount_usd?: number
          buyer_name?: string
          car_id?: string
          created_at?: string
          id?: string
          payment_method?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tesla_orders_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "tesla_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_plans: {
        Row: {
          badge: string | null
          created_at: string
          duration_days: number
          features: Json
          id: string
          max_amount_usd: number
          min_amount_usd: number
          name: string
          roi_percent: number
          sort_order: number
          tagline: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string
          duration_days: number
          features?: Json
          id?: string
          max_amount_usd: number
          min_amount_usd: number
          name: string
          roi_percent: number
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string
          duration_days?: number
          features?: Json
          id?: string
          max_amount_usd?: number
          min_amount_usd?: number
          name?: string
          roi_percent?: number
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_usd: number
          auth_code: string | null
          auth_code_verified: boolean
          bank_details: Json | null
          card_last4: string | null
          created_at: string
          currency: string
          id: string
          method: string
          notes: string | null
          proof_url: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount_usd: number
          auth_code?: string | null
          auth_code_verified?: boolean
          bank_details?: Json | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          id?: string
          method: string
          notes?: string | null
          proof_url?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount_usd?: number
          auth_code?: string | null
          auth_code_verified?: boolean
          bank_details?: Json | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          proof_url?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
