import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PayrollEntry {
  id: string;
  employee_id: string;
  reference_month: string;
  base_salary: number;
  allowances: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_amount: number;
  deductions: number;
  social_security_deduction: number;
  income_tax_deduction: number;
  other_deductions: number;
  gross_salary: number;
  net_salary: number;
  payment_status: string;
  payment_date?: string;
  expense_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    name: string;
    position: string;
  };
}

interface PayrollGenerationResult {
  success: boolean;
  entries_created?: number;
  total_amount?: number;
  currency?: string;
  reference_month?: string;
  error?: string;
}

interface PaymentProcessResult {
  success: boolean;
  expense_id?: string;
  amount?: number;
  error?: string;
}

export const usePayrollManagement = () => {
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchPayrollEntries = async (month?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('payroll_entries')
        .select(`
          *,
          employee:employees(name, position)
        `)
        .order('reference_month', { ascending: false });

      if (month) {
        query = query.eq('reference_month', month);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayrollEntries((data || []) as unknown as PayrollEntry[]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar folha de pagamento: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyPayroll = async (month: string) => {
    try {
      setGenerating(true);
      
      // Get user's condominium
      const { data: profile } = await supabase
        .from('profiles')
        .select('condominium_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.condominium_id) {
        throw new Error('Condomínio não encontrado');
      }

      const { data, error } = await supabase.rpc('generate_monthly_payroll', {
        _condominium_id: profile.condominium_id,
        _reference_month: month
      });

      if (error) throw error;

      const result = data as unknown as PayrollGenerationResult;
      if (result.success) {
        toast({
          title: "Folha de pagamento gerada",
          description: `${result.entries_created} entradas criadas para ${new Date(month).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`
        });
        await fetchPayrollEntries();
      } else {
        throw new Error(result.error || 'Erro na geração da folha');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const updatePayrollEntry = async (id: string, updates: Partial<PayrollEntry>) => {
    try {
      // Recalculate totals if salary components change
      if (updates.base_salary !== undefined || updates.allowances !== undefined || 
          updates.overtime_amount !== undefined || updates.deductions !== undefined ||
          updates.social_security_deduction !== undefined || updates.income_tax_deduction !== undefined ||
          updates.other_deductions !== undefined) {
        
        const grossSalary = (updates.base_salary || 0) + (updates.allowances || 0) + (updates.overtime_amount || 0);
        const totalDeductions = (updates.deductions || 0) + (updates.social_security_deduction || 0) + 
                               (updates.income_tax_deduction || 0) + (updates.other_deductions || 0);
        const netSalary = grossSalary - totalDeductions;

        updates.gross_salary = grossSalary;
        updates.net_salary = netSalary;
      }

      const { error } = await supabase
        .from('payroll_entries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Folha atualizada",
        description: "Entrada da folha de pagamento atualizada com sucesso!"
      });

      await fetchPayrollEntries();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const processPayment = async (payrollId: string) => {
    try {
      const { data, error } = await supabase.rpc('process_payroll_payment', {
        _payroll_id: payrollId
      });

      if (error) throw error;

      const result = data as unknown as PaymentProcessResult;
      if (result.success) {
        toast({
          title: "Pagamento processado",
          description: "Pagamento registado e despesa criada automaticamente!"
        });
        await fetchPayrollEntries();
      } else {
        throw new Error(result.error || 'Erro no processamento');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPayrollStats = (month?: string) => {
    const entries = month 
      ? payrollEntries.filter(entry => entry.reference_month === month)
      : payrollEntries;

    const totalGross = entries.reduce((sum, entry) => sum + Number(entry.gross_salary), 0);
    const totalNet = entries.reduce((sum, entry) => sum + Number(entry.net_salary), 0);
    const totalDeductions = entries.reduce((sum, entry) => 
      sum + Number(entry.social_security_deduction) + Number(entry.income_tax_deduction) + Number(entry.other_deductions), 0);
    const paid = entries.filter(entry => entry.payment_status === 'paid').length;
    const pending = entries.filter(entry => entry.payment_status === 'pending').length;

    return {
      totalEntries: entries.length,
      totalGross,
      totalNet,
      totalDeductions,
      paidCount: paid,
      pendingCount: pending
    };
  };

  useEffect(() => {
    fetchPayrollEntries();
  }, []);

  return {
    payrollEntries,
    loading,
    generating,
    fetchPayrollEntries,
    generateMonthlyPayroll,
    updatePayrollEntry,
    processPayment,
    getPayrollStats
  };
};