// Auto-generated types from Supabase schema (populate with `supabase gen types typescript`)
// For now, these are hand-written stubs matching PRD Section 13

export type MemberRole = 'owner' | 'head_of_household' | 'visitor_head' | 'member' | 'visitor';
export type CuisineType = 'italian' | 'mexican' | 'chinese' | 'japanese' | 'indian' | 'american' | 'mediterranean' | 'thai' | 'french' | 'middle-eastern' | 'korean' | 'other';
export type CarbType = 'rice' | 'pasta' | 'bread' | 'potato' | 'noodles' | 'none' | 'other';
export type ProteinType = 'chicken' | 'beef' | 'pork' | 'fish' | 'shrimp' | 'tofu' | 'lamb' | 'eggs' | 'none' | 'other';
export type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'other';
export type IngredientUnit = 'g' | 'ml' | 'kg' | 'l' | 'oz' | 'lb' | 'cup' | 'tbsp' | 'tsp' | 'qty' | 'piece' | 'pack' | 'bag' | 'bottle';
export type VoteType = 'yes' | 'no' | 'super';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type GroceryCategory = 'produce' | 'dairy-eggs' | 'meat-seafood' | 'frozen' | 'pantry' | 'snacks-drinks' | 'bakery' | 'household' | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          dietary_preference: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          dietary_preference?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          dietary_preference?: string;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
      };
      user_saved_global_recipes: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          recipe_id?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          invite_code: string;
          week_start_day: number;
          dinner_time: string;
          default_duration_days: number;
          reminder_hours_before: number;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          invite_code: string;
          week_start_day?: number;
          dinner_time?: string;
          default_duration_days?: number;
          reminder_hours_before?: number;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          owner_id?: string;
          invite_code?: string;
          week_start_day?: number;
          dinner_time?: string;
          default_duration_days?: number;
          reminder_hours_before?: number;
          timezone?: string;
          updated_at?: string;
        };
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
          visitor_expires_at: string | null;
          is_creator: boolean;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
          visitor_expires_at?: string | null;
          is_creator?: boolean;
        };
        Update: {
          role?: MemberRole;
          visitor_expires_at?: string | null;
          is_creator?: boolean;
        };
      };
      suggestions: {
        Row: {
          id: string;
          household_id: string;
          user_id: string | null;
          content: string;
          status: 'pending' | 'approved' | 'denied';
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id?: string | null;
          content: string;
          status?: 'pending' | 'approved' | 'denied';
        };
        Update: {
          status?: 'pending' | 'approved' | 'denied';
        };
      };
      household_notifications: {
        Row: {
          id: string;
          household_id: string;
          type: string;
          ref_id: string | null;
          message: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          type: string;
          ref_id?: string | null;
          message: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      recipes: {
        Row: {
          id: string;
          title: string;
          description: string;
          cuisine: CuisineType;
          carb_type: CarbType;
          protein_type: ProteinType;
          dietary_tags: string[];
          prep_time_min: number;
          cook_time_min: number;
          servings: number;
          estimated_price: number | null;
          emoji: string;
          bg_color: string;
          advance_prep_days: number;
          advance_prep_note: string | null;
          is_global: boolean;
          household_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          cuisine?: CuisineType;
          carb_type?: CarbType;
          protein_type?: ProteinType;
          prep_time_min?: number;
          cook_time_min?: number;
          servings?: number;
          estimated_price?: number | null;
          emoji?: string;
          bg_color?: string;
          advance_prep_days?: number;
          advance_prep_note?: string | null;
          is_global?: boolean;
          household_id?: string | null;
          created_by?: string | null;
          dietary_tags?: string[];
        };
        Update: {
          title?: string;
          description?: string;
          cuisine?: CuisineType;
          carb_type?: CarbType;
          protein_type?: ProteinType;
          prep_time_min?: number;
          cook_time_min?: number;
          servings?: number;
          estimated_price?: number | null;
          emoji?: string;
          bg_color?: string;
          advance_prep_days?: number;
          advance_prep_note?: string | null;
          dietary_tags?: string[];
          updated_at?: string;
        };
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          name: string;
          amount: number;
          unit: IngredientUnit;
          storage_location: StorageLocation;
          sort_order: number;
          pack_qty: number | null;
          pack_price: number | null;
          unit_cost: number | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          name: string;
          amount: number;
          unit?: IngredientUnit;
          storage_location?: StorageLocation;
          sort_order?: number;
          pack_qty?: number | null;
          pack_price?: number | null;
        };
        Update: {
          name?: string;
          amount?: number;
          unit?: IngredientUnit;
          storage_location?: StorageLocation;
          sort_order?: number;
          pack_qty?: number | null;
          pack_price?: number | null;
        };
      };
      recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          step_order: number;
          instruction: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          step_order: number;
          instruction: string;
        };
        Update: {
          step_order?: number;
          instruction?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          recipe_id: string;
          week_start_date: string;
          vote: VoteType;
          voted_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          recipe_id: string;
          week_start_date: string;
          vote: VoteType;
          voted_at?: string;
        };
        Update: {
          vote?: VoteType;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          household_id: string;
          week_start_date: string;
          created_by: string | null;
          finalized_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          week_start_date: string;
          created_by?: string | null;
          finalized_at?: string | null;
        };
        Update: {
          finalized_at?: string | null;
          updated_at?: string;
        };
      };
      household_recipes: {
        Row: {
          id: string;
          household_id: string;
          recipe_id: string;
          added_by: string | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          recipe_id: string;
          added_by?: string | null;
          added_at?: string;
        };
        Update: {
          added_by?: string | null;
        };
      };
      recipe_add_requests: {
        Row: {
          id: string;
          household_id: string;
          recipe_id: string;
          requested_by: string;
          status: 'pending' | 'approved' | 'denied';
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          recipe_id: string;
          requested_by: string;
          status?: 'pending' | 'approved' | 'denied';
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'approved' | 'denied';
        };
      };
      recipe_cooks: {
        Row: {
          id: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          added_at?: string;
        };
        Update: Record<string, never>;
      };
      meal_plan_slots: {
        Row: {
          id: string;
          meal_plan_id: string;
          recipe_id: string;
          slot_date: string;
          chef_id: string | null;
          servings_override: number | null;
          cooking_reminder_sent_at: string | null;
          advance_prep_reminder_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          recipe_id: string;
          slot_date?: string;
          chef_id?: string | null;
          servings_override?: number | null;
          cooking_reminder_sent_at?: string | null;
          advance_prep_reminder_sent_at?: string | null;
        };
        Update: {
          recipe_id?: string;
          slot_date?: string;
          chef_id?: string | null;
          servings_override?: number | null;
          cooking_reminder_sent_at?: string | null;
          advance_prep_reminder_sent_at?: string | null;
        };
      };
      ingredient_library: {
        Row: {
          id: string;
          name: string;
          default_unit: string | null;
          storage_category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_unit?: string | null;
          storage_category?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          default_unit?: string | null;
          storage_category?: string | null;
        };
      };
      household_storage_categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          sort_order?: number;
        };
      };
      household_packs: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
      };
      household_pack_items: {
        Row: {
          id: string;
          pack_id: string;
          recipe_id: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          pack_id: string;
          recipe_id: string;
          sort_order?: number;
        };
        Update: {
          sort_order?: number;
        };
      };
      meal_plan_packs: {
        Row: {
          id: string;
          plan_id: string;
          pack_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          pack_id: string;
          added_at?: string;
        };
        Update: Record<string, never>;
      };
      grocery_lists: {
        Row: {
          id: string;
          household_id: string;
          week_start_date: string;
          created_at: string;
          pantry_checked_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          week_start_date: string;
          pantry_checked_at?: string | null;
        };
        Update: {
          pantry_checked_at?: string | null;
        };
      };
      grocery_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          amount: number | null;
          unit: IngredientUnit | null;
          category: GroceryCategory;
          is_standalone: boolean;
          recipe_id: string | null;
          checked: boolean;
          pantry_confirmed: boolean;
          added_by: string | null;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          name: string;
          amount?: number | null;
          unit?: IngredientUnit | null;
          category?: GroceryCategory;
          is_standalone?: boolean;
          recipe_id?: string | null;
          checked?: boolean;
          pantry_confirmed?: boolean;
          added_by?: string | null;
          assigned_to?: string | null;
        };
        Update: {
          name?: string;
          amount?: number | null;
          unit?: IngredientUnit | null;
          category?: GroceryCategory;
          checked?: boolean;
          pantry_confirmed?: boolean;
          assigned_to?: string | null;
        };
      };
      shopping_attendance: {
        Row: {
          id: string;
          grocery_list_id: string;
          user_id: string;
          marked_at: string;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          user_id: string;
          marked_at?: string;
        };
        Update: Record<string, never>;
      };
      recipe_ratings: {
        Row: {
          id: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          meal_plan_slot_id: string | null;
          stars: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          meal_plan_slot_id?: string | null;
          stars: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stars?: number;
          comment?: string | null;
          updated_at?: string;
        };
      };
      recipe_favourites: {
        Row: {
          id: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      recipe_notes: {
        Row: {
          id: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          household_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
      meal_plan_templates: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          description: string | null;
          duration_days: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          description?: string | null;
          duration_days: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          duration_days?: number;
          updated_at?: string;
        };
      };
      meal_plan_template_slots: {
        Row: {
          id: string;
          template_id: string;
          recipe_id: string;
          day_offset: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          template_id: string;
          recipe_id: string;
          day_offset: number;
          sort_order?: number;
        };
        Update: {
          day_offset?: number;
          sort_order?: number;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          p256dh?: string;
          auth?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          plan_finalized: boolean;
          cooking_reminder: boolean;
          advance_prep_reminder: boolean;
          join_request: boolean;
          recipe_add_request: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_finalized?: boolean;
          cooking_reminder?: boolean;
          advance_prep_reminder?: boolean;
          join_request?: boolean;
          recipe_add_request?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_finalized?: boolean;
          cooking_reminder?: boolean;
          advance_prep_reminder?: boolean;
          join_request?: boolean;
          recipe_add_request?: boolean;
          updated_at?: string;
        };
      };
    };
    Functions: {
      approve_recipe_add_request: {
        Args: { request_id: string };
        Returns: void;
      };
      deny_recipe_add_request: {
        Args: { request_id: string };
        Returns: void;
      };
      my_household_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      week_start: {
        Args: { d: string };
        Returns: string;
      };
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      finalize_meal_plan: {
        Args: { plan_id: string };
        Returns: string;
      };
      get_meal_history: {
        Args: { p_household_id: string; p_limit?: number };
        Returns: {
          slot_id: string;
          recipe_id: string;
          recipe_title: string;
          recipe_emoji: string;
          recipe_bg_color: string;
          slot_date: string;
          chef_id: string | null;
          chef_name: string | null;
          avg_stars: number | null;
          week_start_date: string;
        }[];
      };
      get_household_analytics: {
        Args: { p_household_id: string };
        Returns: {
          top_recipes: { id: string; title: string; emoji: string; bg_color: string; cook_count: number; avg_stars: number | null }[] | null;
          top_chefs: { user_id: string; display_name: string; meals_cooked: number }[] | null;
          total_meals: number;
        };
      };
    };
    Enums: {
      member_role: MemberRole;
      cuisine_type: CuisineType;
      carb_type: CarbType;
      protein_type: ProteinType;
      storage_location: StorageLocation;
      ingredient_unit: IngredientUnit;
      vote_type: VoteType;
      meal_type: MealType;
      grocery_category: GroceryCategory;
    };
  };
}
