import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  MapPin, 
  Plus, 
  Building2, 
  Users, 
  Search,
  Phone,
  Mail,
  Calendar,
  Home,
  UserCheck,
  UserX,
  Download,
  Filter,
  ChevronRight,
  Loader2,
  Edit2,
  Trash2,
  X,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface City {
  id: string;
  name: string;
  country: string;
  created_at: string;
}

interface Condominium {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  currency: string;
  created_at: string;
}

interface Resident {
  id: string;
  profile_id: string;
  apartment_number: string;
  floor: string | null;
  family_members: any;
  parking_spaces: any;
  document_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  move_in_date: string | null;
  is_owner: boolean;
  created_at: string;
  profile: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
}

const CityCondominiumViewer = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [assignedCondominiums, setAssignedCondominiums] = useState<Record<string, Condominium[]>>({});
  const [residents, setResidents] = useState<Record<string, Resident[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCondominium, setSelectedCondominium] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateCity, setShowCreateCity] = useState(false);
  const [showAssignCondo, setShowAssignCondo] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityCountry, setNewCityCountry] = useState("Angola");
  const [assigningToCity, setAssigningToCity] = useState<string>("");
  const [loadingResidents, setLoadingResidents] = useState<string>("");
  const [showEditCity, setShowEditCity] = useState(false);
  const [showDeleteCity, setShowDeleteCity] = useState(false);
  const [showRemoveCondominium, setShowRemoveCondominium] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [deletingCity, setDeletingCity] = useState<City | null>(null);
  const [removingCondominium, setRemovingCondominium] = useState<{condo: Condominium, cityName: string} | null>(null);
  const [editCityName, setEditCityName] = useState("");
  const [editCityCountry, setEditCityCountry] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (citiesError) throw citiesError;
      setCities(citiesData || []);

      // Fetch all condominiums
      const { data: condoData, error: condoError } = await supabase
        .from('condominiums')
        .select('*')
        .order('name');

      if (condoError) throw condoError;
      setCondominiums(condoData || []);

      // Fetch condominium-city assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('condominium_cities')
        .select(`
          city_id,
          condominium_id,
          condominiums (
            id,
            name,
            address,
            email,
            phone,
            currency,
            created_at
          )
        `);

      if (assignmentsError) throw assignmentsError;

      // Group condominiums by city
      const grouped: Record<string, Condominium[]> = {};
      assignmentsData?.forEach((assignment: any) => {
        if (!grouped[assignment.city_id]) {
          grouped[assignment.city_id] = [];
        }
        if (assignment.condominiums) {
          grouped[assignment.city_id].push(assignment.condominiums);
        }
      });

      setAssignedCondominiums(grouped);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async (condominiumId: string) => {
    if (residents[condominiumId]) return; // Already loaded

    try {
      setLoadingResidents(condominiumId);
      
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          profile_id,
          apartment_number,
          floor,
          family_members,
          parking_spaces,
          document_number,
          emergency_contact_name,
          emergency_contact_phone,
          move_in_date,
          is_owner,
          created_at,
          profile:profiles!inner(
            id,
            user_id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('condominium_id', condominiumId)
        .order('apartment_number');

      if (error) throw error;

      setResidents(prev => ({
        ...prev,
        [condominiumId]: data || []
      }));
    } catch (error: any) {
      console.error('Error fetching residents:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar residentes. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingResidents("");
    }
  };

  const handleCreateCity = async () => {
    if (!newCityName.trim()) return;

    try {
      const { error } = await supabase
        .from('cities')
        .insert({
          name: newCityName.trim(),
          country: newCityCountry
        });

      if (error) throw error;

      toast({
        title: "Cidade criada",
        description: `Cidade "${newCityName}" criada com sucesso.`
      });

      setNewCityName("");
      setNewCityCountry("Angola");
      setShowCreateCity(false);
      fetchInitialData();
    } catch (error: any) {
      console.error('Error creating city:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar cidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAssignCondominium = async () => {
    if (!assigningToCity || !selectedCondominium) return;

    try {
      const { error } = await supabase
        .from('condominium_cities')
        .insert({
          city_id: assigningToCity,
          condominium_id: selectedCondominium
        });

      if (error) throw error;

      toast({
        title: "Condomínio atribuído",
        description: "Condomínio atribuído à cidade com sucesso."
      });

      setAssigningToCity("");
      setSelectedCondominium("");
      setShowAssignCondo(false);
      fetchInitialData();
    } catch (error: any) {
      console.error('Error assigning condominium:', error);
      toast({
        title: "Erro",
        description: "Erro ao atribuir condomínio. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setEditCityName(city.name);
    setEditCityCountry(city.country);
    setShowEditCity(true);
  };

  const handleUpdateCity = async () => {
    if (!editingCity || !editCityName.trim()) return;

    try {
      const { error } = await supabase
        .from('cities')
        .update({
          name: editCityName.trim(),
          country: editCityCountry
        })
        .eq('id', editingCity.id);

      if (error) throw error;

      toast({
        title: "Cidade atualizada",
        description: `Cidade "${editCityName}" atualizada com sucesso.`
      });

      setShowEditCity(false);
      setEditingCity(null);
      setEditCityName("");
      setEditCityCountry("");
      fetchInitialData();
    } catch (error: any) {
      console.error('Error updating city:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar cidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCity = (city: City) => {
    setDeletingCity(city);
    setShowDeleteCity(true);
  };

  const confirmDeleteCity = async () => {
    if (!deletingCity) return;

    // Check if city has condominiums
    const cityCondos = assignedCondominiums[deletingCity.id] || [];
    if (cityCondos.length > 0) {
      toast({
        title: "Erro",
        description: "Não é possível remover uma cidade que tem condomínios atribuídos. Remova primeiro os condomínios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', deletingCity.id);

      if (error) throw error;

      toast({
        title: "Cidade removida",
        description: `Cidade "${deletingCity.name}" removida com sucesso.`
      });

      setShowDeleteCity(false);
      setDeletingCity(null);
      fetchInitialData();
    } catch (error: any) {
      console.error('Error deleting city:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover cidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCondominium = (condo: Condominium, cityName: string) => {
    setRemovingCondominium({condo, cityName});
    setShowRemoveCondominium(true);
  };

  const confirmRemoveCondominium = async () => {
    if (!removingCondominium) return;

    try {
      const { error } = await supabase
        .from('condominium_cities')
        .delete()
        .eq('condominium_id', removingCondominium.condo.id);

      if (error) throw error;

      toast({
        title: "Condomínio removido",
        description: `Condomínio "${removingCondominium.condo.name}" removido da cidade "${removingCondominium.cityName}".`
      });

      setShowRemoveCondominium(false);
      setRemovingCondominium(null);
      fetchInitialData();
    } catch (error: any) {
      console.error('Error removing condominium:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover condomínio da cidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const exportResidents = async (condominiumId: string, condominiumName: string) => {
    const condoResidents = residents[condominiumId] || [];
    
    // Create CSV content
    const headers = ['Nome Completo', 'Apartamento', 'Tipo', 'Telefone', 'Agregado Familiar', 'Estacionamento', 'Data de Entrada'];
    const csvContent = [
      headers.join(','),
      ...condoResidents.map(resident => [
        `"${resident.profile?.first_name || ''} ${resident.profile?.last_name || ''}"`,
        `"${resident.apartment_number}"`,
        `"${resident.is_owner ? 'Proprietário' : 'Inquilino'}"`,
        `"${resident.profile?.phone || resident.emergency_contact_phone || ''}"`,
        `"${Array.isArray(resident.family_members) ? resident.family_members.length : 0} membros"`,
        `"${Array.isArray(resident.parking_spaces) ? resident.parking_spaces.length : 0} lugares"`,
        `"${resident.move_in_date ? new Date(resident.move_in_date).toLocaleDateString('pt-PT') : ''}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `residentes_${condominiumName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: `Lista de residentes de "${condominiumName}" exportada.`
    });
  };

  const getUnassignedCondominiums = () => {
    const assigned = new Set();
    Object.values(assignedCondominiums).flat().forEach(condo => assigned.add(condo.id));
    return condominiums.filter(condo => !assigned.has(condo.id));
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>A carregar dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Visualizador de Cidades & Condomínios
          </h2>
          <p className="text-muted-foreground">
            Organize condomínios por cidade e visualize residentes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showCreateCity} onOpenChange={setShowCreateCity}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Cidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Cidade</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="cityName">Nome da Cidade</Label>
                  <Input
                    id="cityName"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="Ex: Luanda"
                  />
                </div>
                <div>
                  <Label htmlFor="cityCountry">País</Label>
                  <Select value={newCityCountry} onValueChange={setNewCityCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Angola">Angola</SelectItem>
                      <SelectItem value="Moçambique">Moçambique</SelectItem>
                      <SelectItem value="Brasil">Brasil</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateCity(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCity} disabled={!newCityName.trim()}>
                  Criar Cidade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAssignCondo} onOpenChange={setShowAssignCondo}>
            <DialogTrigger asChild>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Atribuir Condomínio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atribuir Condomínio à Cidade</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Selecionar Cidade</Label>
                  <Select value={assigningToCity} onValueChange={setAssigningToCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Selecionar Condomínio</Label>
                  <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um condomínio" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUnassignedCondominiums().map(condo => (
                        <SelectItem key={condo.id} value={condo.id}>
                          {condo.name} - {condo.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAssignCondo(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAssignCondominium} 
                  disabled={!assigningToCity || !selectedCondominium}
                >
                  Atribuir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar cidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cities Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cidades & Condomínios ({filteredCities.length} cidades)
          </CardTitle>
          <CardDescription>
            Clique numa cidade para ver os condomínios atribuídos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma cidade encontrada</p>
            </div>
          ) : (
            <Accordion type="single" collapsible>
              {filteredCities.map((city) => {
                const cityCondos = assignedCondominiums[city.id] || [];
                
                return (
                  <AccordionItem key={city.id} value={city.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">{city.name}</div>
                            <div className="text-sm text-muted-foreground">{city.country}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {cityCondos.length} condomínio{cityCondos.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCity(city);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCity(city);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pl-8">
                        {cityCondos.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum condomínio atribuído a esta cidade</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {cityCondos.map((condo) => (
                              <Card key={condo.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="h-4 w-4" />
                                        <h4 className="font-semibold">{condo.name}</h4>
                                      </div>
                                      <div className="text-sm text-muted-foreground space-y-1">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          <span>{condo.address}</span>
                                        </div>
                                        {condo.email && (
                                          <div className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            <span>{condo.email}</span>
                                          </div>
                                        )}
                                        {condo.phone && (
                                          <div className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            <span>{condo.phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={() => handleRemoveCondominium(condo, city.name)}
                                         title="Remover condomínio da cidade"
                                       >
                                         <X className="h-4 w-4" />
                                       </Button>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => fetchResidents(condo.id)}
                                         disabled={loadingResidents === condo.id}
                                       >
                                         {loadingResidents === condo.id ? (
                                           <Loader2 className="h-4 w-4 animate-spin" />
                                         ) : (
                                           <>
                                             <Users className="h-4 w-4 mr-1" />
                                             Ver Residentes
                                           </>
                                         )}
                                       </Button>
                                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                     </div>
                                  </div>
                                  
                                  {/* Residents Table */}
                                  {residents[condo.id] && (
                                    <div className="mt-4 pt-4 border-t">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium flex items-center gap-2">
                                          <Users className="h-4 w-4" />
                                          Residentes ({residents[condo.id].length})
                                        </h5>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => exportResidents(condo.id, condo.name)}
                                        >
                                          <Download className="h-4 w-4 mr-1" />
                                          Exportar
                                        </Button>
                                      </div>
                                      
                                      {residents[condo.id].length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          <p>Nenhum residente registado</p>
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto">
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
                                              {residents[condo.id].map((resident) => (
                                                <TableRow key={resident.id}>
                                                  <TableCell>
                                                    <div className="font-medium">
                                                      {resident.profile?.first_name} {resident.profile?.last_name}
                                                    </div>
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
                                                      {resident.profile?.phone && (
                                                        <div className="flex items-center gap-1">
                                                          <Phone className="h-3 w-3" />
                                                          {resident.profile.phone}
                                                        </div>
                                                      )}
                                                      {resident.emergency_contact_phone && !resident.profile?.phone && (
                                                        <div className="flex items-center gap-1">
                                                          <Phone className="h-3 w-3" />
                                                          {resident.emergency_contact_phone}
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
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Edit City Dialog */}
      <Dialog open={showEditCity} onOpenChange={setShowEditCity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editCityName">Nome da Cidade</Label>
              <Input
                id="editCityName"
                value={editCityName}
                onChange={(e) => setEditCityName(e.target.value)}
                placeholder="Ex: Luanda"
              />
            </div>
            <div>
              <Label htmlFor="editCityCountry">País</Label>
              <Select value={editCityCountry} onValueChange={setEditCityCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Angola">Angola</SelectItem>
                  <SelectItem value="Moçambique">Moçambique</SelectItem>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                  <SelectItem value="Portugal">Portugal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCity(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCity} disabled={!editCityName.trim()}>
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete City Dialog */}
      <Dialog open={showDeleteCity} onOpenChange={setShowDeleteCity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Remoção
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja remover a cidade{" "}
              <strong>"{deletingCity?.name}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta ação não pode ser desfeita. A cidade só pode ser removida se não tiver condomínios atribuídos.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteCity(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCity}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Cidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Condominium Dialog */}
      <Dialog open={showRemoveCondominium} onOpenChange={setShowRemoveCondominium}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remover Condomínio da Cidade
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja remover o condomínio{" "}
              <strong>"{removingCondominium?.condo.name}"</strong> da cidade{" "}
              <strong>"{removingCondominium?.cityName}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              O condomínio não será removido do sistema, apenas deixará de estar associado a esta cidade.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveCondominium(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRemoveCondominium}>
              <X className="h-4 w-4 mr-2" />
              Remover da Cidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CityCondominiumViewer;