import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, DollarSign, Edit, Plus, Trash2, Filter, TrendingUp, FileText, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { useRemanescenteAnual } from "@/hooks/useRemanescenteAnual";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  fonte_pagamento: 'receita_atual' | 'remanescente';
  status: 'aprovada' | 'pendente' | 'em_aprovacao';
  service_provider_id?: string;
  created_by: string;
  created_at: string;
  service_providers?: {
    id: string;
    name: string;
  };
}

interface ServiceProvider {
  id: string;
  name: string;
  service_type: string;
}

export const ExpensesManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthlyStats, setMonthlyStats] = useState<any>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { saldoData } = useRemanescenteAnual(profile?.condominium_id);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);

  const [formData, setFormData] = useState({
    category: '' as string,
    description: '',
    amount: '',
    expense_date: '',
    service_provider_id: ''
  });

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchExpenses();
      fetchServiceProviders();
    }
  }, [profile]);

  const fetchExpenses = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          service_providers(id, name)
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

  const fetchServiceProviders = async () => {
    if (!profile?.condominium_id) return;

    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('id, name, service_type')
        .eq('condominium_id', profile.condominium_id)
        .eq('is_authorized', true)
        .order('name');

      if (error) throw error;
      setServiceProviders(data || []);
    } catch (error: any) {
      console.error('Error fetching service providers:', error);
    }
  };

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
      
      // Apenas despesas aprovadas contam para o total geral
      if (expense.status === 'aprovada') {
        stats.total += amount;
        stats.aprovadas += amount;
        stats.byCategory[expense.category] += amount;
      } else {
        stats.pendentes += amount;
      }
    });

    setMonthlyStats(stats);
    
    // Separar despesas pendentes para exibição especial
    const pending = expensesList.filter(expense => 
      expense.status === 'pendente' || expense.status === 'em_aprovacao'
    );
    setPendingExpenses(pending);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.condominium_id) return;

    try {
      const expenseData = {
        condominium_id: profile.condominium_id,
        category: formData.category,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        service_provider_id: formData.category === 'Prestadores de Serviços' ? formData.service_provider_id || null : null,
        created_by: profile.user_id
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast({
          title: "Despesa atualizada",
          description: "A despesa foi atualizada com sucesso."
        });
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        toast({
          title: "Despesa registrada",
          description: "A nova despesa foi registrada com sucesso."
        });
      }

      resetForm();
      setShowAddModal(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast({
        title: "Erro ao salvar despesa",
        description: error.message || "Não foi possível salvar a despesa.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Despesa removida",
        description: "A despesa foi removida com sucesso."
      });
      fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Erro ao remover despesa",
        description: "Não foi possível remover a despesa.",
        variant: "destructive"
      });
    }
  };

  const approveExpense = async (expenseId: string) => {
    if (!profile?.condominium_id) return;

    try {
      const { data, error } = await supabase.rpc('aprovar_despesa_pendente', {
        _expense_id: expenseId,
        _condominium_id: profile.condominium_id
      });

      if (error) throw error;

      const resultado = data as any;
      
      if (!resultado.sucesso) {
        toast({
          title: "❌ Erro ao aprovar despesa",
          description: resultado.erro || "Erro desconhecido",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ Despesa Aprovada",
        description: resultado.mensagem,
        duration: 4000
      });

      fetchExpenses();
    } catch (error: any) {
      console.error('Error approving expense:', error);
      toast({
        title: "Erro ao aprovar despesa",
        description: "Não foi possível aprovar a despesa.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      expense_date: '',
      service_provider_id: ''
    });
  };

  const startEdit = (expense: Expense) => {
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      service_provider_id: expense.service_provider_id || ''
    });
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const formatCurrency = (amount: number) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✅ Aprovada</Badge>;
      case 'pendente':
        return <Badge variant="destructive">⏳ Pendente</Badge>;
      case 'em_aprovacao':
        return <Badge variant="outline">👁️ Em Aprovação</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesDate = !dateFilter || expense.expense_date.includes(dateFilter);
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    return matchesCategory && matchesDate && matchesStatus;
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
          <h2 className="text-2xl font-bold">Gestão de Despesas</h2>
          <p className="text-muted-foreground">
            Gerir todas as despesas do condomínio
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Monthly Stats - ATUALIZADO para mostrar controle realista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              ✅ Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyStats.aprovadas || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Deduzidas do saldo</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-orange-600" />
              ⏳ Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(monthlyStats.pendentes || 0)}
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
                {formatCurrency(Number(amount))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerta para despesas pendentes */}
      {pendingExpenses.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {pendingExpenses.length} Despesa(s) Pendente(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 mb-3">
              Estas despesas estão aguardando saldo disponível para serem aprovadas automaticamente.
            </p>
            <div className="space-y-2">
              {pendingExpenses.slice(0, 3).map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{expense.description}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => approveExpense(expense.id)}
                  >
                    Tentar Aprovar
                  </Button>
                </div>
              ))}
              {pendingExpenses.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  E mais {pendingExpenses.length - 3} despesa(s)...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="aprovada">✅ Aprovadas</SelectItem>
                  <SelectItem value="pendente">⏳ Pendentes</SelectItem>
                  <SelectItem value="em_aprovacao">👁️ Em Aprovação</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                      {expense.service_providers && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {expense.service_providers.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(expense.status)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate">{expense.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        {formatCurrency(Number(expense.amount))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Sistema</span>
                        <Badge variant={expense.fonte_pagamento === 'receita_atual' ? 'default' : 'secondary'} className="text-xs">
                          {expense.fonte_pagamento === 'receita_atual' ? 'Receita Atual' : 'Remanescente'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {expense.status === 'pendente' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approveExpense(expense.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
      
      {/* Modal de criação com nova funcionalidade */}
      <CreateExpenseModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onExpenseCreated={fetchExpenses}
        serviceProviders={serviceProviders}
        saldoData={saldoData}
        currency={'AOA'}
      />
    </div>
  );
};