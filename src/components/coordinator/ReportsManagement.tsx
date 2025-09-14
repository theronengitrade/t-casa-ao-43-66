import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  FileText, 
  Users, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Home,
  AlertCircle,
  CheckCircle,
  Receipt,
  FileCheck,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useRemanescenteAnual } from "@/hooks/useRemanescenteAnual";

interface ReportStats {
  residents: number;
  visitors: number;
  announcements: number;
  payments: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  occupancy: number;
  expenses: {
    total: number;
    receita_atual: number;
    remanescente: number;
  };
}

export function ReportsManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [reportData, setReportData] = useState<ReportStats>({
    residents: 0,
    visitors: 0,
    announcements: 0,
    payments: {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0
    },
    occupancy: 0,
    expenses: {
      total: 0,
      receita_atual: 0,
      remanescente: 0
    }
  });

  const { 
    saldoData, 
    loading: saldoLoading 
  } = useRemanescenteAnual(profile?.condominium_id);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, profile?.condominium_id]);

  const fetchReportData = async () => {
    if (!profile?.condominium_id) return;
    
    try {
      setLoading(true);

      // Get current date ranges based on selected period
      const now = new Date();
      let startDate: Date, endDate: Date;

      switch (selectedPeriod) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Fetch all data in parallel
      const [residentsRes, visitorsRes, announcementsRes, paymentsRes, expensesRes, condominiumRes] = await Promise.all([
        supabase
          .from('residents')
          .select('id')
          .eq('condominium_id', profile.condominium_id),
        
        supabase
          .from('visitors')
          .select('id')
          .eq('condominium_id', profile.condominium_id)
          .gte('visit_date', startDate.toISOString().split('T')[0])
          .lte('visit_date', endDate.toISOString().split('T')[0]),
        
        supabase
          .from('announcements')
          .select('id')
          .eq('condominium_id', profile.condominium_id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        supabase
          .from('payments')
          .select('amount, status, currency')
          .eq('condominium_id', profile.condominium_id)
          .gte('reference_month', startDate.toISOString().split('T')[0])
          .lte('reference_month', endDate.toISOString().split('T')[0]),
        
        supabase
          .from('expenses')
          .select('amount, fonte_pagamento')
          .eq('condominium_id', profile.condominium_id)
          .gte('expense_date', startDate.toISOString().split('T')[0])
          .lte('expense_date', endDate.toISOString().split('T')[0]),

        supabase
          .from('condominiums')
          .select('name, address, phone, email, currency')
          .eq('id', profile.condominium_id)
          .single()
      ]);

      // Handle errors
      if (residentsRes.error) throw residentsRes.error;
      if (visitorsRes.error) throw visitorsRes.error;
      if (announcementsRes.error) throw announcementsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      // Calculate payment statistics
      const totalPayments = paymentsRes.data?.length || 0;
      const paidPayments = paymentsRes.data?.filter(p => p.status === 'paid').length || 0;
      const pendingPayments = paymentsRes.data?.filter(p => p.status === 'pending').length || 0;
      const overduePayments = paymentsRes.data?.filter(p => p.status === 'overdue').length || 0;

      // Calculate expenses by source
      const totalExpenses = expensesRes.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const receitaExpenses = expensesRes.data?.filter(exp => exp.fonte_pagamento === 'receita_atual')
        .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const remanescenteExpenses = expensesRes.data?.filter(exp => exp.fonte_pagamento === 'remanescente')
        .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      setReportData({
        residents: residentsRes.data?.length || 0,
        visitors: visitorsRes.data?.length || 0,
        announcements: announcementsRes.data?.length || 0,
        payments: {
          total: totalPayments,
          paid: paidPayments,
          pending: pendingPayments,
          overdue: overduePayments
        },
        occupancy: Math.round((residentsRes.data?.length || 0) / 100 * 100), // Assuming 100 max units
        expenses: {
          total: totalExpenses,
          receita_atual: receitaExpenses,
          remanescente: remanescenteExpenses
        }
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      toast({
        title: "Gerando Relatório",
        description: `O relatório ${reportType} está sendo gerado...`
      });

      // Fetch detailed condominium info
      const { data: condominiumData } = await supabase
        .from('condominiums')
        .select('name, address, phone, email, currency')
        .eq('id', profile.condominium_id)
        .single();

      // Fetch detailed residents data
      const { data: residentsData } = await supabase
        .from('residents')
        .select(`
          id,
          apartment_number,
          floor,
          document_number,
          is_owner,
          move_in_date,
          emergency_contact_name,
          emergency_contact_phone,
          parking_spaces,
          family_members,
          profiles!inner(
            first_name,
            last_name,
            phone,
            user_id
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .order('apartment_number');

      // Fetch visitors data based on period
      const periodFilter = getPeriodFilter();
      const { data: visitorsData } = await supabase
        .from('visitors')
        .select(`
          id,
          name,
          phone,
          document_number,
          visit_date,
          visit_time,
          purpose,
          approved,
          residents!inner(
            apartment_number,
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .gte('visit_date', periodFilter.startDate)
        .lte('visit_date', periodFilter.endDate)
        .order('visit_date', { ascending: false });

      // Fetch announcements data
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          published,
          is_urgent,
          priority,
          created_at,
          expires_at,
          profiles!inner(
            first_name,
            last_name
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', periodFilter.startDate)
        .lte('created_at', periodFilter.endDate)
        .order('created_at', { ascending: false });

      // Fetch payments data
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          currency,
          due_date,
          payment_date,
          status,
          description,
          reference_month,
          residents!inner(
            apartment_number,
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .gte('reference_month', periodFilter.startDate)
        .lte('reference_month', periodFilter.endDate)
        .order('reference_month', { ascending: false });

      // Fetch space reservations data
      const { data: reservationsData } = await supabase
        .from('space_reservations')
        .select(`
          id,
          space_name,
          reservation_date,
          start_time,
          end_time,
          purpose,
          approved,
          approved_at,
          residents!inner(
            apartment_number,
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .gte('reservation_date', periodFilter.startDate)
        .lte('reservation_date', periodFilter.endDate)
        .order('reservation_date', { ascending: false });

      // Fetch expenses data
      const { data: expensesData } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          category,
          expense_date,
          fonte_pagamento,
          service_providers(
            name,
            service_type
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .gte('expense_date', periodFilter.startDate)
        .lte('expense_date', periodFilter.endDate)
        .order('expense_date', { ascending: false });

      const { ReportGenerator } = await import("@/lib/reportGenerator");
      const reportGenerator = new ReportGenerator();
      
      const enhancedData = {
        ...reportData,
        condominiumInfo: {
          name: condominiumData?.name || 'Condomínio',
          address: condominiumData?.address || 'Endereço do condomínio',
          currency: condominiumData?.currency || 'AOA',
          phone: condominiumData?.phone,
          email: condominiumData?.email
        },
        period: getPeriodLabel(),
        remanescente: saldoData,
        // Detailed data for reports
        detailedResidents: residentsData || [],
        detailedVisitors: visitorsData || [],
        detailedAnnouncements: announcementsData || [],
        detailedPayments: paymentsData || [],
        detailedReservations: reservationsData || [],
        detailedExpenses: expensesData || []
      };

      const filename = `${reportType.toLowerCase().replace(/\s+/g, '-')}-${selectedPeriod}-${Date.now()}.pdf`;

      switch (reportType) {
        case 'Moradores':
          reportGenerator.generateResidentsReport(enhancedData);
          break;
        case 'Financeiro':
          reportGenerator.generateFinancialReport(enhancedData);
          break;
        case 'Visitantes':
          reportGenerator.generateVisitorsReport(enhancedData);
          break;
        case 'Anúncios':
          reportGenerator.generateAnnouncementsReport(enhancedData);
          break;
        case 'Reservas de Espaços':
          reportGenerator.generateReservationsReport(enhancedData);
          break;
        case 'Completo':
          reportGenerator.generateComprehensiveReport(enhancedData);
          break;
        default:
          reportGenerator.generateComprehensiveReport(enhancedData);
      }

      reportGenerator.save(filename);

      toast({
        title: "Relatório Gerado",
        description: "O relatório foi gerado e baixado com sucesso!"
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPeriodFilter = () => {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (selectedPeriod) {
      case 'current_month':
        startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
        endDate = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
        break;
      case 'last_month':
        startDate = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM-dd');
        endDate = format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd');
        break;
      case 'current_year':
        startDate = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd');
        break;
      default:
        startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
        endDate = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
    }

    return { startDate, endDate };
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current_month':
        return 'Mês Atual';
      case 'last_month':
        return 'Mês Anterior';
      case 'current_year':
        return 'Ano Atual';
      default:
        return 'Mês Atual';
    }
  };

  const reportTypes = [
    {
      id: 'Moradores',
      title: 'Relatório de Moradores',
      description: 'Lista completa de moradores com informações de contato',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      id: 'Financeiro',
      title: 'Relatório Financeiro',
      description: 'Resumo financeiro com receitas, despesas e remanescentes',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'Visitantes',
      title: 'Relatório de Visitantes',
      description: 'Registro de visitantes e controle de acesso',
      icon: Home,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      id: 'Anúncios',
      title: 'Relatório de Anúncios',
      description: 'Histórico de anúncios e comunicações',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      id: 'Reservas de Espaços',
      title: 'Relatório de Reservas',
      description: 'Uso de espaços comuns e reservas',
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      id: 'Completo',
      title: 'Relatório Completo',
      description: 'Relatório abrangente com todas as informações',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centro de Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Gere documentos profissionais e relatórios detalhados do condomínio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Anterior</SelectItem>
              <SelectItem value="current_year">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{reportData.residents}</p>
                <p className="text-sm text-muted-foreground">Moradores</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{reportData.visitors}</p>
                <p className="text-sm text-muted-foreground">Visitantes ({getPeriodLabel()})</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{reportData.announcements}</p>
                <p className="text-sm text-muted-foreground">Anúncios ({getPeriodLabel()})</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{reportData.occupancy}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Statistics */}
      <Card className="feature-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Estatísticas de Pagamentos - {getPeriodLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-accent/20 border border-border">
              <p className="text-2xl font-bold text-primary">{reportData.payments.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{reportData.payments.paid}</p>
              </div>
              <p className="text-sm text-muted-foreground">Pagos</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
              <p className="text-2xl font-bold text-yellow-600">{reportData.payments.pending}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{reportData.payments.overdue}</p>
              </div>
              <p className="text-sm text-muted-foreground">Em Atraso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="management-reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="management-reports">Relatórios Gerenciais</TabsTrigger>
          <TabsTrigger value="receipts">Recibos e Comprovativos</TabsTrigger>
          <TabsTrigger value="custom-reports">Relatórios Personalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="management-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Relatórios Gerenciais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((report) => {
                  const IconComponent = report.icon;
                  return (
                    <Card key={report.id} className="feature-card border hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${report.bgColor} rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`h-5 w-5 ${report.color}`} />
                          </div>
                          <h3 className="font-semibold text-foreground">{report.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full brand-glow"
                          onClick={() => generateReport(report.id)}
                          disabled={loading}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Recibos e Comprovativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="feature-card border hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">Recibos para Prestadores</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gere recibos profissionais após pagamentos a prestadores de serviços
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => toast({
                        title: "Em Desenvolvimento",
                        description: "Esta funcionalidade será disponibilizada em breve."
                      })}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Acessar Prestadores
                    </Button>
                  </CardContent>
                </Card>

                <Card className="feature-card border hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <FileCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold">Comprovativos para Residentes</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Emita comprovativos de pagamento de quotas mensais e contribuições
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => toast({
                        title: "Em Desenvolvimento", 
                        description: "Esta funcionalidade será disponibilizada em breve."
                      })}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Acessar Residentes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Relatórios Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center mx-auto">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Relatórios Personalizados</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Funcionalidade em desenvolvimento. Em breve você poderá criar relatórios customizados com filtros específicos e critérios personalizados.
                  </p>
                </div>
                <Badge variant="secondary" className="mt-4">
                  Próxima Atualização
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}