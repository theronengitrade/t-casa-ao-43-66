import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CoordinatorSidebar } from "@/components/coordinator/CoordinatorSidebar";
import { DashboardOverview } from "@/components/coordinator/DashboardOverview";
import { ResidentsManagement } from "@/components/coordinator/ResidentsManagement";
import { VisitorsManagement } from "@/components/coordinator/VisitorsManagement";
import { ActionPlansManagement } from "@/components/coordinator/ActionPlansManagement";
import { ServiceProvidersManagement } from "@/components/coordinator/ServiceProvidersManagement";
import { DocumentsManagement } from "@/components/coordinator/DocumentsManagement";
import OccurrencesManagement from "@/components/coordinator/OccurrencesManagement";
import { AnnouncementsManagement } from "@/components/coordinator/AnnouncementsManagement";
import { ExpensesManagement } from "@/components/coordinator/ExpensesManagement";
import { FinancialManagement } from "@/components/coordinator/FinancialManagement";
import { SpaceReservationsManagement } from "@/components/coordinator/SpaceReservationsManagement";
import { ReportsManagement } from "@/components/coordinator/ReportsManagement";
import { ContributionStatus } from "@/components/shared/ContributionStatus";
import { SpecificContributionsReport } from "@/components/coordinator/SpecificContributionsReport";
import EmployeeManagement from "@/components/coordinator/EmployeeManagement";
import PayrollManagement from "@/components/coordinator/PayrollManagement";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import CoordinatorProfile from "@/components/coordinator/CoordinatorProfile";
import SuperAdminChat from "@/components/coordinator/SuperAdminChat";
import { CoordinationStaffManagement } from "@/components/coordinator/CoordinationStaffManagement";
import { CoordinationPermissionsTest } from "@/components/coordinator/CoordinationPermissionsTest";


interface DashboardStats {
  totalResidents: number;
  pendingVisitors: number;
  activeProviders: number;
  pendingPayments: number;
  urgentAnnouncements: number;
  monthlyRevenue: number;
}

