import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RemanescenteData {
  ano_atual: number;
  receita_atual: number;
  despesas_atual: number;
  despesas_aprovadas: number; // Campo adicional para compatibilidade
  remanescente_total: number;
  saldo_disponivel: number;
}

export interface RemanescenteAnual {
  id: string;
  ano_referencia: number;
  valor_recebido: number;
  valor_despesas: number;
  valor_remanescente: number;
  valor_utilizado: number;
  saldo_atual: number;
}

export const useRemanescenteAnual = (condominiumId?: string) => {
  const [saldoData, setSaldoData] = useState<RemanescenteData | null>(null);
  const [historico, setHistorico] = useState<RemanescenteAnual[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSaldoDisponivel = async () => {
    if (!condominiumId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('obter_saldo_disponivel', {
        _condominium_id: condominiumId
      });

      if (error) throw error;

      const typed = data as any;
      setSaldoData({
        ano_atual: typed.ano_atual,
        receita_atual: typed.receita_atual,
        despesas_atual: typed.despesas_aprovadas || 0, // Para compatibilidade
        despesas_aprovadas: typed.despesas_aprovadas || 0, // Campo correto
        remanescente_total: typed.remanescente_total,
        saldo_disponivel: typed.saldo_disponivel
      });
    } catch (error) {
      console.error('Erro ao buscar saldo disponível:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricoRemanescente = async () => {
    if (!condominiumId) return;

    try {
      const { data, error } = await supabase
        .from('remanescente_anual')
        .select('*')
        .eq('condominium_id', condominiumId)
        .order('ano_referencia', { ascending: false });

      if (error) throw error;

      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de remanescente:', error);
    }
  };

  const processarRemanescenteAnual = async (ano: number) => {
    if (!condominiumId) return;

    try {
      const { data, error } = await supabase.rpc('processar_remanescente_anual', {
        _condominium_id: condominiumId,
        _ano: ano
      });

      if (error) throw error;

      if ((data as any).success) {
        toast({
          title: "Sucesso",
          description: `Remanescente do ano ${ano} processado com sucesso.`
        });
        
        // Atualizar dados
        await Promise.all([
          fetchSaldoDisponivel(),
          fetchHistoricoRemanescente()
        ]);
      } else {
        throw new Error((data as any).error);
      }
    } catch (error) {
      console.error('Erro ao processar remanescente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o remanescente anual.",
        variant: "destructive"
      });
    }
  };

  const atualizarUtilizacaoRemanescente = async (valor: number, anoOrigem: number) => {
    if (!condominiumId) return;

    try {
      const { data, error } = await supabase.rpc('atualizar_utilizacao_remanescente', {
        _condominium_id: condominiumId,
        _ano_origem: anoOrigem,
        _valor: valor
      });

      if (error) throw error;

      if (!(data as any).success) {
        throw new Error((data as any).error);
      }

      // Atualizar dados após utilização
      await Promise.all([
        fetchSaldoDisponivel(),
        fetchHistoricoRemanescente()
      ]);
    } catch (error) {
      console.error('Erro ao atualizar utilização do remanescente:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (condominiumId) {
      fetchSaldoDisponivel();
      fetchHistoricoRemanescente();
    }
  }, [condominiumId]);

  return {
    saldoData,
    historico,
    loading,
    fetchSaldoDisponivel,
    fetchHistoricoRemanescente,
    processarRemanescenteAnual,
    atualizarUtilizacaoRemanescente
  };
};