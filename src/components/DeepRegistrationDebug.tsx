import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function DeepRegistrationDebug() {
  const [email, setEmail] = useState('testuser@gmail.com');
  const [password, setPassword] = useState('123456');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(`[DEEP_DEBUG] ${logMessage}`);
  };

  const testStep1_BasicSignup = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog("🔍 STEP 1: Testando signup básico SEM metadados");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password
      });

      addLog(`✅ Resposta básica: ${JSON.stringify({
        user_id: data?.user?.id,
        user_email: data?.user?.email,
        session_exists: !!data?.session,
        error: error?.message
      })}`);

      if (error) {
        addLog(`❌ ERRO: ${error.message}`);
        toast.error(`Erro: ${error.message}`);
      } else if (data.user) {
        addLog(`✅ USUÁRIO CRIADO (BÁSICO): ${data.user.id}`);
        toast.success("Usuário básico criado!");
        
        // Verificar nos logs do Supabase
        addLog("⏳ Aguarde 3 segundos e verifique os logs do Supabase...");
      }
    } catch (err: any) {
      addLog(`💥 ERRO INESPERADO: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testStep2_WithMetadata = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog("🔍 STEP 2: Testando signup COM metadados para trigger");

    try {
      const userMetadata = {
        first_name: "Debug",
        last_name: "Test", 
        phone: "+244999888777",
        linking_code: "088bb6b3e40e44bd", // Código conhecido do log
        apartment_number: "777",
        floor: "7"
      };

      addLog(`📋 Metadados enviados: ${JSON.stringify(userMetadata)}`);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userMetadata
        }
      });

      addLog(`✅ Resposta com metadados: ${JSON.stringify({
        user_id: data?.user?.id,
        user_email: data?.user?.email,
        user_metadata: data?.user?.user_metadata,
        session_exists: !!data?.session,
        error: error?.message
      })}`);

      if (error) {
        addLog(`❌ ERRO: ${error.message}`);
        toast.error(`Erro: ${error.message}`);
      } else if (data.user) {
        addLog(`✅ USUÁRIO CRIADO (COM METADADOS): ${data.user.id}`);
        toast.success("Usuário com metadados criado!");
        
        addLog("⏳ Aguardando trigger processar (5 segundos)...");
        setTimeout(async () => {
          await verifyDatabaseRecords(data.user!.id);
        }, 5000);
      }
    } catch (err: any) {
      addLog(`💥 ERRO INESPERADO: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDatabaseRecords = async (userId: string) => {
    addLog("🔍 VERIFICANDO REGISTROS NO BANCO...");
    
    try {
      // Verificar profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        addLog(`❌ ERRO ao buscar profile: ${profileError.message}`);
      } else if (profile) {
        addLog(`✅ PROFILE ENCONTRADO: ${JSON.stringify(profile)}`);
        
        // Verificar resident
        const { data: resident, error: residentError } = await supabase
          .from('residents')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (residentError) {
          addLog(`❌ ERRO ao buscar resident: ${residentError.message}`);
        } else if (resident) {
          addLog(`✅ RESIDENT ENCONTRADO: ${JSON.stringify(resident)}`);
        } else {
          addLog(`❌ RESIDENT NÃO ENCONTRADO para profile_id: ${profile.id}`);
        }
      } else {
        addLog(`❌ PROFILE NÃO ENCONTRADO para user_id: ${userId}`);
      }
    } catch (err: any) {
      addLog(`💥 ERRO na verificação: ${err.message}`);
    }
  };

  const checkSupabaseLogs = () => {
    addLog("📊 PRÓXIMO PASSO: Verificar logs no Supabase");
    addLog("1. Vá para: https://supabase.com/dashboard/project/citmptpriseuzppmewpf");
    addLog("2. Acesse 'Logs' -> 'Postgres Logs'");
    addLog("3. Procure por: SIMPLE_TEST ou HANDLE_NEW_USER");
    addLog("4. Também verifique 'Auth Logs' para eventos de signup");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 DEBUG PROFUNDO - Registro de Usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Senha (min 6)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={testStep1_BasicSignup}
              disabled={isLoading}
              variant="outline"
            >
              STEP 1: Signup Básico
            </Button>
            <Button 
              onClick={testStep2_WithMetadata}
              disabled={isLoading}
            >
              STEP 2: Com Metadados
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={checkSupabaseLogs}
              disabled={isLoading}
              variant="secondary"
            >
              Como Verificar Logs
            </Button>
            <Button 
              onClick={clearLogs}
              disabled={isLoading}
              variant="destructive"
            >
              Limpar Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Logs de Debug Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
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