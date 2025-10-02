import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Shield, 
  UserCog,
  LogOut,
  Settings,
  Plus,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Menu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import CreateCondominiumWizard from "@/components/super-admin/CreateCondominiumWizard";
import CondominiumsList from "@/components/super-admin/CondominiumsList";
import CityCondominiumViewer from "@/components/super-admin/CityCondominiumViewer";
import LicenseManagement from "@/components/super-admin/LicenseManagement";
import CoordinatorManagement from "@/components/super-admin/CoordinatorManagement";
import LinkingCodeManagement from "@/components/super-admin/LinkingCodeManagement";
import ReportsCenter from "@/components/super-admin/ReportsCenter";
import FinancialControl from "@/components/super-admin/FinancialControl";
import ExpenseManagement from "@/components/super-admin/ExpenseManagement";
import SuperAdminProfile from "@/components/super-admin/SuperAdminProfile";
import InternalChatManagement from "@/components/super-admin/InternalChatManagement";
import UserManagement from "@/components/super-admin/UserManagement";
import FinancialPortal from "@/components/super-admin/FinancialPortal";
import FinancialDashboard from "@/components/super-admin/FinancialDashboard";

interface DashboardStats {
  totalCondominiums: number;
  activeCondominiums: number;
  totalLicenses: number;
  expiringLicenses: number;
  totalCoordinators: number;
  activeCoordinators: number;
}

const SuperAdminDashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState("condominiums");
  const [stats, setStats] = useState<DashboardStats>({
    totalCondominiums: 0,
    activeCondominiums: 0,
    totalLicenses: 0,
    expiringLicenses: 0,
    totalCoordinators: 0,
    activeCoordinators: 0
  });
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchDashboardStats();
    }
  }, [profile]);

  // Setup realtime listeners for super admin
  useEffect(() => {
    if (profile?.role !== 'super_admin') return;

    const channels: any[] = [];

    // Listen for changes in key admin tables
    const tablesToListen = ['condominiums', 'licenses', 'profiles'];
    
    tablesToListen.forEach(table => {
      const channel = supabase
        .channel(`super-admin-${table}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: table
          },
          (payload) => {
            console.log(`Super admin realtime update in ${table}:`, payload);
            // Refresh stats when changes occur
            fetchDashboardStats();
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
  }, [profile?.role]);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching super admin dashboard stats...');

      // Fetch condominiums with more detailed query
      const { data: condominiums, error: condoError } = await supabase
        .from('condominiums')
        .select('id, created_at, name');

      if (condoError) {
        console.error('Error fetching condominiums:', condoError);
        throw condoError;
      }
      console.log('Condominiums found:', condominiums?.length);

      // Fetch licenses with better filtering
      const { data: licenses, error: licenseError } = await supabase
        .from('licenses')
        .select('id, status, end_date, condominium_id');

      if (licenseError) {
        console.error('Error fetching licenses:', licenseError);
        throw licenseError;
      }
      console.log('Licenses found:', licenses?.length);

      // Fetch coordinators with their condominium info
      const { data: coordinators, error: coordError } = await supabase
        .from('profiles')
        .select('id, role, created_at, condominium_id')
        .eq('role', 'coordinator');

      if (coordError) {
        console.error('Error fetching coordinators:', coordError);
        throw coordError;
      }
      console.log('Coordinators found:', coordinators?.length);

      // Calculate active condominiums (those with active licenses)
      const activeLicenses = licenses?.filter(license => 
        license.status === 'active' && 
        new Date(license.end_date) >= new Date()
      ) || [];

      const activeCondominiumIds = new Set(activeLicenses.map(l => l.condominium_id));
      const activeCondominiumsCount = activeCondominiumIds.size;

      // Calculate expiring licenses (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringCount = activeLicenses.filter(license => 
        new Date(license.end_date) <= thirtyDaysFromNow
      ).length;

      // Count active coordinators (those with condominium_id)
      const activeCoordinatorsCount = coordinators?.filter(coord => coord.condominium_id).length || 0;

      const newStats = {
        totalCondominiums: condominiums?.length || 0,
        activeCondominiums: activeCondominiumsCount,
        totalLicenses: licenses?.length || 0,
        expiringLicenses: expiringCount,
        totalCoordinators: coordinators?.length || 0,
        activeCoordinators: activeCoordinatorsCount
      };

      console.log('Super admin stats calculated:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas do dashboard",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={tcasaLogo} alt="T-Casa" className="h-16 w-auto mx-auto" />
          <p className="text-muted-foreground">A carregar painel de administração...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "condominiums":
        return <CondominiumsList onStatsUpdate={fetchDashboardStats} />;
      case "city-viewer":
        return <CityCondominiumViewer />;
      case "financial-portal":
        return <FinancialPortal />;
      case "financial-dashboard":
        return <FinancialDashboard />;
      case "licenses":
        return <LicenseManagement onStatsUpdate={fetchDashboardStats} />;
      case "coordinators":
        return <CoordinatorManagement onStatsUpdate={fetchDashboardStats} />;
      case "user-management":
        return <UserManagement />;
      case "chat":
        return <InternalChatManagement />;
      case "linking-codes":
        return <LinkingCodeManagement />;
      case "audit":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Logs de Auditoria</span>
              </CardTitle>
              <CardDescription>
                Registo de todas as ações críticas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Logs de auditoria em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        );
      case "reports":
        return <ReportsCenter />;
      case "financial":
        return <FinancialControl />;
      case "expenses":
        return <ExpenseManagement />;
      case "profile":
        return <SuperAdminProfile />;
      default:
        return <CondominiumsList onStatsUpdate={fetchDashboardStats} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background mobile-body-offset">
        <SuperAdminSidebar 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        
        <div className="flex-1 flex flex-col mobile-responsive-content">
          {/* Header */}
          <header className="mobile-fixed-header">
            <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 mobile-flex-wrap">
                <SidebarTrigger className="mr-1 sm:mr-2 flex-shrink-0 touch-target" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base font-semibold truncate">Super Administração</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mobile-header-wrap">
                    <span className="mobile-header-truncate">
                      Bem-vindo, {profile.first_name} {profile.last_name}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 mobile-flex-wrap">
                <Badge variant="default" className="hidden sm:flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Super Admin</span>
                </Badge>
                <Badge variant="default" className="sm:hidden">
                  <Shield className="h-3 w-3" />
                </Badge>
                {activeSection === "condominiums" && (
                  <Button onClick={() => setShowCreateWizard(true)} size="sm" className="hidden sm:flex items-center space-x-2 touch-target">
                    <Plus className="h-4 w-4" />
                    <span>Criar Condomínio</span>
                  </Button>
                )}
                {activeSection === "condominiums" && (
                  <Button onClick={() => setShowCreateWizard(true)} size="sm" className="sm:hidden touch-target">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toast({
                    title: "Configurações",
                    description: "Funcionalidade de configurações em desenvolvimento."
                  })}
                  className="hidden sm:flex touch-target"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="touch-target">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto mobile-scroll mobile-main-content">
            <div className="p-4 sm:p-6 mobile-viewport mobile-responsive-content">
              {/* Dashboard Overview - Only show on condominiums section */}
              {activeSection === "condominiums" && (
                <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
                  <div className="space-y-2 sm:space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Painel de Super Administração
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground">
                      Gestão global de condomínios, licenças e coordenadores
                    </p>
                  </div>

                  {/* Stats Grid - Mobile responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Condomínios Totais
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCondominiums}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.activeCondominiums} ativos
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Licenças
                        </CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLicenses}</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                          {stats.expiringLicenses > 0 && (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1 text-orange-500" />
                              {stats.expiringLicenses} a expirar
                            </>
                          )}
                          {stats.expiringLicenses === 0 && (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              Todas em dia
                            </>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Coordenadores
                        </CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCoordinators}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.activeCoordinators} ativos
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Dynamic Content */}
              {renderContent()}
            </div>
          </main>
        </div>

        {/* Create Condominium Wizard Modal */}
        {showCreateWizard && (
          <CreateCondominiumWizard 
            isOpen={showCreateWizard}
            onClose={() => setShowCreateWizard(false)}
            onSuccess={() => {
              setShowCreateWizard(false);
              fetchDashboardStats();
            }}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminDashboard;