import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Download,
  Edit,
  BarChart3,
  PieChart
} from "lucide-react";

interface City {
  id: string;
  name: string;
  country: string;
  created_at: string;
}

interface Condominium {
  id: string;
  name: string;
  address: string;
  apartment_count: number;
  monthly_fee_per_apartment: number;
  payment_plan: string;
  created_at: string;
}

interface CondominiumPayment {
  id: string;
  condominium_id: string;
  year: number;
  month: number;
  status: string;
  amount: number;
  payment_date?: string;
  notes?: string;
}

interface CityStats {
  total_condominiums: number;
  paid_condominiums: number;
  pending_condominiums: number;
  overdue_condominiums: number;
  total_revenue: number;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const FinancialPortal = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominium, setSelectedCondominium] = useState<Condominium | null>(null);
  const [payments, setPayments] = useState<CondominiumPayment[]>([]);
  const [cityStats, setCityStats] = useState<Record<string, CityStats>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddCondominium, setShowAddCondominium] = useState(false);
  const [newCondoData, setNewCondoData] = useState<{
    name: string;
    address: string;
    apartment_count: number;
    monthly_fee_per_apartment: number;
    payment_plan: 'monthly' | 'biannual' | 'annual';
  }>({
    name: '',
    address: '',
    apartment_count: 0,
    monthly_fee_per_apartment: 0,
    payment_plan: 'monthly'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchCityCondominiums(selectedCity.id);
      fetchCityStats(selectedCity.id);
    }
  }, [selectedCity, selectedYear]);

  useEffect(() => {
    if (selectedCondominium) {
      fetchCondominiumPayments(selectedCondominium.id);
    }
  }, [selectedCondominium, selectedYear]);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cidades",
        variant: "destructive"
      });
    }
  };

  const fetchCityCondominiums = async (cityId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('condominiums')
        .select(`
          *,
          condominium_cities!inner(city_id)
        `)
        .eq('condominium_cities.city_id', cityId)
        .order('name');

      if (error) throw error;
      const condoData = (data || []).map(c => ({
        ...c,
        payment_plan: c.payment_plan || 'monthly'
      }));
      setCondominiums(condoData as Condominium[]);
    } catch (error) {
      console.error('Error fetching condominiums:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar condomínios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCityStats = async (cityId: string) => {
    try {
      const { data: revenueData, error } = await supabase.rpc('calculate_revenue_stats', {
        _city_id: cityId
      });

      if (error) throw error;

      // Calcular estatísticas de status dos condomínios
      const { data: statusData, error: statusError } = await supabase
        .from('condominium_payments')
        .select(`
          status,
          condominiums!inner(
            id,
            condominium_cities!inner(city_id)
          )
        `)
        .eq('condominiums.condominium_cities.city_id', cityId)
        .eq('year', selectedYear);

      if (statusError) throw statusError;

      const statusCounts = statusData?.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const stats: CityStats = {
        total_condominiums: condominiums.length,
        paid_condominiums: statusCounts.paid || 0,
        pending_condominiums: statusCounts.pending || 0,
        overdue_condominiums: statusCounts.overdue || 0,
        total_revenue: (revenueData as any)?.total_revenue || 0
      };

      setCityStats(prev => ({ ...prev, [cityId]: stats }));
    } catch (error) {
      console.error('Error fetching city stats:', error);
    }
  };

  const fetchCondominiumPayments = async (condoId: string) => {
    try {
      const { data, error } = await supabase
        .from('condominium_payments')
        .select('*')
        .eq('condominium_id', condoId)
        .eq('year', selectedYear)
        .order('month');

      if (error) throw error;
      setPayments((data || []) as CondominiumPayment[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const addCondominium = async () => {
    if (!selectedCity || !newCondoData.name || !newCondoData.address) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Criar condomínio
      const { data: condoData, error: condoError } = await supabase
        .from('condominiums')
        .insert({
          name: newCondoData.name,
          address: newCondoData.address,
          apartment_count: newCondoData.apartment_count,
          monthly_fee_per_apartment: newCondoData.monthly_fee_per_apartment,
          payment_plan: newCondoData.payment_plan
        })
        .select()
        .single();

      if (condoError) throw condoError;

      // Associar à cidade
      const { error: cityError } = await supabase
        .from('condominium_cities')
        .insert({
          condominium_id: condoData.id,
          city_id: selectedCity.id
        });

      if (cityError) throw cityError;

      // Criar pagamentos do ano atual
      const currentYear = new Date().getFullYear();
      const monthlyPayments = [];
      for (let month = 1; month <= 12; month++) {
        const amount = calculateMonthlyAmount(newCondoData);
        monthlyPayments.push({
          condominium_id: condoData.id,
          year: currentYear,
          month,
          amount,
          status: 'pending'
        });
      }

      const { error: paymentsError } = await supabase
        .from('condominium_payments')
        .insert(monthlyPayments);

      if (paymentsError) throw paymentsError;

      toast({
        title: "Sucesso",
        description: "Condomínio adicionado com sucesso!"
      });

      setShowAddCondominium(false);
      setNewCondoData({
        name: '',
        address: '',
        apartment_count: 0,
        monthly_fee_per_apartment: 0,
        payment_plan: 'monthly'
      });
      
      fetchCityCondominiums(selectedCity.id);
      fetchCityStats(selectedCity.id);
    } catch (error) {
      console.error('Error adding condominium:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar condomínio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyAmount = (condo: typeof newCondoData) => {
    const baseAmount = condo.apartment_count * condo.monthly_fee_per_apartment;
    if (condo.payment_plan === 'annual') {
      return baseAmount * 12;
    } else if (condo.payment_plan === 'biannual') {
      return baseAmount * 6;
    } else {
      return baseAmount;
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('condominium_payments')
        .update({ 
          status,
          payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status do pagamento atualizado!"
      });

      if (selectedCondominium) {
        fetchCondominiumPayments(selectedCondominium.id);
      }
      if (selectedCity) {
        fetchCityStats(selectedCity.id);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pagamento",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const exportReport = async () => {
    if (!selectedCity) return;

    try {
      const stats = cityStats[selectedCity.id];
      const reportData = {
        city: selectedCity.name,
        year: selectedYear,
        stats,
        condominiums: condominiums.map(c => ({
          name: c.name,
          apartments: c.apartment_count,
          monthly_fee: c.monthly_fee_per_apartment,
          payment_plan: c.payment_plan
        }))
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${selectedCity.name}-${selectedYear}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!"
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      });
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCondominiums = condominiums.filter(condo =>
    condo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portal Financeiro</h1>
          <p className="text-muted-foreground">
            Gestão completa de cidades, condomínios e controlo financeiro
          </p>
        </div>
        <div className="flex items-center space-x-4">
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
          {selectedCity && (
            <Button onClick={exportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar cidades ou condomínios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Cidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Cidades ({filteredCities.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredCities.map(city => {
              const stats = cityStats[city.id];
              return (
                <div
                  key={city.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCity?.id === city.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCity(city)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{city.name}</h3>
                    {stats && (
                      <Badge variant="outline">
                        {stats.total_condominiums} condomínios
                      </Badge>
                    )}
                  </div>
                  {stats && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{stats.paid_condominiums} pagos</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>{stats.pending_condominiums} pendentes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>{stats.overdue_condominiums} em atraso</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{stats.total_revenue.toLocaleString()} AOA</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Lista de Condomínios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>
                  Condomínios 
                  {selectedCity && ` - ${selectedCity.name}`}
                  {filteredCondominiums.length > 0 && ` (${filteredCondominiums.length})`}
                </span>
              </div>
              {selectedCity && (
                <Button size="sm" onClick={() => setShowAddCondominium(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedCity ? (
              <p className="text-center text-muted-foreground py-8">
                Selecione uma cidade para ver os condomínios
              </p>
            ) : filteredCondominiums.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum condomínio encontrado
              </p>
            ) : (
              filteredCondominiums.map(condo => (
                <div
                  key={condo.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCondominium?.id === condo.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCondominium(condo)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{condo.name}</h3>
                    <Badge variant={condo.payment_plan === 'monthly' ? 'default' : 'secondary'}>
                      {condo.payment_plan === 'monthly' ? 'Mensal' : 
                       condo.payment_plan === 'biannual' ? 'Semestral' : 'Anual'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{condo.apartment_count} apartamentos</p>
                    <p>{condo.monthly_fee_per_apartment.toLocaleString()} AOA/apt</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Controle de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>
                Controle de Pagamentos {selectedYear}
                {selectedCondominium && ` - ${selectedCondominium.name}`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCondominium ? (
              <p className="text-center text-muted-foreground py-8">
                Selecione um condomínio para ver os pagamentos
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((month, index) => {
                  const payment = payments.find(p => p.month === index + 1);
                  const status = payment?.status || 'pending';
                  
                  return (
                    <div
                      key={month}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${getStatusColor(status)} text-white hover:opacity-80`}
                      onClick={() => {
                        if (payment) {
                          const newStatus = status === 'paid' ? 'pending' : 
                                          status === 'pending' ? 'overdue' : 'paid';
                          updatePaymentStatus(payment.id, newStatus);
                        }
                      }}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {getStatusIcon(status)}
                      </div>
                      <div className="text-xs font-medium">{month}</div>
                      {payment && (
                        <div className="text-xs opacity-90">
                          {payment.amount.toLocaleString()} AOA
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Adicionar Condomínio */}
      <Dialog open={showAddCondominium} onOpenChange={setShowAddCondominium}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Condomínio</DialogTitle>
            <DialogDescription>
              Adicionar novo condomínio à cidade {selectedCity?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Condomínio</Label>
              <Input
                id="name"
                value={newCondoData.name}
                onChange={(e) => setNewCondoData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do condomínio"
              />
            </div>
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={newCondoData.address}
                onChange={(e) => setNewCondoData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <Label htmlFor="apartments">Número de Apartamentos</Label>
              <Input
                id="apartments"
                type="number"
                value={newCondoData.apartment_count}
                onChange={(e) => setNewCondoData(prev => ({ ...prev, apartment_count: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="fee">Valor Mensal por Apartamento (AOA)</Label>
              <Input
                id="fee"
                type="number"
                value={newCondoData.monthly_fee_per_apartment}
                onChange={(e) => setNewCondoData(prev => ({ ...prev, monthly_fee_per_apartment: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="plan">Plano de Pagamento</Label>
              <Select 
                value={newCondoData.payment_plan} 
                onValueChange={(value: 'monthly' | 'biannual' | 'annual') => 
                  setNewCondoData(prev => ({ ...prev, payment_plan: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="biannual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={addCondominium} disabled={loading} className="flex-1">
                {loading ? 'Adicionando...' : 'Adicionar'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddCondominium(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialPortal;