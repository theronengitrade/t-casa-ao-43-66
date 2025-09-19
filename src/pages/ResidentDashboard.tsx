import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home, 
  User, 
  CreditCard, 
  Bell, 
  FileText, 
  Users,
  LogOut,
  Building2,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import ResidentSidebar from "@/components/resident/ResidentSidebar";
import ResidentOverview from "@/components/resident/ResidentOverview";
import ResidentProfile from "@/components/resident/ResidentProfile";
import ResidentPayments from "@/components/resident/ResidentPayments";
import ResidentAnnouncements from "@/components/resident/ResidentAnnouncements";
import { ResidentExpenses } from "@/components/resident/ResidentExpenses";
import ResidentDocuments from "@/components/resident/ResidentDocuments";
import ResidentVisitors from "@/components/resident/ResidentVisitors";
import ResidentSpaceReservations from "@/components/resident/ResidentSpaceReservations";
import ResidentReports from "@/components/resident/ResidentReports";
import ResidentActionPlans from "@/components/resident/ResidentActionPlans";
import ResidentServiceProviders from "@/components/resident/ResidentServiceProviders";
import ResidentFinancialOverview from "@/components/resident/ResidentFinancialOverview";
import ResidentOccurrences from "@/components/resident/ResidentOccurrences";
import ResidentSpecificContributions from "@/components/resident/ResidentSpecificContributions";
import ResidentDashboardOverview from "@/components/resident/ResidentDashboardOverview";
import { ContributionStatus } from "@/components/shared/ContributionStatus";
import { ResidentQuotaInfo } from "@/components/resident/ResidentQuotaInfo";
import { CoordinationStaffList } from "@/components/shared/CoordinationStaffList";
import { ResidentSyncDashboard } from "@/components/resident/ResidentSyncDashboard";
import { CoordinationStatusCard } from "@/components/resident/CoordinationStatusCard";
import { CoordinationDashboard } from "@/components/resident/CoordinationDashboard";

// Importações de componentes de coordenação
import { ResidentsManagement } from "@/components/coordinator/ResidentsManagement";
import EmployeeManagement from "@/components/coordinator/EmployeeManagement";
import PayrollManagement from "@/components/coordinator/PayrollManagement";
import { VisitorsManagement } from "@/components/coordinator/VisitorsManagement";
import { SpaceReservationsManagement } from "@/components/coordinator/SpaceReservationsManagement";
import OccurrencesManagement from "@/components/coordinator/OccurrencesManagement";
import { ActionPlansManagement } from "@/components/coordinator/ActionPlansManagement";
import { ServiceProvidersManagement } from "@/components/coordinator/ServiceProvidersManagement";
import { AnnouncementsManagement } from "@/components/coordinator/AnnouncementsManagement";
import { DocumentsManagement } from "@/components/coordinator/DocumentsManagement";
import { FinancialManagement } from "@/components/coordinator/FinancialManagement";
import { ExpensesManagement } from "@/components/coordinator/ExpensesManagement";
import SuperAdminChat from "@/components/coordinator/SuperAdminChat";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinationPermissions } from "@/hooks/useCoordinationPermissions";


