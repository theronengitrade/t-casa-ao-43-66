import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Key,
  TestTube
} from "lucide-react";

interface ValidationResult {
  success: boolean;
  error?: string;
  code?: string;
  condominium_id?: string;
  condominium_name?: string;
  message?: string;
}

/**
 * Componente de teste para demonstrar a sincronização perfeita entre:
 * 1. Geração de códigos (CreateCondominiumWizard)
 * 2. Regeneração de códigos (LinkingCodeManagement) 
 * 3. Validação de códigos (ResidentRegistrationWizard)
 */
const LinkingCodeSyncTest = () => {
  const [testCode, setTestCode] = useState("");
  const [testApartment, setTestApartment] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const testValidation = async () => {
    if (!testCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, insira um código para testar",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      console.log('🧪 [Test] Testing code validation:', {
        code: testCode,
        apartment: testApartment || 'TEST'
      });

      // Usar exatamente a mesma função que o sistema usa
      const { data, error } = await supabase.rpc(
        'validate_linking_code_and_apartment',
        {
          _linking_code: testCode.trim(),
          _apartment_number: testApartment.trim() || 'TEST'
        }
      );

      if (error) {
        console.error('❌ [Test] RPC error:', error);
        throw error;
      }

      const result = data as unknown as ValidationResult;
      setValidationResult(result);

      console.log('🧪 [Test] Validation result:', result);

      if (result?.success) {
        toast({
          title: "✅ Código válido!",
          description: `Condomínio: ${result.condominium_name}`
        });
      } else {
        toast({
          title: "❌ Código inválido",
          description: result?.error || "Código não encontrado",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('❌ [Test] Error during validation:', error);
      setValidationResult({
        success: false,
        error: error.message || "Erro interno"
      });

      toast({
        title: "Erro de validação",
        description: error.message || "Erro interno no teste",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const loadDemoCode = () => {
    setTestCode("fecf7bee03b5f41c");
    setTestApartment("101");
    toast({
      title: "Código demo carregado",
      description: "Agora pode testar a validação"
    });
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5" />
          <span>Teste de Sincronização</span>
        </CardTitle>
        <CardDescription>
          Verificar se a validação está 100% sincronizada com a geração
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-code">Código de Ligação</Label>
          <Input
            id="test-code"
            placeholder="Ex: fecf7bee03b5f41c"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-apartment">Apartamento (opcional)</Label>
          <Input
            id="test-apartment"
            placeholder="Ex: 101"
            value={testApartment}
            onChange={(e) => setTestApartment(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={testValidation} 
            disabled={isValidating}
            className="flex-1"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Validar
          </Button>
          <Button 
            variant="outline" 
            onClick={loadDemoCode}
            size="sm"
          >
            <Key className="h-4 w-4 mr-1" />
            Demo
          </Button>
        </div>

        {validationResult && (
          <div className={`p-4 rounded-lg border ${
            validationResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {validationResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                validationResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {validationResult.success ? 'Validação Bem-sucedida' : 'Validação Falhada'}
              </span>
            </div>
            
            {validationResult.success ? (
              <div className="space-y-1 text-sm">
                <p><strong>Condomínio:</strong> {validationResult.condominium_name}</p>
                <p><strong>ID:</strong> {validationResult.condominium_id}</p>
                <Badge variant="secondary" className="mt-2">
                  Código sincronizado corretamente ✅
                </Badge>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <p className="text-red-700 dark:text-red-300">
                  <strong>Erro:</strong> {validationResult.error}
                </p>
                {validationResult.code && (
                  <Badge variant="destructive" className="mt-2">
                    {validationResult.code}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-xs">
          <p className="text-blue-700 dark:text-blue-300">
            <strong>💡 Como funciona:</strong> Este teste usa exatamente a mesma função de validação 
            que o formulário de registo usa, garantindo 100% de sincronização.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkingCodeSyncTest;