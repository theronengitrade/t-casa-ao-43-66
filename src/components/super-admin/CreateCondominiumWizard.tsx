import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Steps } from "@/components/ui/steps";
import { 
  Building2, 
  UserPlus, 
  Shield, 
  Link2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateCondominiumWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CondominiumData {
  name: string;
  address: string;
  email: string;
  phone: string;
  currency: 'AOA' | 'EUR' | 'BRL' | 'MZN';
}

interface CoordinatorData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tempPassword: string;
}

interface CreatedData {
  condominiumId: string;
  coordinatorId: string;
  licenseId: string;
  linkingCode: string;
}

const CreateCondominiumWizard = ({ isOpen, onClose, onSuccess }: CreateCondominiumWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [condominiumData, setCondominiumData] = useState<CondominiumData>({
    name: '',
    address: '',
    email: '',
    phone: '',
    currency: 'AOA'
  });

  const [coordinatorData, setCoordinatorData] = useState<CoordinatorData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tempPassword: ''
  });

  const [createdData, setCreatedData] = useState<CreatedData>({
    condominiumId: '',
    coordinatorId: '',
    licenseId: '',
    linkingCode: ''
  });

  const { toast } = useToast();

  const steps = [
    {
      title: "Dados do Condomínio",
      description: "Informações básicas do condomínio",
      icon: <Building2 className="h-5 w-5" />
    },
    {
      title: "Coordenador",
      description: "Registo do coordenador responsável",
      icon: <UserPlus className="h-5 w-5" />
    },
    {
      title: "Licença & Código",
      description: "Geração automática da licença e código de ligação",
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: "Conclusão",
      description: "Resumo e confirmação",
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCoordinatorData(prev => ({ ...prev, tempPassword: result }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(condominiumData.name && condominiumData.address && condominiumData.email);
      case 1:
        return !!(coordinatorData.firstName && coordinatorData.lastName && coordinatorData.email && coordinatorData.tempPassword);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        // Before going to step 2, create everything
        handleCreateAll();
      } else if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateAll = async () => {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting comprehensive condominium creation process...');
      
      // Step 1: Create Condominium
      console.log('Creating condominium...');
      const { data: condoData, error: condoError } = await supabase
        .from('condominiums')
        .insert({
          name: condominiumData.name,
          address: condominiumData.address,
          email: condominiumData.email,
          phone: condominiumData.phone,
          currency: condominiumData.currency
        })
        .select()
        .single();

      if (condoError) {
        console.error('Condominium creation error:', condoError);
        throw new Error(`Erro ao criar condomínio: ${condoError.message}`);
      }

      console.log('Condominium created successfully:', condoData.id);

      // Step 2: Create License for the condominium
      console.log('Creating license...');
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          condominium_id: condoData.id,
          status: 'active'
        })
        .select()
        .single();

      if (licenseError) {
        console.error('License creation error:', licenseError);
        // Cleanup: Remove condominium if license creation fails
        await supabase.from('condominiums').delete().eq('id', condoData.id);
        throw new Error(`Erro ao criar licença: ${licenseError.message}`);
      }

      console.log('License created successfully:', licenseData.id);

      // Step 3: Create Coordinator automatically using Edge Function
      console.log('Creating coordinator via Edge Function...');
      const createCoordinatorResponse = await supabase.functions.invoke('create-coordinator', {
        body: {
          condominium_id: condoData.id,
          coordinator: {
            firstName: coordinatorData.firstName,
            lastName: coordinatorData.lastName,
            email: coordinatorData.email,
            phone: coordinatorData.phone,
            tempPassword: coordinatorData.tempPassword
          }
        }
      });

      if (createCoordinatorResponse.error) {
        console.error('Edge function error:', createCoordinatorResponse.error);
        // Cleanup: Remove condominium and license if coordinator creation fails
        await supabase.from('licenses').delete().eq('id', licenseData.id);
        await supabase.from('condominiums').delete().eq('id', condoData.id);
        throw new Error(`Erro ao criar coordenador: ${createCoordinatorResponse.error.message}`);
      }

      const coordinatorResult = createCoordinatorResponse.data;
      
      if (!coordinatorResult.success) {
        console.error('Coordinator creation failed:', coordinatorResult);
        // Cleanup: Remove condominium and license if coordinator creation fails
        await supabase.from('licenses').delete().eq('id', licenseData.id);
        await supabase.from('condominiums').delete().eq('id', condoData.id);
        throw new Error(`Erro ao criar coordenador: ${coordinatorResult.error}`);
      }

      console.log('Coordinator created successfully:', coordinatorResult.data.coordinator_id);

      // Set created data for display with real coordinator information
      setCreatedData({
        condominiumId: condoData.id,
        coordinatorId: coordinatorResult.data.coordinator_id,
        licenseId: licenseData.id,
        linkingCode: condoData.resident_linking_code
      });

      setCurrentStep(2); // Move to step 3 (license & code display)

      toast({
        title: "🎉 Condomínio criado com sucesso!",
        description: "Condomínio, licença e coordenador criados automaticamente.",
      });

      console.log('Complete condominium setup finished successfully');

    } catch (error: any) {
      console.error('Error in comprehensive condominium creation:', error);
      toast({
        title: "Erro na criação",
        description: error.message || "Erro ao criar condomínio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setCurrentStep(0);
    setCondominiumData({
      name: '',
      address: '',
      email: '',
      phone: '',
      currency: 'AOA'
    });
    setCoordinatorData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      tempPassword: ''
    });
    setCreatedData({
      condominiumId: '',
      coordinatorId: '',
      licenseId: '',
      linkingCode: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-6 w-6" />
            <span>Criar Novo Condomínio</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Steps indicator */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={index} className={`flex items-center space-x-2 ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index <= currentStep ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                }`}>
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : step.icon}
                </div>
                <div className="text-sm">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-4" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Condominium Data */}
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Dados do Condomínio</span>
                  </CardTitle>
                  <CardDescription>
                    Preencha as informações básicas do condomínio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condo-name">Nome do Condomínio *</Label>
                      <Input
                        id="condo-name"
                        placeholder="Ex: Condomínio Jardim das Flores"
                        value={condominiumData.name}
                        onChange={(e) => setCondominiumData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="condo-email">Email do Condomínio *</Label>
                      <Input
                        id="condo-email"
                        type="email"
                        placeholder="admin@condominio.com"
                        value={condominiumData.email}
                        onChange={(e) => setCondominiumData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condo-address">Endereço Completo *</Label>
                    <Textarea
                      id="condo-address"
                      placeholder="Rua, número, bairro, cidade..."
                      value={condominiumData.address}
                      onChange={(e) => setCondominiumData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condo-phone">Telefone</Label>
                      <Input
                        id="condo-phone"
                        placeholder="+244 900 000 000"
                        value={condominiumData.phone}
                        onChange={(e) => setCondominiumData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condo-currency">Moeda</Label>
                      <Select
                        value={condominiumData.currency}
                        onValueChange={(value: 'AOA' | 'EUR' | 'BRL' | 'MZN') => 
                          setCondominiumData(prev => ({ ...prev, currency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AOA">AOA - Kwanza (Angola)</SelectItem>
                          <SelectItem value="EUR">EUR - Euro (Portugal)</SelectItem>
                          <SelectItem value="BRL">BRL - Real (Brasil)</SelectItem>
                          <SelectItem value="MZN">MZN - Metical (Moçambique)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Coordinator Data */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Dados do Coordenador</span>
                  </CardTitle>
                  <CardDescription>
                    Crie a conta do coordenador responsável pelo condomínio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coord-firstname">Nome *</Label>
                      <Input
                        id="coord-firstname"
                        placeholder="Nome"
                        value={coordinatorData.firstName}
                        onChange={(e) => setCoordinatorData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="coord-lastname">Apelido *</Label>
                      <Input
                        id="coord-lastname"
                        placeholder="Apelido"
                        value={coordinatorData.lastName}
                        onChange={(e) => setCoordinatorData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coord-email">Email *</Label>
                      <Input
                        id="coord-email"
                        type="email"
                        placeholder="coordenador@email.com"
                        value={coordinatorData.email}
                        onChange={(e) => setCoordinatorData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="coord-phone">Telefone</Label>
                      <Input
                        id="coord-phone"
                        placeholder="+244 900 000 000"
                        value={coordinatorData.phone}
                        onChange={(e) => setCoordinatorData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="coord-password">Password Temporária *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateTempPassword}
                        className="flex items-center space-x-1"
                      >
                        <Key className="h-3 w-3" />
                        <span>Gerar</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        id="coord-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password temporária"
                        value={coordinatorData.tempPassword}
                        onChange={(e) => setCoordinatorData(prev => ({ ...prev, tempPassword: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O coordenador será obrigado a alterar esta password no primeiro login
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: License & Linking Code (Auto-generated) */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Licença e Código de Ligação</span>
                  </CardTitle>
                  <CardDescription>
                    Licença anual e código de ligação gerados automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Licença Criada</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-green-700">Status:</span> <Badge variant="default">Ativa</Badge>
                          </div>
                          <div>
                            <span className="text-green-700">Validade:</span> 1 ano a partir de hoje
                          </div>
                          <div>
                            <span className="text-green-700">ID:</span> 
                            <code className="ml-2 text-xs">{createdData.licenseId}</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Link2 className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-800">Código de Ligação</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(createdData.linkingCode, "Código de ligação")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm">
                          <div className="p-3 bg-white rounded border text-center font-mono text-lg font-bold text-blue-800">
                            {createdData.linkingCode}
                          </div>
                          <p className="text-blue-700 text-xs mt-2">
                            Os residentes usarão este código para se registarem no sistema
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserPlus className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-800">Credenciais do Coordenador</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-orange-700">Email:</span>
                        <div className="flex items-center space-x-2">
                          <code className="text-orange-800">{coordinatorData.email}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(coordinatorData.email, "Email do coordenador")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-orange-700">Password Temporária:</span>
                        <div className="flex items-center space-x-2">
                          <code className="text-orange-800">{coordinatorData.tempPassword}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(coordinatorData.tempPassword, "Password temporária")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 text-sm font-medium mb-1">
                        ✅ Coordenador Criado Automaticamente
                      </p>
                      <p className="text-green-700 text-xs">
                        A conta do coordenador foi criada automaticamente no sistema. ID do Coordenador: <strong>{createdData.coordinatorId}</strong>
                      </p>
                    </div>
                    <p className="text-orange-700 text-xs mt-2">
                      Envie estas credenciais ao coordenador. Ele será obrigado a alterar a password no primeiro login.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Summary */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Condomínio Criado com Sucesso!</span>
                  </CardTitle>
                  <CardDescription>
                    Resumo de tudo o que foi criado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Condomínio</span>
                      </h4>
                      <div className="pl-6 space-y-1 text-sm">
                        <div><strong>Nome:</strong> {condominiumData.name}</div>
                        <div><strong>Endereço:</strong> {condominiumData.address}</div>
                        <div><strong>Email:</strong> {condominiumData.email}</div>
                        <div><strong>Moeda:</strong> {condominiumData.currency}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center space-x-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Coordenador</span>
                      </h4>
                      <div className="pl-6 space-y-1 text-sm">
                        <div><strong>Nome:</strong> {coordinatorData.firstName} {coordinatorData.lastName}</div>
                        <div><strong>Email:</strong> {coordinatorData.email}</div>
                        <div><strong>Estado:</strong> <Badge variant="secondary">Conta criada</Badge></div>
                        <div><strong>Acesso:</strong> <Badge variant="outline">Deve alterar password</Badge></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Próximos Passos:</h4>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                      <li>Envie as credenciais de acesso ao coordenador</li>
                      <li>Forneça o código de ligação para registo de residentes</li>
                      <li>O coordenador deve fazer login e alterar a password</li>
                      <li>A licença está ativa por 1 ano</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentStep > 0 && currentStep < 2 && (
                <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              {currentStep < 2 && (
                <Button onClick={handleNext} disabled={isLoading || !validateStep(currentStep)}>
                  {currentStep === 1 ? (
                    isLoading ? (
                      <>Criando condomínio e coordenador...</>
                    ) : (
                      <>
                        Criar Condomínio Completo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )
                  ) : (
                    <>
                      Seguinte
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
              
              {currentStep === 2 && (
                <Button onClick={() => setCurrentStep(3)}>
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {currentStep === 3 && (
                <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCondominiumWizard;