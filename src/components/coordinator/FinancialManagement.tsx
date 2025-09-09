import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFinancialSync } from "@/hooks/useFinancialSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Filter,
  Receipt,
  CreditCard,
  Search,
  Clock,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface FinancialManagementProps {
  onStatsUpdate: () => void;
}

export function FinancialManagement({ onStatsUpdate }: FinancialManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [residents, setResidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentMonthlyFee, setCurrentMonthlyFee] = useState<number>(50000);
  const [ibanQuotaNormal, setIbanQuotaNormal] = useState<string>("");
  const [ibanContribuicoes, setIbanContribuicoes] = useState<string>("");
  const [bancoQuotaNormal, setBancoQuotaNormal] = useState<string>("");
  const [destinatarioQuotaNormal, setDestinatarioQuotaNormal] = useState<string>("");
  const [bancoContribuicoes, setBancoContribuicoes] = useState<string>("");
  const [destinatarioContribuicoes, setDestinatarioContribuicoes] = useState<string>("");
  const [showIndividualPayments, setShowIndividualPayments] = useState(false);
  const [individualPaymentMonth, setIndividualPaymentMonth] = useState(new Date().getMonth());
  const [individualPaymentYear, setIndividualPaymentYear] = useState(new Date().getFullYear());
  const [selectedResident, setSelectedResident] = useState<string>("");

  // ✅ SINCRONIZAÇÃO UNIFICADA: Usar hook centralizado
  const { 
    stats, 
    payments, 
    loading, 
    refreshing, 
    refreshData,
    markPaymentAsPaid 
  } = useFinancialSync(profile?.condominium_id, selectedMonth, selectedYear);

  // Setup real-time subscriptions for immediate updates
  useEffect(() => {
    if (!profile?.condominium_id) return;

    console.log('FinancialManagement - Setting up comprehensive realtime subscription');
    
    const paymentsChannel = supabase
      .channel(`financial-control-payments-${profile.condominium_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => {
          console.log('FinancialManagement - Payment change detected:', payload);
          // Immediate refresh with slight delay for database consistency
          setTimeout(() => {
            refreshData();
          }, 50);
        }
      )
      .subscribe((status) => {
        console.log('FinancialManagement - Payments subscription status:', status);
      });

    const condoChannel = supabase
      .channel(`financial-control-condo-${profile.condominium_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'condominiums',
          filter: `id=eq.${profile.condominium_id}`
        },
        (payload) => {
          console.log('FinancialManagement - Condominium updated:', payload);
          if (payload.new?.current_monthly_fee) {
            setCurrentMonthlyFee(payload.new.current_monthly_fee);
          }
          if (payload.new?.iban_quota_normal) {
            setIbanQuotaNormal(payload.new.iban_quota_normal);
          }
          if (payload.new?.iban_contribuicoes_especificas) {
            setIbanContribuicoes(payload.new.iban_contribuicoes_especificas);
          }
          if (payload.new?.banco_quota_normal) {
            setBancoQuotaNormal(payload.new.banco_quota_normal);
          }
          if (payload.new?.destinatario_quota_normal) {
            setDestinatarioQuotaNormal(payload.new.destinatario_quota_normal);
          }
          if (payload.new?.banco_contribuicoes_especificas) {
            setBancoContribuicoes(payload.new.banco_contribuicoes_especificas);
          }
          if (payload.new?.destinatario_contribuicoes_especificas) {
            setDestinatarioContribuicoes(payload.new.destinatario_contribuicoes_especificas);
          }
        }
      )
      .subscribe((status) => {
        console.log('FinancialManagement - Condominium subscription status:', status);
      });

    return () => {
      console.log('FinancialManagement - Cleaning up subscriptions');
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(condoChannel);
    };
  }, [profile?.condominium_id]);

  useEffect(() => {
    if (profile?.condominium_id) {
      refreshData();
      fetchCurrentMonthlyFee();
      fetchResidents();
    }
  }, [selectedMonth, selectedYear, profile?.condominium_id]);

  // Comprehensive data refresh function
  const refreshAllData = async () => {
    await Promise.all([
      refreshData(),
      fetchCurrentMonthlyFee(),
      fetchResidents()
    ]);
  };

  const handleManualRefresh = async () => {
    try {
      await Promise.all([
        refreshData(),
        fetchCurrentMonthlyFee(),
        fetchResidents()
      ]);
      toast({
        title: "Atualizado",
        description: "Dados atualizados com sucesso"
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados",
        variant: "destructive"
      });
    }
  };

  const fetchCurrentMonthlyFee = async () => {
    try {
      const { data, error } = await supabase
        .from('condominiums')
        .select(`
          current_monthly_fee, 
          iban_quota_normal, 
          iban_contribuicoes_especificas,
          banco_quota_normal,
          destinatario_quota_normal,
          banco_contribuicoes_especificas,
          destinatario_contribuicoes_especificas
        `)
        .eq('id', profile?.condominium_id)
        .single();

      if (error) throw error;
      if (data?.current_monthly_fee) {
        setCurrentMonthlyFee(data.current_monthly_fee);
      }
      if (data?.iban_quota_normal) {
        setIbanQuotaNormal(data.iban_quota_normal);
      }
      if (data?.iban_contribuicoes_especificas) {
        setIbanContribuicoes(data.iban_contribuicoes_especificas);
      }
      if (data?.banco_quota_normal) {
        setBancoQuotaNormal(data.banco_quota_normal);
      }
      if (data?.destinatario_quota_normal) {
        setDestinatarioQuotaNormal(data.destinatario_quota_normal);
      }
      if (data?.banco_contribuicoes_especificas) {
        setBancoContribuicoes(data.banco_contribuicoes_especificas);
      }
      if (data?.destinatario_contribuicoes_especificas) {
        setDestinatarioContribuicoes(data.destinatario_contribuicoes_especificas);
      }
    } catch (error) {
      console.error('Error fetching monthly fee:', error);
    }
  };

  const fetchResidents = async () => {
    try {
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          apartment_number,
          profiles(first_name, last_name)
        `)
        .eq('condominium_id', profile?.condominium_id)
        .order('apartment_number');

      if (error) throw error;
      setResidents(data || []);
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  const updateMonthlyFee = async (newFee: number) => {
    try {
      console.log('Updating monthly fee:', { newFee, condominiumId: profile?.condominium_id });
      
      const { error } = await supabase
        .from('condominiums')
        .update({ current_monthly_fee: newFee })
        .eq('id', profile?.condominium_id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Monthly fee updated successfully');
      toast({
        title: "Sucesso",
        description: "Quota mensal atualizada com sucesso"
      });
      
      await fetchCurrentMonthlyFee();
    } catch (error: any) {
      console.error('Error updating monthly fee:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar quota mensal",
        variant: "destructive"
      });
    }
  };

  const updateBankingInfoQuotaNormal = async () => {
    try {
      const { error } = await supabase
        .from('condominiums')
        .update({ 
          iban_quota_normal: ibanQuotaNormal,
          banco_quota_normal: bancoQuotaNormal,
          destinatario_quota_normal: destinatarioQuotaNormal
        })
        .eq('id', profile?.condominium_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Informações bancárias para quotas atualizadas com sucesso"
      });
      
      await fetchCurrentMonthlyFee();
    } catch (error: any) {
      console.error('Error updating banking info:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar informações bancárias",
        variant: "destructive"
      });
    }
  };

  const updateBankingInfoContribuicoes = async () => {
    try {
      const { error } = await supabase
        .from('condominiums')
        .update({ 
          iban_contribuicoes_especificas: ibanContribuicoes,
          banco_contribuicoes_especificas: bancoContribuicoes,
          destinatario_contribuicoes_especificas: destinatarioContribuicoes
        })
        .eq('id', profile?.condominium_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Informações bancárias para contribuições atualizadas com sucesso"
      });
      
      await fetchCurrentMonthlyFee();
    } catch (error: any) {
      console.error('Error updating banking info:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar informações bancárias",
        variant: "destructive"
      });
    }
  };

  const confirmPaymentForResident = async () => {
    if (!selectedResident) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um morador",
        variant: "destructive"
      });
      return;
    }

    try {
      const referenceMonth = new Date(individualPaymentYear, individualPaymentMonth, 1);
      const dueDate = new Date(individualPaymentYear, individualPaymentMonth + 1, 10);
      
      // Check if payment already exists
      const { data: existingPayment, error: checkError } = await supabase
        .from('payments')
        .select('id')
        .eq('resident_id', selectedResident)
        .eq('reference_month', referenceMonth.toISOString().split('T')[0])
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      if (existingPayment) {
        toast({
          title: "Info",
          description: "Pagamento já existe para este morador neste mês",
          variant: "default"
        });
        return;
      }

      console.log('Creating new payment:', {
        resident_id: selectedResident,
        reference_month: referenceMonth.toISOString().split('T')[0],
        amount: currentMonthlyFee
      });

      const { error } = await supabase
        .from('payments')
        .insert({
          condominium_id: profile?.condominium_id,
          resident_id: selectedResident,
          description: `Quota mensal - ${months[individualPaymentMonth]} ${individualPaymentYear}`,
          amount: currentMonthlyFee,
          currency: 'AOA',
          due_date: dueDate.toISOString().split('T')[0],
          reference_month: referenceMonth.toISOString().split('T')[0],
          status: 'pending'
        });

      if (error) throw error;

      console.log('Payment created successfully');

      toast({
        title: "Sucesso",
        description: "Pagamento confirmado e disponível no Controle Financeiro"
      });

      // Reset selection and refresh data
      setSelectedResident("");
      await refreshAllData();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar pagamento",
        variant: "destructive"
      });
    }
  };

  // Remove fetchPayments function as it's handled by useFinancialSync
  // Remove calculateStats function as it's handled by useFinancialSync

  const markAsPaid = async (paymentId: string) => {
    try {
      console.log('🎯 Marking payment as paid - using unified sync system:', { 
        paymentId, 
        currentMonth: selectedMonth + 1, 
        currentYear: selectedYear 
      });
      
      await markPaymentAsPaid(paymentId);
      
      // Update stats callback
      onStatsUpdate?.();
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o pagamento",
        variant: "destructive"
      });
    }
  };

  const generateMonthlyPayments = async () => {
    try {
      const referenceMonth = new Date(selectedYear, selectedMonth, 1);
      
      console.log('Generating monthly payments for:', {
        condominiumId: profile?.condominium_id,
        referenceMonth: referenceMonth.toISOString().split('T')[0],
        selectedMonth,
        selectedYear,
        currentMonthlyFee
      });

      const { data, error } = await supabase.rpc('generate_monthly_payments', {
        _condominium_id: profile?.condominium_id,
        _reference_month: referenceMonth.toISOString().split('T')[0],
        _amount: currentMonthlyFee,
        _description: `Quota mensal - ${months[selectedMonth]} ${selectedYear}`,
        _due_days: 10
      });

      if (error) throw error;

      console.log('Monthly payments generated:', data);

      toast({
        title: "Sucesso",
        description: `${data} pagamentos gerados para ${months[selectedMonth]} ${selectedYear}`,
      });

      // Refresh data via unified sync
      await refreshData();
    } catch (error: any) {
      console.error('Error generating payments:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar pagamentos mensais",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Em atraso</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AOA') => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency,
    }).format(Number(amount));
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.residents?.profiles?.first_name
      ?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.residents?.profiles?.last_name
        ?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.residents?.apartment_number
        ?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Controle Financeiro</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Todos os pagamentos de quotas em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowIndividualPayments(!showIndividualPayments)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            {showIndividualPayments ? 'Ocultar' : 'Gerar'} Pagamentos Individuais
          </Button>
        </div>
      </div>

      {/* Monthly Fee Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Quota Mensal Atual</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Valor da Quota Mensal (Kz)</label>
              <Input
                type="number"
                value={currentMonthlyFee}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  console.log('Input value changed:', value);
                  setCurrentMonthlyFee(value);
                }}
                placeholder="50000"
                className="mt-1"
                min="0"
                step="1000"
              />
            </div>
            <Button 
              onClick={() => {
                console.log('Attempting to update fee to:', currentMonthlyFee);
                updateMonthlyFee(currentMonthlyFee);
              }}
              disabled={!currentMonthlyFee || currentMonthlyFee <= 0}
            >
              Atualizar Quota
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Quota atual: {formatCurrency(currentMonthlyFee)} - Esta será aplicada a todos os novos pagamentos gerados
          </p>
        </CardContent>
      </Card>

      {/* IBAN Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Contas Bancárias (IBANs)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* IBAN Quota Normal */}
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium text-sm">Quotas Mensais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome do Banco</label>
                  <Input
                    value={bancoQuotaNormal}
                    onChange={(e) => setBancoQuotaNormal(e.target.value)}
                    placeholder="Ex: Banco Millennium Atlântico"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nome do Destinatário</label>
                  <Input
                    value={destinatarioQuotaNormal}
                    onChange={(e) => setDestinatarioQuotaNormal(e.target.value)}
                    placeholder="Ex: Condomínio Jardim de Rosas Real"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">IBAN</label>
                <Input
                  value={ibanQuotaNormal}
                  onChange={(e) => setIbanQuotaNormal(e.target.value)}
                  placeholder="Ex: AO06 0040 0000 1234 5678 9012 3"
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={() => updateBankingInfoQuotaNormal()}
                disabled={!ibanQuotaNormal || !bancoQuotaNormal || !destinatarioQuotaNormal}
                className="w-full"
              >
                Atualizar Informações Bancárias - Quotas
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Informações utilizadas pelos residentes para pagamento das quotas mensais
              </p>
            </div>

            {/* IBAN Contribuições Específicas */}
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium text-sm">Contribuições Específicas</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome do Banco</label>
                  <Input
                    value={bancoContribuicoes}
                    onChange={(e) => setBancoContribuicoes(e.target.value)}
                    placeholder="Ex: Banco BAI"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nome do Destinatário</label>
                  <Input
                    value={destinatarioContribuicoes}
                    onChange={(e) => setDestinatarioContribuicoes(e.target.value)}
                    placeholder="Ex: Condomínio JRR - Contribuições"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">IBAN</label>
                <Input
                  value={ibanContribuicoes}
                  onChange={(e) => setIbanContribuicoes(e.target.value)}
                  placeholder="Ex: AO06 0040 0000 9876 5432 1098 7"
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={() => updateBankingInfoContribuicoes()}
                disabled={!ibanContribuicoes || !bancoContribuicoes || !destinatarioContribuicoes}
                className="w-full"
              >
                Atualizar Informações Bancárias - Contribuições
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Informações utilizadas pelos residentes para contribuições específicas e campanhas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Payment Generation */}
      {showIndividualPayments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Gerar Pagamentos Individuais</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Resident Selection */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  Selecionar Morador
                </h4>
                <Select value={selectedResident} onValueChange={setSelectedResident}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o morador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((resident) => (
                      <SelectItem key={resident.id} value={resident.id}>
                        {resident.profiles?.first_name} {resident.profiles?.last_name} - Apartamento {resident.apartment_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month/Year Selection for Individual Payments */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Selecionar Mês de Referência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Mês</label>
                    <Select 
                      value={individualPaymentMonth.toString()} 
                      onValueChange={(value) => setIndividualPaymentMonth(parseInt(value, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Ano</label>
                    <Select 
                      value={individualPaymentYear.toString()} 
                      onValueChange={(value) => setIndividualPaymentYear(parseInt(value, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              {selectedResident && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center text-primary">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Resumo do Pagamento
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Morador:</span>
                      <span className="font-medium">
                        {residents.find(r => r.id === selectedResident)?.profiles?.first_name} {residents.find(r => r.id === selectedResident)?.profiles?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Apartamento:</span>
                      <span className="font-medium">
                        {residents.find(r => r.id === selectedResident)?.apartment_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Período:</span>
                      <span className="font-medium">
                        {months[individualPaymentMonth]} {individualPaymentYear}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor:</span>
                      <span className="font-medium text-primary">
                        {formatCurrency(currentMonthlyFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Vencimento:</span>
                      <span>
                        10 de {months[individualPaymentMonth === 11 ? 0 : individualPaymentMonth + 1]} {individualPaymentMonth === 11 ? individualPaymentYear + 1 : individualPaymentYear}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Button */}
              <div className="flex justify-center">
                <Button
                  onClick={confirmPaymentForResident}
                  disabled={!selectedResident || loading}
                  size="lg"
                  className="px-8"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirmar e Adicionar ao Controle Financeiro
                </Button>
              </div>

              {residents.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    <Calculator className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    <p>Nenhum morador encontrado</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalReceived)}
                </p>
                <p className="text-sm text-muted-foreground">Recebido</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-sm text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalOverdue)}
                </p>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.currentMonth)}
                </p>
                <p className="text-sm text-muted-foreground">Total Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar morador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleManualRefresh} className="w-full" disabled={refreshing}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Controle Financeiro - Todos os Pagamentos ({filteredPayments.length})</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Exibindo: {months[selectedMonth]} {selectedYear}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum pagamento encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há pagamentos para {months[selectedMonth]} {selectedYear}.
              </p>
              <div className="mt-4 space-x-2">
                <Button 
                  onClick={generateMonthlyPayments} 
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Pagamentos para {months[selectedMonth]} {selectedYear}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowIndividualPayments(true)}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Ou Gerar Pagamento Individual
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Morador</TableHead>
                  <TableHead>Apartamento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.residents?.profiles?.first_name} {payment.residents?.profiles?.last_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.residents?.apartment_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{payment.description}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: pt })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      {(payment.status === 'pending' || payment.status === 'overdue') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPaid(payment.id)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Marcar como Pago
                        </Button>
                      )}
                      {payment.status === 'paid' && payment.payment_date && (
                        <p className="text-xs text-muted-foreground">
                          Pago em {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: pt })}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
