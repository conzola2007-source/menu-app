// Auto-generated types from Supabase schema (populate with `supabase gen types typescript`)
// For now, these are hand-written stubs matching PRD Section 13

export type MemberRole = 'owner' | 'member';
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          invite_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          owner_id?: string;
          invite_code?: string;
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
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Update: {
          role?: MemberRole;
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
        };
        Insert: {
          id?: string;
          recipe_id: string;
          name: string;
          amount: number;
          unit?: IngredientUnit;
          storage_location?: StorageLocation;
          sort_order?: number;
        };
        Update: {
          name?: string;
          amount?: number;
          unit?: IngredientUnit;
          storage_location?: StorageLocation;
          sort_order?: number;
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
      meal_plan_slots: {
        Row: {
          id: string;
          meal_plan_id: string;
          recipe_id: string;
          day_of_week: number;
          meal_type: MealType;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          recipe_id: string;
          day_of_week: number;
          meal_type: MealType;
        };
        Update: {
          recipe_id?: string;
        };
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
        };
        Update: {
          name?: string;
          amount?: number | null;
          unit?: IngredientUnit | null;
          category?: GroceryCategory;
          checked?: boolean;
          pantry_confirmed?: boolean;
        };
      };
    };
    Functions: {
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
