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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      action_plan_history: {
        Row: {
          action_plan_id: string
          changed_at: string
          changed_by: string
          condominium_id: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action_plan_id: string
          changed_at?: string
          changed_by: string
          condominium_id: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action_plan_id?: string
          changed_at?: string
          changed_by?: string
          condominium_id?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      action_plans: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          category: string
          completion_date: string | null
          condominium_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          priority: string
          status: string
          task_number: number
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string
          completion_date?: string | null
          condominium_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          task_number: number
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string
          completion_date?: string | null
          condominium_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          task_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          condominium_id: string
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_urgent: boolean | null
          priority: number | null
          published: boolean | null
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          condominium_id: string
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_urgent?: boolean | null
          priority?: number | null
          published?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          condominium_id?: string
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_urgent?: boolean | null
          priority?: number | null
          published?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          condominium_id: string
          created_at: string
          floor: string | null
          id: string
          is_occupied: boolean | null
          number: string
          updated_at: string
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          condominium_id: string
          created_at?: string
          floor?: string | null
          id?: string
          is_occupied?: boolean | null
          number: string
          updated_at?: string
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          condominium_id?: string
          created_at?: string
          floor?: string | null
          id?: string
          is_occupied?: boolean | null
          number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartments_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          condominium_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          condominium_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          condominium_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      condominium_cities: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          city_id: string
          condominium_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          city_id: string
          condominium_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          city_id?: string
          condominium_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condominium_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condominium_cities_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condominium_payments: {
        Row: {
          amount: number
          condominium_id: string
          created_at: string | null
          id: string
          month: number
          notes: string | null
          payment_date: string | null
          status: string
          updated_at: string | null
          year: number
        }
        Insert: {
          amount?: number
          condominium_id: string
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          payment_date?: string | null
          status?: string
          updated_at?: string | null
          year: number
        }
        Update: {
          amount?: number
          condominium_id?: string
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          payment_date?: string | null
          status?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "condominium_payments_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condominiums: {
        Row: {
          address: string
          apartment_count: number | null
          banco_contribuicoes_especificas: string | null
          banco_quota_normal: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          current_monthly_fee: number | null
          destinatario_contribuicoes_especificas: string | null
          destinatario_quota_normal: string | null
          email: string | null
          iban_contribuicoes_especificas: string | null
          iban_quota_normal: string | null
          id: string
          monthly_fee_per_apartment: number | null
          name: string
          payment_plan: string | null
          phone: string | null
          resident_linking_code: string
          updated_at: string
        }
        Insert: {
          address: string
          apartment_count?: number | null
          banco_contribuicoes_especificas?: string | null
          banco_quota_normal?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          current_monthly_fee?: number | null
          destinatario_contribuicoes_especificas?: string | null
          destinatario_quota_normal?: string | null
          email?: string | null
          iban_contribuicoes_especificas?: string | null
          iban_quota_normal?: string | null
          id?: string
          monthly_fee_per_apartment?: number | null
          name: string
          payment_plan?: string | null
          phone?: string | null
          resident_linking_code?: string
          updated_at?: string
        }
        Update: {
          address?: string
          apartment_count?: number | null
          banco_contribuicoes_especificas?: string | null
          banco_quota_normal?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          current_monthly_fee?: number | null
          destinatario_contribuicoes_especificas?: string | null
          destinatario_quota_normal?: string | null
          email?: string | null
          iban_contribuicoes_especificas?: string | null
          iban_quota_normal?: string | null
          id?: string
          monthly_fee_per_apartment?: number | null
          name?: string
          payment_plan?: string | null
          phone?: string | null
          resident_linking_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_activity: string | null
          last_message_id: string | null
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity?: string | null
          last_message_id?: string | null
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity?: string | null
          last_message_id?: string | null
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      coordination_staff: {
        Row: {
          assigned_date: string
          condominium_id: string
          created_at: string
          created_by: string
          has_system_access: boolean
          id: string
          name: string
          permissions: Json | null
          phone: string | null
          position: string
          role: Database["public"]["Enums"]["coordination_member_role"]
          start_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_date?: string
          condominium_id: string
          created_at?: string
          created_by: string
          has_system_access?: boolean
          id?: string
          name: string
          permissions?: Json | null
          phone?: string | null
          position: string
          role?: Database["public"]["Enums"]["coordination_member_role"]
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_date?: string
          condominium_id?: string
          created_at?: string
          created_by?: string
          has_system_access?: boolean
          id?: string
          name?: string
          permissions?: Json | null
          phone?: string | null
          position?: string
          role?: Database["public"]["Enums"]["coordination_member_role"]
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coordination_staff_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          condominium_id: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_public: boolean | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          condominium_id: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          condominium_id?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          base_salary: number
          condominium_id: string
          created_at: string
          document_number: string | null
          email: string | null
          hire_date: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          position: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_salary?: number
          condominium_id: string
          created_at?: string
          document_number?: string | null
          email?: string | null
          hire_date?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          position: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_salary?: number
          condominium_id?: string
          created_at?: string
          document_number?: string | null
          email?: string | null
          hire_date?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          condominium_id: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          fonte_pagamento: string
          id: string
          service_provider_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          condominium_id: string
          created_at?: string
          created_by: string
          description: string
          expense_date: string
          fonte_pagamento?: string
          id?: string
          service_provider_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          condominium_id?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          fonte_pagamento?: string
          id?: string
          service_provider_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_condominium_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_service_provider_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          condominium_id: string
          created_at: string
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["license_status"]
          updated_at: string
        }
        Insert: {
          condominium_id: string
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
        }
        Update: {
          condominium_id?: string
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      linking_codes: {
        Row: {
          code: string
          condominium_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          condominium_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          condominium_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linking_codes_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          message_type: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      occurrences: {
        Row: {
          assigned_to: string | null
          category: string
          condominium_id: string
          created_at: string
          description: string
          id: string
          images: Json | null
          location: string | null
          occurrence_number: number | null
          priority: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          condominium_id: string
          created_at?: string
          description: string
          id?: string
          images?: Json | null
          location?: string | null
          occurrence_number?: number | null
          priority?: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          condominium_id?: string
          created_at?: string
          description?: string
          id?: string
          images?: Json | null
          location?: string | null
          occurrence_number?: number | null
          priority?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          condominium_id: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          description: string
          due_date: string
          id: string
          payment_date: string | null
          reference_month: string
          resident_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          condominium_id: string
          created_at?: string
          currency: Database["public"]["Enums"]["currency_type"]
          description: string
          due_date: string
          id?: string
          payment_date?: string | null
          reference_month: string
          resident_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          condominium_id?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string
          due_date?: string
          id?: string
          payment_date?: string | null
          reference_month?: string
          resident_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          allowances: number
          base_salary: number
          condominium_id: string
          created_at: string
          deductions: number
          employee_id: string
          expense_id: string | null
          gross_salary: number
          id: string
          income_tax_deduction: number
          net_salary: number
          notes: string | null
          other_deductions: number
          overtime_amount: number
          overtime_hours: number
          overtime_rate: number
          payment_date: string | null
          payment_status: string
          reference_month: string
          social_security_deduction: number
          updated_at: string
        }
        Insert: {
          allowances?: number
          base_salary?: number
          condominium_id: string
          created_at?: string
          deductions?: number
          employee_id: string
          expense_id?: string | null
          gross_salary?: number
          id?: string
          income_tax_deduction?: number
          net_salary?: number
          notes?: string | null
          other_deductions?: number
          overtime_amount?: number
          overtime_hours?: number
          overtime_rate?: number
          payment_date?: string | null
          payment_status?: string
          reference_month: string
          social_security_deduction?: number
          updated_at?: string
        }
        Update: {
          allowances?: number
          base_salary?: number
          condominium_id?: string
          created_at?: string
          deductions?: number
          employee_id?: string
          expense_id?: string | null
          gross_salary?: number
          id?: string
          income_tax_deduction?: number
          net_salary?: number
          notes?: string | null
          other_deductions?: number
          overtime_amount?: number
          overtime_hours?: number
          overtime_rate?: number
          payment_date?: string | null
          payment_status?: string
          reference_month?: string
          social_security_deduction?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payroll_entries_employee_id"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apartment_number: string | null
          condominium_id: string | null
          coordination_staff_id: string | null
          created_at: string
          first_name: string
          floor: string | null
          id: string
          last_name: string
          must_change_password: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment_number?: string | null
          condominium_id?: string | null
          coordination_staff_id?: string | null
          created_at?: string
          first_name: string
          floor?: string | null
          id?: string
          last_name: string
          must_change_password?: boolean | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment_number?: string | null
          condominium_id?: string | null
          coordination_staff_id?: string | null
          created_at?: string
          first_name?: string
          floor?: string | null
          id?: string
          last_name?: string
          must_change_password?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_coordination_staff_id_fkey"
            columns: ["coordination_staff_id"]
            isOneToOne: false
            referencedRelation: "coordination_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      remanescente_anual: {
        Row: {
          ano_referencia: number
          condominium_id: string
          created_at: string
          id: string
          saldo_atual: number
          updated_at: string
          valor_despesas: number
          valor_recebido: number
          valor_remanescente: number
          valor_utilizado: number
        }
        Insert: {
          ano_referencia: number
          condominium_id: string
          created_at?: string
          id?: string
          saldo_atual?: number
          updated_at?: string
          valor_despesas?: number
          valor_recebido?: number
          valor_remanescente?: number
          valor_utilizado?: number
        }
        Update: {
          ano_referencia?: number
          condominium_id?: string
          created_at?: string
          id?: string
          saldo_atual?: number
          updated_at?: string
          valor_despesas?: number
          valor_recebido?: number
          valor_remanescente?: number
          valor_utilizado?: number
        }
        Relationships: []
      }
      residents: {
        Row: {
          apartment_number: string
          condominium_id: string
          created_at: string
          document_number: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          family_members: Json | null
          floor: string | null
          id: string
          is_owner: boolean | null
          move_in_date: string | null
          parking_spaces: Json | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          apartment_number: string
          condominium_id: string
          created_at?: string
          document_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_members?: Json | null
          floor?: string | null
          id?: string
          is_owner?: boolean | null
          move_in_date?: string | null
          parking_spaces?: Json | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          apartment_number?: string
          condominium_id?: string
          created_at?: string
          document_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_members?: Json | null
          floor?: string | null
          id?: string
          is_owner?: boolean | null
          move_in_date?: string | null
          parking_spaces?: Json | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residents_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          condominium_id: string
          contact_person: string | null
          created_at: string
          document_number: string | null
          email: string | null
          id: string
          is_authorized: boolean | null
          name: string
          phone: string | null
          service_type: string
          updated_at: string
        }
        Insert: {
          condominium_id: string
          contact_person?: string | null
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          is_authorized?: boolean | null
          name: string
          phone?: string | null
          service_type: string
          updated_at?: string
        }
        Update: {
          condominium_id?: string
          contact_person?: string | null
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          is_authorized?: boolean | null
          name?: string
          phone?: string | null
          service_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      space_reservations: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          condominium_id: string
          created_at: string
          end_time: string
          id: string
          purpose: string | null
          rejection_reason: string | null
          reservation_date: string
          resident_id: string
          space_name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          condominium_id: string
          created_at?: string
          end_time: string
          id?: string
          purpose?: string | null
          rejection_reason?: string | null
          reservation_date: string
          resident_id: string
          space_name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          condominium_id?: string
          created_at?: string
          end_time?: string
          id?: string
          purpose?: string | null
          rejection_reason?: string | null
          reservation_date?: string
          resident_id?: string
          space_name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_space_reservations_condominium"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_space_reservations_resident"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      specific_campaigns: {
        Row: {
          condominium_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          condominium_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          status?: string
          target_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          condominium_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      specific_contributions: {
        Row: {
          amount: number
          campaign_id: string
          condominium_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          resident_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          campaign_id: string
          condominium_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          resident_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          condominium_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          resident_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specific_contributions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "specific_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_city_access: {
        Row: {
          city_id: string
          created_at: string
          created_by: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          created_by: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city_id?: string
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_viewer_city_access_city"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_qrcodes: {
        Row: {
          condominium_id: string
          created_at: string
          created_by: string
          entry_registered_at: string | null
          expires_at: string
          id: string
          token: string
          updated_at: string
          used_at: string | null
          visitor_id: string
        }
        Insert: {
          condominium_id: string
          created_at?: string
          created_by: string
          entry_registered_at?: string | null
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used_at?: string | null
          visitor_id: string
        }
        Update: {
          condominium_id?: string
          created_at?: string
          created_by?: string
          entry_registered_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used_at?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          condominium_id: string
          created_at: string
          document_number: string | null
          id: string
          name: string
          phone: string | null
          purpose: string | null
          resident_id: string
          updated_at: string
          visit_date: string
          visit_time: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          condominium_id: string
          created_at?: string
          document_number?: string | null
          id?: string
          name: string
          phone?: string | null
          purpose?: string | null
          resident_id: string
          updated_at?: string
          visit_date: string
          visit_time?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          condominium_id?: string
          created_at?: string
          document_number?: string | null
          id?: string
          name?: string
          phone?: string | null
          purpose?: string | null
          resident_id?: string
          updated_at?: string
          visit_date?: string
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprovar_despesa_pendente: {
        Args: { _condominium_id: string; _expense_id: string }
        Returns: Json
      }
      atualizar_utilizacao_remanescente: {
        Args: { _ano_origem: number; _condominium_id: string; _valor: number }
        Returns: Json
      }
      calculate_revenue_stats: {
        Args: {
          _city_id?: string
          _condominium_id?: string
          _payment_plan?: string
        }
        Returns: Json
      }
      check_license_active: {
        Args: { _condominium_id: string }
        Returns: boolean
      }
      create_city_viewer_user: {
        Args: {
          _city_ids: string[]
          _first_name: string
          _last_name: string
          _phone?: string
          _user_id: string
        }
        Returns: Json
      }
      create_coordinator_profile: {
        Args: {
          _condominium_id: string
          _first_name: string
          _last_name: string
          _phone?: string
          _user_id: string
        }
        Returns: Json
      }
      create_mario_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_super_admin: {
        Args: {
          first_name: string
          last_name: string
          phone?: string
          user_email: string
          user_password: string
        }
        Returns: Json
      }
      criar_despesa_com_validacao: {
        Args: {
          _amount: number
          _category: string
          _condominium_id: string
          _created_by?: string
          _description: string
          _expense_date: string
          _fonte_pagamento?: string
          _service_provider_id?: string
        }
        Returns: Json
      }
      generate_linking_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_monthly_payments: {
        Args: {
          _amount: number
          _condominium_id: string
          _description?: string
          _due_days?: number
          _reference_month: string
        }
        Returns: number
      }
      generate_monthly_payroll: {
        Args: { _condominium_id: string; _reference_month: string }
        Returns: Json
      }
      generate_visitor_qrcode_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_campaign_report: {
        Args: { _campaign_id: string; _condominium_id: string }
        Returns: Json
      }
      get_condominium_with_coordinator: {
        Args: { _condominium_id: string }
        Returns: Json
      }
      get_coordination_member_permissions: {
        Args: { _user_id: string }
        Returns: Json
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          profile_data: Json
        }[]
      }
      get_next_occurrence_number: {
        Args: { _condominium_id: string }
        Returns: number
      }
      get_next_task_number: {
        Args: { _condominium_id: string }
        Returns: number
      }
      get_user_accessible_cities: {
        Args: { _user_id: string }
        Returns: {
          city_id: string
          city_name: string
        }[]
      }
      get_user_condominium: {
        Args: { _user_id: string }
        Returns: string
      }
      has_city_access: {
        Args: { _city_id: string; _user_id: string }
        Returns: boolean
      }
      has_coordination_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_super_admin_profile: {
        Args: {
          _first_name: string
          _last_name: string
          _phone?: string
          _user_id: string
        }
        Returns: Json
      }
      is_email_available: {
        Args: { _email: string }
        Returns: boolean
      }
      is_valid_linking_code_format: {
        Args: { _code: string }
        Returns: boolean
      }
      obter_saldo_disponivel: {
        Args: { _condominium_id: string }
        Returns: Json
      }
      process_payroll_payment: {
        Args: { _payroll_id: string }
        Returns: Json
      }
      processar_remanescente_anual: {
        Args: { _ano: number; _condominium_id: string }
        Returns: Json
      }
      promote_resident_to_coordination: {
        Args: {
          _has_system_access?: boolean
          _position: string
          _resident_id: string
          _role: Database["public"]["Enums"]["coordination_member_role"]
        }
        Returns: Json
      }
      regenerate_linking_code: {
        Args: { _condominium_id: string }
        Returns: Json
      }
      remove_from_coordination: {
        Args: { _coordination_staff_id: string }
        Returns: Json
      }
      update_city_viewer_access: {
        Args: { _city_ids: string[]; _user_id: string }
        Returns: Json
      }
      validar_saldo_disponivel: {
        Args: {
          _condominium_id: string
          _fonte_pagamento?: string
          _valor: number
        }
        Returns: Json
      }
      validate_and_process_visitor_qrcode: {
        Args: { _scanner_condominium_id: string; _token: string }
        Returns: Json
      }
      validate_linking_code_and_apartment: {
        Args: { _apartment_number: string; _linking_code: string }
        Returns: Json
      }
    }
    Enums: {
      coordination_member_role:
        | "coordinator"
        | "financial"
        | "security"
        | "maintenance"
        | "administration"
        | "secretary"
      currency_type: "AOA" | "EUR" | "BRL" | "MZN"
      license_status: "active" | "paused" | "expired"
      payment_status: "pending" | "paid" | "overdue"
      user_role: "super_admin" | "coordinator" | "resident" | "city_viewer"
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
      coordination_member_role: [
        "coordinator",
        "financial",
        "security",
        "maintenance",
        "administration",
        "secretary",
      ],
      currency_type: ["AOA", "EUR", "BRL", "MZN"],
      license_status: ["active", "paused", "expired"],
      payment_status: ["pending", "paid", "overdue"],
      user_role: ["super_admin", "coordinator", "resident", "city_viewer"],
    },
  },
} as const
