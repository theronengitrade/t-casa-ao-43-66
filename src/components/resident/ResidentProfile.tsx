import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Building2,
  Edit,
  Save,
  X,
  Calendar,
  Shield,
  Key,
  Smartphone,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ChangePasswordModal from "./ChangePasswordModal";
import { useResidentSync } from "@/hooks/useResidentSync";

interface ResidentProfileProps {
  profile: any;
}

const ResidentProfile = ({ profile }: ResidentProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    apartment_number: profile?.apartment_number || '',
    floor: profile?.floor || '',
    family_members: [] as any[],
    parking_spaces: [] as any[]
  });
  const [residentInfo, setResidentInfo] = useState<any>(null);
  const { toast } = useToast();

  const refreshResidentInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setResidentInfo(data);
      
      // Update form data with fresh resident info
      if (data) {
        setFormData(prev => ({
          ...prev,
          family_members: Array.isArray(data.family_members) ? data.family_members : [],
          parking_spaces: Array.isArray(data.parking_spaces) ? data.parking_spaces : []
        }));
      }
    } catch (error: any) {
      console.error('Error refreshing resident info:', error);
    }
  };

  // Configurar sincronização em tempo real
  useResidentSync({
    profileId: profile?.id,
    onDataChange: refreshResidentInfo
  });

  useEffect(() => {
    const fetchResidentInfo = async () => {
      try {
        console.log('🔍 Fetching resident info for profile:', profile?.id);
        const { data, error } = await supabase
          .from('residents')
          .select('*')
          .eq('profile_id', profile?.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        console.log('📋 Raw resident data:', data);
        setResidentInfo(data);
        
        // Initialize formData with both profile and resident data
        setFormData({
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          phone: profile?.phone || '',
          apartment_number: profile?.apartment_number || '',
          floor: profile?.floor || '',
          family_members: Array.isArray(data?.family_members) ? data.family_members : [],
          parking_spaces: Array.isArray(data?.parking_spaces) ? data.parking_spaces : []
        });
        
        console.log('🔄 Form data initialized:', {
          family_members: Array.isArray(data?.family_members) ? data.family_members : [],
          parking_spaces: Array.isArray(data?.parking_spaces) ? data.parking_spaces : [],
          family_count: Array.isArray(data?.family_members) ? data.family_members.length : 0,
          parking_count: Array.isArray(data?.parking_spaces) ? data.parking_spaces.length : 0
        });
        if (data) {
          setFormData(prev => ({
            ...prev,
            family_members: Array.isArray(data.family_members) ? data.family_members : [],
            parking_spaces: Array.isArray(data.parking_spaces) ? data.parking_spaces : []
          }));
        }
      } catch (error: any) {
        console.error('Error fetching resident info:', error);
      }
    };

    if (profile?.id) {
      fetchResidentInfo();
    }
  }, [profile?.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('💾 Saving profile data:', {
        profile_id: profile.id,
        profile_update: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          apartment_number: formData.apartment_number,
          floor: formData.floor
        },
        resident_update: {
          family_members: formData.family_members,
          parking_spaces: formData.parking_spaces,
          floor: formData.floor,
          apartment_number: formData.apartment_number
        }
      });

      // Update profiles table first
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || null,
          apartment_number: formData.apartment_number.trim(),
          floor: formData.floor.trim() || null
        })
        .eq('id', profile.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Prepare family members data - ensure proper JSON format
      const processedFamilyMembers = formData.family_members
        .map(member => {
          if (typeof member === 'string') {
            return member.trim() ? { name: member.trim() } : null;
          }
          return member?.name?.trim() ? { name: member.name.trim() } : null;
        })
        .filter(Boolean);

      // Prepare parking spaces data - ensure proper JSON format
      const processedParkingSpaces = formData.parking_spaces
        .map(space => {
          if (typeof space === 'string') {
            return space.trim() ? { number: space.trim(), type: 'Atribuído' } : null;
          }
          if (space && typeof space === 'object') {
            const number = space.number?.trim();
            return number ? {
              number: number,
              type: space.type || 'Atribuído'
            } : null;
          }
          return null;
        })
        .filter(Boolean);

      console.log('🅿️ Processing parking spaces:', {
        raw_input: formData.parking_spaces,
        processed_output: processedParkingSpaces,
        input_count: formData.parking_spaces.length,
        output_count: processedParkingSpaces.length
      });

      console.log('🔄 Processed data:', {
        family_members: processedFamilyMembers,
        parking_spaces: processedParkingSpaces,
        family_count: processedFamilyMembers.length,
        parking_count: processedParkingSpaces.length
      });

      // Update or upsert residents table
      const { data: existingResident } = await supabase
        .from('residents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (existingResident) {
        // Update existing resident
        const { error: residentError } = await supabase
          .from('residents')
          .update({
            family_members: processedFamilyMembers,
            parking_spaces: processedParkingSpaces,
            floor: formData.floor.trim() || null,
            apartment_number: formData.apartment_number.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('profile_id', profile.id);

        if (residentError) {
          console.error('Resident update error:', residentError);
          throw residentError;
        }
        console.log('✅ Resident data updated successfully');
      } else {
        console.log('⚠️ No existing resident found, creating new record...');
        const { error: residentError } = await supabase
          .from('residents')
          .insert({
            profile_id: profile.id,
            condominium_id: profile.condominium_id,
            apartment_number: formData.apartment_number.trim(),
            floor: formData.floor.trim() || null,
            family_members: processedFamilyMembers,
            parking_spaces: processedParkingSpaces,
            is_owner: true,
            move_in_date: new Date().toISOString().split('T')[0]
          });

        if (residentError) {
          console.error('❌ Resident creation error:', residentError);
          throw residentError;
        }

        console.log('✅ New resident record created successfully');
      }

      // Refresh resident info locally instead of full page reload
      console.log('🔄 Refreshing resident data after save...');
      await refreshResidentInfo();

      toast({
        title: "Perfil atualizado com sucesso",
        description: "As suas informações foram sincronizadas em tempo real"
      });

      setIsEditing(false);
      console.log('✅ Profile save operation completed successfully');
    } catch (error: any) {
      console.error('❌ Profile save error:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível atualizar o perfil. Tente novamente.",
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
      phone: profile?.phone || '',
      apartment_number: profile?.apartment_number || '',
      floor: profile?.floor || '',
      family_members: Array.isArray(residentInfo?.family_members) ? residentInfo.family_members : [],
      parking_spaces: Array.isArray(residentInfo?.parking_spaces) ? residentInfo.parking_spaces : []
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Temporarily commented until avatar_url column is added
      // const { error: updateError } = await supabase
      //   .from('profiles')
      //   .update({ avatar_url: publicUrl })
      //   .eq('id', profile.id);

      // if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Foto atualizada",
        description: "A sua foto de perfil foi atualizada com sucesso"
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao carregar foto",
        description: error.message || "Não foi possível carregar a foto",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    return `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meu Perfil</h2>
          <p className="text-muted-foreground">
            Gerir as suas informações pessoais
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
              <User className="h-5 w-5" />
              <span>Foto de Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl || ''} alt={`${profile?.first_name} ${profile?.last_name}`} />
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="font-semibold">
                {profile?.first_name} {profile?.last_name}
              </p>
              <Badge variant="secondary" className="mt-1">
                <Shield className="h-3 w-3 mr-1" />
                Residente
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? "A carregar..." : "Alterar Foto"}
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
                {profile?.email || 'Email não disponível'} (Não editável)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="apartment">
                  <Home className="h-4 w-4 inline mr-1" />
                  Apartamento
                </Label>
                {isEditing ? (
                  <Input
                    id="apartment"
                    value={formData.apartment_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, apartment_number: e.target.value }))}
                    placeholder="Ex: 101, A-23"
                  />
                ) : (
                  <p className="py-2 px-3 bg-muted rounded-md">{profile?.apartment_number}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Andar
                </Label>
                {isEditing ? (
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                    placeholder="Ex: 1, 2, Térreo"
                  />
                ) : (
                  <p className="py-2 px-3 bg-muted rounded-md">{profile?.floor || 'Não definido'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  <User className="h-4 w-4 inline mr-1" />
                  Agregado Familiar
                </Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {formData.family_members.map((member, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={typeof member === 'string' ? member : member?.name || ''}
                          onChange={(e) => {
                            const newMembers = [...formData.family_members];
                            newMembers[index] = typeof member === 'string' ? e.target.value : { ...member, name: e.target.value };
                            setFormData(prev => ({ ...prev, family_members: newMembers }));
                          }}
                          placeholder="Nome do membro"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newMembers = formData.family_members.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, family_members: newMembers }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          family_members: [...prev.family_members, '']
                        }));
                      }}
                    >
                      Adicionar Membro
                    </Button>
                  </div>
                ) : (
                  <p className="py-2 px-3 bg-muted rounded-md">
                    {Array.isArray(residentInfo?.family_members)
                      ? residentInfo.family_members.length
                      : Number(residentInfo?.family_members) || 0} membro(s)
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                <Home className="h-4 w-4 inline mr-1" />
                Estacionamento
              </Label>
              {isEditing ? (
                <div className="space-y-2">
                  {formData.parking_spaces.map((space, index) => (
                    <div key={index} className="flex items-center space-x-2">
                       <Input
                         value={typeof space === 'string' ? space : space?.number || ''}
                         onChange={(e) => {
                           const newSpaces = [...formData.parking_spaces];
                           newSpaces[index] = typeof space === 'string' ? e.target.value : { ...space, number: e.target.value };
                           setFormData(prev => ({ ...prev, parking_spaces: newSpaces }));
                         }}
                         placeholder="Número do lugar"
                         className="flex-1"
                       />
                       <select
                         value={typeof space === 'string' ? 'Atribuído' : space?.type || 'Atribuído'}
                         onChange={(e) => {
                           const newSpaces = [...formData.parking_spaces];
                           newSpaces[index] = typeof space === 'string' ? { number: space, type: e.target.value } : { ...space, type: e.target.value };
                           setFormData(prev => ({ ...prev, parking_spaces: newSpaces }));
                         }}
                         className="flex-1 p-2 border border-input rounded-md"
                       >
                         <option value="Atribuído">Atribuído</option>
                         <option value="Alugado">Alugado</option>
                         <option value="Propriedade">Propriedade</option>
                       </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSpaces = formData.parking_spaces.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, parking_spaces: newSpaces }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                     onClick={() => {
                       setFormData(prev => ({
                         ...prev,
                         parking_spaces: [...prev.parking_spaces, { number: '', type: 'Atribuído' }]
                       }));
                     }}
                  >
                    Adicionar Lugar
                  </Button>
                </div>
              ) : (
                <div className="py-2 px-3 bg-muted rounded-md">
                  {residentInfo?.parking_spaces?.length > 0 ? (
                    <div className="space-y-1">
                      {residentInfo.parking_spaces.some((s: any) => s?.number || s?.type) ? (
                        residentInfo.parking_spaces.map((space: any, index: number) => (
                          <div key={index} className="text-sm">
                            🚗 {space.number ?? `P${index + 1}`} - {space.type ?? 'Atribuído'}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm">
                          {residentInfo.parking_spaces.length} lugar(es)
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>Nenhum lugar de estacionamento</span>
                  )}
                </div>
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

      <ChangePasswordModal 
        open={showPasswordModal} 
        onOpenChange={setShowPasswordModal}
      />
    </div>
  );
};

export default ResidentProfile;