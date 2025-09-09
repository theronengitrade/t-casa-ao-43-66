import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinationPermissions } from "@/hooks/useCoordinationPermissions";
import { Shield, User, CheckCircle, XCircle } from "lucide-react";

export const CoordinationPermissionsDebug = () => {
  const { profile } = useAuth();
  const { permissions, loading, hasPermission, hasAnyPermission } = useCoordinationPermissions();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">Carregando permissões...</div>
        </CardContent>
      </Card>
    );
  }

  const permissionList = [
    { key: 'payments', label: 'Pagamentos' },
    { key: 'expenses', label: 'Despesas' },
    { key: 'payroll', label: 'Folha de Pagamento' },
    { key: 'financial_reports', label: 'Relatórios Financeiros' },
    { key: 'visitors', label: 'Visitantes' },
    { key: 'qr_codes', label: 'Códigos QR' },
    { key: 'occurrences', label: 'Ocorrências' },
    { key: 'announcements', label: 'Anúncios' },
    { key: 'action_plans', label: 'Planos de Ação' },
    { key: 'service_providers', label: 'Prestadores de Serviços' },
    { key: 'residents', label: 'Residentes' },
    { key: 'documents', label: 'Documentos' },
    { key: 'space_reservations', label: 'Reserva de Espaços' }
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Debug: Permissões do Usuário</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do Usuário */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">
              {profile?.first_name} {profile?.last_name}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <div>Papel: <Badge variant="outline">{profile?.role}</Badge></div>
            <div>Condomínio: <span className="font-mono text-xs">{profile?.condominium_id}</span></div>
            <div>Coord. Staff ID: <span className="font-mono text-xs">{(profile as any)?.coordination_staff_id || 'N/A'}</span></div>
          </div>
        </div>

        {/* Permissões Globais */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Status de Permissões</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>Todas as permissões</span>
              {permissions.all ? (
                <Badge variant="default" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Sim</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>Não</span>
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>Tem alguma permissão</span>
              {hasAnyPermission() ? (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Sim</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>Não</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Permissões Específicas */}
        <div>
          <div className="font-medium mb-3">Permissões Específicas</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {permissionList.map((permission) => (
              <div key={permission.key} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">{permission.label}</span>
                {hasPermission(permission.key as keyof typeof permissions) ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Debug Raw Data */}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">Raw Permission Data</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};