import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  MapPin, 
  Search, 
  TrendingUp, 
  Calendar,
  Download,
  Plus,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface City {
  id: string;
  name: string;
  clients?: BusinessClient[];
  total_revenue?: number;
  paid_count?: number;
  pending_count?: number;
  overdue_count?: number;
}

interface Condominium {
  id: string;
  name: string;
  apartment_count: number;
}

interface BusinessClient {
  id: string;
  name: string;
  condominium_id?: string;
  apartment_count: number;
  monthly_fee_per_apartment: number;
  payment_plan: 'monthly' | 'biannual' | 'annual';
  total_monthly_value: number;
  city_id: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  contract_start_date: string;
  is_active: boolean;
  notes?: string;
  payments?: BusinessPayment[];
  total_revenue?: number;
}

interface BusinessPayment {
  id: string;
  client_id: string;
  year: number;
  month: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  payment_date?: string;
  notes?: string;
}

const FinancialPortal = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedClient, setSelectedClient] = useState<BusinessClient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingPayment, setEditingPayment] = useState<BusinessPayment | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState<Partial<BusinessClient>>({
    name: '',
    condominium_id: '',
    city_id: '',
    payment_plan: 'monthly',
    apartment_count: 0,
    monthly_fee_per_apartment: 0,
    contact_person: '',
    phone: '',
    email: '',
    notes: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar cidades
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('id, name');
      
      if (citiesError) throw citiesError;

      // Buscar condomínios (ordenados por nome)
      const { data: condominiumsData, error: condominiumsError } = await supabase
        .from('condominiums')
        .select('id, name, apartment_count')
        .order('name');
      
      if (condominiumsError) throw condominiumsError;
      
      // Buscar clientes de negócio
      const { data: clientsData, error: clientsError } = await supabase
        .from('business_clients')
        .select('*');
      
      if (clientsError) throw clientsError;
      
      // Buscar pagamentos do ano selecionado
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('business_payments')
        .select('*')
        .eq('year', selectedYear);
      
      if (paymentsError) throw paymentsError;
      
      // Organizar dados por cidade
      const citiesWithData = citiesData.map(city => {
        const cityClients = clientsData
          .filter(client => client.city_id === city.id)
          .map(client => {
            const clientPayments = paymentsData.filter(p => p.client_id === client.id);
            const totalRevenue = clientPayments
              .filter(p => p.status === 'paid')
              .reduce((sum, p) => sum + Number(p.amount), 0);
            
            return {
              ...client,
              payment_plan: client.payment_plan as 'monthly' | 'biannual' | 'annual',
              payments: clientPayments.map(p => ({
                ...p,
                status: p.status as 'paid' | 'pending' | 'overdue'
              })),
              total_revenue: totalRevenue
            } as BusinessClient;
          });
        
        const cityPayments = cityClients.flatMap(c => c.payments || []);
        const totalRevenue = cityPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        
        return {
          ...city,
          clients: cityClients,
          total_revenue: totalRevenue,
          paid_count: cityPayments.filter(p => p.status === 'paid').length,
          pending_count: cityPayments.filter(p => p.status === 'pending').length,
          overdue_count: cityPayments.filter(p => p.status === 'overdue').length
        } as City;
      });
      
      setCities(citiesWithData);
      setCondominiums(condominiumsData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do portal financeiro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    try {
      const { error } = await supabase
        .from('business_payments')
        .update({ 
          status: newStatus,
          payment_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', paymentId);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Status do pagamento atualizado com sucesso"
      });
      
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pagamento",
        variant: "destructive"
      });
    }
  };

  const addClient = async () => {
    try {
      if (!newClient.name || !newClient.city_id || !newClient.apartment_count || !newClient.monthly_fee_per_apartment) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('business_clients')
        .insert([{
          name: newClient.name!,
          city_id: newClient.city_id!,
          apartment_count: newClient.apartment_count!,
          monthly_fee_per_apartment: newClient.monthly_fee_per_apartment!,
          payment_plan: newClient.payment_plan!,
          contact_person: newClient.contact_person,
          phone: newClient.phone,
          email: newClient.email,
          address: newClient.address,
          notes: newClient.notes,
          is_active: newClient.is_active!
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Cliente adicionado com sucesso"
      });
      
      setShowAddClientModal(false);
      setNewClient({
        payment_plan: 'monthly',
        apartment_count: 0,
        monthly_fee_per_apartment: 0,
        is_active: true
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar cliente",
        variant: "destructive"
      });
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.clients?.some(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalStats = cities.reduce((acc, city) => ({
    totalRevenue: acc.totalRevenue + (city.total_revenue || 0),
    totalClients: acc.totalClients + (city.clients?.length || 0),
    paidCount: acc.paidCount + (city.paid_count || 0),
    pendingCount: acc.pendingCount + (city.pending_count || 0),
    overdueCount: acc.overdueCount + (city.overdue_count || 0)
  }), { totalRevenue: 0, totalClients: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Portal Financeiro</h1>
              <p className="text-muted-foreground">Controle de receitas e pagamentos dos clientes do sistema</p>
            </div>
            <div className="flex space-x-2">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showAddClientModal} onOpenChange={setShowAddClientModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Adicionar Cliente</DialogTitle>
                    <DialogDescription>
                      Adicione um novo cliente (condomínio) para controle financeiro
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="condominium">Nome do Condomínio *</Label>
                      <Select value={newClient.condominium_id || ''} onValueChange={(value) => {
                        const selectedCondo = condominiums.find(c => c.id === value);
                        if (selectedCondo) {
                          setNewClient({
                            ...newClient, 
                            condominium_id: selectedCondo.id,
                            name: selectedCondo.name,
                            apartment_count: selectedCondo.apartment_count || 0
                          });
                        }
                      }}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione o condomínio" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {condominiums.map(condo => (
                            <SelectItem key={condo.id} value={condo.id} className="hover:bg-accent">
                              {condo.name} ({condo.apartment_count || 0} apartamentos)
                              {condo.apartment_count === 0 && (
                                <span className="text-muted-foreground ml-1">- valor não definido</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Select value={newClient.city_id || ''} onValueChange={(value) => setNewClient({...newClient, city_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a cidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="apartment-count">Nº de Apartamentos *</Label>
                      <Input
                        id="apartment-count"
                        type="number"
                        min="1"
                        value={newClient.apartment_count || 0}
                        onChange={(e) => setNewClient({...newClient, apartment_count: parseInt(e.target.value) || 0})}
                        placeholder="Ex: 50"
                        disabled={!!newClient.condominium_id && (newClient.apartment_count || 0) > 0}
                      />
                      {newClient.condominium_id && (newClient.apartment_count || 0) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Valor preenchido automaticamente baseado no condomínio selecionado
                        </p>
                      )}
                      {newClient.condominium_id && (newClient.apartment_count || 0) === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Valor não definido no sistema - informe manualmente
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="monthly-fee">Valor Mensal por Apartamento (AOA) *</Label>
                      <Input
                        id="monthly-fee"
                        type="number"
                        value={newClient.monthly_fee_per_apartment || 0}
                        onChange={(e) => setNewClient({...newClient, monthly_fee_per_apartment: parseFloat(e.target.value) || 0})}
                        placeholder="Ex: 1000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-plan">Plano de Pagamento *</Label>
                      <Select value={newClient.payment_plan || 'monthly'} onValueChange={(value: 'monthly' | 'biannual' | 'annual') => setNewClient({...newClient, payment_plan: value})}>
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
                    <div>
                      <Label htmlFor="contact-person">Pessoa de Contato</Label>
                      <Input
                        id="contact-person"
                        value={newClient.contact_person || ''}
                        onChange={(e) => setNewClient({...newClient, contact_person: e.target.value})}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={newClient.phone || ''}
                        onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                        placeholder="Ex: +244 912 345 678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClient.email || ''}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        placeholder="Ex: contato@condominio.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={newClient.notes || ''}
                        onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                        placeholder="Observações adicionais"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddClientModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addClient}>
                      Adicionar Cliente
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Relatório
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cidades ou clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="cities">Por Cidade</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="payments">Controle de Pagamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Cards de Estatísticas Globais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita Total {selectedYear}
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-AO', { 
                        style: 'currency', 
                        currency: 'AOA' 
                      }).format(totalStats.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pagamentos confirmados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Clientes
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalStats.totalClients}</div>
                    <p className="text-xs text-muted-foreground">
                      Condomínios ativos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pagamentos em Dia
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{totalStats.paidCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalStats.pendingCount} pendentes, {totalStats.overdueCount} em atraso
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Cidades Ativas
                    </CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cities.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Com clientes ativos
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo por Cidade */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo por Cidade</CardTitle>
                  <CardDescription>
                    Receitas e status de pagamentos por localização
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cities.map(city => (
                      <div key={city.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{city.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {city.clients?.length || 0} clientes
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {new Intl.NumberFormat('pt-AO', { 
                              style: 'currency', 
                              currency: 'AOA' 
                            }).format(city.total_revenue || 0)}
                          </div>
                          <div className="flex space-x-2 text-xs">
                            <span className="text-green-600">{city.paid_count || 0} pagos</span>
                            <span className="text-yellow-600">{city.pending_count || 0} pendentes</span>
                            <span className="text-red-600">{city.overdue_count || 0} em atraso</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cities" className="space-y-6">
              <div className="grid gap-4">
                {filteredCities.map(city => (
                  <Card key={city.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedCity(city)}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium text-lg">{city.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {city.clients?.length || 0} clientes
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">
                            {new Intl.NumberFormat('pt-AO', { 
                              style: 'currency', 
                              currency: 'AOA' 
                            }).format(city.total_revenue || 0)}
                          </div>
                          <div className="flex space-x-2 text-xs">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {city.paid_count || 0} pagos
                            </Badge>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {city.pending_count || 0} pendentes
                            </Badge>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {city.overdue_count || 0} atraso
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="grid gap-6">
                {selectedCity ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        {selectedCity.name} - Clientes
                      </h3>
                      <Button variant="outline" onClick={() => setSelectedCity(null)}>
                        Voltar
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {selectedCity.clients?.map(client => (
                        <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedClient(client)}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-lg">{client.name}</h4>
                                <div className="space-y-1 text-sm text-muted-foreground mt-2">
                                  <p>Apartamentos: {client.apartment_count}</p>
                                  <p>Valor mensal/apt: {new Intl.NumberFormat('pt-AO', { 
                                    style: 'currency', 
                                    currency: 'AOA' 
                                  }).format(client.monthly_fee_per_apartment)}</p>
                                  <p>Total mensal: {new Intl.NumberFormat('pt-AO', { 
                                    style: 'currency', 
                                    currency: 'AOA' 
                                  }).format(client.total_monthly_value)}</p>
                                  <p>Plano: {client.payment_plan === 'monthly' ? 'Mensal' : 
                                           client.payment_plan === 'biannual' ? 'Semestral' : 'Anual'}</p>
                                  {client.contact_person && <p>Contato: {client.contact_person}</p>}
                                  {client.phone && <p>Telefone: {client.phone}</p>}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  {new Intl.NumberFormat('pt-AO', { 
                                    style: 'currency', 
                                    currency: 'AOA' 
                                  }).format(client.total_revenue || 0)}
                                </div>
                                <p className="text-sm text-muted-foreground">Receita {selectedYear}</p>
                                <Badge variant={client.is_active ? "default" : "secondary"} className="mt-2">
                                  {client.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Selecione uma cidade para ver os clientes</h3>
                    <div className="grid gap-4">
                      {filteredCities.map(city => (
                        <Card key={city.id} className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedCity(city)}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-lg flex items-center">
                                <MapPin className="h-5 w-5 mr-2" />
                                {city.name}
                              </h4>
                              <div className="text-right">
                                <div className="text-xl font-bold text-blue-600">
                                  {city.clients?.length || 0} clientes
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Intl.NumberFormat('pt-AO', { 
                                    style: 'currency', 
                                    currency: 'AOA' 
                                  }).format(city.total_revenue || 0)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              {selectedClient ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">
                      Controle de Pagamentos - {selectedClient.name}
                    </h3>
                    <Button variant="outline" onClick={() => setSelectedClient(null)}>
                      Voltar
                    </Button>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Pagamentos {selectedYear}</CardTitle>
                      <CardDescription>
                        Clique nos status para alterar: Verde (pago), Amarelo (por confirmar), Vermelho (em atraso)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {Array.from({length: 12}, (_, i) => {
                          const month = i + 1;
                          const payment = selectedClient.payments?.find(p => p.month === month);
                          const monthName = format(new Date(2024, i, 1), 'MMM', { locale: ptBR });
                          
                          // Determinar se o mês deve estar ativo baseado no plano de pagamento
                          const shouldShowMonth = selectedClient.payment_plan === 'monthly' || 
                                                (selectedClient.payment_plan === 'biannual' && (month === 1 || month === 7)) ||
                                                (selectedClient.payment_plan === 'annual' && month === 1);
                          
                          if (!shouldShowMonth) {
                            return (
                              <Card key={month} className="opacity-50">
                                <CardContent className="p-4 text-center">
                                  <div className="mb-2">
                                    <div className="w-4 h-4 rounded-full mx-auto mb-2 bg-gray-200" />
                                    <p className="text-sm font-medium capitalize">{monthName}</p>
                                  </div>
                                  <div className="text-xs">
                                    <p className="text-muted-foreground">N/A</p>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          }
                          
                          return (
                            <Card key={month} className="cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => payment && updatePaymentStatus(payment.id, 
                                    payment.status === 'paid' ? 'pending' : 
                                    payment.status === 'pending' ? 'overdue' : 'paid'
                                  )}>
                              <CardContent className="p-4 text-center">
                                <div className="mb-2">
                                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                                    payment?.status === 'paid' ? 'bg-green-500' :
                                    payment?.status === 'pending' ? 'bg-yellow-500' :
                                    payment?.status === 'overdue' ? 'bg-red-500' : 'bg-gray-300'
                                  }`} />
                                  <p className="text-sm font-medium capitalize">{monthName}</p>
                                </div>
                                <div className="text-xs space-y-1">
                                  <p className="text-muted-foreground">
                                    {payment?.status === 'paid' ? 'Pago' :
                                     payment?.status === 'pending' ? 'Pendente' :
                                     payment?.status === 'overdue' ? 'Em Atraso' : 'N/A'}
                                  </p>
                                  {payment && (
                                    <p className="font-medium">
                                      {new Intl.NumberFormat('pt-AO', { 
                                        style: 'currency', 
                                        currency: 'AOA' 
                                      }).format(payment.amount)}
                                    </p>
                                  )}
                                  {payment?.payment_date && (
                                    <p className="text-muted-foreground">
                                      {format(new Date(payment.payment_date), 'dd/MM', { locale: ptBR })}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecione um cliente</h3>
                  <p className="text-muted-foreground">
                    Escolha um cliente na aba "Clientes" para gerenciar seus pagamentos
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FinancialPortal;