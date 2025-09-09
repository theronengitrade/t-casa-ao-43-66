import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRemanescenteAnual, RemanescenteData } from "@/hooks/useRemanescenteAnual";
import { formatCurrency, CurrencyType } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Calendar } from "lucide-react";

interface CreateExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseCreated: () => void;
  serviceProviders: any[];
  saldoData?: RemanescenteData;
  currency: CurrencyType;
}

interface DespesaValidacao {
  sucesso: boolean;
  erro?: string;
  saldo_fonte: number;
  saldo_total: number;
  valor_solicitado: number;
  fonte_pagamento: string;
}

interface DespesaResponse {
  sucesso: boolean;
  erro?: string;
  expense_id?: string;
  status?: string;
  mensagem?: string;
  validacao?: DespesaValidacao;
}

export const CreateExpenseModal = ({ 
  open, 
  onOpenChange, 
  onExpenseCreated, 
  serviceProviders,
  saldoData,
  currency
}: CreateExpenseModalProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { atualizarUtilizacaoRemanescente } = useRemanescenteAnual(profile?.condominium_id);
  
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    service_provider_id: '',
    fonte_pagamento: 'receita_atual' as 'receita_atual' | 'remanescente'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.condominium_id) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('criar_despesa_com_validacao', {
        _condominium_id: profile.condominium_id,
        _category: formData.category,
        _description: formData.description,
        _amount: amount,
        _expense_date: formData.expense_date,
        _fonte_pagamento: formData.fonte_pagamento,
        _service_provider_id: formData.service_provider_id || null,
        _created_by: profile.user_id
      });

      if (error) throw error;

      const resultado = data as unknown as DespesaResponse;
      
      if (!resultado.sucesso) {
        toast({
          title: "❌ Erro ao criar despesa",
          description: resultado.erro || "Erro desconhecido",
          variant: "destructive"
        });
        return;
      }

      // 🎯 FEEDBACK INTELIGENTE baseado no status
      if (resultado.status === 'pendente') {
        toast({
          title: "⏳ Despesa Criada como PENDENTE",
          description: `${resultado.mensagem}. Saldo disponível: ${formatCurrency(resultado.validacao?.saldo_fonte || 0, currency)}`,
          variant: "default",
          duration: 6000
        });
      } else {
        toast({
          title: "✅ Despesa Aprovada",
          description: resultado.mensagem || "Despesa registrada com sucesso",
          duration: 4000
        });
      }

      // Reset form
      setFormData({
        category: '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        service_provider_id: '',
        fonte_pagamento: 'receita_atual'
      });

      onExpenseCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar despesa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSaldoDisponivel = (fonte: 'receita_atual' | 'remanescente') => {
    if (!saldoData) return 0;
    
    if (fonte === 'receita_atual') {
      return saldoData.receita_atual - saldoData.despesas_atual;
    } else {
      return saldoData.remanescente_total;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Registre uma nova despesa do condomínio
          </DialogDescription>
        </DialogHeader>

        {/* Resumo Financeiro */}
        {saldoData && (
          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Receita Atual</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(getSaldoDisponivel('receita_atual'), currency)}
              </div>
              <Badge variant="outline" className="text-xs">
                Disponível para gastos
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Remanescente</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(saldoData.remanescente_total, currency)}
              </div>
              <Badge variant="outline" className="text-xs">
                De anos anteriores
              </Badge>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Salários">Salários</SelectItem>
                  <SelectItem value="Coordenação">Coordenação</SelectItem>
                  <SelectItem value="Prestadores de Serviços">Prestadores de Serviços</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonte_pagamento">Fonte de Pagamento</Label>
              <Select 
                value={formData.fonte_pagamento} 
                onValueChange={(value: 'receita_atual' | 'remanescente') => 
                  setFormData({...formData, fonte_pagamento: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita_atual">
                    <div className="flex items-center justify-between w-full">
                      <span>Receita Atual</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {saldoData && formatCurrency(getSaldoDisponivel('receita_atual'), currency)}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="remanescente">
                    <div className="flex items-center justify-between w-full">
                      <span>Remanescente</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {saldoData && formatCurrency(saldoData.remanescente_total, currency)}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva a despesa..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor ({currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_date">Data da Despesa</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_provider">Prestador de Serviços (Opcional)</Label>
            <Select
              value={formData.service_provider_id}
              onValueChange={(value) => setFormData({...formData, service_provider_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um prestador (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {serviceProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aviso de saldo insuficiente */}
          {saldoData && formData.amount && parseFloat(formData.amount) > getSaldoDisponivel(formData.fonte_pagamento) && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Saldo insuficiente na fonte selecionada. 
                Disponível: {formatCurrency(getSaldoDisponivel(formData.fonte_pagamento), currency)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Despesa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};