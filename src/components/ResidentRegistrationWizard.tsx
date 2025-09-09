import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Key, 
  UserPlus, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Home,
  Phone,
  Mail,
  User,
  Building2,
  Info,
  Users,
  Car,
  Plus,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FamilyMember {
  name: string;
  relationship: string;
  age: string;
}

interface ParkingSpace {
  number: string;
  type: string;
}

interface ValidationResult {
  success: boolean;
  error?: string;
  code?: string;
  condominium_id?: string;
  condominium_name?: string;
  message?: string;
}

const ResidentRegistrationWizard = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [linkingCode, setLinkingCode] = useState("");
  const [condominiumName, setCondominiumName] = useState("");
  const [condominiumId, setCondominiumId] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    apartmentNumber: "",
    floor: "",
    password: "",
    confirmPassword: ""
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);

  const { toast } = useToast();

  // Generate floor options (RC to 100º)
  const floorOptions = [
    { value: "RC", label: "RC (Rés do Chão)" },
    ...Array.from({ length: 100 }, (_, i) => ({
      value: `${i + 1}º`,
      label: `${i + 1}º Andar`
    }))
  ];

  const relationshipOptions = [
    "Cônjuge", "Filho(a)", "Pai/Mãe", "Irmão/Irmã", "Avô/Avó", "Neto(a)", "Outro"
  ];

  const parkingTypeOptions = [
    "Coberto", "Descoberto", "Garagem", "Box"
  ];

  const validateLinkingCode = async () => {
    if (!linkingCode || linkingCode.trim() === "") {
      toast({
        title: "Código obrigatório",
        description: "Por favor, insira o código de ligação",
        variant: "destructive"
      });
      return;
    }

    if (!formData.apartmentNumber || formData.apartmentNumber.trim() === "") {
      toast({
        title: "Apartamento obrigatório", 
        description: "Por favor, preencha o número do apartamento para validação",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const trimmedCode = linkingCode.trim();
      const trimmedApartment = formData.apartmentNumber.trim();
      
      console.log('🔍 [WIZARD] Starting complete validation:', {
        code: trimmedCode,
        apartment: trimmedApartment,
        timestamp: new Date().toISOString()
      });

      // ✅ USAR FUNÇÃO DE VALIDAÇÃO COMPLETA
      const { data: validationData, error: validationError } = await supabase.rpc(
        'validate_linking_code_and_apartment',
        {
          _linking_code: trimmedCode,
          _apartment_number: trimmedApartment
        }
      );

      console.log('🔍 [WIZARD] Validation result:', {
        data: validationData,
        error: validationError
      });

      if (validationError) {
        console.error('❌ [Wizard] Validation function error:', validationError);
        toast({
          title: "Erro na validação",
          description: "Erro interno na validação. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const validation = validationData as unknown as ValidationResult;

      if (!validation?.success) {
        console.error('❌ [WIZARD] Validation failed:', validation);
        
        // Tratar erros específicos da validação
        let errorMessage = validation.error || "Código ou apartamento inválido";
        
        if (validation.code === 'APARTMENT_OCCUPIED') {
          errorMessage = `O apartamento ${trimmedApartment} já está ocupado por outro residente.`;
        } else if (validation.code === 'INVALID_LINKING_CODE') {
          errorMessage = "Código de ligação inválido ou expirado.";
        } else if (validation.code === 'INVALID_FORMAT') {
          errorMessage = "Formato do código inválido. Deve ter 16 caracteres hexadecimais.";
        }
        
        toast({
          title: "Validação falhou",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // ✅ Validação bem-sucedida
      console.log('✅ [Wizard] Complete validation successful:', validation);
      
      setCondominiumName(validation.condominium_name || 'Condomínio Encontrado');
      setCondominiumId(validation.condominium_id || '');
      setStep(6); // Mover para confirmação
      
      toast({
        title: "✅ Código válido!",
        description: `Condomínio: ${validation.condominium_name}`,
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ [Wizard] Unexpected validation error:', error);
      toast({
        title: "Erro inesperado",
        description: `Erro durante validação: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: "", relationship: "", age: "" }]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const addParkingSpace = () => {
    setParkingSpaces([...parkingSpaces, { number: "", type: "" }]);
  };

  const removeParkingSpace = (index: number) => {
    setParkingSpaces(parkingSpaces.filter((_, i) => i !== index));
  };

  const updateParkingSpace = (index: number, field: keyof ParkingSpace, value: string) => {
    const updated = [...parkingSpaces];
    updated[index] = { ...updated[index], [field]: value };
    setParkingSpaces(updated);
  };

  const handleRegistration = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro nas palavras-passe",
        description: "As palavras-passe não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (!formData.floor) {
      toast({
        title: "Andar obrigatório",
        description: "Por favor, selecione o andar do apartamento",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔒 [Wizard] Starting final registration with validation...');
      
      // VALIDAÇÃO DUPLA CRÍTICA: Revalidar código e apartamento antes do registro
      const { data: validationData, error: validationError } = await supabase.rpc(
        'validate_linking_code_and_apartment',
        {
          _linking_code: linkingCode.trim(),
          _apartment_number: formData.apartmentNumber.trim()
        }
      );

      if (validationError) {
        console.error('❌ [Wizard] Validation function error:', validationError);
        toast({
          title: "Erro de validação",
          description: "Erro ao validar dados. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const validation = validationData as unknown as ValidationResult;

      if (!validation?.success) {
        console.error('❌ [Wizard] Final validation failed:', validation);
        let errorMessage = "Código de ligação ou apartamento inválido";
        
        if (validation?.code === 'APARTMENT_OCCUPIED') {
          errorMessage = `O apartamento ${formData.apartmentNumber} já está ocupado por outro residente.`;
        } else if (validation?.code === 'INVALID_LINKING_CODE') {
          errorMessage = "Código de ligação não é mais válido. Verifique com o administrador.";
        }
        
        toast({
          title: "Erro na validação final",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Voltar ao passo de validação
        setStep(5);
        return;
      }

      console.log('✅ [Wizard] Final validation successful:', validation);

      // Proceder com o registro após validação dupla bem-sucedida
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            linking_code: linkingCode.trim(),
            phone: formData.phone,
            apartment_number: formData.apartmentNumber.trim(),
            floor: formData.floor,
            family_members: familyMembers,
            parking_spaces: parkingSpaces
          }
        }
      });

      if (error) {
        console.error('❌ [Wizard] Registration error:', error);
        
        // Tratar erros específicos do Supabase
        let errorMessage = error.message;
        if (error.message.includes('Falha na validação')) {
          errorMessage = "Os dados não passaram na validação final. Verifique se o apartamento ainda está disponível.";
        } else if (error.message.includes('already registered')) {
          errorMessage = "Este email já está registado no sistema.";
        }
        
        toast({
          title: "Erro no registo",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        console.log('✅ [Wizard] Registration successful for user:', data.user.id);
        setStep(6);
        toast({
          title: "Registo concluído!",
          description: `Conta criada com sucesso no ${validation.condominium_name}. Verifique o seu email.`
        });
      }
    } catch (error) {
      console.error('❌ [Wizard] Unexpected error during registration:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o registo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemo = () => {
    setStep(1);
    setLinkingCode("");
    setCondominiumName("");
    setCondominiumId("");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      apartmentNumber: "",
      floor: "",
      password: "",
      confirmPassword: ""
    });
    setFamilyMembers([]);
    setParkingSpaces([]);
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 2:
        return formData.apartmentNumber && formData.floor;
      case 4:
        return formData.password && formData.confirmPassword;
      case 5:
        return linkingCode && condominiumName; // Validação já foi feita
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-1 sm:space-x-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((stepNum) => (
          <div key={stepNum} className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${
              step >= stepNum ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
            }`}>
              {step > stepNum ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : stepNum}
            </div>
            {stepNum < 6 && <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground mx-0.5 sm:mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5" />
              <span>Dados Pessoais</span>
            </CardTitle>
            <CardDescription>
              Preencha os seus dados pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  placeholder="Nome"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apelido *</Label>
                <Input
                  id="lastName"
                  placeholder="Apelido"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-1" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefone *
              </Label>
              <Input
                id="phone"
                placeholder="+244 900 000 000"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full" 
              disabled={!canProceedToNext()}
            >
              Continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Apartment Details */}
      {step === 2 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Detalhes do Apartamento</span>
            </CardTitle>
            <CardDescription>
              Informações sobre o seu apartamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apartmentNumber">
                <Home className="h-4 w-4 inline mr-1" />
                Número do Apartamento *
              </Label>
              <Input
                id="apartmentNumber"
                placeholder="Ex: 101, A-23, B-45"
                value={formData.apartmentNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, apartmentNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">
                <Building2 className="h-4 w-4 inline mr-1" />
                Andar *
              </Label>
              <Select value={formData.floor} onValueChange={(value) => setFormData(prev => ({ ...prev, floor: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o andar" />
                </SelectTrigger>
                <SelectContent>
                  {floorOptions.map((floor) => (
                    <SelectItem key={floor.value} value={floor.value}>
                      {floor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                className="w-full sm:flex-1" 
                disabled={!canProceedToNext()}
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Family Members */}
      {step === 3 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Familiares</span>
            </CardTitle>
            <CardDescription>
              Adicione os membros da sua família (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Membros da Família</Label>
              {familyMembers.map((member, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Membro {index + 1}</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeFamilyMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Nome"
                      value={member.name}
                      onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                      className="text-sm"
                    />
                    <Select 
                      value={member.relationship} 
                      onValueChange={(value) => updateFamilyMember(index, 'relationship', value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Parentesco" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((rel) => (
                          <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Idade"
                      type="number"
                      value={member.age}
                      onChange={(e) => updateFamilyMember(index, 'age', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addFamilyMember} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep(4)} className="w-full sm:flex-1">
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Password */}
      {step === 4 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Definir Palavra-passe</span>
            </CardTitle>
            <CardDescription>
              Crie uma palavra-passe segura para a sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="w-full sm:flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={() => setStep(5)} 
                className="w-full sm:flex-1" 
                disabled={!canProceedToNext()}
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Linking Code & Validation */}
      {step === 5 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Código de Ligação & Apartamento</span>
            </CardTitle>
            <CardDescription>
              Valide o código fornecido pelo administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkingCode">Código de Ligação</Label>
              <Input
                id="linkingCode"
                placeholder="Ex: fecf7bee03b5f41c"
                value={linkingCode}
                onChange={(e) => setLinkingCode(e.target.value)}
                className="text-center text-lg tracking-wider font-mono"
                maxLength={16}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Dados a validar
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Apartamento: <strong>{formData.apartmentNumber}</strong> - Andar: <strong>{formData.floor}</strong>
                  </p>
                  <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/40 rounded text-green-800 dark:text-green-200">
                    <strong>🎯 Para teste:</strong> fecf7bee03b5f41c (Condomínio Demo T-Casa)
                  </div>
                </div>
              </div>
            </div>

            {condominiumName && (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <Badge variant="outline" className="mx-auto text-green-800 dark:text-green-200">
                  <Building2 className="h-3 w-3 mr-1" />
                  Validado: {condominiumName}
                </Badge>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep(4)} className="w-full sm:flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={condominiumName ? handleRegistration : validateLinkingCode}
                className="w-full sm:flex-1" 
                disabled={isLoading || !linkingCode.trim()}
              >
                {isLoading ? "A processar..." : condominiumName ? "Criar Conta" : "Validar & Registar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Success */}
      {step === 6 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span>Registo Concluído!</span>
            </CardTitle>
            <CardDescription>
              A sua conta foi criada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                Bem-vindo ao {condominiumName}!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                A sua conta foi criada com todas as informações fornecidas.
                Verifique o seu email para confirmar a conta.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ Perfil de residente criado</p>
              <p>✅ Ligação ao condomínio estabelecida</p>
              <p>✅ Informações familiares registadas</p>
              <p>✅ Dados de estacionamento configurados</p>
              <p>✅ Acesso ao portal do residente ativado</p>
            </div>

            <Button onClick={resetDemo} variant="outline" className="w-full">
              Testar Novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResidentRegistrationWizard;