import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinationSync } from "@/hooks/useCoordinationSync";
import { CheckCircle, XCircle, RefreshCw, Shield, Users, Settings } from 'lucide-react';

export function CoordinationPermissionsTest() {
  const { profile, isCoordinationMember } = useAuth();
  const { userPermissions, getUserCoordinationRole, hasPermission, isLoading, refresh } = useCoordinationSync();

  const permissionTests = [
    { key: 'all', label: 'Acesso Total', icon: Shield },
    { key: 'payments', label: 'Pagamentos', icon: Settings },
    { key: 'expenses', label: 'Despesas', icon: Settings },
    { key: 'financial_reports', label: 'Relatórios Financeiros', icon: Settings },
    { key: 'visitors', label: 'Visitantes', icon: Users },
    { key: 'qr_codes', label: 'QR Codes', icon: Settings },
    { key: 'occurrences', label: 'Ocorrências', icon: Settings },
    { key: 'action_plans', label: 'Planos de Ação', icon: Settings },
    { key: 'service_providers', label: 'Prestadores', icon: Users },
    { key: 'announcements', label: 'Comunicados', icon: Settings },
    { key: 'documents', label: 'Documentos', icon: Settings },
    { key: 'space_reservations', label: 'Reservas', icon: Settings },
    { key: 'residents', label: 'Residentes', icon: Users },
  ];

  const userRole = getUserCoordinationRole();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Verificando permissões...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status de Coordenação
            </CardTitle>
            <Button onClick={refresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Membro da Coordenação</p>
              <div className="flex items-center gap-2 mt-1">
                {isCoordinationMember ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Sim</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Não</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Função</p>
              <div className="mt-1">
                {userRole ? (
                  <Badge variant="secondary">{userRole}</Badge>
                ) : (
                  <span className="text-muted-foreground">Nenhuma</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Perfil do Usuário</p>
            <div className="text-sm space-y-1">
              <p><strong>Nome:</strong> {profile?.first_name} {profile?.last_name}</p>
              <p><strong>Papel:</strong> <Badge variant="outline">{profile?.role}</Badge></p>
              <p><strong>Coordination Staff ID:</strong> {profile?.coordination_staff_id || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {permissionTests.map(({ key, label, icon: Icon }) => {
              const hasAccess = hasPermission(key);
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    hasAccess 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                  {hasAccess ? (
                    <CheckCircle className="h-4 w-4 ml-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                userPermissions,
                isCoordinationMember,
                userRole,
                coordination_staff_id: profile?.coordination_staff_id
              }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}