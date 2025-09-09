import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentGenerator } from "@/components/shared/DocumentGenerator";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Receipt, Building, Calendar } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ExpenseRecord {
  id: string;
  service_provider_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  service_providers?: {
    name: string;
    document_number?: string;
    email?: string;
    phone?: string;
  };
}

export function ServiceProviderReceiptGenerator() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [condominiumInfo, setCondominiumInfo] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchCondominiumInfo();
      fetchExpenses();
    }
  }, [profile?.condominium_id, selectedCategory, selectedMonth]);

  const fetchCondominiumInfo = async () => {
    if (!profile?.condominium_id) return;

    try {
      const { data, error } = await supabase
        .from('condominiums')
        .select('name, address, phone, email')
        .eq('id', profile.condominium_id)
        .single();

      if (error) throw error;
      if (data) setCondominiumInfo(data);
    } catch (error) {
      console.error('Error fetching condominium info:', error);
    }
  };

  const fetchExpenses = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('expenses')
        .select(`
          id,
          service_provider_id,
          description,
          amount,
          expense_date,
          category,
          service_providers(
            name,
            document_number,
            email,
            phone
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .not('service_provider_id', 'is', null);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedMonth) {
        const startDate = new Date(selectedMonth);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        query = query
          .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
          .lte('expense_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query
        .order('expense_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar despesas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const providerName = expense.service_providers?.name?.toLowerCase() || '';
    const description = expense.description.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return providerName.includes(search) || description.includes(search);
  });

  const categories = [
    'Limpeza',
    'Segurança',
    'Manutenção',
    'Jardinagem',
    'Elevador',
    'Portaria',
    'Obras',
    'Outros'
  ];

  const generateServiceReceipt = (expense: ExpenseRecord) => {
    if (!expense.service_providers) return null;

    const receiptData = {
      recipient: {
        name: expense.service_providers.name,
        nif: expense.service_providers.document_number
      },
      description: expense.description,
      amount: expense.amount,
      currency: 'AOA', // Default currency
      paymentDate: format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: pt }),
      paymentMethod: 'Transferência bancária'
    };

    return (
      <DocumentGenerator
        type="service_receipt"
        data={receiptData}
        condominiumInfo={condominiumInfo}
        coordinatorName={`${profile?.first_name} ${profile?.last_name}`}
        size="sm"
      />
    );
  };

  const generateAcceptanceReport = (expense: ExpenseRecord) => {
    if (!expense.service_providers) return null;

    const reportData = {
      recipient: {
        name: expense.service_providers.name,
        nif: expense.service_providers.document_number
      },
      description: expense.description,
      amount: expense.amount,
      currency: 'AOA',
      completionDate: format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: pt }),
      observations: 'Serviço concluído conforme acordado e aceito pelo condomínio.'
    };

    return (
      <DocumentGenerator
        type="service_acceptance"
        data={reportData}
        condominiumInfo={condominiumInfo}
        coordinatorName={`${profile?.first_name} ${profile?.last_name}`}
        variant="ghost"
        size="sm"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recibos para Prestadores</h2>
          <p className="text-muted-foreground">
            Gere recibos e termos de aceitação para prestadores de serviços
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do prestador, serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(new Date().getFullYear(), i, 1);
                    const value = format(date, 'yyyy-MM-dd');
                    const label = format(date, 'MMMM yyyy', { locale: pt });
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fetchExpenses} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Serviços Prestados ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando serviços...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground">
                Não há serviços que correspondam aos critérios selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-accent/20 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">
                        {expense.service_providers?.name || 'Prestador não identificado'}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {expense.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-primary">
                        {expense.amount.toFixed(2)} AOA
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: pt })}
                        </span>
                      </div>
                    </div>
                    {expense.service_providers?.document_number && (
                      <p className="text-xs text-muted-foreground">
                        NIF: {expense.service_providers.document_number}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {generateServiceReceipt(expense)}
                    {generateAcceptanceReport(expense)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}