const CoordinatorDashboard = () => {
  const { user, profile, loading, signOut, checkLicense } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState<DashboardStats>({
    totalResidents: 0,
    pendingVisitors: 0,
    activeProviders: 0,
    pendingPayments: 0,
    urgentAnnouncements: 0,
    monthlyRevenue: 0,
  });
  const [condominium, setCondominium] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role === 'coordinator' && profile.condominium_id) {
      fetchDashboardData();
      fetchCondominiumData();
    }
  }, [profile]);

  // Setup realtime listeners for automatic updates
  useEffect(() => {
    if (!profile?.condominium_id) return;

    const channels: any[] = [];

    // Listen for changes in key tables
    const tablesTetoListen = ['residents', 'visitors', 'service_providers', 'payments', 'announcements'];
    
    tablesTetoListen.forEach(table => {
      const channel = supabase
        .channel(`dashboard-${table}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `condominium_id=eq.${profile.condominium_id}`
          },
          (payload) => {
            console.log(`Realtime update in ${table}:`, payload);
            // Refresh dashboard data when changes occur
            fetchDashboardData();
          }
        )
        .subscribe();
      
      channels.push(channel);
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [profile?.condominium_id]);

  useEffect(() => {
    const verifyLicense = async () => {
      if (profile?.condominium_id) {
        const hasValidLicense = await checkLicense();
        if (!hasValidLicense) {
          toast({
            title: "Acesso Suspenso",
            description: "A licença do seu condomínio está suspensa ou expirada. Contacte a administração.",
            variant: "destructive"
          });
          await signOut(); // Forçar logout quando licença está suspensa
        }
      }
    };

    verifyLicense();
  }, [profile, checkLicense, signOut, toast]);

  const fetchCondominiumData = async () => {
    try {
      const { data, error } = await supabase
        .from('condominiums')
        .select('*')
        .eq('id', profile?.condominium_id)
        .single();

      if (error) throw error;
      setCondominium(data);
    } catch (error) {
      console.error('Error fetching condominium:', error);
    }
  };

  const fetchDashboardData = async () => {
    if (!profile?.condominium_id) {
      console.warn('No condominium_id found for dashboard data fetch');
      return;
    }

    try {
      console.log('Fetching dashboard data for condominium:', profile.condominium_id);

      // Fetch residents count with detailed logging
      const { count: residentsCount, error: residentsError } = await supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .eq('condominium_id', profile.condominium_id);

      if (residentsError) {
        console.error('Error fetching residents:', residentsError);
      } else {
        console.log('Residents count:', residentsCount);
      }

      // Fetch pending visitors with validation
      const { count: pendingVisitorsCount, error: visitorsError } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('condominium_id', profile.condominium_id)
        .eq('approved', false);

      if (visitorsError) {
        console.error('Error fetching visitors:', visitorsError);
      } else {
        console.log('Pending visitors count:', pendingVisitorsCount);
      }

      // Fetch active service providers
      const { count: activeProvidersCount, error: providersError } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .eq('condominium_id', profile.condominium_id)
        .eq('is_authorized', true);

      if (providersError) {
        console.error('Error fetching providers:', providersError);
      } else {
        console.log('Active providers count:', activeProvidersCount);
      }

      // Fetch ALL pending payments (not just current month) for better accuracy
      const { count: pendingPaymentsCount, error: paymentsError } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('condominium_id', profile.condominium_id)
        .eq('status', 'pending');

      if (paymentsError) {
        console.error('Error fetching pending payments:', paymentsError);
      } else {
        console.log('Pending payments count:', pendingPaymentsCount);
      }

      // Fetch urgent announcements that are published
      const { count: urgentAnnouncementsCount, error: announcementsError } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('condominium_id', profile.condominium_id)
        .eq('is_urgent', true)
        .eq('published', true);

      if (announcementsError) {
        console.error('Error fetching announcements:', announcementsError);
      } else {
        console.log('Urgent announcements count:', urgentAnnouncementsCount);
      }

      // ✅ SINCRONIZAÇÃO: Usar dados do useFinancialSync para receita mensal
      // A receita será calculada de forma unificada pelo hook centralizado
      const monthlyRevenue = 0; // Será sobrescrita pelo DashboardOverview com dados sincronizados

      const newStats = {
        totalResidents: residentsCount || 0,
        pendingVisitors: pendingVisitorsCount || 0,
        activeProviders: activeProvidersCount || 0,
        pendingPayments: pendingPaymentsCount || 0,
        urgentAnnouncements: urgentAnnouncementsCount || 0,
        monthlyRevenue,
      };

      console.log('Final dashboard stats:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <img src="/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png" alt="T-Casa" className="w-16 h-16" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'coordinator') {
    return <Navigate to="/dashboard" replace />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview stats={stats} condominium={condominium} onRefresh={fetchDashboardData} />;
      case "residents":
        return <ResidentsManagement onStatsUpdate={fetchDashboardData} />;
      case "employees":
        return <EmployeeManagement />;
      case "payroll":
        return <PayrollManagement />;
      case "visitors":
        return <VisitorsManagement onStatsUpdate={fetchDashboardData} />;
      case "spaces":
        return <SpaceReservationsManagement onStatsUpdate={fetchDashboardData} />;
      case "occurrences":
        return <OccurrencesManagement onStatsUpdate={fetchDashboardData} />;
      case "action-plans":
        return <ActionPlansManagement onStatsUpdate={fetchDashboardData} />;
      case "providers":
        return <ServiceProvidersManagement onStatsUpdate={fetchDashboardData} />;
      case "coordination-staff":
        return <CoordinationStaffManagement />;
      case "documents":
        return <DocumentsManagement />;
      case "announcements":
        return <AnnouncementsManagement onStatsUpdate={fetchDashboardData} />;
      case "chat":
        return <SuperAdminChat />;
      case "financial":
        return <FinancialManagement onStatsUpdate={fetchDashboardData} />;
      case "expenses":
        return <ExpensesManagement />;
      case "contribution":
        return <ContributionStatus userRole="coordinator" />;
      case "reports":
        return <ReportsManagement />;
        case "specific-contributions":
          return <SpecificContributionsReport />;
      case "permissions-test":
        return <CoordinationPermissionsTest />;
      case "profile":
        return <CoordinatorProfile profile={profile} />;
      default:
        return <DashboardOverview stats={stats} condominium={condominium} onRefresh={fetchDashboardData} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background mobile-safe-area">
        <CoordinatorSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="mobile-fixed-header h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <SidebarTrigger className="touch-target" />
              <img src="/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png" alt="T-Casa" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <h1 className="text-sm sm:text-xl font-semibold truncate">
                <span className="hidden sm:inline">Coordenador - </span>
                <span className="sm:hidden">Coord. - </span>
                {condominium?.name || 'Carregando...'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {profile.first_name} {profile.last_name}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="touch-target">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-6 overflow-y-auto mobile-scroll mobile-main-content">
            <div className="max-w-full mobile-viewport">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CoordinatorDashboard;