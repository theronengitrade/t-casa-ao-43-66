import { 
  Home, 
  Users, 
  UserCheck, 
  Building, 
  FileText, 
  Megaphone, 
  Calculator, 
  BarChart3,
  MapPin,
  User,
  Receipt,
  ClipboardList,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  UserCog,
  Banknote,
  Shield
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
import { useIsMobile } from "@/hooks/use-mobile";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";

interface CoordinatorSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "residents", label: "Moradores", icon: Users },
  { id: "employees", label: "Funcionários", icon: UserCog },
  { id: "payroll", label: "Folha de Pagamento", icon: Banknote },
  { id: "visitors", label: "Visitantes", icon: UserCheck },
  { id: "spaces", label: "Espaços", icon: MapPin },
  { id: "occurrences", label: "Ocorrências", icon: AlertTriangle },
  { id: "action-plans", label: "Planos de Ação", icon: ClipboardList },
  { id: "providers", label: "Prestadores", icon: Building },
  { id: "coordination-staff", label: "Equipa", icon: Users },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "announcements", label: "Anúncios", icon: Megaphone },
  { id: "chat", label: "Chat Interno", icon: MessageSquare },
  { id: "financial", label: "Financeiro", icon: Calculator },
  { id: "expenses", label: "Despesas", icon: Receipt },
  { id: "contribution", label: "Estado Conta", icon: TrendingUp },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "specific-contributions", label: "Contribuições", icon: Receipt },
  { id: "permissions-test", label: "Teste Permissões", icon: Shield },
  { id: "profile", label: "Perfil", icon: User },
];

export function CoordinatorSidebar({ activeSection, setActiveSection }: CoordinatorSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const handleMenuItemClick = (sectionId: string) => {
    setActiveSection(sectionId);
    // Auto-hide sidebar on mobile after menu item click
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} mobile-tap sidebar-3d`}>
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border/30 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-center">
          <img 
            src={tcasaLogo} 
            alt="T-Casa" 
            className={`${collapsed ? "h-2 w-2" : "h-2 w-auto"} transition-all duration-200`} 
          />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-6 py-4 text-sm font-semibold text-muted-foreground"}>
            Gestão do Condomínio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`
                      sidebar-menu-item touch-target
                      ${collapsed ? 'justify-center px-3' : 'justify-start'}
                      ${activeSection === item.id ? 'active' : ''}
                    `}
                  >
                    <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 icon`} />
                    {!collapsed && (
                      <span className="text-sm sm:text-base truncate">
                        {item.label}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}