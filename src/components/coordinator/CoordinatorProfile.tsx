import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Building2,
  Edit,
  Save,
  X,
  Calendar,
  Shield,
  Key,
  Smartphone,
  UserCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ChangePasswordModal from "../resident/ChangePasswordModal";

interface CoordinatorProfileProps {
  profile: any;
}

const CoordinatorProfile = ({ profile }: CoordinatorProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || ''
  });
  const { toast } = useToast();

  // Buscar email do usuário autenticado
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    fetchUserEmail();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "As suas informações foram atualizadas com sucesso"
      });

      setIsEditing(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meu Perfil</h2>
          <p className="text-muted-foreground">
            Gerir as suas informações pessoais como coordenador
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "A guardar..." : "Guardar"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCog className="h-5 w-5" />
              <span>Foto de Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto">
              <UserCog className="h-12 w-12 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">
                {profile?.first_name} {profile?.last_name}
              </p>
              <Badge variant="default" className="mt-1">
                <Shield className="h-3 w-3 mr-1" />
                Coordenador
              </Badge>
            </div>
            <Button variant="outline" size="sm" disabled>
              Alterar Foto (Em breve)
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize as suas informações de contacto e pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  <User className="h-4 w-4 inline mr-1" />
                  Nome
                </Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Nome"
                  />
                ) : (
                  <p className="py-2 px-3 bg-muted rounded-md">{profile?.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apelido</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Apelido"
                  />
                ) : (
                  <p className="py-2 px-3 bg-muted rounded-md">{profile?.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </Label>
              <p className="py-2 px-3 bg-muted rounded-md text-muted-foreground">
                {userEmail || 'A carregar...'} (Não editável)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+244 900 000 000"
                />
              ) : (
                <p className="py-2 px-3 bg-muted rounded-md">{profile?.phone || 'Não definido'}</p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Informações do Condomínio
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">ID do Condomínio</Label>
                  <p className="font-mono text-sm py-1">{profile?.condominium_id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Tipo de Utilizador</Label>
                  <p className="py-1 capitalize">{profile?.role}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Informações da Conta
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Data de Criação</Label>
                  <p className="py-1">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Última Atualização</Label>
                  <p className="py-1">
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-PT') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Segurança</span>
          </CardTitle>
          <CardDescription>
            Gerir as definições de segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Alterar Palavra-passe</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Atualize a sua palavra-passe para manter a conta segura
                </p>
              </div>
              <Button onClick={() => setShowPasswordModal(true)}>
                Alterar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Autenticação de Dois Fatores</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança à sua conta
                </p>
              </div>
              <Button variant="outline" disabled>
                Em breve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showPasswordModal && (
        <ChangePasswordModal 
          open={showPasswordModal} 
          onOpenChange={setShowPasswordModal}
        />
      )}
    </div>
  );
};

export default CoordinatorProfile;