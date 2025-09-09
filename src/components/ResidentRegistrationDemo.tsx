import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  UserPlus, 
  CheckCircle, 
  ArrowRight,
  Home,
  Phone,
  Mail,
  User,
  Building2,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResidentRegistrationDemo = () => {
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
    password: "",
    confirmPassword: ""
  });

  const { toast } = useToast();

  const validateLinkingCode = async () => {
    if (!linkingCode) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, insira o código de ligação",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Limpar e normalizar o código
      const cleanCode = linkingCode.trim().toLowerCase();
      
      console.log('🔍 [Demo] Validating linking code:', {
        original: linkingCode,
        cleaned: cleanCode,
        length: cleanCode.length
      });

      // Buscar todos os códigos para comparação inteligente
      const { data: allCondos, error: fetchError } = await supabase
        .from('condominiums')
        .select('id, name, resident_linking_code');

      if (fetchError) {
        console.error('❌ [Demo] Database error:', fetchError);
        toast({
          title: "Erro de sistema",
          description: "Erro ao consultar base de dados",
          variant: "destructive"
        });
        return;
      }

      console.log('🏢 [Demo] All condominiums:', allCondos?.map(c => ({ 
        name: c.name, 
        code: c.resident_linking_code 
      })));

      // Busca exata primeiro
      let foundCondo = allCondos?.find(c => 
        c.resident_linking_code.toLowerCase() === cleanCode
      );

      // Se não encontrou exata, fazer busca por similaridade
      if (!foundCondo) {
        console.log('🔍 [Demo] Exact match not found, trying similarity search...');
        
        foundCondo = allCondos?.find(c => {
          const dbCode = c.resident_linking_code.toLowerCase();
          
          // Verificar se é uma substring ou vice-versa
          const isSubstring = dbCode.includes(cleanCode) || cleanCode.includes(dbCode);
          
          // Verificar diferença de caracteres (tolerância de 1-2 caracteres)
          const maxLength = Math.max(dbCode.length, cleanCode.length);
          const minLength = Math.min(dbCode.length, cleanCode.length);
          const lengthDiff = maxLength - minLength;
          
          // Calcular similaridade simples
          let similarity = 0;
          const shortestLength = Math.min(dbCode.length, cleanCode.length);
          for (let i = 0; i < shortestLength; i++) {
            if (dbCode[i] === cleanCode[i]) similarity++;
          }
          const similarityPercent = similarity / maxLength;
          
          console.log(`🔍 [Demo] Comparing "${cleanCode}" with "${dbCode}":`, {
            isSubstring,
            lengthDiff,
            similarity: similarityPercent,
            acceptable: isSubstring || (lengthDiff <= 2 && similarityPercent > 0.8)
          });
          
          return isSubstring || (lengthDiff <= 2 && similarityPercent > 0.8);
        });
      }

      if (!foundCondo) {
        console.log('❌ [Demo] No condominium found with code:', cleanCode);
        toast({
          title: "Código inválido",
          description: `Código "${linkingCode}" não encontrado. Verifique se está correto.`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [Demo] Condominium found:', foundCondo);
      
      setCondominiumName(foundCondo.name);
      setStep(2);
      toast({
        title: "Código válido!",
        description: `Condomínio encontrado: ${foundCondo.name}`
      });
    } catch (error) {
      console.error('❌ [Demo] Validation error:', error);
      toast({
        title: "Erro de validação",
        description: "Erro ao validar o código de ligação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            linking_code: linkingCode,
            phone: formData.phone,
            apartment_number: formData.apartmentNumber
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no registo",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        setStep(3);
        toast({
          title: "Registo concluído!",
          description: "Conta criada com sucesso. Verifique o seu email."
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o registo",
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
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      apartmentNumber: "",
      password: "",
      confirmPassword: ""
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
          }`}>
            {step > 1 ? <CheckCircle className="h-4 w-4" /> : <Key className="h-4 w-4" />}
          </div>
          <span className="text-sm font-medium">Validar Código</span>
        </div>
        
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
          }`}>
            {step > 2 ? <CheckCircle className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          </div>
          <span className="text-sm font-medium">Dados Pessoais</span>
        </div>
        
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
          }`}>
            <CheckCircle className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Concluído</span>
        </div>
      </div>

      {/* Step 1: Linking Code */}
      {step === 1 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Código de Ligação</span>
            </CardTitle>
            <CardDescription>
              Insira o código fornecido pelo administrador do seu condomínio
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
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Como obter o código?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    O código de ligação é fornecido pelo administrador do condomínio. 
                    Contacte a administração para obter o seu código.
                  </p>
                  <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/40 rounded text-green-800 dark:text-green-200">
                    <strong>🎯 Para teste:</strong> fecf7bee03b5f41c (Condomínio Demo T-Casa)
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={validateLinkingCode} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "A validar..." : "Validar Código"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Personal Information */}
      {step === 2 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Dados Pessoais</span>
            </CardTitle>
            <CardDescription>
              Complete o seu registo para o condomínio
            </CardDescription>
            {condominiumName && (
              <Badge variant="outline" className="mx-auto">
                <Building2 className="h-3 w-3 mr-1" />
                {condominiumName}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  <User className="h-4 w-4 inline mr-1" />
                  Nome
                </Label>
                <Input
                  id="firstName"
                  placeholder="Nome"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apelido</Label>
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
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  placeholder="+244 900 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apartmentNumber">
                  <Home className="h-4 w-4 inline mr-1" />
                  Apartamento
                </Label>
                <Input
                  id="apartmentNumber"
                  placeholder="Ex: 101, A-23"
                  value={formData.apartmentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, apartmentNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar</Label>
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
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={handleRegistration} 
                className="flex-1" 
                disabled={isLoading}
              >
                {isLoading ? "A registar..." : "Criar Conta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
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
                A sua conta foi criada automaticamente e está ligada ao condomínio correto.
                Verifique o seu email para confirmar a conta.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ Perfil de residente criado</p>
              <p>✅ Ligação ao condomínio estabelecida</p>
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

export default ResidentRegistrationDemo;