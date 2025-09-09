import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinationPermissions } from "@/hooks/useCoordinationPermissions";

interface CoordinationStatusCardProps {
  onNavigateToCoordination?: () => void;
}

export function CoordinationStatusCard({ onNavigateToCoordination }: CoordinationStatusCardProps) {
  const { isCoordinationMember } = useAuth();
  const { permissions, hasPermission, hasAnyPermission } = useCoordinationPermissions();

  if (!isCoordinationMember) {
    return null;
  }

  const availablePermissions = [
    { key: 'all', label: 'Acesso Total', description: 'Todas as funcionalidades' },
    { key: 'payments', label: 'Pagamentos', description: 'Gestão de pagamentos' },
    { key: 'expenses', label: 'Despesas', description: 'Gestão de despesas' },
    { key: 'financial_reports', label: 'Relatórios', description: 'Relatórios financeiros' },
    { key: 'visitors', label: 'Visitantes', description: 'Gestão de visitantes' },
    { key: 'qr_codes', label: 'QR Codes', description: 'Códigos QR de visitantes' },
    { key: 'occurrences', label: 'Ocorrências', description: 'Gestão de ocorrências' },
    { key: 'action_plans', label: 'Planos de Ação', description: 'Tarefas e projetos' },
    { key: 'service_providers', label: 'Prestadores', description: 'Prestadores de serviços' },
    { key: 'announcements', label: 'Comunicados', description: 'Gestão de anúncios' },
    { key: 'documents', label: 'Documentos', description: 'Gestão de documentos' },
    { key: 'space_reservations', label: 'Reservas', description: 'Reserva de espaços' },
    { key: 'residents', label: 'Residentes', description: 'Gestão de moradores' }
  ];

  const activePermissions = availablePermissions.filter(permission => 
    hasPermission(permission.key as keyof typeof permissions)
  );

  const hasCoordinationAccess = hasAnyPermission();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Membro da Coordenação
          </CardTitle>
          <Badge variant="default" className="bg-primary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-white/50 rounded-lg">
          <p className="text-sm text-primary font-medium mb-2">
            🎉 Parabéns! Você agora tem acesso às funcionalidades de coordenação
          </p>
          <p className="text-sm text-muted-foreground">
            Como membro da equipe de coordenação, você pode acessar ferramentas especiais para gestão do condomínio.
          </p>
        </div>

        {hasCoordinationAccess && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Suas Permissões Ativas</span>
                <Badge variant="secondary" className="text-xs">
                  {activePermissions.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {activePermissions.slice(0, 6).map((permission) => (
                  <div key={permission.key} className="flex items-center gap-2 p-2 bg-white/30 rounded text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="font-medium">{permission.label}</span>
                  </div>
                ))}
              </div>
              
              {activePermissions.length > 6 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{activePermissions.length - 6} outras permissões
                </p>
              )}
            </div>

            {onNavigateToCoordination && (
              <Button 
                onClick={onNavigateToCoordination} 
                className="w-full bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Shield className="h-4 w-4 mr-2" />
                Explorar Funcionalidades
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </>
        )}

        {!hasCoordinationAccess && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⏳ Suas permissões estão sendo processadas. 
              Contacte o coordenador se o problema persistir.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}