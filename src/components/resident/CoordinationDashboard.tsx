import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CreditCard, 
  UserCheck, 
  QrCode,
  Calendar,
  AlertTriangle,
  ClipboardList,
  Wrench,
  Megaphone,
  FileText,
  PieChart,
  Receipt,
  MessageSquare,
  Shield,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useCoordinationPermissions } from "@/hooks/useCoordinationPermissions";

interface CoordinationDashboardProps {
  onNavigateTo: (tab: string) => void;
}

export function CoordinationDashboard({ onNavigateTo }: CoordinationDashboardProps) {
  const { hasPermission, permissions } = useCoordinationPermissions();

  const coordinationFeatures = [
    {
      key: 'residents',
      title: 'Gestão de Residentes',
      description: 'Gerir moradores e apartamentos',
      icon: Users,
      tab: 'coord-residents',
      color: 'bg-blue-500',
      permission: 'residents' as const
    },
    {
      key: 'financial_reports',
      title: 'Gestão Financeira & Pagamentos',
      description: 'Relatórios financeiros e gestão de pagamentos',
      icon: PieChart,
      tab: 'coord-financial-management',
      color: 'bg-green-500',
      permission: 'financial_reports' as const
    },
    {
      key: 'expenses',
      title: 'Despesas',
      description: 'Controlar gastos do condomínio',
      icon: Receipt,
      tab: 'coord-expenses-management',
      color: 'bg-red-500',
      permission: 'expenses' as const
    },
    {
      key: 'payroll',
      title: 'Folha de Pagamento',
      description: 'Gerir funcionários e salários',
      icon: UserCheck,
      tab: 'coord-payroll',
      color: 'bg-purple-500',
      permission: 'payroll' as const
    },
    {
      key: 'visitors',
      title: 'Visitantes',
      description: 'Controlar acesso de visitantes',
      icon: UserCheck,
      tab: 'coord-visitors-management',
      color: 'bg-orange-500',
      permission: 'visitors' as const
    },
    {
      key: 'qr_codes',
      title: 'QR Codes',
      description: 'Gestão de códigos QR',
      icon: QrCode,
      tab: 'coord-qr-management',
      color: 'bg-indigo-500',
      permission: 'qr_codes' as const
    },
    {
      key: 'space_reservations',
      title: 'Reservas de Espaços',
      description: 'Gerir reservas de áreas comuns',
      icon: Calendar,
      tab: 'coord-spaces-management',
      color: 'bg-cyan-500',
      permission: 'space_reservations' as const
    },
    {
      key: 'occurrences',
      title: 'Ocorrências',
      description: 'Gestão de incidentes e problemas',
      icon: AlertTriangle,
      tab: 'coord-occurrences-management',
      color: 'bg-yellow-500',
      permission: 'occurrences' as const
    },
    {
      key: 'action_plans',
      title: 'Planos de Ação',
      description: 'Tarefas e projetos',
      icon: ClipboardList,
      tab: 'coord-action-plans-management',
      color: 'bg-teal-500',
      permission: 'action_plans' as const
    },
    {
      key: 'service_providers',
      title: 'Prestadores de Serviços',
      description: 'Gerir fornecedores e contratos',
      icon: Wrench,
      tab: 'coord-providers-management',
      color: 'bg-pink-500',
      permission: 'service_providers' as const
    },
    {
      key: 'announcements',
      title: 'Comunicados',
      description: 'Gestão de anúncios e avisos',
      icon: Megaphone,
      tab: 'coord-announcements-management',
      color: 'bg-amber-500',
      permission: 'announcements' as const
    },
    {
      key: 'documents',
      title: 'Documentos',
      description: 'Gestão de arquivos e documentos',
      icon: FileText,
      tab: 'coord-documents-management',
      color: 'bg-slate-500',
      permission: 'documents' as const
    },
    {
      key: 'financial_reports',
      title: 'Relatórios Financeiros',
      description: 'Análises e relatórios detalhados',
      icon: PieChart,
      tab: 'coord-financial-management',
      color: 'bg-emerald-500',
      permission: 'financial_reports' as const
    },
    {
      key: 'all',
      title: 'Chat de Coordenação',
      description: 'Comunicação interna da coordenação',
      icon: MessageSquare,
      tab: 'coord-chat',
      color: 'bg-violet-500',
      permission: 'all' as const
    }
  ];

  const availableFeatures = coordinationFeatures.filter(feature => 
    hasPermission(feature.permission)
  );

  const totalPermissions = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Funcionalidades de Coordenação</h1>
          <p className="text-muted-foreground">
            Acesso às ferramentas de gestão do condomínio
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Shield className="h-4 w-4 mr-2" />
          {totalPermissions} permissões ativas
        </Badge>
      </div>

      {/* Status Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary">Membro da Coordenação</h3>
              <p className="text-sm text-muted-foreground">
                Você tem acesso a {availableFeatures.length} funcionalidades de gestão
              </p>
            </div>
            <Badge variant="default" className="bg-primary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Available Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card key={feature.key} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-lg ${feature.color} flex items-center justify-center`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <Button 
                  onClick={() => onNavigateTo(feature.tab)}
                  className="w-full"
                  variant="outline"
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Features Message */}
      {availableFeatures.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Funcionalidade Disponível</h3>
            <p className="text-muted-foreground">
              Suas permissões estão sendo processadas. Contacte o coordenador se o problema persistir.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}