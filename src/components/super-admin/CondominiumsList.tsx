import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Building2, 
  MapPin, 
  Mail, 
  Phone,
  Calendar,
  Users,
  Shield,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  UserCog
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Condominium {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  currency: string;
  resident_linking_code: string;
  created_at: string;
  licenses: Array<{
    id: string;
    status: string;
    end_date: string;
  }>;
  profiles: Array<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  }>;
}

interface CondominiumsListProps {
  onStatsUpdate: () => void;
}

const CondominiumsList = ({ onStatsUpdate }: CondominiumsListProps) => {
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCondominiums();
  }, []);

  const fetchCondominiums = async () => {
    try {
      const { data, error } = await supabase
        .from('condominiums')
        .select(`
          id,
          name,
          address,
          email,
          phone,
          currency,
          resident_linking_code,
          created_at,
          licenses (
            id,
            status,
            end_date
          ),
          profiles!profiles_condominium_id_fkey (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCondominiums(data || []);
    } catch (error) {
      console.error('Error fetching condominiums:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de condomínios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLicense = async (condominiumId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('licenses')
        .update({ status: newStatus })
        .eq('condominium_id', condominiumId);

      if (error) throw error;

      await fetchCondominiums();
      onStatsUpdate();

      toast({
        title: "Licença atualizada",
        description: `Licença ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso`,
      });
    } catch (error) {
      console.error('Error toggling license:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar licença",
        variant: "destructive"
      });
    }
  };

  const filteredCondominiums = condominiums.filter(condo =>
    condo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condo.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condo.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCoordinator = (profiles: Condominium['profiles']) => {
    return profiles.find(profile => profile.role === 'coordinator');
  };

  const getResidentsCount = (profiles: Condominium['profiles']) => {
    return profiles.filter(profile => profile.role === 'resident').length;
  };

  const getLicenseStatus = (licenses: Condominium['licenses']) => {
    if (!licenses || licenses.length === 0) return { status: 'none', badge: 'destructive' };
    
    const activeLicense = licenses.find(license => license.status === 'active');
    if (activeLicense) {
      const endDate = new Date(activeLicense.end_date);
      const now = new Date();
      const daysToExpire = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysToExpire < 0) {
        return { status: 'expired', badge: 'destructive' };
      } else if (daysToExpire <= 30) {
        return { status: 'expiring', badge: 'outline' };
      } else {
        return { status: 'active', badge: 'default' };
      }
    }
    
    const pausedLicense = licenses.find(license => license.status === 'paused');
    if (pausedLicense) {
      return { status: 'paused', badge: 'secondary' };
    }
    
    return { status: 'unknown', badge: 'destructive' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">A carregar condomínios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Gestão de Condomínios</span>
        </CardTitle>
        <CardDescription>
          Lista de todos os condomínios registados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, endereço ou email..."
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
                <TableHead>Condomínio</TableHead>
                <TableHead>Coordenador</TableHead>
                <TableHead>Residentes</TableHead>
                <TableHead>Licença</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCondominiums.map((condo) => {
                const coordinator = getCoordinator(condo.profiles);
                const residentsCount = getResidentsCount(condo.profiles);
                const licenseStatus = getLicenseStatus(condo.licenses);
                
                return (
                  <TableRow key={condo.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{condo.name}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {condo.address.substring(0, 50)}...
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {condo.email}
                          </div>
                          {condo.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {condo.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {coordinator ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {coordinator.first_name} {coordinator.last_name}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <UserCog className="h-3 w-3 mr-1" />
                            Coordenador
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Sem coordenador
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{residentsCount}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={licenseStatus.badge as any}>
                        <Shield className="h-3 w-3 mr-1" />
                        {licenseStatus.status === 'active' && 'Ativa'}
                        {licenseStatus.status === 'paused' && 'Pausada'}
                        {licenseStatus.status === 'expired' && 'Expirada'}
                        {licenseStatus.status === 'expiring' && 'A expirar'}
                        {licenseStatus.status === 'none' && 'Sem licença'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(condo.created_at).toLocaleDateString('pt-PT')}
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {condo.licenses && condo.licenses.length > 0 && (
                            <DropdownMenuItem
                              onClick={() => handleToggleLicense(
                                condo.id, 
                                condo.licenses[0].status
                              )}
                            >
                              {condo.licenses[0].status === 'active' ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pausar licença
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Ativar licença
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {filteredCondominiums.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum condomínio encontrado
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

export default CondominiumsList;