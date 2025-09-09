import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegistrationData {
  // Dados pessoais
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Dados do apartamento
  linkingCode: string;
  apartmentNumber: string;
  floor: string;
  
  // Dados familiares e estacionamento
  familyMembers: string;
  parkingSpaces: string;
  
  // Credenciais
  password: string;
  confirmPassword: string;
}

interface ValidationResult {
  success: boolean;
  error?: string;
  code?: string;
  condominium_id?: string;
  condominium_name?: string;
  message?: string;
}

export const useResidentRegistration = () => {
  const { toast } = useToast();
  
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkingCode: '',
    apartmentNumber: '',
    floor: '',
    familyMembers: '',
    parkingSpaces: '',
    password: '',
    confirmPassword: ''
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);

  const updateData = (field: keyof RegistrationData, value: string) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateLinkingCode = async (): Promise<boolean> => {
    if (!registrationData.linkingCode.trim() || !registrationData.apartmentNumber.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o código de ligação e número do apartamento",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 [useResidentRegistration] Validating linking code:', {
        linkingCode: registrationData.linkingCode,
        apartmentNumber: registrationData.apartmentNumber
      });

      const { data, error } = await supabase.rpc('validate_linking_code_and_apartment', {
        _linking_code: registrationData.linkingCode.trim(),
        _apartment_number: registrationData.apartmentNumber.trim()
      });

      if (error) {
        console.error('❌ [useResidentRegistration] RPC Error:', error);
        toast({
          title: "Erro de validação",
          description: "Erro interno na validação. Tente novamente.",
          variant: "destructive"
        });
        setValidationResult(null);
        return false;
      }

      console.log('✅ [useResidentRegistration] Validation result:', data);
      
      // Type guard para verificar se data é um objeto com as propriedades esperadas
      if (typeof data === 'object' && data !== null && 'success' in data) {
        const result = data as unknown as ValidationResult;
        setValidationResult(result);

        if (!result.success) {
          toast({
            title: "Código inválido",
            description: result.error || "Código de ligação ou apartamento inválido",
            variant: "destructive"
          });
          return false;
        }

        toast({
          title: "Código válido! ✅",
          description: `Condomínio: ${result.condominium_name}`,
          variant: "default"
        });

        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ [useResidentRegistration] Exception:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro durante a validação. Tente novamente.",
        variant: "destructive"
      });
      setValidationResult(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validatePersonalData = (): boolean => {
    const { firstName, lastName, email, phone, familyMembers, parkingSpaces } = registrationData;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos pessoais obrigatórios",
        variant: "destructive"
      });
      return false;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateCredentials = (): boolean => {
    const { password, confirmPassword } = registrationData;
    
    if (!password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a palavra-passe e confirmação",
        variant: "destructive"
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Palavra-passe muito curta",
        description: "A palavra-passe deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Palavras-passe não coincidem",
        description: "A confirmação de palavra-passe deve ser igual à palavra-passe",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const completeRegistration = async (): Promise<boolean> => {
    if (!validatePersonalData() || !validateCredentials() || !validationResult?.success) {
      return false;
    }

    setIsLoading(true);

    try {
      console.log('🔄 [useResidentRegistration] Starting registration process...');
      
      // Verificar se email já existe
      const { data: existingUser } = await supabase.rpc('is_email_available', {
        _email: registrationData.email
      });

      if (!existingUser) {
        toast({
          title: "Email já registado",
          description: "Este email já está registado no sistema",
          variant: "destructive"
        });
        return false;
      }

      // Criar usuário com metadados completos
      // Converter números informados em arrays JSON para refletirem corretamente no perfil
      const familyCount = parseInt(registrationData.familyMembers || '0', 10);
      const familyArray = Array.from({ length: Math.max(0, familyCount) }, () => ({ name: null }));

      const parkingCount = parseInt(registrationData.parkingSpaces || '0', 10);
      const parkingArray = Array.from({ length: Math.max(0, parkingCount) }, (_v, i) => ({ number: `P${i + 1}`, type: 'Atribuído' }));

      const signUpData = {
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            first_name: registrationData.firstName.trim(),
            last_name: registrationData.lastName.trim(),
            phone: registrationData.phone.trim(),
            linking_code: registrationData.linkingCode.trim(),
            apartment_number: registrationData.apartmentNumber.trim(),
            floor: registrationData.floor.trim(),
            family_members: familyArray,
            parking_spaces: parkingArray
          }
        }
      };

      console.log('🔄 [useResidentRegistration] Creating user with data:', signUpData);

      const { data: authData, error: authError } = await supabase.auth.signUp(signUpData);

      if (authError) {
        console.error('❌ [useResidentRegistration] Auth error:', authError);
        toast({
          title: "Erro no registo",
          description: authError.message,
          variant: "destructive"
        });
        return false;
      }

      if (!authData.user) {
        toast({
          title: "Erro no registo",
          description: "Falha ao criar conta de utilizador",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ [useResidentRegistration] User created successfully:', authData.user.id);

      // Verificação robusta com retry para aguardar o trigger processar
      let profileData: any = null;
      let residentData: any = null;
      let attempts = 0;
      const maxAttempts = 5;
      const retryDelay = 1500; // 1.5 segundos entre tentativas

      while (attempts < maxAttempts && (!profileData || !residentData)) {
        attempts++;
        console.log(`🔄 [useResidentRegistration] Verification attempt ${attempts}/${maxAttempts}`);
        
        // Aguardar antes da tentativa
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        // Verificar se perfil foi criado
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, condominium_id, first_name, last_name')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (profile && !profileError) {
          profileData = profile;
          console.log('✅ [useResidentRegistration] Profile found:', profile.id);

          // Verificar se residente foi criado
          const { data: resident, error: residentError } = await supabase
            .from('residents')
            .select('id, apartment_number')
            .eq('profile_id', profile.id)
            .maybeSingle();

          if (resident && !residentError) {
            residentData = resident;
            console.log('✅ [useResidentRegistration] Resident found:', resident.id);
            break; // Tudo criado com sucesso
          }
        }

        if (attempts === maxAttempts) {
          // Última tentativa falhou
          console.error('❌ [useResidentRegistration] Final verification failed after', maxAttempts, 'attempts');
          
          toast({
            title: "Registro em processamento",
            description: "Sua conta foi criada com sucesso! Se houver problemas de acesso, contacte o suporte.",
            variant: "default"
          });
          
          // Ainda considerar como sucesso para não bloquear o usuário
          setIsRegistrationComplete(true);
          return true;
        }
      }

      console.log('✅ [useResidentRegistration] Registration completed successfully');

      toast({
        title: "Registo concluído com sucesso! 🎉",
        description: "Verifique o seu email para confirmar a conta",
        variant: "default"
      });

      setIsRegistrationComplete(true);
      return true;

    } catch (error) {
      console.error('❌ [useResidentRegistration] Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o registo. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 1 && !(await validateLinkingCode())) {
      return;
    }
    
    if (currentStep === 2 && !validatePersonalData()) {
      return;
    }
    
    if (currentStep === 3 && !validateCredentials()) {
      return;
    }

    if (currentStep === 4) {
      await completeRegistration();
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const reset = () => {
    setRegistrationData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkingCode: '',
      apartmentNumber: '',
      floor: '',
      familyMembers: '',
      parkingSpaces: '',
      password: '',
      confirmPassword: ''
    });
    setCurrentStep(1);
    setValidationResult(null);
    setIsRegistrationComplete(false);
  };

  return {
    registrationData,
    updateData,
    currentStep,
    setCurrentStep,
    isLoading,
    validationResult,
    isRegistrationComplete,
    nextStep,
    prevStep,
    reset,
    validateLinkingCode,
    completeRegistration
  };
};