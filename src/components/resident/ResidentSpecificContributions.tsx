import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Contribution {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  notes: string;
  created_at: string;
  campaign: Campaign;
}

interface ResidentSpecificContributionsProps {
  profile: any;
}

export default function ResidentSpecificContributions({ profile }: ResidentSpecificContributionsProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [campaignStats, setCampaignStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar campanhas ativas
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('specific_campaigns')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Buscar dados do residente
      const { data: residentData, error: residentError } = await supabase
        .from('residents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (residentError) throw residentError;

      // Buscar contribuições do residente
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('specific_contributions')
        .select(`
          *,
          specific_campaigns!inner(
            id,
            title,
            description,
            target_amount,
            status,
            start_date,
            end_date,
            created_at
          )
        `)
        .eq('resident_id', residentData.id)
        .eq('condominium_id', profile.condominium_id)
        .order('created_at', { ascending: false });

      if (contributionsError) throw contributionsError;
      // Mapear dados para corresponder à interface Contribution
      const mappedContributions = (contributionsData || []).map(item => ({
        ...item,
        campaign: item.specific_campaigns
      }));
      setContributions(mappedContributions);

      // Calcular estatísticas das campanhas
      await calculateCampaignStats(campaignsData || []);

    } catch (error) {
      console.error('Error fetching contribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCampaignStats = async (campaignsData: Campaign[]) => {
    const stats = await Promise.all(
      campaignsData.map(async (campaign) => {
        const { data: contributionsData } = await supabase
          .from('specific_contributions')
          .select('amount, status')
          .eq('campaign_id', campaign.id);

        const totalRaised = contributionsData
          ?.filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        const totalPending = contributionsData
          ?.filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        const progressPercentage = campaign.target_amount > 0 
          ? Math.min((totalRaised / campaign.target_amount) * 100, 100) 
          : 0;

        return {
          ...campaign,
          totalRaised,
          totalPending,
          progressPercentage,
          totalContributors: contributionsData?.length || 0
        };
      })
    );

    setCampaignStats(stats);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCampaignStatusBadge = (campaign: any) => {
    const now = new Date();
    const endDate = new Date(campaign.end_date);
    
    if (campaign.progressPercentage >= 100) {
      return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
    } else if (endDate < now) {
      return <Badge variant="destructive">Expirada</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Ativa</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Contribuições Específicas</h1>
        <p className="text-muted-foreground">
          Acompanhe as campanhas e suas contribuições específicas do condomínio
        </p>
      </div>

      {/* Resumo das Contribuições */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Minhas Contribuições</p>
                <p className="text-2xl font-bold">
                  {contributions.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contribuído</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    contributions
                      .filter(c => c.status === 'paid')
                      .reduce((sum, c) => sum + Number(c.amount), 0),
                    'AOA'
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    contributions
                      .filter(c => c.status === 'pending')
                      .reduce((sum, c) => sum + Number(c.amount), 0),
                    'AOA'
                  )}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campanhas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campanhas Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaignStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma campanha ativa no momento</p>
            </div>
          ) : (
            campaignStats.map((campaign) => (
              <Card key={campaign.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{campaign.title}</h4>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    </div>
                    {getCampaignStatusBadge(campaign)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta</p>
                      <p className="font-semibold">{formatCurrency(campaign.target_amount, 'AOA')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Arrecadado</p>
                      <p className="font-semibold text-green-600">{formatCurrency(campaign.totalRaised, 'AOA')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pendente</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(campaign.totalPending, 'AOA')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contribuintes</p>
                      <p className="font-semibold">{campaign.totalContributors}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso: {campaign.progressPercentage.toFixed(1)}%</span>
                      <span>Faltam: {formatCurrency(campaign.target_amount - campaign.totalRaised, 'AOA')}</span>
                    </div>
                    <Progress value={campaign.progressPercentage} className="h-2" />
                  </div>

                  <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                    <span>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Início: {format(new Date(campaign.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    {campaign.end_date && (
                      <span>
                        Fim: {format(new Date(campaign.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Minhas Contribuições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Histórico das Minhas Contribuições
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não fez nenhuma contribuição específica</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Contribuição</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contribution.campaign.title}</p>
                          <p className="text-xs text-muted-foreground">{contribution.campaign.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(contribution.amount, 'AOA')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contribution.status)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(contribution.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {contribution.payment_date 
                          ? format(new Date(contribution.payment_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{contribution.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}