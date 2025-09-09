import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  UserCog, 
  Building2, 
  Mail, 
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  Key,
  MoreHorizontal,
  TrendingUp
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCoordinatorManagement } from "@/hooks/useCoordinatorManagement";

interface Coordinator {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  must_change_password: boolean;
  created_at: string;
  condominium: {
    id: string;
    name: string;
    email: string;
  };
  user?: {
    email: string;
    last_sign_in_at: string;
  };
}

interface CoordinatorManagementProps {
  onStatsUpdate: () => void;
}

const CoordinatorManagement = ({ onStatsUpdate }: CoordinatorManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    coordinators, 
    loading, 
    resetCoordinatorPassword,
    getCoordinatorStats
  } = useCoordinatorManagement();

  // Update stats whenever coordinators change
  const stats = getCoordinatorStats();

  const filteredCoordinators = coordinators.filter(coordinator =>
    coordinator.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coordinator.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coordinator.condominium?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coordinator.condominium?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResetPassword = async (coordinatorId: string, userId: string) => {
    try {
      await resetCoordinatorPassword(coordinatorId, userId);
      onStatsUpdate(); // Update parent stats
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">A carregar coordenadores...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCog className="h-5 w-5" />
          <span>Gestão de Coordenadores</span>
        </CardTitle>
        <CardDescription>
          Lista de todos os coordenadores registados no sistema
        </CardDescription>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCog className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeCoordinators}</p>
                  <p className="text-xs text-muted-foreground">Com Condomínio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.needPasswordChange}</p>
                  <p className="text-xs text-muted-foreground">Precisam Alterar Password</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.withoutCondominium}</p>
                  <p className="text-xs text-muted-foreground">Órfãos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou condomínio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coordenador</TableHead>
                <TableHead>Condomínio</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Status da Password</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoordinators.map((coordinator) => (
                <TableRow key={coordinator.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {coordinator.first_name} {coordinator.last_name}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <UserCog className="h-3 w-3 mr-1" />
                        Coordenador
                      </Badge>
                    </div>
                  </TableCell>
                  
                   <TableCell>
                    {coordinator.condominium ? (
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="font-medium">{coordinator.condominium.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {coordinator.condominium.email}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sem condomínio
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {coordinator.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                          {coordinator.phone}
                        </div>
                      )}
                      {/* Email would come from auth data in real implementation */}
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1" />
                        Email do sistema
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {coordinator.must_change_password ? (
                      <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                        <AlertCircle className="h-3 w-3" />
                        <span>Deve alterar</span>
                      </Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center space-x-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        <span>Configurada</span>
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(coordinator.created_at).toLocaleDateString('pt-PT')}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(coordinator.id, coordinator.user_id)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Redefinir password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredCoordinators.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum coordenador encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoordinatorManagement;