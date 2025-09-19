import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Users, 
  LogOut,
  Settings,
  MapPin,
  Search,
  Download,
  Eye,
  Home,
  Phone,
  Calendar,
  UserCheck,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";
import * as XLSX from 'xlsx';

interface City {
  id: string;
  name: string;
}

interface Condominium {
  id: string;
  name: string;
  address: string;
  city_name: string;
  resident_count: number;
}

interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  apartment_number: string;
  floor: string | null;
  family_members: any;
  parking_spaces: any;
  move_in_date: string | null;
  is_owner: boolean;
  emergency_contact_phone: string | null;
  condominium_name: string;
  city_name: string;
}

const CityViewerDashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [accessibleCities, setAccessibleCities] = useState<City[]>([]);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cities' | 'condos' | 'residents'>('cities');
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role === 'city_viewer' && user?.id) {
      fetchAccessibleCities();
    }
  }, [profile, user]);

  useEffect(() => {
    if (selectedCity) {
      fetchCityCondominiums(selectedCity);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedCondominium) {
      fetchCondominiumResidents(selectedCondominium);
    }
  }, [selectedCondominium]);

  const fetchAccessibleCities = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_accessible_cities', {
          _user_id: user?.id
        });

      if (error) throw error;
      
      const cities = data?.map((row: any) => ({
        id: row.city_id,
        name: row.city_name
      })) || [];
      
      setAccessibleCities(cities);
    } catch (error) {
      console.error('Error fetching accessible cities:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cidades acessíveis",
        variant: "destructive"
      });
    }
  };

  const fetchCityCondominiums = async (cityId: string) => {
    try {
      const { data: condoData, error } = await supabase
        .from('condominium_cities')
        .select(`
          condominium_id,
          condominiums:condominiums(
            id,
            name,
            address
          )
        `)
        .eq('city_id', cityId);

      if (error) throw error;

      // Get resident counts for each condominium
      const condominiumsWithCounts = await Promise.all(
        (condoData || []).map(async (item) => {
          const condo = item.condominiums;
          if (!condo) return null;

          const { count } = await supabase
            .from('residents')
            .select('*', { count: 'exact', head: true })
            .eq('condominium_id', condo.id);

          return {
            id: condo.id,
            name: condo.name,
            address: condo.address,
            city_name: accessibleCities.find(c => c.id === cityId)?.name || '',
            resident_count: count || 0
          };
        })
      );

      setCondominiums(condominiumsWithCounts.filter(Boolean) as Condominium[]);
      setViewMode('condos');
    } catch (error) {
      console.error('Error fetching condominiums:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar condomínios",
        variant: "destructive"
      });
    }
  };

  const fetchCondominiumResidents = async (condominiumId: string) => {
    try {
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          apartment_number,
          floor,
          family_members,
          parking_spaces,
          move_in_date,
          is_owner,
          emergency_contact_phone,
          profile_id,
          profiles:profiles(
            user_id,
            first_name,
            last_name,
            phone
          ),
          condominiums:condominiums(
            name
          )
        `)
        .eq('condominium_id', condominiumId);

      if (error) throw error;

      // Map residents data without trying to fetch email from auth
      // City viewers don't need email access for privacy reasons
      const mappedResidents = (data || []).map((resident) => {
        const profile = resident.profiles;
        if (!profile) return null;
        
        return {
          id: resident.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: 'N/A', // City viewers don't have access to email for privacy
          phone: profile.phone || resident.emergency_contact_phone || 'N/A',
          apartment_number: resident.apartment_number,
          floor: resident.floor,
          family_members: resident.family_members,
          parking_spaces: resident.parking_spaces,
          move_in_date: resident.move_in_date,
          is_owner: resident.is_owner,
          emergency_contact_phone: resident.emergency_contact_phone,
          condominium_name: resident.condominiums?.name || '',
          city_name: accessibleCities.find(c => c.id === selectedCity)?.name || ''
        };
      }).filter(Boolean) as Resident[];

      setResidents(mappedResidents);
      setViewMode('residents');
    } catch (error) {
      console.error('Error fetching residents:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar residentes",
        variant: "destructive"
      });
    }
  };

  const exportToExcel = () => {
    if (residents.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum residente para exportar",
        variant: "default"
      });
      return;
    }

    const exportData = residents.map(resident => ({
      'Nome Completo': `${resident.first_name} ${resident.last_name}`,
      Apartamento: resident.apartment_number,
      'Agregado Familiar': Array.isArray(resident.family_members) ? `${resident.family_members.length} membros` : '0 membros',
      Estacionamento: Array.isArray(resident.parking_spaces) ? `${resident.parking_spaces.length} lugares` : '0 lugares',
      Contacto: resident.phone,
      Tipo: resident.is_owner ? 'Proprietário' : 'Inquilino',
      'Data de Entrada': resident.move_in_date ? new Date(resident.move_in_date).toLocaleDateString('pt-PT') : '',
      Condomínio: resident.condominium_name,
      Cidade: resident.city_name
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Residentes');
    
    const cityName = accessibleCities.find(c => c.id === selectedCity)?.name || 'cidade';
    const condoName = condominiums.find(c => c.id === selectedCondominium)?.name || 'condominio';
    
    XLSX.writeFile(wb, `residentes_${cityName}_${condoName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Sucesso",
      description: "Dados exportados com sucesso"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={tcasaLogo} alt="T-Casa" className="h-16 w-auto mx-auto" />
          <p className="text-muted-foreground">A carregar visualizador de cidades...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'city_viewer') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredResidents = residents.filter(resident =>
    `${resident.first_name} ${resident.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.apartment_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCondominiums = condominiums.filter(condo =>
    condo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condo.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background mobile-body-offset">
      {/* Header */}
      <header className="mobile-fixed-header">
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 mobile-flex-wrap">
            <img src={tcasaLogo} alt="T-Casa" className="h-6 sm:h-10 w-auto flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold truncate">Visualizador de Cidades & Condomínios</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Bem-vindo, {profile.first_name} {profile.last_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 mobile-flex-wrap">
            <Badge variant="default" className="hidden sm:flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>City Viewer</span>
            </Badge>
            <Badge variant="default" className="sm:hidden">
              <Eye className="h-3 w-3" />
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toast({
                title: "Configurações",
                description: "Funcionalidade de configurações em desenvolvimento."
              })}
              className="hidden sm:flex touch-target"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="touch-target">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 mobile-scroll mobile-main-content">
        <div className="space-y-4 sm:space-y-6 mobile-viewport mobile-responsive-content">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setViewMode('cities');
                setSelectedCity('');
                setSelectedCondominium('');
                setResidents([]);
                setCondominiums([]);
              }}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Cidades
            </Button>
            {selectedCity && (
              <>
                <span className="text-muted-foreground">/</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setViewMode('condos');
                    setSelectedCondominium('');
                    setResidents([]);
                  }}
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  {accessibleCities.find(c => c.id === selectedCity)?.name}
                </Button>
              </>
            )}
            {selectedCondominium && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {condominiums.find(c => c.id === selectedCondominium)?.name}
                </span>
              </>
            )}
          </div>

          {/* Cities View */}
          {viewMode === 'cities' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Cidades Acessíveis</h2>
                <p className="text-muted-foreground">
                  Selecione uma cidade para visualizar os seus condomínios
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accessibleCities.map(city => (
                  <Card 
                    key={city.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCity(city.id);
                      setSearchTerm('');
                    }}
                  >
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {city.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Clique para visualizar condomínios
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {accessibleCities.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma cidade atribuída ao seu utilizador
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Condominiums View */}
          {viewMode === 'condos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    Condomínios - {accessibleCities.find(c => c.id === selectedCity)?.name}
                  </h2>
                  <p className="text-muted-foreground">
                    Selecione um condomínio para ver os residentes
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar condomínios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCondominiums.map(condo => (
                  <Card 
                    key={condo.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCondominium(condo.id);
                      setSearchTerm('');
                    }}
                  >
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        {condo.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">
                        {condo.address}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        {condo.resident_count} residentes
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCondominiums.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Nenhum condomínio encontrado com essa pesquisa' : 'Nenhum condomínio encontrado nesta cidade'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Residents View */}
          {viewMode === 'residents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    Residentes - {condominiums.find(c => c.id === selectedCondominium)?.name}
                  </h2>
                  <p className="text-muted-foreground">
                    Lista de todos os residentes do condomínio
                  </p>
                </div>
                <Button onClick={exportToExcel} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Exportar Excel</span>
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar residentes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Card>
                <CardContent>
                  {filteredResidents.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Nenhum residente encontrado com essa pesquisa' : 'Nenhum residente encontrado neste condomínio'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome Completo</TableHead>
                          <TableHead>Apartamento</TableHead>
                          <TableHead>Agregado/Estacionamento</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Data de Entrada</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResidents.map(resident => (
                          <TableRow key={resident.id}>
                            <TableCell className="font-medium">
                              {resident.first_name} {resident.last_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                <span>{resident.apartment_number}</span>
                                {resident.floor && (
                                  <span className="text-muted-foreground">
                                    (Andar {resident.floor})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                <div>
                                  👥 {Array.isArray(resident.family_members) ? resident.family_members.length : 0} agregado(s)
                                </div>
                                <div>
                                  🚗 {Array.isArray(resident.parking_spaces) ? resident.parking_spaces.length : 0} lugar(es)
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {resident.phone !== 'N/A' && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {resident.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={resident.is_owner ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {resident.is_owner ? (
                                  <>
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Proprietário
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3 mr-1" />
                                    Inquilino
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {resident.move_in_date && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(resident.move_in_date).toLocaleDateString('pt-PT')}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CityViewerDashboard;