export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_usage_log: {
        Row: {
          cost_usd: number
          created_at: string
          id: string
          input_tokens: number | null
          metadata: Json
          model: string | null
          operation: string
          output_tokens: number | null
          project_id: string | null
          project_id_snapshot: string | null
          requests_count: number
          service: Database["public"]["Enums"]["api_service"]
          user_id: string | null
          user_id_snapshot: string | null
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number | null
          metadata?: Json
          model?: string | null
          operation: string
          output_tokens?: number | null
          project_id?: string | null
          project_id_snapshot?: string | null
          requests_count?: number
          service: Database["public"]["Enums"]["api_service"]
          user_id?: string | null
          user_id_snapshot?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number | null
          metadata?: Json
          model?: string | null
          operation?: string
          output_tokens?: number | null
          project_id?: string | null
          project_id_snapshot?: string | null
          requests_count?: number
          service?: Database["public"]["Enums"]["api_service"]
          user_id?: string | null
          user_id_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          created_at: string
          id: string
          intent_category: Database["public"]["Enums"]["intent_category"] | null
          is_active: boolean
          project_id: string
          term: string
          type: Database["public"]["Enums"]["keyword_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent_category?:
            | Database["public"]["Enums"]["intent_category"]
            | null
          is_active?: boolean
          project_id: string
          term: string
          type?: Database["public"]["Enums"]["keyword_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intent_category?:
            | Database["public"]["Enums"]["intent_category"]
            | null
          is_active?: boolean
          project_id?: string
          term?: string
          type?: Database["public"]["Enums"]["keyword_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keywords_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_replies: {
        Row: {
          content: string
          cost_usd: number | null
          created_at: string
          created_by: string
          id: string
          input_tokens: number | null
          lead_id: string
          model: string | null
          output_tokens: number | null
          project_id: string
          prompt_version: string | null
          style: Database["public"]["Enums"]["reply_style"]
          used_at: string | null
          was_used: boolean
        }
        Insert: {
          content: string
          cost_usd?: number | null
          created_at?: string
          created_by: string
          id?: string
          input_tokens?: number | null
          lead_id: string
          model?: string | null
          output_tokens?: number | null
          project_id: string
          prompt_version?: string | null
          style: Database["public"]["Enums"]["reply_style"]
          used_at?: string | null
          was_used?: boolean
        }
        Update: {
          content?: string
          cost_usd?: number | null
          created_at?: string
          created_by?: string
          id?: string
          input_tokens?: number | null
          lead_id?: string
          model?: string | null
          output_tokens?: number | null
          project_id?: string
          prompt_version?: string | null
          style?: Database["public"]["Enums"]["reply_style"]
          used_at?: string | null
          was_used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lead_replies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_replies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_replies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_replies_project_matches_lead"
            columns: ["project_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          author: string | null
          body: string | null
          classification_reason: string | null
          classifier_prompt_version: string | null
          created_at: string
          created_utc: string | null
          id: string
          intent_score: number | null
          keywords_matched: string[]
          lost_reason: string | null
          num_comments: number | null
          opened_at: string | null
          permalink: string
          project_id: string
          raw_data: Json
          reddit_fullname: string | null
          reddit_post_id: string
          region_score: number | null
          replied_at: string | null
          reply_generation_completed_at: string | null
          reply_generation_error: string | null
          reply_generation_requested_at: string | null
          reply_generation_status: Database["public"]["Enums"]["reply_generation_status"]
          score: number | null
          sentiment: Database["public"]["Enums"]["lead_sentiment"] | null
          snoozed_until: string | null
          status: Database["public"]["Enums"]["lead_status"]
          subreddit: string
          title: string
          updated_at: string
          url: string | null
          won_value: number | null
        }
        Insert: {
          assigned_to?: string | null
          author?: string | null
          body?: string | null
          classification_reason?: string | null
          classifier_prompt_version?: string | null
          created_at?: string
          created_utc?: string | null
          id?: string
          intent_score?: number | null
          keywords_matched?: string[]
          lost_reason?: string | null
          num_comments?: number | null
          opened_at?: string | null
          permalink: string
          project_id: string
          raw_data?: Json
          reddit_fullname?: string | null
          reddit_post_id: string
          region_score?: number | null
          replied_at?: string | null
          reply_generation_completed_at?: string | null
          reply_generation_error?: string | null
          reply_generation_requested_at?: string | null
          reply_generation_status?: Database["public"]["Enums"]["reply_generation_status"]
          score?: number | null
          sentiment?: Database["public"]["Enums"]["lead_sentiment"] | null
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          subreddit: string
          title: string
          updated_at?: string
          url?: string | null
          won_value?: number | null
        }
        Update: {
          assigned_to?: string | null
          author?: string | null
          body?: string | null
          classification_reason?: string | null
          classifier_prompt_version?: string | null
          created_at?: string
          created_utc?: string | null
          id?: string
          intent_score?: number | null
          keywords_matched?: string[]
          lost_reason?: string | null
          num_comments?: number | null
          opened_at?: string | null
          permalink?: string
          project_id?: string
          raw_data?: Json
          reddit_fullname?: string | null
          reddit_post_id?: string
          region_score?: number | null
          replied_at?: string | null
          reply_generation_completed_at?: string | null
          reply_generation_error?: string | null
          reply_generation_requested_at?: string | null
          reply_generation_status?: Database["public"]["Enums"]["reply_generation_status"]
          score?: number | null
          sentiment?: Database["public"]["Enums"]["lead_sentiment"] | null
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          subreddit?: string
          title?: string
          updated_at?: string
          url?: string | null
          won_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_keyword_suggestions: {
        Row: {
          created_at: string
          id: string
          intent_category: Database["public"]["Enums"]["intent_category"] | null
          project_id: string
          rationale: string | null
          term: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent_category?:
            | Database["public"]["Enums"]["intent_category"]
            | null
          project_id: string
          rationale?: string | null
          term: string
        }
        Update: {
          created_at?: string
          id?: string
          intent_category?:
            | Database["public"]["Enums"]["intent_category"]
            | null
          project_id?: string
          rationale?: string | null
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_keyword_suggestions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scrape_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicates_skipped: number
          error_message: string | null
          id: string
          leads_created: number
          metadata: Json
          posts_seen: number
          project_id: string
          run_id: string
          started_at: string
          status: Database["public"]["Enums"]["scrape_run_status"]
          subreddits_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicates_skipped?: number
          error_message?: string | null
          id?: string
          leads_created?: number
          metadata?: Json
          posts_seen?: number
          project_id: string
          run_id: string
          started_at?: string
          status: Database["public"]["Enums"]["scrape_run_status"]
          subreddits_count?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicates_skipped?: number
          error_message?: string | null
          id?: string
          leads_created?: number
          metadata?: Json
          posts_seen?: number
          project_id?: string
          run_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["scrape_run_status"]
          subreddits_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_scrape_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_subreddit_suggestions: {
        Row: {
          created_at: string
          id: string
          is_regional: boolean
          name: string
          project_id: string
          rationale: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_regional?: boolean
          name: string
          project_id: string
          rationale?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_regional?: boolean
          name?: string
          project_id?: string
          rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_subreddit_suggestions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          last_scrape_error: string | null
          last_scraped_at: string | null
          name: string
          onboarding_completed_at: string | null
          onboarding_status: Database["public"]["Enums"]["project_onboarding_status"]
          owner_id: string
          primary_language: string
          region: string | null
          scrape_backoff_until: string | null
          scrape_fail_count: number
          secondary_language: string | null
          status: Database["public"]["Enums"]["project_status"]
          suggestions_error: string | null
          tone: string | null
          updated_at: string
          value_proposition: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          currency_code?: string
          id?: string
          last_scrape_error?: string | null
          last_scraped_at?: string | null
          name: string
          onboarding_completed_at?: string | null
          onboarding_status?: Database["public"]["Enums"]["project_onboarding_status"]
          owner_id: string
          primary_language?: string
          region?: string | null
          scrape_backoff_until?: string | null
          scrape_fail_count?: number
          secondary_language?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          suggestions_error?: string | null
          tone?: string | null
          updated_at?: string
          value_proposition?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          last_scrape_error?: string | null
          last_scraped_at?: string | null
          name?: string
          onboarding_completed_at?: string | null
          onboarding_status?: Database["public"]["Enums"]["project_onboarding_status"]
          owner_id?: string
          primary_language?: string
          region?: string | null
          scrape_backoff_until?: string | null
          scrape_fail_count?: number
          secondary_language?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          suggestions_error?: string | null
          tone?: string | null
          updated_at?: string
          value_proposition?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subreddits: {
        Row: {
          avg_daily_posts: number | null
          created_at: string
          id: string
          is_active: boolean
          is_regional: boolean
          last_scanned_at: string | null
          name: string
          project_id: string
          region: string | null
          type: Database["public"]["Enums"]["keyword_type"]
          updated_at: string
        }
        Insert: {
          avg_daily_posts?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_regional?: boolean
          last_scanned_at?: string | null
          name: string
          project_id: string
          region?: string | null
          type?: Database["public"]["Enums"]["keyword_type"]
          updated_at?: string
        }
        Update: {
          avg_daily_posts?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_regional?: boolean
          last_scanned_at?: string | null
          name?: string
          project_id?: string
          region?: string | null
          type?: Database["public"]["Enums"]["keyword_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subreddits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_project_with_owner: {
        Args: {
          _currency_code?: string
          _name: string
          _primary_language?: string
          _region?: string
          _secondary_language?: string
          _tone?: string
          _value_proposition?: string
          _website_url?: string
        }
        Returns: {
          created_at: string
          currency_code: string
          id: string
          last_scrape_error: string | null
          last_scraped_at: string | null
          name: string
          onboarding_completed_at: string | null
          onboarding_status: Database["public"]["Enums"]["project_onboarding_status"]
          owner_id: string
          primary_language: string
          region: string | null
          scrape_backoff_until: string | null
          scrape_fail_count: number
          secondary_language: string | null
          status: Database["public"]["Enums"]["project_status"]
          suggestions_error: string | null
          tone: string | null
          updated_at: string
          value_proposition: string | null
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_project_role: {
        Args: {
          _project_id: string
          _roles: Database["public"]["Enums"]["project_member_role"][]
        }
        Returns: boolean
      }
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
    }
    Enums: {
      api_service: "openai" | "anthropic" | "reddit" | "apify" | "inngest"
      intent_category: "informational" | "comparative" | "transactional"
      keyword_type: "custom" | "ai_suggested" | "competitor"
      lead_sentiment: "positive" | "negative" | "neutral"
      lead_status:
        | "new"
        | "reviewing"
        | "replied"
        | "won"
        | "lost"
        | "irrelevant"
      onboarding_status: "not_started" | "in_progress" | "completed"
      project_member_role: "owner" | "admin" | "member" | "viewer"
      project_onboarding_status:
        | "needs_suggestions"
        | "suggestions_pending"
        | "suggestions_ready"
        | "suggestions_failed"
        | "completed"
      project_status: "active" | "archived" | "suspended"
      reply_generation_status: "idle" | "generating" | "ready" | "failed"
      reply_style: "engaging" | "direct" | "balanced" | "custom"
      scrape_run_status: "started" | "completed" | "failed" | "skipped"
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
      api_service: ["openai", "anthropic", "reddit", "apify", "inngest"],
      intent_category: ["informational", "comparative", "transactional"],
      keyword_type: ["custom", "ai_suggested", "competitor"],
      lead_sentiment: ["positive", "negative", "neutral"],
      lead_status: ["new", "reviewing", "replied", "won", "lost", "irrelevant"],
      onboarding_status: ["not_started", "in_progress", "completed"],
      project_member_role: ["owner", "admin", "member", "viewer"],
      project_onboarding_status: [
        "needs_suggestions",
        "suggestions_pending",
        "suggestions_ready",
        "suggestions_failed",
        "completed",
      ],
      project_status: ["active", "archived", "suspended"],
      reply_style: ["engaging", "direct", "balanced", "custom"],
      scrape_run_status: ["started", "completed", "failed", "skipped"],
    },
  },
} as const
