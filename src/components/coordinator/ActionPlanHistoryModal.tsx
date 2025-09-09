import { useState } from 'react';
import { useActionPlanHistory } from '@/hooks/useActionPlanHistory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { History, User, Clock, Edit, FileText, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { formatDateTime } from '@/lib/dateUtils';

interface ActionPlanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionPlan: any;
}

export function ActionPlanHistoryModal({ isOpen, onClose, actionPlan }: ActionPlanHistoryModalProps) {
  const { history, loading } = useActionPlanHistory(actionPlan?.id);

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'status': return <AlertCircle className="w-4 h-4" />;
      case 'title': return <Edit className="w-4 h-4" />;
      case 'description': return <FileText className="w-4 h-4" />;
      case 'due_date': 
      case 'completion_date': return <Calendar className="w-4 h-4" />;
      case 'estimated_cost':
      case 'actual_cost': return <DollarSign className="w-4 h-4" />;
      default: return <Edit className="w-4 h-4" />;
    }
  };

  const getFieldBadgeVariant = (fieldName: string) => {
    switch (fieldName) {
      case 'status': return 'default';
      case 'title': return 'secondary';
      case 'priority': return 'destructive';
      case 'due_date':
      case 'completion_date': return 'outline';
      default: return 'secondary';
    }
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldNames: { [key: string]: string } = {
      'status': 'Status',
      'title': 'Título',
      'description': 'Descrição',
      'notes': 'Notas',
      'category': 'Categoria',
      'priority': 'Prioridade',
      'due_date': 'Data Limite',
      'completion_date': 'Data de Conclusão',
      'estimated_cost': 'Custo Estimado',
      'actual_cost': 'Custo Real',
      'assigned_to': 'Responsável',
    };
    return fieldNames[fieldName] || fieldName;
  };

  const formatValue = (value: string | null | undefined, fieldName: string) => {
    if (!value) return 'N/A';
    
    if (fieldName.includes('date')) {
      return formatDateTime(value);
    }
    
    if (fieldName.includes('cost')) {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA'
      }).format(parseFloat(value));
    }
    
    return value;
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Group history by date
  const groupedHistory = history.reduce((groups: { [key: string]: any[] }, item) => {
    const date = new Date(item.changed_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  if (!actionPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>
              Histórico do Plano #{actionPlan.task_number?.toString().padStart(3, '0')} - {actionPlan.title}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma alteração registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {new Date(date).toLocaleDateString('pt-PT', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>
                  
                  <div className="space-y-3 ml-6">
                    {items.map((item, index) => (
                      <Card key={item.id} className="relative">
                        {index !== items.length - 1 && (
                          <div className="absolute left-6 top-full w-px h-3 bg-border" />
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            {/* Timeline dot */}
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Header with field and time */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={getFieldBadgeVariant(item.field_changed)} className="flex items-center space-x-1">
                                    {getFieldIcon(item.field_changed)}
                                    <span>{getFieldDisplayName(item.field_changed)}</span>
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.changed_at).toLocaleTimeString('pt-PT', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              {/* Value changes */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-muted-foreground">Valor Anterior</p>
                                  <div className="p-2 bg-red-50 dark:bg-red-950/10 rounded border border-red-200 dark:border-red-900/20">
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                      {formatValue(item.old_value, item.field_changed)}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-muted-foreground">Novo Valor</p>
                                  <div className="p-2 bg-green-50 dark:bg-green-950/10 rounded border border-green-200 dark:border-green-900/20">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                      {formatValue(item.new_value, item.field_changed)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Author */}
                              <div className="flex items-center space-x-2 pt-2 border-t">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(
                                      item.changed_by_profile?.first_name,
                                      item.changed_by_profile?.last_name
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>
                                    Alterado por{' '}
                                    <span className="font-medium">
                                      {item.changed_by_profile
                                        ? `${item.changed_by_profile.first_name} ${item.changed_by_profile.last_name}`
                                        : 'Usuário não identificado'
                                      }
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {Object.entries(groupedHistory).indexOf([date, items]) < Object.entries(groupedHistory).length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}