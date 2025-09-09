import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Building2,
  MapPin,
  Calendar
} from "lucide-react";

interface DashboardData {
  cityStats: {
    name: string;
    total_condominiums: number;
    paid_condominiums: number;
    pending_condominiums: number;
    overdue_condominiums: number;
    total_revenue: number;
  }[];
  planStats: {
    plan: string;
    count: number;
    revenue: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
  overallStats: {
    total_cities: number;
    total_condominiums: number;
    total_revenue: number;
    payment_rate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const FinancialDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch cities with condominium stats
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select(`
          id,
          name,
          condominium_cities(
            condominium_id,
            condominiums(
              id,
              name,
              payment_plan,
              apartment_count,
              monthly_fee_per_apartment
            )
          )
        `);

      if (citiesError) throw citiesError;

      // Fetch payment data for the selected year
      const { data: payments, error: paymentsError } = await supabase
        .from('condominium_payments')
        .select(`
          *,
          condominiums(
            id,
            name,
            payment_plan,
            condominium_cities(
              city_id,
              cities(name)
            )
          )
        `)
        .eq('year', selectedYear);

      if (paymentsError) throw paymentsError;

      // Process data
      const cityStats = cities?.map(city => {
        const cityCondos = city.condominium_cities || [];
        const total_condominiums = cityCondos.length;
        
        const cityPayments = payments?.filter(payment => 
          payment.condominiums?.condominium_cities?.[0]?.city_id === city.id
        ) || [];

        const paid_condominiums = new Set(
          cityPayments.filter(p => p.status === 'paid').map(p => p.condominium_id)
        ).size;
        
        const pending_condominiums = new Set(
          cityPayments.filter(p => p.status === 'pending').map(p => p.condominium_id)
        ).size;
        
        const overdue_condominiums = new Set(
          cityPayments.filter(p => p.status === 'overdue').map(p => p.condominium_id)
        ).size;

        const total_revenue = cityPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          name: city.name,
          total_condominiums,
          paid_condominiums,
          pending_condominiums,
          overdue_condominiums,
          total_revenue
        };
      }) || [];

      // Calculate plan statistics
      const planStats = ['monthly', 'biannual', 'annual'].map(plan => {
        const planCondos = cities?.flatMap(city => 
          city.condominium_cities?.filter(cc => 
            cc.condominiums?.payment_plan === plan
          ) || []
        ) || [];

        const planPayments = payments?.filter(payment => 
          payment.condominiums?.payment_plan === plan && payment.status === 'paid'
        ) || [];

        return {
          plan: plan === 'monthly' ? 'Mensal' : plan === 'biannual' ? 'Semestral' : 'Anual',
          count: planCondos.length,
          revenue: planPayments.reduce((sum, p) => sum + p.amount, 0)
        };
      });

      // Calculate monthly revenue
      const monthlyRevenue = monthNames.map((month, index) => {
        const monthPayments = payments?.filter(p => 
          p.month === index + 1 && p.status === 'paid'
        ) || [];
        
        return {
          month,
          revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0)
        };
      });

      // Calculate overall stats
      const total_cities = cities?.length || 0;
      const total_condominiums = cities?.reduce((sum, city) => 
        sum + (city.condominium_cities?.length || 0), 0
      ) || 0;
      const total_revenue = payments?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0) || 0;
      const total_payments = payments?.length || 0;
      const paid_payments = payments?.filter(p => p.status === 'paid').length || 0;
      const payment_rate = total_payments > 0 ? (paid_payments / total_payments) * 100 : 0;

      const overallStats = {
        total_cities,
        total_condominiums,
        total_revenue,
        payment_rate
      };

      setDashboardData({
        cityStats,
        planStats,
        monthlyRevenue,
        overallStats
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const statusData = [
    { name: 'Pagos', value: dashboardData.cityStats.reduce((sum, city) => sum + city.paid_condominiums, 0) },
    { name: 'Pendentes', value: dashboardData.cityStats.reduce((sum, city) => sum + city.pending_condominiums, 0) },
    { name: 'Em Atraso', value: dashboardData.cityStats.reduce((sum, city) => sum + city.overdue_condominiums, 0) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das receitas e estatísticas do sistema
          </p>
        </div>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cidades</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overallStats.total_cities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Condomínios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overallStats.total_condominiums}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.overallStats.total_revenue.toLocaleString()} AOA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
            {dashboardData.overallStats.payment_rate >= 80 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.overallStats.payment_rate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pagamentos</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal - {selectedYear}</CardTitle>
            <CardDescription>Evolução das receitas por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} AOA`, 'Receita']} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Cidade */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por Cidade</CardTitle>
          <CardDescription>Performance financeira por cidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.cityStats.map(city => (
              <div key={city.name} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <h3 className="font-semibold">{city.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{city.total_condominiums} condomínios</span>
                    <span>{city.total_revenue.toLocaleString()} AOA</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {city.paid_condominiums} pagos
                  </Badge>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {city.pending_condominiums} pendentes
                  </Badge>
                  {city.overdue_condominiums > 0 && (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {city.overdue_condominiums} em atraso
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Plano de Pagamento</CardTitle>
          <CardDescription>Distribuição de receitas por tipo de plano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.planStats.map(plan => (
              <div key={plan.plan} className="text-center p-4 rounded-lg border">
                <h3 className="font-semibold text-lg">{plan.plan}</h3>
                <p className="text-2xl font-bold text-primary mt-2">
                  {plan.revenue.toLocaleString()} AOA
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.count} condomínios
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;