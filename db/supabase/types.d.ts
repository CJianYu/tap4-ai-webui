/* eslint-disable @typescript-eslint/indent */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      navigation_category: {
        Row: {
          create_by: number;
          create_time: string;
          del_flag: number;
          id: number;
          name: string;
          sort: number;
          title: string;
        };
        Insert: {
          create_by?: number | null;
          create_time?: string;
          del_flag?: number | null;
          id?: never;
          name: string;
          sort?: number | null;
          title?: string | null;
        };
        Update: {
          create_by?: number | null;
          create_time?: string;
          del_flag?: number | null;
          id?: never;
          name?: string;
          sort?: number | null;
          title?: string | null;
        };
        Relationships: [];
      };
      submit: {
        Row: {
          created_at: string;
          email: string | null;
          id: number;
          is_feature: number | null;
          name: string | null;
          status: number | null;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: number;
          is_feature?: number | null;
          name?: string | null;
          status?: number | null;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: number;
          is_feature?: number | null;
          name?: string | null;
          status?: number | null;
          url?: string | null;
        };
        Relationships: [];
      };
      web_navigation: {
        Row: {
          category_name: string;
          collection_time: string;
          content: string;
          detail: string;
          id: number;
          image_url: string;
          name: string;
          star_rating: number;
          tag_name: string;
          thumbnail_url: string;
          title: string;
          url: string;
          website_data: string;
        };
        Insert: {
          category_name?: string | null;
          collection_time?: string | null;
          content?: string | null;
          detail?: string | null;
          id?: number;
          image_url?: string | null;
          name: string;
          star_rating?: number | null;
          tag_name?: string | null;
          thumbnail_url?: string | null;
          title?: string | null;
          url?: string | null;
          website_data?: string | null;
        };
        Update: {
          category_name?: string | null;
          collection_time?: string | null;
          content?: string | null;
          detail?: string | null;
          id?: number;
          image_url?: string | null;
          name?: string;
          star_rating?: number | null;
          tag_name?: string | null;
          thumbnail_url?: string | null;
          title?: string | null;
          url?: string | null;
          website_data?: string | null;
        };
        Relationships: [];
      };
      blog_post: {
        Row: {
          id: number;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          featured_image: string | null;
          author_id: number | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          status: number | null;
          view_count: number | null;
          tags: string[] | null;
        };
        Insert: {
          id?: number;
          title: string;
          slug: string;
          content: string;
          excerpt?: string | null;
          featured_image?: string | null;
          author_id?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: number | null;
          view_count?: number | null;
          tags?: string[] | null;
        };
        Update: {
          id?: number;
          title?: string;
          slug?: string;
          content?: string;
          excerpt?: string | null;
          featured_image?: string | null;
          author_id?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: number | null;
          view_count?: number | null;
          tags?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_blog_post_author';
            columns: ['author_id'];
            referencedRelation: 'blog_author';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_author: {
        Row: {
          id: number;
          name: string;
          bio: string | null;
          avatar: string | null;
          email: string | null;
          website: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          bio?: string | null;
          avatar?: string | null;
          email?: string | null;
          website?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          bio?: string | null;
          avatar?: string | null;
          email?: string | null;
          website?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_comment: {
        Row: {
          id: number;
          post_slug: string;
          author_name: string;
          author_email: string | null;
          content: string;
          parent_id: number | null;
          created_at: string;
          status: number | null;
        };
        Insert: {
          id?: number;
          post_slug: string;
          author_name: string;
          author_email?: string | null;
          content: string;
          parent_id?: number | null;
          created_at?: string;
          status?: number | null;
        };
        Update: {
          id?: number;
          post_slug?: string;
          author_name?: string;
          author_email?: string | null;
          content?: string;
          parent_id?: number | null;
          created_at?: string;
          status?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_comment_post_slug_fkey';
            columns: ['post_slug'];
            referencedRelation: 'blog_post';
            referencedColumns: ['slug'];
          },
          {
            foreignKeyName: 'blog_comment_parent_id_fkey';
            columns: ['parent_id'];
            referencedRelation: 'blog_comment';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type NavigationCategory = Database['public']['Tables']['navigation_category']['Row'];
export type Submit = Database['public']['Tables']['submit']['Row'];
export type WebNavigation = Database['public']['Tables']['web_navigation']['Row'];
export type BlogPost = Database['public']['Tables']['blog_post']['Row'];
export type BlogAuthor = Database['public']['Tables']['blog_author']['Row'];
export type BlogComment = Database['public']['Tables']['blog_comment']['Row'];

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views']) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
