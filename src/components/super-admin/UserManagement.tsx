import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface City {
  id: string;
  name: string;
}

interface CityViewer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at: string;
  cities: City[];
  is_active: boolean;
}

interface CreateViewerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  selectedCities: string[];
  isActive: boolean;
}

const UserManagement = () => {
  const [viewers, setViewers] = useState<CityViewer[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingViewer, setEditingViewer] = useState<CityViewer | null>(null);
  const [createData, setCreateData] = useState<CreateViewerData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    selectedCities: [],
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchViewers();
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cidades",
        variant: "destructive"
      });
    }
  };

  const fetchViewers = async () => {
    try {
      setLoading(true);
      
      // Get all city viewer profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          phone,
          created_at
        `)
        .eq('role', 'city_viewer');

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setViewers([]);
        return;
      }

      // Get all user IDs
      const userIds = profilesData.map(profile => profile.user_id);

      // Fetch emails using edge function
      let emailMap: { [key: string]: string } = {};
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('get-user-emails', {
          body: { userIds }
        });

        if (emailError) {
          console.error('Error fetching emails:', emailError);
        } else if (emailData?.success && emailData?.emails) {
          emailMap = emailData.emails.reduce((acc: { [key: string]: string }, item: any) => {
            acc[item.userId] = item.email;
            return acc;
          }, {});
        }
      } catch (error) {
        console.error('Exception calling email function:', error);
      }

      // Get city access for each viewer
      const viewersWithCities = await Promise.all(
        profilesData.map(async (profile) => {
          // Get city access
          const { data: cityAccess } = await supabase
            .from('viewer_city_access')
            .select(`
              city_id,
              cities:cities(id, name)
            `)
            .eq('user_id', profile.user_id);

          const cities = cityAccess?.map(ca => ca.cities).filter(Boolean) || [];

          return {
            id: profile.id,
            user_id: profile.user_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: emailMap[profile.user_id] || 'Email não disponível',
            phone: profile.phone,
            created_at: profile.created_at,
            cities: cities.flat(),
            is_active: true
          };
        })
      );

      setViewers(viewersWithCities);
    } catch (error) {
      console.error('Error fetching viewers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar visualizadores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateData({ ...createData, password });
  };

  const handleCreateViewer = async () => {
    try {
      if (!createData.firstName || !createData.lastName || !createData.email || !createData.password) {
        toast({
          title: "Erro",
          description: "Todos os campos obrigatórios devem ser preenchidos",
          variant: "destructive"
        });
        return;
      }

      if (createData.selectedCities.length === 0) {
        toast({
          title: "Erro", 
          description: "Selecione pelo menos uma cidade",
          variant: "destructive"
        });
        return;
      }

      // Call edge function to create city viewer user
      const { data: result, error: functionError } = await supabase.functions.invoke('create-city-viewer', {
        body: {
          firstName: createData.firstName,
          lastName: createData.lastName,
          email: createData.email,
          phone: createData.phone,
          password: createData.password,
          selectedCities: createData.selectedCities,
          isActive: createData.isActive
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro na chamada da função');
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao criar visualizador');
      }

      toast({
        title: "Sucesso",
        description: "Visualizador criado com sucesso"
      });

      setShowCreateModal(false);
      setCreateData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        selectedCities: [],
        isActive: true
      });
      
      fetchViewers();
    } catch (error) {
      console.error('Error creating viewer:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar visualizador",
        variant: "destructive"
      });
    }
  };

  const handleDeleteViewer = async (viewer: CityViewer) => {
    try {
      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(viewer.user_id);
      if (authError) throw authError;

      toast({
        title: "Sucesso",
        description: "Visualizador removido com sucesso"
      });

      fetchViewers();
    } catch (error) {
      console.error('Error deleting viewer:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover visualizador",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCities = async (viewer: CityViewer, newCityIds: string[]) => {
    try {
      const { data: result, error } = await supabase
        .rpc('update_city_viewer_access', {
          _user_id: viewer.user_id,
          _city_ids: newCityIds
        });

      if (error) throw error;

      if (!(result as any)?.success) {
        throw new Error((result as any)?.error || 'Erro ao atualizar acesso');
      }

      toast({
        title: "Sucesso",
        description: "Acesso às cidades atualizado"
      });

      fetchViewers();
    } catch (error) {
      console.error('Error updating cities:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar acesso às cidades",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (viewer: CityViewer) => {
    try {
      // Generate a secure temporary password
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      const newPassword = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      
      // Call edge function to reset password
      const { data: result, error: functionError } = await supabase.functions.invoke('reset-coordinator-password', {
        body: {
          userId: viewer.user_id,
          newPassword: newPassword
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro na chamada da função');
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao redefinir senha');
      }

      toast({
        title: "Senha redefinida com sucesso",
        description: `Nova senha temporária: ${newPassword}`,
        duration: 10000, // Show for 10 seconds so admin can copy it
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao redefinir senha",
        variant: "destructive"
      });
    }
  };

  const toggleCitySelection = (cityId: string) => {
    setCreateData(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.includes(cityId)
        ? prev.selectedCities.filter(id => id !== cityId)
        : [...prev.selectedCities, cityId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Utilizadores - Visualizadores</h1>
          <p className="text-muted-foreground">
            Gerir utilizadores com acesso limitado ao visualizador de cidades
          </p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Criar Novo Visualizador</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Visualizador</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    value={createData.firstName}
                    onChange={(e) => setCreateData({...createData, firstName: e.target.value})}
                    placeholder="Primeiro nome"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apelido *</Label>
                  <Input
                    id="lastName"
                    value={createData.lastName}
                    onChange={(e) => setCreateData({...createData, lastName: e.target.value})}
                    placeholder="Último nome"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createData.email}
                  onChange={(e) => setCreateData({...createData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={createData.phone}
                  onChange={(e) => setCreateData({...createData, phone: e.target.value})}
                  placeholder="+244 XXX XXX XXX"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    type="password"
                    value={createData.password}
                    onChange={(e) => setCreateData({...createData, password: e.target.value})}
                    placeholder="Senha temporária"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Gerar
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Cidades com Acesso *</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {cities.map(city => (
                    <div key={city.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city.id}`}
                        checked={createData.selectedCities.includes(city.id)}
                        onCheckedChange={() => toggleCitySelection(city.id)}
                      />
                      <Label htmlFor={`city-${city.id}`} className="text-sm">
                        {city.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione as cidades que o utilizador pode visualizar
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={createData.isActive}
                  onCheckedChange={(checked) => setCreateData({...createData, isActive: checked})}
                />
                <Label htmlFor="isActive">Utilizador Ativo</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateViewer}>
                  Criar Visualizador
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Visualizadores</span>
            <Button variant="ghost" size="sm" onClick={fetchViewers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">A carregar visualizadores...</div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum visualizador encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cidades com Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewers.map((viewer) => (
                  <TableRow key={viewer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {viewer.first_name} {viewer.last_name}
                        </div>
                        {viewer.phone && (
                          <div className="text-sm text-muted-foreground">
                            {viewer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{viewer.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {viewer.cities.map(city => (
                          <Badge key={city.id} variant="secondary">
                            {city.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={viewer.is_active ? "default" : "secondary"}>
                        {viewer.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingViewer(viewer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => resetPassword(viewer)}
                           title="Redefinir senha do utilizador"
                         >
                           <RefreshCw className="h-4 w-4" />
                         </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteViewer(viewer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingViewer} onOpenChange={() => setEditingViewer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Visualizador</DialogTitle>
          </DialogHeader>
          
          {editingViewer && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <p className="text-sm text-muted-foreground">
                  {editingViewer.first_name} {editingViewer.last_name}
                </p>
              </div>
              
               <div>
                 <Label>Email</Label>
                 <p className="text-sm text-muted-foreground">
                   {editingViewer.email}
                 </p>
               </div>
              
              <div>
                <Label>Cidades com Acesso</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {cities.map(city => {
                    const hasAccess = editingViewer.cities.some(c => c.id === city.id);
                    return (
                      <div key={city.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-city-${city.id}`}
                          checked={hasAccess}
                          onCheckedChange={(checked) => {
                            const currentCityIds = editingViewer.cities.map(c => c.id);
                            const newCityIds = checked 
                              ? [...currentCityIds, city.id]
                              : currentCityIds.filter(id => id !== city.id);
                            handleUpdateCities(editingViewer, newCityIds);
                          }}
                        />
                        <Label htmlFor={`edit-city-${city.id}`} className="text-sm">
                          {city.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingViewer(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;