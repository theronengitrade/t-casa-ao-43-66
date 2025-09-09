import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Info, RefreshCw, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export function ResidentQuotaInfo() {
  const { profile } = useAuth();
  const [condominiumInfo, setCondominiumInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCondominiumInfo();
    
    // Setup realtime subscription for condominium updates
    const channel = supabase
      .channel('condominium-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'condominiums',
          filter: `id=eq.${profile?.condominium_id}`
        },
        (payload) => {
          console.log('Condominium updated:', payload);
          setCondominiumInfo(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.condominium_id]);

  const fetchCondominiumInfo = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('condominiums')
        .select(`
          name, 
          current_monthly_fee, 
          currency, 
          iban_quota_normal, 
          iban_contribuicoes_especificas,
          banco_quota_normal,
          destinatario_quota_normal,
          banco_contribuicoes_especificas,
          destinatario_contribuicoes_especificas
        `)
        .eq('id', profile?.condominium_id)
        .single();

      if (error) throw error;
      setCondominiumInfo(data);
    } catch (error) {
      console.error('Error fetching condominium info:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AOA') => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Informações de Quota</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Valor atual da quota mensal do condomínio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Quota Mensal Atual</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCondominiumInfo}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Condomínio</p>
                <p className="text-lg font-medium">{condominiumInfo?.name}</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {formatCurrency(condominiumInfo?.current_monthly_fee || 0, condominiumInfo?.currency)}
              </Badge>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Esta é a quota mensal atual definida pela coordenação do condomínio.</p>
                  <p className="mt-1">
                    Os pagamentos mensais são baseados neste valor e devem ser efetuados até o dia 10 de cada mês.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Última atualização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information Card */}
      {(condominiumInfo?.iban_quota_normal || condominiumInfo?.iban_contribuicoes_especificas) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Informações Bancárias para Pagamentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {condominiumInfo?.iban_quota_normal && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Quotas Mensais</h4>
                    <Badge variant="outline" className="text-xs">IBAN Quotas</Badge>
                  </div>
                  
                  {condominiumInfo?.banco_quota_normal && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground">Banco</p>
                      <p className="font-medium text-sm">{condominiumInfo.banco_quota_normal}</p>
                    </div>
                  )}
                  
                  {condominiumInfo?.destinatario_quota_normal && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">Destinatário</p>
                      <p className="font-medium text-sm">{condominiumInfo.destinatario_quota_normal}</p>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="font-mono text-sm bg-background p-2 rounded border">
                      {condominiumInfo.iban_quota_normal}
                    </p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Utilize estas informações para pagamento das quotas mensais
                  </p>
                </div>
              )}
              
              {condominiumInfo?.iban_contribuicoes_especificas && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Contribuições Específicas</h4>
                    <Badge variant="outline" className="text-xs">IBAN Contribuições</Badge>
                  </div>
                  
                  {condominiumInfo?.banco_contribuicoes_especificas && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground">Banco</p>
                      <p className="font-medium text-sm">{condominiumInfo.banco_contribuicoes_especificas}</p>
                    </div>
                  )}
                  
                  {condominiumInfo?.destinatario_contribuicoes_especificas && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">Destinatário</p>
                      <p className="font-medium text-sm">{condominiumInfo.destinatario_contribuicoes_especificas}</p>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="font-mono text-sm bg-background p-2 rounded border">
                      {condominiumInfo.iban_contribuicoes_especificas}
                    </p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Utilize estas informações para contribuições específicas e campanhas
                  </p>
                </div>
              )}

              {(!condominiumInfo?.iban_quota_normal && !condominiumInfo?.iban_contribuicoes_especificas) && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Informações bancárias ainda não foram configuradas pela coordenação.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Informações Importantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>O valor da quota pode ser alterado pela coordenação conforme necessidades do condomínio.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>Os pagamentos devem ser efetuados até o dia 10 de cada mês.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>Após o vencimento, o pagamento será considerado em atraso.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>Para verificar sua situação detalhada, acesse a seção "Situação Contributiva".</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}