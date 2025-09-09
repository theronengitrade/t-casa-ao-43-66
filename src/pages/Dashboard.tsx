import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  CreditCard, 
  FileText, 
  Bell, 
  Settings,
  LogOut,
  Shield,
  UserCog,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";

const Dashboard = () => {
  const { user, profile, loading, signOut, checkLicense } = useAuth();
  const [licenseValid, setLicenseValid] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const validateLicense = async () => {
      if (profile && profile.role !== 'super_admin' && profile.role !== 'city_viewer') {
        const isValid = await checkLicense();
        setLicenseValid(isValid);
        
        if (!isValid) {
          toast({
            title: "Licença Suspensa",
            description: "A sua licença está suspensa. Por favor, regularize os pagamentos para continuar a usar o sistema.",
            variant: "destructive"
          });
        }
      }
    };

    if (profile) {
      validateLicense();
    }
  }, [profile, checkLicense, toast]);

  // Redirect based on user role (after all hooks are called)
  if (profile?.role === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  }

  if (profile?.role === 'city_viewer') {
    return <Navigate to="/city-viewer" replace />;
  }

  if (profile?.role === 'coordinator') {
    return <Navigate to="/coordinator" replace />;
  }

  if (profile?.role === 'resident') {
    return <Navigate to="/resident" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-2xl">T</span>
          </div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Precisa de estar autenticado para aceder a esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!licenseValid && profile.role !== 'super_admin' && profile.role !== 'city_viewer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-destructive-foreground" />
            </div>
            <CardTitle className="text-destructive">Licença Suspensa</CardTitle>
            <CardDescription>
              A sua licença está suspensa. Por favor, regularize os pagamentos para continuar a usar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={signOut} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Terminar Sessão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-5 w-5" />;
      case 'coordinator':
        return <UserCog className="h-5 w-5" />;
      case 'resident':
        return <Home className="h-5 w-5" />;
      case 'city_viewer':
        return <Users className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrador';
      case 'coordinator':
        return 'Coordenador';
      case 'resident':
        return 'Residente';
      case 'city_viewer':
        return 'Visualizador de Cidades';
      default:
        return 'Utilizador';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={tcasaLogo} alt="T-Casa" className="h-10 w-auto" />
            <div>
              <h1 className="font-semibold">T-Casa Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {profile.first_name} {profile.last_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center space-x-1">
              {getRoleIcon(profile.role)}
              <span>{getRoleName(profile.role)}</span>
            </Badge>
            {(profile.role === 'super_admin' || profile.role === 'city_viewer') && (
            <Button variant="outline" size="sm" onClick={() => window.location.href = profile.role === 'super_admin' ? '/super-admin' : '/city-viewer'}>
              <Shield className="h-4 w-4 mr-2" />
              {profile.role === 'super_admin' ? 'Super Admin' : 'Visualizador'}
            </Button>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Painel de Controle
            </h2>
            <p className="text-lg text-muted-foreground">
              Aceda às principais funcionalidades do sistema T-Casa
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Super Admin Actions */}
            {profile.role === 'super_admin' && (
              <>
                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Gerir Condomínios
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">
                      Condomínios ativos
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Licenças
                    </CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">
                      A expirar este mês
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Coordenadores
                    </CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">25</div>
                    <p className="text-xs text-muted-foreground">
                      Coordenadores ativos
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Coordinator Actions */}
            {profile.role === 'coordinator' && (
              <>
                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Residentes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">
                      Residentes registados
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Finanças
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">
                      Pagamentos pendentes
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Documentos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-xs text-muted-foreground">
                      Documentos partilhados
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Comunicados
                    </CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">
                      Comunicados ativos
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Resident Actions */}
            {profile.role === 'resident' && (
              <>
                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Meus Pagamentos
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1</div>
                    <p className="text-xs text-muted-foreground">
                      Pagamento pendente
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Visitantes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-xs text-muted-foreground">
                      Visitas pendentes
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Comunicados
                    </CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-xs text-muted-foreground">
                      Comunicados não lidos
                    </p>
                  </CardContent>
                </Card>

                <Card className="feature-card cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Documentos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">
                      Documentos disponíveis
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Sistema inicializado com sucesso</p>
                    <p className="text-sm text-muted-foreground">
                      Base de dados configurada e pronta para uso
                    </p>
                  </div>
                  <Badge variant="secondary">Agora</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;