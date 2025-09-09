import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  name: string;
  position: string;
  base_salary: number;
  document_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  hire_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeData {
  name: string;
  position: string;
  base_salary: number;
  document_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  hire_date: string;
}

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData: CreateEmployeeData) => {
    try {
      // Get user's condominium
      const { data: profile } = await supabase
        .from('profiles')
        .select('condominium_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.condominium_id) {
        throw new Error('Condomínio não encontrado');
      }

      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...employeeData,
          condominium_id: profile.condominium_id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Funcionário criado",
        description: `Funcionário ${employeeData.name} criado com sucesso!`
      });

      await fetchEmployees();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<CreateEmployeeData>) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Funcionário atualizado",
        description: "Dados do funcionário atualizados com sucesso!"
      });

      await fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleEmployeeStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isActive ? "Funcionário ativado" : "Funcionário desativado",
        description: `Status do funcionário alterado com sucesso!`
      });

      await fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getActiveEmployees = () => {
    return employees.filter(emp => emp.is_active);
  };

  const getInactiveEmployees = () => {
    return employees.filter(emp => !emp.is_active);
  };

  const deleteEmployee = async (id: string, employeeName: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Funcionário removido",
        description: `Funcionário ${employeeName} foi removido permanentemente do sistema!`
      });

      await fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTotalMonthlySalaries = () => {
    return employees
      .filter(emp => emp.is_active)
      .reduce((total, emp) => total + Number(emp.base_salary), 0);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    deleteEmployee,
    getActiveEmployees,
    getInactiveEmployees,
    getTotalMonthlySalaries
  };
};