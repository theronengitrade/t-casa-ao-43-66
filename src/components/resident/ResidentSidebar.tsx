import { 
  Home, 
  User, 
  CreditCard, 
  Bell, 
  FileText, 
  Users,
  Building2,
  MapPin,
  BarChart3,
  Receipt,
  Shield,
  AlertTriangle,
  Calculator,
  ClipboardList,
  RefreshCw,
  UserCheck,
  Megaphone,
  MessageSquare,
  UserCog,
  Banknote
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinationPermissions } from "@/hooks/useCoordinationPermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";

interface ResidentSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  profile: any;
  condominiumInfo: any;
}

// Menu items básicos para todos os residentes
const baseMenuItems = [
  { id: "overview", label: "Visão Geral", icon: Home },
  { id: "sync", label: "Status Sync", icon: RefreshCw },
  { id: "profile", label: "Meu Perfil", icon: User },
  { id: "quota-info", label: "Quota Mensal", icon: CreditCard },
  { id: "payments", label: "Pagamentos", icon: CreditCard },
  { id: "announcements", label: "Anúncios", icon: Bell },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "expenses", label: "Despesas", icon: Receipt },
  { id: "financial", label: "Situação Financeira", icon: Calculator },
  { id: "action-plans", label: "Planos de Ação", icon: ClipboardList },
  { id: "service-providers", label: "Prestadores", icon: Shield },
  { id: "visitors", label: "Visitantes", icon: Users },
  { id: "coordination-staff", label: "Coordenação", icon: Shield },
  { id: "spaces", label: "Espaços", icon: MapPin },
  { id: "occurrences", label: "Ocorrências", icon: AlertTriangle },
  { id: "specific-contributions", label: "Contribuições Específicas", icon: Calculator },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "contribution", label: "Situação Contributiva", icon: FileText }
];

// Menu items de coordenação baseados em permissões
const coordinationMenuItems = [
  { id: "coord-residents", label: "👥 Gestão Residentes", icon: Users, permission: "residents" },
  { id: "coord-employees", label: "🧑‍💼 Funcionários", icon: UserCog, permission: "payroll" },
  { id: "coord-payroll", label: "💰 Folha Pagamento", icon: Banknote, permission: "payroll" },
  { id: "coord-visitors-management", label: "🚪 Gestão Visitantes", icon: UserCheck, permission: "visitors" },
  { id: "coord-qr-management", label: "📱 Gestão QR Codes", icon: Shield, permission: "qr_codes" },
  { id: "coord-spaces-management", label: "📍 Gestão Espaços", icon: MapPin, permission: "space_reservations" },
  { id: "coord-occurrences-management", label: "⚠️ Gestão Ocorrências", icon: AlertTriangle, permission: "occurrences" },
  { id: "coord-action-plans-management", label: "📋 Gestão Planos", icon: ClipboardList, permission: "action_plans" },
  { id: "coord-providers-management", label: "🔧 Gestão Prestadores", icon: Building2, permission: "service_providers" },
  { id: "coord-announcements-management", label: "📢 Gestão Anúncios", icon: Megaphone, permission: "announcements" },
  { id: "coord-documents-management", label: "📄 Gestão Documentos", icon: FileText, permission: "documents" },
  { id: "coord-financial-management", label: "💼 Gestão Financeira", icon: Calculator, permission: "financial_reports" },
  { id: "coord-expenses-management", label: "💸 Gestão Despesas", icon: Receipt, permission: "expenses" },
  { id: "coord-chat", label: "💬 Chat Coordenação", icon: MessageSquare, permission: "all" }
];

const ResidentSidebar = ({ activeTab, onTabChange, profile, condominiumInfo }: ResidentSidebarProps) => {
  const { state, setOpenMobile } = useSidebar();
  const { isCoordinationMember } = useAuth();
  const { hasPermission, loading: permissionsLoading } = useCoordinationPermissions();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    // Auto-hide sidebar on mobile after menu item click
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Construir menu dinâmico baseado em permissões
  const getMenuItems = () => {
    let menuItems = [...baseMenuItems];
    
    if (isCoordinationMember && !permissionsLoading) {
      const availableCoordinationItems = coordinationMenuItems.filter(item => 
        hasPermission(item.permission as keyof typeof hasPermission)
      );
      
      if (availableCoordinationItems.length > 0) {
        menuItems = [...menuItems, ...availableCoordinationItems];
      }
    }
    
    return menuItems;
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} mobile-tap flex-shrink-0 sidebar-3d`}>
      <SidebarContent className="flex flex-col h-full">
        {/* Logo Section - Always Visible */}
        <div className="p-4 border-b border-sidebar-border/30 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-center">
          <img 
            src={tcasaLogo} 
            alt="T-Casa" 
            className={`${collapsed ? "h-8 w-8" : "h-10 w-auto"} transition-all duration-200`} 
          />
        </div>

        {/* Fixed Header Section */}
        <div className={`${collapsed ? "hidden" : "block"} border-b border-sidebar-border/30 bg-transparent`}>
          <div className="p-4 space-y-4">
            {/* User Info Section */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">Residente</p>
              </div>
            </div>
            
            {/* Apartment and Condominium Info */}
            <div className="space-y-2 text-xs">
              {profile?.apartment_number && (
                <div className="flex items-center text-muted-foreground bg-background/50 rounded-md px-2 py-1 backdrop-blur">
                  <Building2 className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate font-medium">Apartamento {profile.apartment_number}</span>
                </div>
              )}
              {condominiumInfo && (
                <div className="flex items-center text-muted-foreground bg-background/50 rounded-md px-2 py-1 backdrop-blur">
                  <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{condominiumInfo.name}</span>
                </div>
              )}
            </div>
            
            {/* Portal Title */}
            <div className="text-center pt-2 border-t border-border/30">
              <p className="text-sm font-bold text-primary">
                Portal do Residente
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Menu Section */}
        <SidebarGroup className="flex-1 overflow-hidden">
          {!collapsed && isCoordinationMember && (
            <SidebarGroupLabel className="px-6 py-2 text-xs font-semibold text-primary">
              🏠 Portal do Residente
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="h-full">
            <div className="overflow-y-auto mobile-scroll h-full py-2">
              <SidebarMenu className="space-y-1 px-2">
                {baseMenuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`
                        sidebar-menu-item touch-target w-full
                        ${collapsed ? 'justify-center px-3' : 'justify-start'}
                        ${activeTab === item.id ? 'active' : ''}
                      `}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0 icon" />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>

              {/* Seção de Coordenação */}
              {isCoordinationMember && !permissionsLoading && (
                <>
                  {!collapsed && (
                    <div className="px-6 py-3 mt-4 border-t border-border/30">
                      <div className="text-xs font-semibold text-secondary-foreground flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Coordenação
                      </div>
                    </div>
                  )}
                  <SidebarMenu className="space-y-1 px-2">
                    {coordinationMenuItems
                      .filter(item => hasPermission(item.permission as keyof typeof hasPermission))
                      .map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={activeTab === item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`
                              sidebar-menu-item touch-target w-full bg-primary/5 border-l-2 border-primary/20
                              ${collapsed ? 'justify-center px-3' : 'justify-start'}
                              ${activeTab === item.id ? 'active bg-primary/10 border-primary' : ''}
                            `}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0 icon text-primary" />
                            {!collapsed && (
                              <span className="text-sm font-medium truncate text-primary">
                                {item.label}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
                </>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ResidentSidebar;