import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RegistrationTestComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(`[TEST] ${logMessage}`);
  };

  const testBasicSignUp = async () => {
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }

    setIsLoading(true);
    setLogs([]);
    addLog("🧪 INICIANDO TESTE BÁSICO DE SIGNUP");

    try {
      // Teste 1: SignUp simples sem metadados
      addLog("📧 Tentando signUp básico...");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      addLog(`✅ Resposta: ${JSON.stringify({ 
        user: data?.user ? { id: data.user.id, email: data.user.email } : null,
        session: data?.session ? "existe" : "null",
        error: error?.message || "nenhum erro" 
      })}`);

      if (error) {
        addLog(`❌ ERRO: ${error.message}`);
        toast.error(`Erro: ${error.message}`);
      } else if (data.user) {
        addLog(`✅ USUÁRIO CRIADO: ${data.user.id}`);
        toast.success("Usuário criado com sucesso!");
        
        // Verificar se foi criado no banco
        setTimeout(async () => {
          addLog("🔍 Verificando se usuário foi criado...");
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.id === data.user!.id) {
            addLog(`✅ Usuário confirmado no auth: ${user.id}`);
          } else {
            addLog(`❌ Usuário não encontrado no auth atual`);
          }
        }, 1000);
      }

    } catch (err: any) {
      addLog(`💥 ERRO INESPERADO: ${err.message}`);
      toast.error("Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const testWithMetadata = async () => {
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }

    setIsLoading(true);
    setLogs([]);
    addLog("🧪 INICIANDO TESTE COM METADADOS");

    try {
      const userMetadata = {
        first_name: "Teste",
        last_name: "Usuario",
        phone: "+244123456789",
        linking_code: "fecf7bee03b5f41c", // Código válido conhecido
        apartment_number: "999", // Apartamento teste
        floor: "9"
      };

      addLog(`📋 Metadados: ${JSON.stringify(userMetadata)}`);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userMetadata
        }
      });

      addLog(`✅ Resposta com metadados: ${JSON.stringify({ 
        user: data?.user ? { id: data.user.id, email: data.user.email, metadata: data.user.user_metadata } : null,
        error: error?.message || "nenhum erro" 
      })}`);

      if (error) {
        addLog(`❌ ERRO: ${error.message}`);
        toast.error(`Erro: ${error.message}`);
      } else if (data.user) {
        addLog(`✅ USUÁRIO CRIADO COM METADADOS: ${data.user.id}`);
        toast.success("Usuário com metadados criado!");
        
        // Aguardar trigger
        addLog("⏳ Aguardando trigger processar...");
        setTimeout(async () => {
          // Verificar profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user!.id)
            .maybeSingle();
          
          addLog(`👤 Profile criado: ${JSON.stringify(profile)}`);
          
          if (profile) {
            // Verificar resident
            const { data: resident } = await supabase
              .from('residents')
              .select('*')
              .eq('profile_id', profile.id)
              .maybeSingle();
            
            addLog(`🏠 Resident criado: ${JSON.stringify(resident)}`);
          }
        }, 3000);
      }

    } catch (err: any) {
      addLog(`💥 ERRO INESPERADO: ${err.message}`);
      toast.error("Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste de Registro de Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email para teste"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Senha (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testBasicSignUp}
              disabled={isLoading}
              variant="outline"
            >
              Teste Básico
            </Button>
            <Button 
              onClick={testWithMetadata}
              disabled={isLoading}
            >
              Teste com Metadados
            </Button>
            <Button 
              onClick={clearLogs}
              disabled={isLoading}
              variant="secondary"
            >
              Limpar Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Logs de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-3 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {logs.join('\n')}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}