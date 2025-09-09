import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// ✅ CORREÇÃO CRÍTICA: Garantir que componente de despesas está usando dados sincronizados
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useResidentSync } from "@/hooks/useResidentSync";
import { useFinancialSync } from "@/hooks/useFinancialSync";
import { formatCurrency } from "@/lib/currency";
import { Calendar, DollarSign, Filter, TrendingUp, FileText, Eye, PieChart } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  status: 'aprovada' | 'pendente' | 'em_aprovacao'; // ✅ CORREÇÃO: Adicionar campo status
  service_provider_id?: string;
  created_by: string;
  created_at: string;
  service_provider?: {
    id: string;
    name: string;
  };
}

export const ResidentExpenses = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // ✅ SINCRONIZAÇÃO UNIFICADA: Usar hook centralizado para dados financeiros
  const { 
    stats: financialStats, 
    loading: financialLoading,
    refreshData: refreshFinancialData 
  } = useFinancialSync(profile?.condominium_id);
  
  // ✅ DADOS REAIS: Buscar despesas diretamente da base de dados com dados sincronizados
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any>({});

  const fetchExpenses = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          service_provider:service_providers(id, name)
        `)
        .eq('condominium_id', profile.condominium_id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data as unknown as Expense[] || []);
      calculateMonthlyStats(data as unknown as Expense[] || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Erro ao carregar despesas",
        description: "Não foi possível carregar as despesas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Configurar sincronização em tempo real para despesas e atualização automática
  useResidentSync({ 
    onDataChange: () => {
      fetchExpenses();
      refreshFinancialData(); // ✅ SINCRONIZAÇÃO: Refresh dos dados financeiros centralizados
    },
    condominiumId: profile?.condominium_id 
  });

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchExpenses();
    }
  }, [profile]);

  const calculateMonthlyStats = (expensesList: Expense[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expensesList.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const stats = {
      total: 0,
      aprovadas: 0,
      pendentes: 0,
      byCategory: {
        'Salários': 0,
        'Coordenação': 0,
        'Prestadores de Serviços': 0,
        'Outros': 0
      },
      byStatus: {
        'aprovada': 0,
        'pendente': 0,
        'em_aprovacao': 0
      }
    };

    monthlyExpenses.forEach(expense => {
      const amount = Number(expense.amount);
      stats.byStatus[expense.status] += amount;
      
      // ✅ CONTROLE REALISTA: Apenas despesas aprovadas contam para o total geral
      if (expense.status === 'aprovada') {
        stats.total += amount;
        stats.aprovadas += amount;
        stats.byCategory[expense.category] += amount;
      } else {
        stats.pendentes += amount;
      }
    });

    setMonthlyStats(stats);
  };

  const formatCurrencyLocal = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(amount);
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'Salários': return 'default';
      case 'Coordenação': return 'secondary';
      case 'Prestadores de Serviços': return 'outline';
      case 'Outros': return 'destructive';
      default: return 'default';
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesDate = !dateFilter || expense.expense_date.includes(dateFilter);
    return matchesCategory && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Despesas do Condomínio</h2>
          <p className="text-muted-foreground flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Visualização das despesas (apenas leitura)
          </p>
        </div>
      </div>

      {/* Monthly Stats - ✅ DADOS SINCRONIZADOS com controle realista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              ✅ Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrencyLocal(monthlyStats.aprovadas || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Deduzidas do saldo</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <PieChart className="h-4 w-4 mr-2 text-orange-600" />
              ⏳ Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrencyLocal(monthlyStats.pendentes || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Aguardam saldo</p>
          </CardContent>
        </Card>
        
        {Object.entries(monthlyStats.byCategory || {}).map(([category, amount]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {formatCurrencyLocal(Number(amount))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="Salários">Salários</SelectItem>
                  <SelectItem value="Coordenação">Coordenação</SelectItem>
                  <SelectItem value="Prestadores de Serviços">Prestadores de Serviços</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Data</Label>
              <Input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filtrar por mês"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Lista de Despesas ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: pt })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(expense.category)}>
                        {expense.category}
                      </Badge>
                      {expense.service_provider && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {expense.service_provider.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate" title={expense.description}>
                          {expense.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        {formatCurrencyLocal(Number(expense.amount))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">Coordenação</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma despesa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {expenses.length === 0 
                  ? "Não há despesas registradas ainda."
                  : "Nenhuma despesa corresponde aos filtros aplicados."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};