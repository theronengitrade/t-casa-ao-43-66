import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Calendar, User, Eye, Filter, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ResidentActionPlansProps {
  profile: any;
}

export default function ResidentActionPlans({ profile }: ResidentActionPlansProps) {
  const { toast } = useToast();
  const [actionPlans, setActionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchActionPlans();
  }, [profile?.condominium_id, statusFilter]);

  const fetchActionPlans = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('action_plans')
        .select(`
          id,
          task_number,
          title,
          description,
          category,
          status,
          priority,
          due_date,
          completion_date,
          estimated_cost,
          actual_cost,
          notes,
          created_at,
          created_by,
          assigned_to
        `)
        .eq('condominium_id', profile.condominium_id)
        .order('task_number', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setActionPlans(data || []);
    } catch (error) {
      console.error('Error fetching action plans:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos de ação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendente': return 'secondary';
      case 'em_andamento': return 'default';
      case 'concluido': return 'outline';
      case 'cancelado': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'secondary';
      case 'media': return 'default';
      case 'alta': return 'destructive';
      case 'urgente': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'alta': return 'Alta';
      case 'urgente': return 'Urgente';
      default: return priority;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'manutencao': return 'Manutenção';
      case 'limpeza': return 'Limpeza';
      case 'seguranca': return 'Segurança';
      case 'infraestrutura': return 'Infraestrutura';
      case 'paisagismo': return 'Paisagismo';
      default: return category.replace('_', ' ').toUpperCase();
    }
  };

  const handleViewDetails = (plan: any) => {
    setSelectedPlan(plan);
    setIsDetailsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'AOA'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Planos de Ação</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Acompanhe os planos de ação e melhorias do condomínio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
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
                <p className="text-2xl font-bold text-foreground">
                  {actionPlans.filter(p => p.status === 'pendente').length}
                </p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {actionPlans.filter(p => p.status === 'em_andamento').length}
                </p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {actionPlans.filter(p => p.status === 'concluido').length}
                </p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {actionPlans.filter(p => p.priority === 'urgente' || p.priority === 'alta').length}
                </p>
                <p className="text-sm text-muted-foreground">Alta Prioridade</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="feature-card">
        <CardHeader>
          <CardTitle>Lista de Planos de Ação ({actionPlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {actionPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum plano de ação encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono">
                        #{plan.task_number.toString().padStart(3, '0')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.title}</p>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(plan.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(plan.status)}>
                          {getStatusLabel(plan.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(plan.priority)}>
                          {getPriorityLabel(plan.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.due_date ? (
                          <div className="flex items-center space-x-1 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(plan.due_date)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(plan)}
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Plano de Ação #{selectedPlan?.task_number?.toString().padStart(3, '0')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Título</label>
                  <p className="text-sm">{selectedPlan.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p className="text-sm">{getCategoryLabel(selectedPlan.category)}</p>
                </div>
              </div>

              {selectedPlan.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-sm">{selectedPlan.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedPlan.status)}>
                      {getStatusLabel(selectedPlan.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <div className="mt-1">
                    <Badge variant={getPriorityBadgeVariant(selectedPlan.priority)}>
                      {getPriorityLabel(selectedPlan.priority)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prazo</label>
                  <p className="text-sm">
                    {selectedPlan.due_date ? formatDate(selectedPlan.due_date) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Conclusão</label>
                  <p className="text-sm">
                    {selectedPlan.completion_date ? formatDate(selectedPlan.completion_date) : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Custo Estimado</label>
                  <p className="text-sm">{formatCurrency(selectedPlan.estimated_cost)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Custo Real</label>
                  <p className="text-sm">{formatCurrency(selectedPlan.actual_cost)}</p>
                </div>
              </div>

              {selectedPlan.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-sm">{selectedPlan.notes}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado por</label>
                <p className="text-sm">
                  {selectedPlan.profiles?.first_name} {selectedPlan.profiles?.last_name}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}