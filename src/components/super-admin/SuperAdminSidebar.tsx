import { 
  Building2, 
  Shield, 
  UserCog, 
  QrCode,
  Activity,
  BarChart3,
  Calculator,
  Receipt,
  User,
  MessageSquare,
  MapPin
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
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";

interface SuperAdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const menuItems = [
  { id: "condominiums", label: "Condomínios", icon: Building2 },
  { id: "city-viewer", label: "Visualizador de Cidades", icon: MapPin },
  { id: "financial-portal", label: "Portal Financeiro", icon: Calculator },
  { id: "financial-dashboard", label: "Dashboard Financeiro", icon: BarChart3 },
  { id: "licenses", label: "Licenças", icon: Shield },
  { id: "coordinators", label: "Coordenadores", icon: UserCog },
  { id: "user-management", label: "Gestão de Utilizadores", icon: User },
  { id: "chat", label: "Chat Interno", icon: MessageSquare },
  { id: "linking-codes", label: "Códigos", icon: QrCode },
  { id: "audit", label: "Auditoria", icon: Activity },
  { id: "reports", label: "Centro de Relatórios", icon: BarChart3 },
  { id: "financial", label: "Controlo Financeiro", icon: Calculator },
  { id: "expenses", label: "Gestão de Despesas", icon: Receipt },
  { id: "profile", label: "Meu Perfil", icon: User },
];

export function SuperAdminSidebar({ activeSection, setActiveSection }: SuperAdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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
            Super Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => setActiveSection(item.id)}
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