const ResidentDashboard = () => {
  const { user, profile, loading, signOut, checkLicense, isCoordinationMember } = useAuth();
  const { hasPermission } = useCoordinationPermissions();
  const [activeTab, setActiveTab] = useState("overview");
  const [condominiumInfo, setCondominiumInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCondominiumInfo = async () => {
      if (!profile?.condominium_id) return;

      try {
        const { data, error } = await supabase
          .from('condominiums')
          .select('name, address, currency')
          .eq('id', profile.condominium_id)
          .single();

        if (error) throw error;
        setCondominiumInfo(data);
      } catch (error) {
        console.error('Error fetching condominium info:', error);
      }
    };

    fetchCondominiumInfo();
  }, [profile]);

  useEffect(() => {
    const verifyLicense = async () => {
      if (profile && profile.role === 'resident') {
        const hasValidLicense = await checkLicense();
        if (!hasValidLicense) {
          toast({
            title: "Acesso Suspenso",
            description: "A licença do seu condomínio está suspensa ou expirada. Contacte a administração.",
            variant: "destructive"
          });
          await signOut();
        }
      }
    };

    verifyLicense();
  }, [profile, checkLicense, signOut, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={tcasaLogo} alt="T-Casa" className="h-16 w-auto mx-auto" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  if (profile.role !== 'resident') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background mobile-safe-area w-full flex mobile-body-offset">
        {/* Sidebar */}
        <ResidentSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          profile={profile}
          condominiumInfo={condominiumInfo}
        />

        {/* Main Content using SidebarInset for proper spacing */}
        <SidebarInset className="flex-1 flex flex-col h-screen overflow-y-auto mobile-scroll mobile-responsive-content">
          {/* Header */}
          <header className="mobile-fixed-header px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <div className="flex items-center justify-between mobile-flex-wrap">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 mobile-flex-wrap">
                <SidebarTrigger className="mr-1 sm:mr-2 flex-shrink-0 touch-target" />
                <img src={tcasaLogo} alt="T-Casa" className="h-6 sm:h-8 w-auto flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-semibold truncate">Portal do Residente</h1>
                  {condominiumInfo && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {condominiumInfo.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 mobile-flex-wrap">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <div className="flex gap-1 mobile-flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Residente
                      </Badge>
                      {isCoordinationMember && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Coordenação
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-center sm:hidden">
                    <p className="text-xs font-medium truncate max-w-20">
                      {profile.first_name}
                    </p>
                    <div className="flex gap-1 justify-center mobile-flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        Residente
                      </Badge>
                      {isCoordinationMember && (
                        <Badge variant="outline" className="text-xs">
                          Coord.
                        </Badge>
                      )}
                    </div>
                  </div>
                <Button variant="outline" size="sm" onClick={signOut} className="flex-shrink-0 touch-target">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 mobile-main-content mobile-viewport mobile-responsive-content">
            {/* Card de Status de Coordenação (se aplicável) */}
            {isCoordinationMember && activeTab === "overview" && (
              <div className="mb-6">
                <CoordinationStatusCard onNavigateToCoordination={() => setActiveTab("coordination-dashboard")} />
              </div>
            )}

            {/* Dashboard de Coordenação */}
            {activeTab === "coordination-dashboard" && isCoordinationMember && (
              <CoordinationDashboard onNavigateTo={setActiveTab} />
            )}
            
            {activeTab === "overview" && (
              <ResidentDashboardOverview 
                profile={profile} 
                condominiumInfo={condominiumInfo}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === "sync" && (
              <ResidentSyncDashboard />
            )}
            {activeTab === "profile" && (
              <ResidentProfile profile={profile} />
            )}
            {activeTab === "quota-info" && (
              <ResidentQuotaInfo />
            )}
            {activeTab === "payments" && (
              <ResidentPayments 
                profile={profile} 
                condominiumInfo={condominiumInfo}
              />
            )}
            {activeTab === "announcements" && (
              <ResidentAnnouncements profile={profile} />
            )}
            {activeTab === "documents" && (
              <ResidentDocuments profile={profile} />
            )}
            {activeTab === "expenses" && (
              <ResidentExpenses />
            )}
            {activeTab === "financial" && (
              <ResidentFinancialOverview 
                profile={profile} 
                condominiumInfo={condominiumInfo}
              />
            )}
            {activeTab === "action-plans" && (
              <ResidentActionPlans profile={profile} />
            )}
            {activeTab === "service-providers" && (
              <ResidentServiceProviders profile={profile} />
            )}
            {activeTab === "visitors" && (
              <ResidentVisitors profile={profile} />
            )}
            {activeTab === "coordination-staff" && (
              <CoordinationStaffList />
            )}
            {activeTab === "spaces" && (
              <ResidentSpaceReservations profile={profile} />
            )}
            {activeTab === "occurrences" && (
              <ResidentOccurrences profile={profile} />
            )}
            {activeTab === "reports" && (
              <ResidentReports 
                profile={profile} 
                condominiumInfo={condominiumInfo}
              />
            )}
            {activeTab === "specific-contributions" && (
              <ResidentSpecificContributions profile={profile} />
            )}
            {activeTab === "contribution" && (
              <ContributionStatus userRole="resident" />
            )}

            {/* === SEÇÃO DE COORDENAÇÃO === */}
            {/* Gestão de Residentes */}
            {activeTab === "coord-residents" && isCoordinationMember && hasPermission("residents") && (
              <ResidentsManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de Funcionários */}
            {activeTab === "coord-employees" && isCoordinationMember && hasPermission("payroll") && (
              <EmployeeManagement />
            )}
            
            {/* Folha de Pagamento */}
            {activeTab === "coord-payroll" && isCoordinationMember && hasPermission("payroll") && (
              <PayrollManagement />
            )}
            
            {/* Gestão de Visitantes */}
            {activeTab === "coord-visitors-management" && isCoordinationMember && hasPermission("visitors") && (
              <VisitorsManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de QR Codes */}
            {activeTab === "coord-qr-management" && isCoordinationMember && hasPermission("qr_codes") && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Gestão de QR Codes</h2>
                <p className="text-muted-foreground">Funcionalidade de gestão de QR Codes em desenvolvimento.</p>
              </div>
            )}
            
            {/* Gestão de Espaços */}
            {activeTab === "coord-spaces-management" && isCoordinationMember && hasPermission("space_reservations") && (
              <SpaceReservationsManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de Ocorrências */}
            {activeTab === "coord-occurrences-management" && isCoordinationMember && hasPermission("occurrences") && (
              <OccurrencesManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de Planos de Ação */}
            {activeTab === "coord-action-plans-management" && isCoordinationMember && hasPermission("action_plans") && (
              <ActionPlansManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de Prestadores */}
            {activeTab === "coord-providers-management" && isCoordinationMember && hasPermission("service_providers") && (
              <ServiceProvidersManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de Anúncios */}
            {activeTab === "coord-announcements-management" && isCoordinationMember && hasPermission("announcements") && (
              <AnnouncementsManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de Documentos */}
            {activeTab === "coord-documents-management" && isCoordinationMember && hasPermission("documents") && (
              <DocumentsManagement />
            )}
            
            {/* Gestão Financeira */}
            {activeTab === "coord-financial-management" && isCoordinationMember && hasPermission("financial_reports") && (
              <FinancialManagement onStatsUpdate={() => {}} />
            )}
            
            {/* Gestão de Despesas */}
            {activeTab === "coord-expenses-management" && isCoordinationMember && hasPermission("expenses") && (
              <ExpensesManagement />
            )}
            
            {/* Chat de Coordenação */}
            {activeTab === "coord-chat" && isCoordinationMember && hasPermission("all") && (
              <SuperAdminChat />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ResidentDashboard;