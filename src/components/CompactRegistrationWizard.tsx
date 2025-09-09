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

interface CompactRegistrationWizardProps {
  onClose?: () => void;
}

const CompactRegistrationWizard = ({ onClose }: CompactRegistrationWizardProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [linkingCode, setLinkingCode] = useState("");
  const [condominiumName, setCondominiumName] = useState("");
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
      
      console.log('🔍 [CompactWizard] Starting complete validation:', {
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

      console.log('🔍 [CompactWizard] Validation result:', {
        data: validationData,
        error: validationError
      });

      if (validationError) {
        console.error('❌ [CompactWizard] Validation function error:', validationError);
        toast({
          title: "Erro na validação",
          description: "Erro interno na validação. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const validation = validationData as unknown as ValidationResult;

      if (!validation?.success) {
        console.error('❌ [CompactWizard] Validation failed:', validation);
        
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
      console.log('✅ [CompactWizard] Complete validation successful:', validation);
      
      setCondominiumName(validation.condominium_name || 'Condomínio Encontrado');
      setStep(6); // Mover para confirmação
      
      toast({
        title: "✅ Código válido!",
        description: `Condomínio: ${validation.condominium_name}`,
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ [CompactWizard] Unexpected validation error:', error);
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
      console.log('🔒 [CompactWizard] Starting final registration with validation...');
      
      // VALIDAÇÃO DUPLA CRÍTICA: Revalidar código e apartamento antes do registro
      const { data: validationData, error: validationError } = await supabase.rpc(
        'validate_linking_code_and_apartment',
        {
          _linking_code: linkingCode.trim(),
          _apartment_number: formData.apartmentNumber.trim()
        }
      );

      if (validationError) {
        console.error('❌ [CompactWizard] Validation function error:', validationError);
        toast({
          title: "Erro de validação",
          description: "Erro ao validar dados. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const validation = validationData as unknown as ValidationResult;

      if (!validation?.success) {
        console.error('❌ [CompactWizard] Final validation failed:', validation);
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

      console.log('✅ [CompactWizard] Final validation successful:', validation);

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
        console.error('❌ [CompactWizard] Registration error:', error);
        
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
        console.log('✅ [CompactWizard] Registration successful for user:', data.user.id);
        setStep(6);
        toast({
          title: "Registo concluído!",
          description: `Conta criada com sucesso no ${validation.condominium_name}. Verifique o seu email.`
        });
      }
    } catch (error) {
      console.error('❌ [CompactWizard] Unexpected error during registration:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o registo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToNext = () => {
    const result = (() => {
      switch (step) {
        case 1:
          const step1Valid = formData.firstName.trim() && formData.lastName.trim() && formData.email.trim() && formData.phone.trim();
          console.log('🔍 [CompactWizard] Step 1 validation:', {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            isValid: step1Valid
          });
          return step1Valid;
        case 2:
          const step2Valid = formData.apartmentNumber.trim() && formData.floor;
          console.log('🔍 [CompactWizard] Step 2 validation:', {
            apartmentNumber: formData.apartmentNumber,
            floor: formData.floor,
            isValid: step2Valid
          });
          return step2Valid;
        case 4:
          const step4Valid = formData.password && formData.confirmPassword;
          console.log('🔍 [CompactWizard] Step 4 validation:', {
            hasPassword: !!formData.password,
            hasConfirmPassword: !!formData.confirmPassword,
            isValid: step4Valid
          });
          return step4Valid;
        case 5:
          const step5Valid = linkingCode && condominiumName;
          console.log('🔍 [CompactWizard] Step 5 validation:', {
            linkingCode,
            condominiumName,
            isValid: step5Valid
          });
          return step5Valid;
        default:
          return true;
      }
    })();
    
    console.log(`🔍 [CompactWizard] Step ${step} can proceed:`, result);
    return result;
  };

  return (
    <div className="w-full space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2">
        {[1, 2, 3, 4, 5, 6].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 text-xs ${
              step >= stepNum ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
            }`}>
              {step > stepNum ? <CheckCircle className="h-3 w-3" /> : stepNum}
            </div>
            {stepNum < 6 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg">
              <User className="h-4 w-4" />
              <span>Dados Pessoais</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Preencha os seus dados pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">Nome *</Label>
                <Input
                  id="firstName"
                  placeholder="Nome"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-sm">Apelido *</Label>
                <Input
                  id="lastName"
                  placeholder="Apelido"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm">Telefone *</Label>
              <Input
                id="phone"
                placeholder="+244 900 000 000"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <Button 
              onClick={() => {
                console.log('🔍 [CompactWizard] Button clicked - current state:', {
                  step,
                  formData,
                  canProceed: canProceedToNext()
                });
                if (canProceedToNext()) {
                  console.log('✅ [CompactWizard] Proceeding to step 2');
                  setStep(2);
                } else {
                  console.log('❌ [CompactWizard] Cannot proceed - validation failed');
                  toast({
                    title: "Campos obrigatórios",
                    description: "Por favor, preencha todos os campos obrigatórios",
                    variant: "destructive"
                  });
                }
              }} 
              className="w-full" 
              disabled={!canProceedToNext()}
            >
              Continuar
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Apartment Details */}
      {step === 2 && (
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg">
              <Home className="h-4 w-4" />
              <span>Detalhes do Apartamento</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Informações sobre o seu apartamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="apartmentNumber" className="text-sm">Apartamento *</Label>
              <Input
                id="apartmentNumber"
                placeholder="Ex: 101, A-23"
                value={formData.apartmentNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, apartmentNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="floor" className="text-sm">Andar *</Label>
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

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Voltar
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                className="flex-1" 
                disabled={!canProceedToNext()}
              >
                Continuar
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Family & Optional */}
      {step === 3 && (
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg">
              <Users className="h-4 w-4" />
              <span>Familiares</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Adicione familiares e estacionamento (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Family Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Familiares</Label>
                <Button variant="outline" size="sm" onClick={addFamilyMember}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {familyMembers.map((member, index) => (
                <div key={index} className="p-2 border rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Membro {index + 1}</span>
                    <Button variant="outline" size="sm" onClick={() => removeFamilyMember(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Nome"
                      value={member.name}
                      onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                      className="text-xs"
                    />
                    <Select 
                      value={member.relationship} 
                      onValueChange={(value) => updateFamilyMember(index, 'relationship', value)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Parentesco" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((rel) => (
                          <SelectItem key={rel} value={rel} className="text-xs">{rel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Idade"
                      type="number"
                      value={member.age}
                      onChange={(e) => updateFamilyMember(index, 'age', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Parking Spaces */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Estacionamento</Label>
                <Button variant="outline" size="sm" onClick={addParkingSpace}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {parkingSpaces.map((space, index) => (
                <div key={index} className="p-2 border rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Parque {index + 1}</span>
                    <Button variant="outline" size="sm" onClick={() => removeParkingSpace(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Número"
                      value={space.number}
                      onChange={(e) => updateParkingSpace(index, 'number', e.target.value)}
                      className="text-xs"
                    />
                    <Select 
                      value={space.type} 
                      onValueChange={(value) => updateParkingSpace(index, 'type', value)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {parkingTypeOptions.map((type) => (
                          <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Voltar
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Continuar
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Password */}
      {step === 4 && (
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg">
              <Key className="h-4 w-4" />
              <span>Definir Palavra-passe</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Crie uma palavra-passe segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm">Palavra-passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-sm">Confirmar *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Voltar
              </Button>
              <Button 
                onClick={() => setStep(5)} 
                className="flex-1" 
                disabled={!canProceedToNext()}
              >
                Continuar
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Linking Code & Validation */}
      {step === 5 && (
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg">
              <Key className="h-4 w-4" />
              <span>Código de Ligação</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Valide o código fornecido pelo administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="linkingCode">Código de Ligação</Label>
              <Input
                id="linkingCode"
                placeholder="Ex: fecf7bee03b5f41c"
                value={linkingCode}
                onChange={(e) => setLinkingCode(e.target.value)}
                className="text-center text-lg tracking-wider font-mono"
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Apartamento a validar: <strong>{formData.apartmentNumber}</strong> - Andar: <strong>{formData.floor}</strong></div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700 dark:text-green-300">
                  🎯 <strong>Para teste:</strong> fecf7bee03b5f41c (Condomínio Demo T-Casa)
                </div>
              </div>
            </div>

            {condominiumName && (
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
                <Badge variant="outline" className="mx-auto text-green-800 dark:text-green-200">
                  <Building2 className="h-3 w-3 mr-1" />
                  Validado: {condominiumName}
                </Badge>
              </div>
            )}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Voltar
              </Button>
              <Button 
                onClick={condominiumName ? handleRegistration : validateLinkingCode}
                className="flex-1" 
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
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Concluído!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                Bem-vindo ao {condominiumName}!
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Conta criada com sucesso. Verifique o seu email.
              </p>
            </div>

            <Button onClick={onClose} className="w-full">
              Fechar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompactRegistrationWizard;