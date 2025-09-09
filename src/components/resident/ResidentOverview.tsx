import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  CreditCard, 
  Bell, 
  FileText, 
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  DollarSign,
  RefreshCw,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRemanescenteAnual } from "@/hooks/useRemanescenteAnual";
import { RemanescenteCard } from "@/components/shared/RemanescenteCard";

interface ResidentOverviewProps {
  profile: any;
  condominiumInfo: any;
  onNavigate?: (tab: string) => void;
}

const ResidentOverview = ({ profile, condominiumInfo, onNavigate }: ResidentOverviewProps) => {
  const [stats, setStats] = useState({
    pendingPayments: 0,
    totalPayments: 0,
    recentAnnouncements: 0,
    pendingVisitors: 0,
    documents: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { saldoData, loading: remanescenteLoading } = useRemanescenteAnual(profile?.condominium_id);

  const fetchOverviewData = async () => {
    if (!profile?.condominium_id || !profile?.id) {
      console.warn('Missing profile data for resident overview');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching resident overview data for profile:', profile.id);

      // Get resident record with error handling
      const { data: residentData, error: residentError } = await supabase
        .from('residents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (residentError) {
        console.error('Error fetching resident data:', residentError);
        return;
      }

      if (!residentData) {
        console.warn('No resident record found for profile:', profile.id);
        return;
      }

      console.log('Resident found:', residentData.id);

      // Fetch payments data with validation
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('resident_id', residentData.id);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      } else {
        console.log('Payments found:', paymentsData?.length);
      }

      // Fetch recent announcements (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: announcementsCount, error: announcementsError } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('condominium_id', profile.condominium_id)
        .eq('published', true)
        .gte('created_at', thirtyDaysAgo);

      if (announcementsError) {
        console.error('Error fetching announcements:', announcementsError);
      } else {
        console.log('Recent announcements count:', announcementsCount);
      }

      // Fetch pending visitors for this resident
      const { count: visitorsCount, error: visitorsError } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('resident_id', residentData.id)
        .eq('approved', false);

      if (visitorsError) {
        console.error('Error fetching visitors:', visitorsError);
      } else {
        console.log('Pending visitors count:', visitorsCount);
      }

      // Fetch documents count for condominium
      const { count: documentsCount, error: documentsError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('condominium_id', profile.condominium_id);

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
      } else {
        console.log('Documents count:', documentsCount);
      }

      // Calculate pending payments accurately
      const pendingPayments = paymentsData?.filter(p => p.status === 'pending').length || 0;
      console.log('Pending payments:', pendingPayments);

      const newStats = {
        pendingPayments,
        totalPayments: paymentsData?.length || 0,
        recentAnnouncements: announcementsCount || 0,
        pendingVisitors: visitorsCount || 0,
        documents: documentsCount || 0
      };

      console.log('Resident overview stats:', newStats);
      setStats(newStats);

      // Fetch real recent activity from database
      const recentActivityData = [];

      // Get recent payment activity
      if (paymentsData && paymentsData.length > 0) {
        const recentPayments = paymentsData
          .filter(p => p.status === 'paid')
          .sort((a, b) => new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime())
          .slice(0, 2);

        recentPayments.forEach(payment => {
          recentActivityData.push({
            type: 'payment',
            title: `${payment.description} processado`,
            time: new Date(payment.payment_date || payment.created_at).toLocaleDateString('pt-PT'),
            status: 'success'
          });
        });
      }

      // Get recent announcements
      const { data: recentAnnouncements } = await supabase
        .from('announcements')
        .select('title, created_at')
        .eq('condominium_id', profile.condominium_id)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentAnnouncements) {
        recentAnnouncements.forEach(announcement => {
          recentActivityData.push({
            type: 'announcement',
            title: announcement.title,
            time: new Date(announcement.created_at).toLocaleDateString('pt-PT'),
            status: 'info'
          });
        });
      }

      // Sort by most recent
      recentActivityData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setRecentActivity(recentActivityData.slice(0, 3));

    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [profile]);

  // Setup realtime listeners for resident data
  useEffect(() => {
    if (!profile?.condominium_id || !profile?.id) return;

    const channels: any[] = [];

    // Listen for payment changes
    const paymentsChannel = supabase
      .channel('resident-payments')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => {
          console.log('Resident payments update:', payload);
          fetchOverviewData();
        }
      )
      .subscribe();

    // Listen for announcement changes
    const announcementsChannel = supabase
      .channel('resident-announcements')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => {
          console.log('Resident announcements update:', payload);
          fetchOverviewData();
        }
      )
      .subscribe();

    // Listen for visitor changes
    const visitorsChannel = supabase
      .channel('resident-visitors')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'visitors',
          filter: `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => {
          console.log('Resident visitors update:', payload);
          fetchOverviewData();
        }
      )
      .subscribe();

    channels.push(paymentsChannel, announcementsChannel, visitorsChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [profile?.condominium_id, profile?.id]);

  const handleQuickAction = (tab: string, actionName: string) => {
    onNavigate?.(tab);
    toast({
      title: "Navegação concluída",
      description: `Redirecionado para ${actionName}`,
      duration: 2000
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      'AOA': 'Kz',
      'EUR': '€',
      'BRL': 'R$',
      'MZN': 'MT'
    };
    return `${symbols[currency] || ''}${amount.toLocaleString('pt-PT')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bem-vindo, {profile.first_name}!</h2>
        <p className="text-muted-foreground">
          Resumo da sua atividade no condomínio
        </p>
      </div>

      {/* Cards de Remanescente Anual - Modo Leitura */}
      {saldoData && !remanescenteLoading && (
        <RemanescenteCard 
          data={saldoData} 
          currency={condominiumInfo?.currency || 'AOA'} 
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagamentos Pendentes
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments > 0 ? (
                <span className="text-orange-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Requer atenção
                </span>
              ) : (
                <span className="text-green-500 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Em dia
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Anúncios Recentes
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentAnnouncements}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visitantes Pendentes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documentos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Atividade Recente</span>
            </CardTitle>
            <CardDescription>
              Últimas atualizações relacionadas com a sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades mais usadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
              onClick={() => handleQuickAction('payments', 'Pagamentos')}
            >
              <CreditCard className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
              Ver Status de Pagamentos
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
              onClick={() => handleQuickAction('visitors', 'Visitantes')}
            >
              <Users className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
              Solicitar Visitante
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
              onClick={() => handleQuickAction('announcements', 'Anúncios')}
            >
              <Bell className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
              Ver Anúncios
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
              onClick={() => handleQuickAction('documents', 'Documentos')}
            >
              <FileText className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
              Aceder Documentos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Apartment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Informações do Apartamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Apartamento</p>
              <p className="text-lg font-semibold">{profile.apartment_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Condomínio</p>
              <p className="text-lg font-semibold">{condominiumInfo?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Moeda</p>
              <p className="text-lg font-semibold">
                {condominiumInfo?.currency} - {
                  condominiumInfo?.currency === 'AOA' ? 'Kwanza' :
                  condominiumInfo?.currency === 'EUR' ? 'Euro' :
                  condominiumInfo?.currency === 'BRL' ? 'Real' :
                  'Metical'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentOverview;