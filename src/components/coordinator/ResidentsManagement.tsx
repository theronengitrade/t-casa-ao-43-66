import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Home,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/dateUtils";
import { useResidentSync } from "@/hooks/useResidentSync";
import { PromoteResidentModal } from "./PromoteResidentModal";
import { RemoveFromCoordinationModal } from "./RemoveFromCoordinationModal";
import { useResidentPromotion } from "@/hooks/useResidentPromotion";

interface Resident {
  id: string;
  profile_id: string;
  condominium_id: string;
  apartment_number: string;
  document_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  move_in_date: string | null;
  is_owner: boolean;
  floor: string | null;
  family_members: any;
  parking_spaces: any;
  created_at: string;
  updated_at: string;
  profile: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    apartment_number: string | null;
  };
}

interface ResidentsManagementProps {
  onStatsUpdate: () => void;
}

export const ResidentsManagement = ({ onStatsUpdate }: ResidentsManagementProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { 
    residents: promotionResidents, 
    getAvailableResidents, 
    getCoordinationMembers, 
    fetchResidents: refetchPromotionData 
  } = useResidentPromotion();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [formData, setFormData] = useState({
    apartment_number: "",
    document_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    move_in_date: "",
    is_owner: true
  });

  // Usar sincronização especializada para residentes
  useResidentSync({
    condominiumId: profile?.condominium_id,
    onDataChange: () => {
      fetchResidents();
      onStatsUpdate();
    }
  });

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchResidents();
    }
  }, [profile]);

  const fetchResidents = async () => {
    if (!profile?.condominium_id) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching residents for condominium:', profile.condominium_id);
      
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          condominium_id,
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
          updated_at,
          profile:profiles!inner(
            id,
            user_id,
            first_name,
            last_name,
            phone,
            apartment_number,
            floor
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .order('apartment_number');

      if (error) throw error;
      
      console.log('✅ Fetched residents data:', data);
      
      // Log específico dos dados de família e estacionamento
      data?.forEach((resident, index) => {
        console.log(`👥 Resident ${index + 1} (${resident.apartment_number}):`, {
          name: `${resident.profile?.first_name} ${resident.profile?.last_name}`,
          family_members: resident.family_members,
          parking_spaces: resident.parking_spaces,
          family_count: Array.isArray(resident.family_members) ? resident.family_members.length : 0,
          parking_count: Array.isArray(resident.parking_spaces) ? resident.parking_spaces.length : 0,
          family_valid: Array.isArray(resident.family_members) && resident.family_members.some((f: any) => f?.name),
          parking_valid: Array.isArray(resident.parking_spaces) && resident.parking_spaces.some((p: any) => p?.number)
        });
      });
      
      setResidents(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching residents:', error);
      toast({
        title: "Erro ao carregar residentes",
        description: "Não foi possível carregar a lista de residentes. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingResident) {
        // Update resident
        const { error } = await supabase
          .from('residents')
          .update({
            apartment_number: formData.apartment_number,
            document_number: formData.document_number || null,
            emergency_contact_name: formData.emergency_contact_name || null,
            emergency_contact_phone: formData.emergency_contact_phone || null,
            move_in_date: formData.move_in_date || null,
            is_owner: formData.is_owner
          })
          .eq('id', editingResident.id);

        if (error) throw error;

        toast({
          title: "Residente atualizado",
          description: "Dados do residente atualizados com sucesso"
        });
      }

      resetForm();
      fetchResidents();
    } catch (error: any) {
      console.error('Error saving resident:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar residente",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      apartment_number: resident.apartment_number,
      document_number: resident.document_number || "",
      emergency_contact_name: resident.emergency_contact_name || "",
      emergency_contact_phone: resident.emergency_contact_phone || "",
      move_in_date: resident.move_in_date || "",
      is_owner: resident.is_owner
    });
    setShowAddModal(true);
  };

  const handleDelete = async (resident: Resident) => {
    if (!confirm(`Tem certeza que deseja remover ${resident.profile?.first_name || 'este residente'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('residents')
        .delete()
        .eq('id', resident.id);

      if (error) throw error;

      toast({
        title: "Residente removido",
        description: "Residente removido com sucesso"
      });

      fetchResidents();
    } catch (error: any) {
      console.error('Error deleting resident:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover residente",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      apartment_number: "",
      document_number: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      move_in_date: "",
      is_owner: true
    });
    setEditingResident(null);
    setShowAddModal(false);
  };

  const filteredResidents = residents.filter(resident => {
    const searchLower = searchQuery.toLowerCase();
    return (
      resident.apartment_number.toLowerCase().includes(searchLower) ||
      (resident.profile?.first_name?.toLowerCase().includes(searchLower)) ||
      (resident.profile?.last_name?.toLowerCase().includes(searchLower)) ||
      (resident.document_number && resident.document_number.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Gestão de Residentes</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {residents.length} {residents.length === 1 ? 'residente registado' : 'residentes registados'}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center space-x-2"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Editar Residente</span>
                <span className="sm:hidden">Editar</span>
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <PromoteResidentModal 
            residents={getAvailableResidents()} 
            onPromotionSuccess={() => {
              fetchResidents();
              refetchPromotionData();
            }} 
          />
          
          <RemoveFromCoordinationModal 
            members={getCoordinationMembers()} 
            onRemovalSuccess={() => {
              fetchResidents();
              refetchPromotionData();
            }} 
          />
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Pesquisar por nome, apartamento ou documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Residents Table */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Lista de Residentes</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Gestão completa dos residentes do condomínio
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 px-6">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchQuery ? "Nenhum residente encontrado" : "Nenhum residente registado"}
              </p>
              <p className="text-sm mt-2">
                Os residentes são criados automaticamente quando se registam com o código de ligação
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 p-4">
                {filteredResidents.map((resident) => (
                  <Card key={resident.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback>
                              {resident.profile?.first_name?.[0] || 'R'}
                              {resident.profile?.last_name?.[0] || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            {resident.profile ? (
                              <div>
                                <div className="font-medium truncate">
                                  {resident.profile.first_name} {resident.profile.last_name}
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-green-600">
                                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                                  <span>Registado</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-gray-500">
                                  Apt. {resident.apartment_number}
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-orange-600">
                                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                  <span>Aguarda registo</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(resident)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(resident)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                       <div className="grid grid-cols-2 gap-3 text-sm">
                         <div>
                           <div className="flex items-center space-x-1 text-gray-500">
                             <Home className="h-3 w-3" />
                             <span>Apartamento</span>
                           </div>
                           <div className="font-mono font-medium">
                             {resident.apartment_number}
                             {resident.floor && <span className="text-gray-500 ml-1">(Andar {resident.floor})</span>}
                           </div>
                         </div>
                         
                         <div>
                           <div className="text-gray-500">Tipo</div>
                           <Badge variant={resident.is_owner ? "default" : "secondary"} className="text-xs">
                             {resident.is_owner ? "Proprietário" : "Inquilino"}
                           </Badge>
                         </div>
                         
                          {resident.family_members && Array.isArray(resident.family_members) && resident.family_members.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <User className="h-3 w-3" />
                                <span>Agregado</span>
                              </div>
                              <div className="text-sm">
                                {resident.family_members.length} membro(s)
                                {resident.family_members.some(m => m?.name) && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {resident.family_members.map(m => m?.name).filter(Boolean).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                           {resident.parking_spaces && Array.isArray(resident.parking_spaces) && resident.parking_spaces.length > 0 && (
                             <div>
                               <div className="flex items-center space-x-1 text-gray-500">
                                 <Home className="h-3 w-3" />
                                 <span>Estacionamento</span>
                               </div>
                               <div className="text-sm">
                                 {resident.parking_spaces.length} lugar(es)
                                 {resident.parking_spaces.some(s => s?.number) && (
                                   <div className="text-xs text-gray-400 mt-1">
                                     {resident.parking_spaces.map(s => s?.number).filter(Boolean).join(', ')}
                                   </div>
                                 )}
                               </div>
                             </div>
                           )}
                           
                           {/* Debug info for family and parking */}
                           {(!resident.family_members || !Array.isArray(resident.family_members) || resident.family_members.length === 0) && (
                             <div className="text-xs text-gray-300 italic">
                               👥 Sem agregado familiar
                             </div>
                           )}
                           
                           {/* Debug info for parking spaces */}
                           {(!resident.parking_spaces || !Array.isArray(resident.parking_spaces) || resident.parking_spaces.length === 0) && (
                             <div className="text-xs text-gray-300 italic">
                               🚗 Sem estacionamento registado
                             </div>
                           )}
                         
                         {resident.profile?.phone && (
                           <div>
                             <div className="flex items-center space-x-1 text-gray-500">
                               <Phone className="h-3 w-3" />
                               <span>Contacto</span>
                             </div>
                             <div className="text-sm">{resident.profile.phone}</div>
                           </div>
                         )}
                         
                         {resident.move_in_date && (
                           <div>
                             <div className="flex items-center space-x-1 text-gray-500">
                               <Calendar className="h-3 w-3" />
                               <span>Entrada</span>
                             </div>
                             <div className="text-sm">{formatDate(resident.move_in_date)}</div>
                           </div>
                         )}
                       </div>
                      
                      {resident.document_number && (
                        <div className="text-sm text-gray-500 pt-2 border-t">
                          <span>Doc: {resident.document_number}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Residente</TableHead>
                        <TableHead>Apartamento</TableHead>
                        <TableHead>Agregado/Estacionamento</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data de Entrada</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredResidents.map((resident) => (
                      <TableRow key={resident.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {resident.profile?.first_name?.[0] || 'R'}
                                {resident.profile?.last_name?.[0] || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              {resident.profile ? (
                                <div>
                                  <div className="font-medium">
                                    {resident.profile.first_name} {resident.profile.last_name}
                                  </div>
                                  <div className="flex items-center space-x-1 text-sm text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Registado</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-gray-500">
                                    Apt. {resident.apartment_number}
                                  </div>
                                  <div className="flex items-center space-x-1 text-sm text-orange-600">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Aguarda registo</span>
                                  </div>
                                </div>
                              )}
                              {resident.document_number && (
                                <div className="text-sm text-gray-500">
                                  Doc: {resident.document_number}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Home className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-mono">{resident.apartment_number}</div>
                              {resident.floor && (
                                <div className="text-sm text-gray-500">Andar {resident.floor}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {resident.family_members && Array.isArray(resident.family_members) && resident.family_members.length > 0 && (
                              <div className="flex items-center space-x-1 text-sm">
                                <User className="h-3 w-3 text-gray-400" />
                                <span>{resident.family_members.length} membro(s)</span>
                                {resident.family_members.some(m => m?.name) && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({resident.family_members.map(m => m?.name).filter(Boolean).slice(0, 2).join(', ')}{resident.family_members.length > 2 ? '...' : ''})
                                  </span>
                                )}
                              </div>
                            )}
                            {resident.parking_spaces && Array.isArray(resident.parking_spaces) && resident.parking_spaces.length > 0 && (
                              <div className="text-sm text-gray-600">
                                🚗 {resident.parking_spaces.length} lugar(es)
                                {resident.parking_spaces.some(s => s?.number) && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({resident.parking_spaces.map(s => s?.number).filter(Boolean).slice(0, 2).join(', ')}{resident.parking_spaces.length > 2 ? '...' : ''})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {resident.profile?.phone && (
                              <div className="flex items-center space-x-1 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{resident.profile.phone}</span>
                              </div>
                            )}
                            {resident.emergency_contact_phone && (
                              <div className="flex items-center space-x-1 text-sm text-orange-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>{resident.emergency_contact_phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={resident.is_owner ? "default" : "secondary"}>
                            {resident.is_owner ? "Proprietário" : "Inquilino"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {resident.move_in_date ? (
                            <div className="flex items-center space-x-1 text-sm">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{formatDate(resident.move_in_date)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(resident)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(resident)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResident ? "Editar Residente" : "Novo Residente"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apartment_number">Número do Apartamento *</Label>
              <Input
                id="apartment_number"
                value={formData.apartment_number}
                onChange={(e) => setFormData(prev => ({ ...prev, apartment_number: e.target.value }))}
                placeholder="Ex: 101, A-23"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_number">Número do Documento</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                placeholder="Bilhete de identidade, passaporte..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contacto de Emergência</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                placeholder="Nome do contacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Telefone de Emergência</Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                placeholder="+244 900 000 000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="move_in_date">Data de Entrada</Label>
              <Input
                id="move_in_date"
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData(prev => ({ ...prev, move_in_date: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_owner"
                checked={formData.is_owner}
                onChange={(e) => setFormData(prev => ({ ...prev, is_owner: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_owner">Proprietário (não inquilino)</Label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} className="order-2 sm:order-1">
                Cancelar
              </Button>
              <Button type="submit">
                {editingResident ? "Atualizar" : "Registar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};