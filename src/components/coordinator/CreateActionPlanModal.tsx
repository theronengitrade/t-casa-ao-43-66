import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useActionPlans } from '@/hooks/useActionPlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CreateActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ActionPlanFormData {
  title: string;
  description: string;
  notes: string;
  category: string;
  priority: string;
  due_date: string;
  estimated_cost: number;
}

export function CreateActionPlanModal({ isOpen, onClose, onSuccess }: CreateActionPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const { createActionPlan } = useActionPlans();
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
  const priorityValue = watch('priority');

  const onSubmit = async (data: ActionPlanFormData) => {
    setLoading(true);
    try {
      const result = await createActionPlan({
        title: data.title,
        description: data.description || undefined,
        notes: data.notes || undefined,
        category: data.category || 'manutencao',
        priority: data.priority || 'media',
        due_date: data.due_date || undefined,
        estimated_cost: data.estimated_cost || 0,
      });

      if (result) {
        reset();
        onSuccess();
        toast({
          title: "Sucesso",
          description: "Plano de ação criado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error creating action plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano de ação.",
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Plano de Ação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mobile-form-content">
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

          <div className="mobile-buttons-container">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}