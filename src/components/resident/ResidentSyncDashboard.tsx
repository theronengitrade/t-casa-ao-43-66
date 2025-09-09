import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinationSync } from "@/hooks/useCoordinationSync";
import { CheckCircle, XCircle, RefreshCw, Shield, Users, Bell, FileText } from 'lucide-react';

export function ResidentSyncDashboard() {
  const { profile, isCoordinationMember, refreshProfile } = useAuth();
  const { userPermissions, getUserCoordinationRole, hasPermission, refresh } = useCoordinationSync();

  const userRole = getUserCoordinationRole();

  const syncStatus = [
    {
      name: 'Perfil Atualizado',
      status: profile ? 'success' : 'error',
      icon: Users,
      description: profile ? `${profile.first_name} ${profile.last_name}` : 'Perfil não carregado'
    },
    {
      name: 'Membro da Coordenação',
      status: isCoordinationMember ? 'success' : 'info',
      icon: Shield,
      description: isCoordinationMember ? `Função: ${userRole}` : 'Residente regular'
    },
    {
      name: 'Permissões Sincronizadas',
      status: Object.keys(userPermissions).length > 0 ? 'success' : 'info',
      icon: Bell,
      description: `${Object.keys(userPermissions).length} permissões ativas`
    },
    {
      name: 'Dados em Tempo Real',
      status: 'success',
      icon: FileText,
      description: 'Sincronização automática ativa'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      default: return RefreshCw;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status de Sincronização
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={refreshProfile} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              <Button onClick={refresh} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Permissões
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syncStatus.map((item, index) => {
              const StatusIcon = getStatusIcon(item.status);
              const IconComponent = item.icon;
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 border rounded-lg"
                >
                  <div className={`p-2 rounded-full ${getStatusColor(item.status)}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <StatusIcon className={`h-4 w-4 ${
                        item.status === 'success' ? 'text-green-500' : 
                        item.status === 'error' ? 'text-red-500' : 'text-blue-500'
                      }`} />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Residente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
              <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Apartamento</p>
              <p className="font-medium">{profile?.apartment_number || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Papel no Sistema</p>
              <Badge variant="outline">{profile?.role}</Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status na Coordenação</p>
              {isCoordinationMember ? (
                <Badge variant="default">{userRole}</Badge>
              ) : (
                <Badge variant="secondary">Residente</Badge>
              )}
            </div>
          </div>

          {isCoordinationMember && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🎉 Permissões de Coordenação Ativas</h4>
              <p className="text-blue-700 text-sm mb-3">
                Como membro da coordenação, você tem acesso a funcionalidades especiais no sistema. 
                Suas permissões são sincronizadas automaticamente em tempo real.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(userPermissions).map(([key, value]) => 
                  value && (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}
                    </Badge>
                  )
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
                <h5 className="font-semibold text-blue-900 text-sm mb-2">📋 Funcionalidades Disponíveis:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800">
                  {hasPermission('residents') && <div>• Gestão de Residentes</div>}
                  {hasPermission('payroll') && <div>• Folha de Pagamento & Funcionários</div>}
                  {hasPermission('visitors') && <div>• Gestão de Visitantes</div>}
                  {hasPermission('qr_codes') && <div>• Códigos QR</div>}
                  {hasPermission('space_reservations') && <div>• Gestão de Espaços</div>}
                  {hasPermission('occurrences') && <div>• Gestão de Ocorrências</div>}
                  {hasPermission('action_plans') && <div>• Gestão de Planos de Ação</div>}
                  {hasPermission('service_providers') && <div>• Gestão de Prestadores</div>}
                  {hasPermission('announcements') && <div>• Gestão de Anúncios</div>}
                  {hasPermission('documents') && <div>• Gestão de Documentos</div>}
                  {hasPermission('financial_reports') && <div>• Gestão Financeira</div>}
                  {hasPermission('expenses') && <div>• Gestão de Despesas</div>}
                  {hasPermission('payments') && <div>• Gestão de Pagamentos</div>}
                  {hasPermission('all') && <div>• Chat de Coordenação</div>}
                </div>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  💡 Acesse estas funcionalidades através do menu lateral expandido!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}