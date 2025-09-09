import { useState } from 'react';
import { useActionPlans } from '@/hooks/useActionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, User, ClipboardList, History } from 'lucide-react';
import { CreateActionPlanModal } from './CreateActionPlanModal';
import { ActionPlanDetailsModal } from './ActionPlanDetailsModal';
import { ActionPlanHistoryModal } from './ActionPlanHistoryModal';
import { formatDate } from '@/lib/dateUtils';

interface ActionPlansManagementProps {
  onStatsUpdate?: () => void;
}

export function ActionPlansManagement({ onStatsUpdate }: ActionPlansManagementProps) {
  const { actionPlans, loading, updateActionPlan, deleteActionPlan } = useActionPlans();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedActionPlan, setSelectedActionPlan] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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

  const handleEdit = (actionPlan: any) => {
    setSelectedActionPlan(actionPlan);
    setIsDetailsModalOpen(true);
  };

  const handleHistory = (actionPlan: any) => {
    setSelectedActionPlan(actionPlan);
    setIsHistoryModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano de ação?')) {
      await deleteActionPlan(id);
      onStatsUpdate?.();
    }
  };

  const handleStatusUpdate = async (planId: string, newStatus: string) => {
    const success = await updateActionPlan(planId, { status: newStatus });
    if (success) {
      onStatsUpdate?.();
    }
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
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Planos de Ação</h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Planos de Ação</CardTitle>
        </CardHeader>
        <CardContent>
          {actionPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum plano de ação encontrado.</p>
            </div>
          ) : (
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
                        {plan.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={plan.status}
                        onValueChange={(newStatus) => handleStatusUpdate(plan.id, newStatus)}
                      >
                        <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent">
                          <SelectValue asChild>
                            <Badge 
                              variant={getStatusBadgeVariant(plan.status)}
                              className="cursor-pointer hover:opacity-80"
                            >
                              {getStatusLabel(plan.status)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHistory(plan)}
                          title="Ver Histórico"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateActionPlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          onStatsUpdate?.();
          setIsCreateModalOpen(false);
        }}
      />

      <ActionPlanDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedActionPlan(null);
        }}
        actionPlan={selectedActionPlan}
        onSuccess={() => {
          onStatsUpdate?.();
          setIsDetailsModalOpen(false);
          setSelectedActionPlan(null);
        }}
      />

      <ActionPlanHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedActionPlan(null);
        }}
        actionPlan={selectedActionPlan}
      />
    </div>
  );
}