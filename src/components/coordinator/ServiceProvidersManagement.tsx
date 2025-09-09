import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit, Trash2, Phone, Mail, User, Building } from "lucide-react";

interface ServiceProvider {
  id: string;
  name: string;
  service_type: string;
  contact_person: string;
  phone: string;
  email: string;
  document_number: string;
  is_authorized: boolean;
  created_at: string;
}

interface ServiceProvidersManagementProps {
  onStatsUpdate: () => void;
}

export function ServiceProvidersManagement({ onStatsUpdate }: ServiceProvidersManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    service_type: "",
    contact_person: "",
    phone: "",
    email: "",
    document_number: "",
    is_authorized: false,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('condominium_id', profile?.condominium_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar prestadores de serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    try {
      const { error } = await supabase
        .from('service_providers')
        .insert({
          ...formData,
          condominium_id: profile?.condominium_id,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Prestador de serviços criado com sucesso.",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchProviders();
      onStatsUpdate();
    } catch (error) {
      console.error('Error creating provider:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar prestador de serviços.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProvider = async () => {
    if (!editingProvider) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .update(formData)
        .eq('id', editingProvider.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Prestador de serviços atualizado com sucesso.",
      });

      setEditingProvider(null);
      resetForm();
      fetchProviders();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating provider:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar prestador de serviços.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm("Tem certeza que deseja remover este prestador de serviços?")) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Prestador de serviços removido com sucesso.",
      });

      fetchProviders();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover prestador de serviços.",
        variant: "destructive",
      });
    }
  };

  const toggleAuthorization = async (providerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_providers')
        .update({ is_authorized: !currentStatus })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Prestador ${!currentStatus ? 'autorizado' : 'desautorizado'} com sucesso.`,
      });

      fetchProviders();
      onStatsUpdate();
    } catch (error) {
      console.error('Error toggling authorization:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar autorização.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      service_type: "",
      contact_person: "",
      phone: "",
      email: "",
      document_number: "",
      is_authorized: false,
    });
  };

  const openEditDialog = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      service_type: provider.service_type,
      contact_person: provider.contact_person || "",
      phone: provider.phone || "",
      email: provider.email || "",
      document_number: provider.document_number || "",
      is_authorized: provider.is_authorized,
    });
  };

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (provider.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const serviceTypes = [
    "Limpeza", "Manutenção", "Segurança", "Jardinagem", "Elevadores",
    "Electricidade", "Canalização", "Pintura", "Ar Condicionado", "Outros"
  ];

  const ProviderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome da Empresa *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome da empresa"
          />
        </div>
        <div>
          <Label htmlFor="service_type">Tipo de Serviço *</Label>
          <select
            id="service_type"
            value={formData.service_type}
            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecionar tipo</option>
            {serviceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_person">Pessoa de Contacto</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="Nome do responsável"
          />
        </div>
        <div>
          <Label htmlFor="document_number">Documento/NIF</Label>
          <Input
            id="document_number"
            value={formData.document_number}
            onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
            placeholder="Número do documento"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Número de telefone"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_authorized"
          checked={formData.is_authorized}
          onCheckedChange={(checked) => setFormData({ ...formData, is_authorized: checked as boolean })}
        />
        <Label htmlFor="is_authorized">Autorizar prestador</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false);
            setEditingProvider(null);
            resetForm();
          }}
        >
          Cancelar
        </Button>
        <Button onClick={editingProvider ? handleUpdateProvider : handleCreateProvider}>
          {editingProvider ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prestadores de Serviços</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir prestadores de serviços autorizados
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Prestador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Prestador</DialogTitle>
            </DialogHeader>
            <ProviderForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Prestadores ({filteredProviders.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar prestadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Pessoa Responsável</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        {provider.document_number && (
                          <p className="text-xs text-gray-400">Doc: {provider.document_number}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{provider.service_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {provider.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{provider.phone}</span>
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{provider.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {provider.contact_person && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{provider.contact_person}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={provider.is_authorized ? "default" : "destructive"}>
                      {provider.is_authorized ? "Autorizado" : "Não Autorizado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAuthorization(provider.id, provider.is_authorized)}
                        className={provider.is_authorized ? "text-red-600" : "text-green-600"}
                      >
                        {provider.is_authorized ? "Desautorizar" : "Autorizar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(provider)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProviders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum prestador de serviços encontrado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Prestador</DialogTitle>
          </DialogHeader>
          <ProviderForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}