import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Bug, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormData {
  linkingCode: string;
  apartmentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  floor: string;
}

interface ValidationResult {
  success: boolean;
  condominium_id?: string;
  condominium_name?: string;
  error?: string;
  code?: string;
}

export function ResidentRegistrationDebug() {
  const [formData, setFormData] = useState<FormData>({
    linkingCode: '',
    apartmentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    floor: ''
  });
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateAndRegister = async () => {
    setIsProcessing(true);
    clearLogs();
    
    try {
      addLog('🔍 INICIANDO VALIDAÇÃO DO CÓDIGO DE LIGAÇÃO');
      addLog(`Código: ${formData.linkingCode}`);
      addLog(`Apartamento: ${formData.apartmentNumber}`);
      
      // STEP 1: Validate linking code
      const { data: validationData, error: validationError } = await supabase.rpc(
        'validate_linking_code_and_apartment',
        {
          _linking_code: formData.linkingCode.trim(),
          _apartment_number: formData.apartmentNumber.trim()
        }
      );

      if (validationError) {
        addLog(`❌ ERRO na validação RPC: ${validationError.message}`);
        toast.error('Erro na validação do código');
        return;
      }

      const validation = validationData as unknown as ValidationResult;
      setValidationResult(validation);

      if (!validation?.success) {
        addLog(`❌ VALIDAÇÃO FALHOU: ${validation.error} (${validation.code})`);
        toast.error(validation.error || 'Código inválido');
        return;
      }

      addLog(`✅ VALIDAÇÃO BEM-SUCEDIDA para condomínio: ${validation.condominium_name}`);
      addLog(`Condomínio ID: ${validation.condominium_id}`);

      // STEP 2: Prepare user metadata
      const userMetadata = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        linking_code: formData.linkingCode.trim(),
        apartment_number: formData.apartmentNumber.trim(),
        floor: formData.floor,
        family_members: [],
        parking_spaces: []
      };

      addLog('📝 PREPARANDO METADADOS DO USUÁRIO:');
      addLog(JSON.stringify(userMetadata, null, 2));

      // STEP 3: Create user with Supabase Auth
      addLog('🔐 CRIANDO USUÁRIO COM SUPABASE AUTH...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userMetadata
        }
      });

      if (authError) {
        addLog(`❌ ERRO no registro: ${authError.message}`);
        if (authError.message.includes('already registered')) {
          toast.error('Este email já está registrado');
        } else {
          toast.error(`Erro no registro: ${authError.message}`);
        }
        return;
      }

      if (authData.user) {
        addLog(`✅ USUÁRIO CRIADO COM SUCESSO: ${authData.user.id}`);
        addLog(`Email: ${authData.user.email}`);
        addLog(`Email confirmado: ${authData.user.email_confirmed_at ? 'Sim' : 'Não'}`);
        
        // STEP 4: Check if trigger processed correctly
        addLog('⏳ AGUARDANDO PROCESSAMENTO DO TRIGGER...');
        
        // Wait a bit for trigger to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if profile was created
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();
          
        if (profileError) {
          addLog(`❌ ERRO ao verificar perfil: ${profileError.message}`);
        } else if (profileData) {
          addLog(`✅ PERFIL CRIADO: ${JSON.stringify(profileData, null, 2)}`);
          
          // Check if resident record was created
          const { data: residentData, error: residentError } = await supabase
            .from('residents')
            .select('*')
            .eq('profile_id', profileData.id)
            .maybeSingle();
            
          if (residentError) {
            addLog(`❌ ERRO ao verificar residente: ${residentError.message}`);
          } else if (residentData) {
            addLog(`✅ REGISTRO DE RESIDENTE CRIADO: ${JSON.stringify(residentData, null, 2)}`);
            toast.success('Registro completo realizado com sucesso!');
          } else {
            addLog(`⚠️ PERFIL CRIADO MAS REGISTRO DE RESIDENTE NÃO ENCONTRADO`);
            toast.error('Perfil criado mas falta vinculação ao condomínio');
          }
        } else {
          addLog(`⚠️ USUÁRIO CRIADO MAS PERFIL NÃO ENCONTRADO`);
          toast.error('Usuário criado mas perfil não foi processado');
        }
      }

    } catch (error: any) {
      addLog(`💥 ERRO INESPERADO: ${error.message}`);
      toast.error('Erro inesperado durante o processo');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="h-5 w-5" />
            <span>Debug: Registro de Residente</span>
          </CardTitle>
          <CardDescription>
            Ferramenta de debug para analisar o processo de registro de residentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Result */}
          {validationResult && (
            <Alert variant={validationResult.success ? "default" : "destructive"}>
              {validationResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {validationResult.success 
                  ? `Código válido para: ${validationResult.condominium_name}`
                  : `Erro: ${validationResult.error}`
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkingCode">Código de Ligação</Label>
              <Input
                id="linkingCode"
                value={formData.linkingCode}
                onChange={(e) => updateFormData('linkingCode', e.target.value)}
                placeholder="Ex: fecf7bee03b5f41c"
                disabled={isProcessing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apartmentNumber">Número do Apartamento</Label>
              <Input
                id="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={(e) => updateFormData('apartmentNumber', e.target.value)}
                placeholder="Ex: 101"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateFormData('firstName', e.target.value)}
                placeholder="João"
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateFormData('lastName', e.target.value)}
                placeholder="Silva"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="joao@email.com"
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+244 900 000 000"
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Andar</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => updateFormData('floor', e.target.value)}
                placeholder="1º andar"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="••••••••"
                disabled={isProcessing}
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

          <div className="flex gap-2">
            <Button 
              onClick={validateAndRegister}
              disabled={isProcessing || !formData.linkingCode || !formData.apartmentNumber || !formData.firstName || !formData.lastName || !formData.email || !formData.password}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Validar & Registrar'
              )}
            </Button>
            
            <Button variant="outline" onClick={clearLogs}>
              Limpar Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Debug</CardTitle>
          <CardDescription>
            Logs detalhados do processo de registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {debugLogs.length > 0 ? debugLogs.join('\n') : 'Nenhum log ainda...'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}