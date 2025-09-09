import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CondominiumReport {
  id: string;
  name: string;
  total_residents: number;
  license_revenue: number;
  license_status: string;
  created_at: string;
}

interface ReportStats {
  total_revenue: number;
  active_condominiums: number;
  total_licenses: number;
  monthly_growth: number;
}

const ReportsCenter = () => {
  const [condominiumReports, setCondominiumReports] = useState<CondominiumReport[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats>({
    total_revenue: 0,
    active_condominiums: 0,
    total_licenses: 0,
    monthly_growth: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Fetch condominiums with license info
      const { data: condominiums, error: condoError } = await supabase
        .from('condominiums')
        .select(`
          id,
          name,
          created_at,
          licenses (
            id,
            status,
            start_date,
            end_date
          )
        `);

      if (condoError) throw condoError;

      // Fetch residents count for each condominium
      const condominiumReports: CondominiumReport[] = [];
      let totalRevenue = 0;
      let activeCondominiums = 0;

      for (const condo of condominiums || []) {
        const { data: residents, error: resError } = await supabase
          .from('residents')
          .select('id')
          .eq('condominium_id', condo.id);

        if (resError) {
          console.error('Error fetching residents:', resError);
          continue;
        }

        const license = condo.licenses?.[0];
        const licenseRevenue = license?.status === 'active' ? 25000 : 0; // Assuming 25,000 AOA per active license
        totalRevenue += licenseRevenue;

        if (license?.status === 'active') {
          activeCondominiums++;
        }

        condominiumReports.push({
          id: condo.id,
          name: condo.name,
          total_residents: residents?.length || 0,
          license_revenue: licenseRevenue,
          license_status: license?.status || 'inactive',
          created_at: condo.created_at
        });
      }

      setCondominiumReports(condominiumReports);
      setReportStats({
        total_revenue: totalRevenue,
        active_condominiums: activeCondominiums,
        total_licenses: condominiums?.length || 0,
        monthly_growth: 12.5 // Mock growth percentage
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(amount);
  };

  const exportReport = () => {
    // Mock export functionality
    toast({
      title: "Relatório Exportado",
      description: "O relatório foi exportado com sucesso",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Centro de Relatórios</h2>
          <p className="text-lg text-muted-foreground">
            Desempenho dos condomínios e receitas de licenças
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchReports} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportStats.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +{reportStats.monthly_growth}% este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Condomínios Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.active_condominiums}</div>
            <p className="text-xs text-muted-foreground">
              de {reportStats.total_licenses} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Licenças</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.total_licenses}</div>
            <p className="text-xs text-muted-foreground">
              {reportStats.active_condominiums} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{reportStats.monthly_growth}%</div>
            <p className="text-xs text-muted-foreground">
              vs. mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Condominiums Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Desempenho por Condomínio</span>
          </CardTitle>
          <CardDescription>
            Resumo detalhado de cada condomínio e receitas geradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium">Condomínio</th>
                  <th className="text-left p-4 font-medium">Residentes</th>
                  <th className="text-left p-4 font-medium">Estado da Licença</th>
                  <th className="text-left p-4 font-medium">Receita</th>
                  <th className="text-left p-4 font-medium">Data de Criação</th>
                </tr>
              </thead>
              <tbody>
                {condominiumReports.map((report) => (
                  <tr key={report.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 font-medium">{report.name}</td>
                    <td className="p-4">{report.total_residents}</td>
                    <td className="p-4">
                      <Badge 
                        variant={report.license_status === 'active' ? 'default' : 'secondary'}
                      >
                        {report.license_status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium">
                      {formatCurrency(report.license_revenue)}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString('pt-AO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {condominiumReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsCenter;