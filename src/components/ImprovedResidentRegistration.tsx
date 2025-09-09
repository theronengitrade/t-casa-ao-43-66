
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ValidationResult {
  success: boolean;
  condominium_id?: string;
  condominium_name?: string;
  error?: string;
  code?: string;
}

interface FormData {
  linkingCode: string;
  apartmentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  floor: string;
}

export function ImprovedResidentRegistration() {
  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    linkingCode: '',
    apartmentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    floor: ''
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage]);
    console.log(`[REGISTRATION DEBUG] ${logMessage}`);
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateLinkingCode = async () => {
    if (!formData.linkingCode.trim() || !formData.apartmentNumber.trim()) {
      toast.error("Por favor, preencha o código de ligação e número do apartamento");
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    addLog("🔍 INICIANDO VALIDAÇÃO DO CÓDIGO");

    try {
      addLog(`Código enviado: ${formData.linkingCode}`);
      addLog(`Apartamento enviado: ${formData.apartmentNumber}`);

      const { data, error } = await supabase.rpc('validate_linking_code_and_apartment', {
        _linking_code: formData.linkingCode.trim(),
        _apartment_number: formData.apartmentNumber.trim()
      });

      addLog(`Resposta da validação: ${JSON.stringify(data)}`);
      if (error) addLog(`Erro na validação: ${JSON.stringify(error)}`);

      if (error) {
        addLog("❌ ERRO na chamada RPC");
        setValidationResult({
          success: false,
          error: 'Erro interno na validação',
          code: 'RPC_ERROR'
        });
        return;
      }

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        addLog("✅ VALIDAÇÃO BEM-SUCEDIDA");
        const result = data as unknown as ValidationResult;
        setValidationResult(result);
        toast.success(`Código válido para ${result.condominium_name}`);
        setStep(2);
      } else {
        addLog("❌ VALIDAÇÃO FALHOU");
        const result = data as unknown as ValidationResult;
        setValidationResult(result || {
          success: false,
          error: 'Código inválido ou apartamento ocupado',
          code: 'VALIDATION_FAILED'
        });
      }
    } catch (err: any) {
      addLog(`💥 ERRO INESPERADO: ${err.message}`);
      setValidationResult({
        success: false,
        error: 'Erro inesperado na validação',
        code: 'UNEXPECTED_ERROR'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const registerUser = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!validationResult?.success) {
      toast.error("Código de ligação não validado");
      return;
    }

    setIsRegistering(true);
    addLog("🔐 INICIANDO PROCESSO DE REGISTRO");

    try {
      // Preparar metadados do usuário com logs detalhados
      const userMetadata = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
        linking_code: formData.linkingCode.trim(),
        apartment_number: formData.apartmentNumber.trim(),
        floor: formData.floor.trim(),
        family_members: [],
        parking_spaces: []
      };

      addLog(`📝 METADADOS PREPARADOS: ${JSON.stringify(userMetadata)}`);

      // Configurar URL de redirecionamento correta
      const redirectUrl = `${window.location.origin}/`;
      addLog(`🔗 URL DE REDIRECIONAMENTO: ${redirectUrl}`);

        // Verificar se email já existe primeiro
        addLog("🔍 VERIFICANDO SE EMAIL JÁ EXISTE...");
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('first_name', formData.firstName.trim())
          .eq('last_name', formData.lastName.trim());

        if (existingUser && existingUser.length > 0) {
          addLog("❌ USUÁRIO JÁ EXISTE COM ESSE NOME");
          toast.error("Já existe um usuário com esse nome. Tente outro nome ou contacte o administrador.");
          return;
        }

        // Tentar criar usuário
        addLog("📧 CRIANDO USUÁRIO NO SUPABASE AUTH...");
        addLog(`🔍 DADOS SENDO ENVIADOS: email=${formData.email.trim()}, metadata=${JSON.stringify(userMetadata)}`);
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: userMetadata
          }
        });

        addLog(`📊 RESPOSTA COMPLETA DO AUTH: ${JSON.stringify({ data: authData, error: authError })}`);
        
        // Log adicional para debug
        if (authData) {
          addLog(`👤 USER DATA: ${JSON.stringify(authData.user)}`);
          addLog(`📨 SESSION DATA: ${JSON.stringify(authData.session)}`);
        }

      addLog(`Resposta do Auth: ${JSON.stringify(authData)}`);
      if (authError) addLog(`Erro do Auth: ${JSON.stringify(authError)}`);

      if (authError) {
        addLog("❌ ERRO NO REGISTRO DE AUTH");
        if (authError.message.includes('already registered')) {
          toast.error("Este email já está registrado");
        } else if (authError.message.includes('weak_password')) {
          toast.error("A senha deve ter pelo menos 6 caracteres");
        } else {
          toast.error(`Erro no registro: ${authError.message}`);
        }
        return;
      }

      if (authData.user) {
        addLog(`✅ USUÁRIO CRIADO: ${authData.user.id}`);
        addLog(`Email confirmado: ${authData.user.email_confirmed_at ? 'Sim' : 'Não'}`);
        
        // O trigger handle_new_user processa automaticamente no banco
        addLog("⏳ AGUARDANDO PROCESSAMENTO DO TRIGGER...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se o perfil foi criado
        addLog("🔍 VERIFICANDO CRIAÇÃO DO PERFIL...");
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();
          
        if (profileError) {
          addLog(`❌ ERRO ao verificar perfil: ${profileError.message}`);
        } else if (profileData) {
          addLog(`✅ PERFIL CRIADO: ID ${profileData.id}`);
          
          // Verificar se o residente foi criado
          addLog("🏠 VERIFICANDO CRIAÇÃO DO RESIDENTE...");
          const { data: residentData, error: residentError } = await supabase
            .from('residents')
            .select('*')
            .eq('profile_id', profileData.id)
            .maybeSingle();
            
          if (residentError) {
            addLog(`❌ ERRO ao verificar residente: ${residentError.message}`);
          } else if (residentData) {
            addLog(`✅ RESIDENTE CRIADO: ID ${residentData.id}`);
            toast.success("Registro completo realizado com sucesso! Verifique seu email.");
            setStep(3);
          } else {
            addLog("⚠️ RESIDENTE NÃO CRIADO - TRIGGER NÃO EXECUTOU");
            toast.warning("Usuário criado, mas trigger falhou. Contacte o administrador.");
          }
        } else {
          addLog("⚠️ PERFIL NÃO CRIADO - TRIGGER NÃO EXECUTOU");
          toast.error("Usuário criado mas trigger falhou. Contacte o administrador.");
        }
      }

    } catch (err: any) {
      addLog(`💥 ERRO INESPERADO NO REGISTRO: ${err.message}`);
      toast.error("Erro inesperado durante o registro");
    } finally {
      setIsRegistering(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Validar Código de Ligação</CardTitle>
            <CardDescription>
              Insira o código fornecido pelo administrador e o número do seu apartamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkingCode">Código de Ligação</Label>
              <Input
                id="linkingCode"
                value={formData.linkingCode}
                onChange={(e) => updateFormData('linkingCode', e.target.value)}
                placeholder="Ex: fecf7bee03b5f41c"
                disabled={isValidating}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apartmentNumber">Número do Apartamento</Label>
              <Input
                id="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={(e) => updateFormData('apartmentNumber', e.target.value)}
                placeholder="Ex: 101"
                disabled={isValidating}
              />
            </div>

            {validationResult && !validationResult.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationResult.error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={validateLinkingCode}
              disabled={isValidating || !formData.linkingCode.trim() || !formData.apartmentNumber.trim()}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Validar Código'
              )}
            </Button>
          </CardContent>
        </Card>

        {debugLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Logs de Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {debugLogs.join('\n')}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Completar Registro</CardTitle>
            <CardDescription>
              Preencha seus dados pessoais para finalizar o registro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult?.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Código validado para: <strong>{validationResult.condominium_name}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="João"
                  disabled={isRegistering}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Silva"
                  disabled={isRegistering}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="joao@email.com"
                disabled={isRegistering}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+244 900 000 000"
                disabled={isRegistering}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Andar (opcional)</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => updateFormData('floor', e.target.value)}
                placeholder="1º andar"
                disabled={isRegistering}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha * (mínimo 6 caracteres)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="••••••••"
                  disabled={isRegistering}
                  minLength={6}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="••••••••"
                disabled={isRegistering}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isRegistering}
                className="w-full"
              >
                Voltar
              </Button>
              <Button 
                onClick={registerUser}
                disabled={isRegistering || !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || formData.password.length < 6}
                className="w-full"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Finalizar Registro'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {debugLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Logs de Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-lg max-h-60 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {debugLogs.join('\n')}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-green-600">Registro Concluído!</CardTitle>
        <CardDescription className="text-center">
          Seu registro foi realizado com sucesso
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <div className="space-y-2">
          <p className="font-medium">Parabéns! Sua conta foi criada.</p>
          <p className="text-sm text-muted-foreground">
            Verifique seu email para confirmar a conta e fazer login.
          </p>
          <p className="text-xs text-muted-foreground">
            Se não receber o email em alguns minutos, verifique a pasta de spam.
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = '/'}
          className="w-full"
        >
          Ir para Login
        </Button>
      </CardContent>
    </Card>
  );
}
