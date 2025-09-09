import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useActionPlans } from '@/hooks/useActionPlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ActionPlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionPlan: any;
}

interface ActionPlanFormData {
  title: string;
  description: string;
  notes: string;
  category: string;
  status: string;
  priority: string;
  due_date: string;
  completion_date: string;
  estimated_cost: number;
  actual_cost: number;
}

export function ActionPlanDetailsModal({ isOpen, onClose, onSuccess, actionPlan }: ActionPlanDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const { updateActionPlan } = useActionPlans();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ActionPlanFormData>();

  const categoryValue = watch('category');
  const statusValue = watch('status');
  const priorityValue = watch('priority');

  useEffect(() => {
    if (actionPlan && isOpen) {
      setValue('title', actionPlan.title || '');
      setValue('description', actionPlan.description || '');
      setValue('notes', actionPlan.notes || '');
      setValue('category', actionPlan.category || 'manutencao');
      setValue('status', actionPlan.status || 'pendente');
      setValue('priority', actionPlan.priority || 'media');
      setValue('due_date', actionPlan.due_date || '');
      setValue('completion_date', actionPlan.completion_date || '');
      setValue('estimated_cost', actionPlan.estimated_cost || 0);
      setValue('actual_cost', actionPlan.actual_cost || 0);
    }
  }, [actionPlan, isOpen, setValue]);

  const onSubmit = async (data: ActionPlanFormData) => {
    if (!actionPlan) return;
    
    setLoading(true);
    try {
      const result = await updateActionPlan(actionPlan.id, {
        title: data.title,
        description: data.description || undefined,
        notes: data.notes || undefined,
        category: data.category,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date || undefined,
        completion_date: data.completion_date || undefined,
        estimated_cost: data.estimated_cost || 0,
        actual_cost: data.actual_cost || 0,
      });

      if (result) {
        onSuccess();
        toast({
          title: "Sucesso",
          description: "Plano de ação atualizado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error updating action plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano de ação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!actionPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Editar Plano de Ação #{actionPlan.task_number?.toString().padStart(3, '0')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Título é obrigatório' })}
                placeholder="Digite o título do plano"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva o plano de ação"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryValue} onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="seguranca">Segurança</SelectItem>
                  <SelectItem value="limpeza">Limpeza</SelectItem>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusValue} onValueChange={(value) => setValue('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priorityValue} onValueChange={(value) => setValue('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">Data Limite</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
              />
            </div>

            <div>
              <Label htmlFor="completion_date">Data de Conclusão</Label>
              <Input
                id="completion_date"
                type="date"
                {...register('completion_date')}
              />
            </div>

            <div>
              <Label htmlFor="estimated_cost">Custo Estimado (AOA)</Label>
              <Input
                id="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                {...register('estimated_cost', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="actual_cost">Custo Real (AOA)</Label>
              <Input
                id="actual_cost"
                type="number"
                min="0"
                step="0.01"
                {...register('actual_cost', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notas Adicionais</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Observações, instruções especiais, etc."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}