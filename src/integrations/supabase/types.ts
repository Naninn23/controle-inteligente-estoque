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
      auditoria: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          registro_id: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          alerta_estoque_baixo: boolean
          empresa_nome: string
          id: boolean
          moeda: string
          permitir_estoque_negativo: boolean
          updated_at: string
        }
        Insert: {
          alerta_estoque_baixo?: boolean
          empresa_nome?: string
          id?: boolean
          moeda?: string
          permitir_estoque_negativo?: boolean
          updated_at?: string
        }
        Update: {
          alerta_estoque_baixo?: boolean
          empresa_nome?: string
          id?: boolean
          moeda?: string
          permitir_estoque_negativo?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      documento_itens: {
        Row: {
          created_at: string
          documento_id: string
          id: string
          produto_id: string
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          documento_id: string
          id?: string
          produto_id: string
          quantidade: number
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          documento_id?: string
          id?: string
          produto_id?: string
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "documento_itens_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          confirmado_em: string | null
          created_at: string
          created_by: string | null
          destino: string | null
          fornecedor_id: string | null
          id: string
          numero: number
          observacao: string | null
          status: Database["public"]["Enums"]["doc_status"]
          tipo: Database["public"]["Enums"]["doc_tipo"]
          total: number
        }
        Insert: {
          confirmado_em?: string | null
          created_at?: string
          created_by?: string | null
          destino?: string | null
          fornecedor_id?: string | null
          id?: string
          numero?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          tipo: Database["public"]["Enums"]["doc_tipo"]
          total?: number
        }
        Update: {
          confirmado_em?: string | null
          created_at?: string
          created_by?: string | null
          destino?: string | null
          fornecedor_id?: string | null
          id?: string
          numero?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          tipo?: Database["public"]["Enums"]["doc_tipo"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          documento: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
          uf: string | null
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          uf?: string | null
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      inventario_itens: {
        Row: {
          created_at: string
          id: string
          inventario_id: string
          produto_id: string
          saldo_contado: number | null
          saldo_sistema: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventario_id: string
          produto_id: string
          saldo_contado?: number | null
          saldo_sistema?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventario_id?: string
          produto_id?: string
          saldo_contado?: number | null
          saldo_sistema?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventario_itens_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      inventarios: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string
          finalizado_em: string | null
          id: string
          status: Database["public"]["Enums"]["inv_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string
          finalizado_em?: string | null
          id?: string
          status?: Database["public"]["Enums"]["inv_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string
          finalizado_em?: string | null
          id?: string
          status?: Database["public"]["Enums"]["inv_status"]
        }
        Relationships: []
      }
      movimentos: {
        Row: {
          created_at: string
          created_by: string | null
          custo_medio_anterior: number
          custo_medio_posterior: number
          custo_unitario: number
          documento_id: string | null
          id: string
          inventario_id: string | null
          observacao: string | null
          origem: string
          produto_id: string
          quantidade: number
          saldo_anterior: number
          saldo_posterior: number
          tipo: Database["public"]["Enums"]["mov_tipo"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custo_medio_anterior?: number
          custo_medio_posterior?: number
          custo_unitario?: number
          documento_id?: string | null
          id?: string
          inventario_id?: string | null
          observacao?: string | null
          origem?: string
          produto_id: string
          quantidade: number
          saldo_anterior: number
          saldo_posterior: number
          tipo: Database["public"]["Enums"]["mov_tipo"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custo_medio_anterior?: number
          custo_medio_posterior?: number
          custo_unitario?: number
          documento_id?: string | null
          id?: string
          inventario_id?: string | null
          observacao?: string | null
          origem?: string
          produto_id?: string
          quantidade?: number
          saldo_anterior?: number
          saldo_posterior?: number
          tipo?: Database["public"]["Enums"]["mov_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          custo_medio: number
          descricao: string | null
          estoque_max: number
          estoque_min: number
          fornecedor_id: string | null
          id: string
          nome: string
          preco_venda: number
          saldo: number
          sku: string
          unidade: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          custo_medio?: number
          descricao?: string | null
          estoque_max?: number
          estoque_min?: number
          fornecedor_id?: string | null
          id?: string
          nome: string
          preco_venda?: number
          saldo?: number
          sku: string
          unidade?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          custo_medio?: number
          descricao?: string | null
          estoque_max?: number
          estoque_min?: number
          fornecedor_id?: string | null
          id?: string
          nome?: string
          preco_venda?: number
          saldo?: number
          sku?: string
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string
          id: string
          nome?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
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
      confirmar_documento: {
        Args: { _documento_id: string }
        Returns: undefined
      }
      definir_papel: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      finalizar_inventario: {
        Args: { _inventario_id: string }
        Returns: undefined
      }
      garantir_perfil: {
        Args: { _email: string; _nome: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pode_gerenciar: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gerente" | "operador"
      doc_status: "rascunho" | "confirmado" | "cancelado"
      doc_tipo: "entrada" | "saida"
      inv_status: "aberto" | "finalizado" | "cancelado"
      mov_tipo: "entrada" | "saida" | "ajuste"
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
      app_role: ["admin", "gerente", "operador"],
      doc_status: ["rascunho", "confirmado", "cancelado"],
      doc_tipo: ["entrada", "saida"],
      inv_status: ["aberto", "finalizado", "cancelado"],
      mov_tipo: ["entrada", "saida", "ajuste"],
    },
  },
} as const
