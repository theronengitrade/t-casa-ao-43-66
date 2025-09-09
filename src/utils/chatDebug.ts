/**
 * CHAT DEBUG UTILITIES
 * 
 * Funções para testar e validar o funcionamento do contador de mensagens não lidas
 */

import { supabase } from "@/integrations/supabase/client";

interface ChatDebugReport {
  timestamp: string;
  superAdminId: string | null;
  coordinatorId: string | null;
  totalMessages: number;
  unreadCount: number;
  unreadMessages: Array<{
    id: string;
    content: string;
    sender_id: string;
    recipient_id: string;
    created_at: string;
    read_at: string | null;
  }>;
  issues: string[];
  recommendations: string[];
}

/**
 * Valida o estado atual do contador de não lidas para um coordenador específico
 */
export async function validateUnreadCounter(
  superAdminUserId: string,
  coordinatorUserId: string
): Promise<ChatDebugReport> {
  const report: ChatDebugReport = {
    timestamp: new Date().toISOString(),
    superAdminId: superAdminUserId,
    coordinatorId: coordinatorUserId,
    totalMessages: 0,
    unreadCount: 0,
    unreadMessages: [],
    issues: [],
    recommendations: []
  };

  try {
    // 1. Buscar todas as mensagens da conversa
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${superAdminUserId},recipient_id.eq.${coordinatorUserId}),and(sender_id.eq.${coordinatorUserId},recipient_id.eq.${superAdminUserId})`)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    report.totalMessages = allMessages?.length || 0;

    // 2. Filtrar mensagens não lidas (do coordenador para o super admin)
    const unreadMessages = allMessages?.filter(msg => 
      msg.sender_id === coordinatorUserId && 
      msg.recipient_id === superAdminUserId && 
      !msg.read_at
    ) || [];

    report.unreadCount = unreadMessages.length;
    report.unreadMessages = unreadMessages;

    // 3. VALIDAÇÕES E DETECÇÃO DE PROBLEMAS

    // Verificar se há mensagens com read_at no futuro
    const futureReadMessages = allMessages?.filter(msg => 
      msg.read_at && new Date(msg.read_at) > new Date()
    ) || [];

    if (futureReadMessages.length > 0) {
      report.issues.push(`${futureReadMessages.length} mensagens com read_at no futuro`);
    }

    // Verificar se há mensagens muito antigas não lidas
    const oldUnreadMessages = unreadMessages.filter(msg => {
      const messageDate = new Date(msg.created_at);
      const daysDiff = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 7;
    });

    if (oldUnreadMessages.length > 0) {
      report.issues.push(`${oldUnreadMessages.length} mensagens não lidas com mais de 7 dias`);
      report.recommendations.push('Considere marcar mensagens antigas como lidas automaticamente');
    }

    // Verificar padrões suspeitos
    const messagesFromCoordinator = allMessages?.filter(msg => msg.sender_id === coordinatorUserId) || [];
    const readMessagesFromCoordinator = messagesFromCoordinator.filter(msg => msg.read_at);
    
    if (messagesFromCoordinator.length > 0) {
      const readPercentage = (readMessagesFromCoordinator.length / messagesFromCoordinator.length) * 100;
      
      if (readPercentage < 50) {
        report.issues.push(`Apenas ${readPercentage.toFixed(1)}% das mensagens do coordenador foram lidas`);
        report.recommendations.push('Verificar se auto-marcação está funcionando corretamente');
      }
    }

    // Verificar mensagens duplicadas (mesmo conteúdo, mesmo remetente, diferença < 1 segundo)
    const duplicates = [];
    for (let i = 0; i < (allMessages?.length || 0) - 1; i++) {
      const current = allMessages![i];
      const next = allMessages![i + 1];
      
      if (current.sender_id === next.sender_id && 
          current.content === next.content &&
          Math.abs(new Date(current.created_at).getTime() - new Date(next.created_at).getTime()) < 1000) {
        duplicates.push(current.id);
      }
    }

    if (duplicates.length > 0) {
      report.issues.push(`${duplicates.length} mensagens possivelmente duplicadas detectadas`);
      report.recommendations.push('Verificar lógica de prevenção de envio duplo');
    }

    // 4. RECOMENDAÇÕES GERAIS
    if (report.unreadCount === 0) {
      report.recommendations.push('✅ Contador funcionando corretamente - sem mensagens não lidas');
    } else if (report.unreadCount > 10) {
      report.recommendations.push('⚠️ Muitas mensagens não lidas - verificar se notificações estão funcionando');
    }

    return report;

  } catch (error) {
    report.issues.push(`Erro durante validação: ${error}`);
    return report;
  }
}

/**
 * Simula cenários de teste para validar o contador
 */
export async function runCounterStressTest(
  superAdminUserId: string,
  coordinatorUserId: string
): Promise<{
  success: boolean;
  testResults: Array<{
    test: string;
    passed: boolean;
    details: string;
  }>;
}> {
  const results = [];
  
  try {
    // Teste 1: Enviar mensagem e verificar se contador incrementa
    console.log('🧪 TESTE 1: Enviando mensagem do coordenador...');
    
    const { error: sendError } = await supabase
      .from('messages')
      .insert({
        sender_id: coordinatorUserId,
        recipient_id: superAdminUserId,
        content: `Teste automático - ${new Date().toLocaleTimeString()}`,
        message_type: 'text'
      });

    results.push({
      test: 'Envio de mensagem',
      passed: !sendError,
      details: sendError ? sendError.message : 'Mensagem enviada com sucesso'
    });

    // Aguardar um pouco para o realtime processar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 2: Verificar se mensagem está não lida
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', coordinatorUserId)
      .eq('recipient_id', superAdminUserId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    const hasUnread = unreadMessages && unreadMessages.length > 0;
    
    results.push({
      test: 'Mensagem não lida detectada',
      passed: hasUnread,
      details: hasUnread ? 'Mensagem corretamente marcada como não lida' : 'Mensagem não encontrada ou já marcada como lida'
    });

    // Teste 3: Marcar como lida e verificar se contador decrementa
    if (hasUnread) {
      const { error: markReadError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', unreadMessages[0].id);

      results.push({
        test: 'Marcação como lida',
        passed: !markReadError,
        details: markReadError ? markReadError.message : 'Mensagem marcada como lida com sucesso'
      });
    }

    const allPassed = results.every(result => result.passed);
    
    return {
      success: allPassed,
      testResults: results
    };

  } catch (error) {
    results.push({
      test: 'Execução do teste',
      passed: false,
      details: `Erro durante teste: ${error}`
    });

    return {
      success: false,
      testResults: results
    };
  }
}

/**
 * Gera relatório detalhado sobre o estado do chat
 */
export function logChatDebugReport(report: ChatDebugReport) {
  console.group('📊 RELATÓRIO DE DEBUG DO CHAT');
  console.log('🕒 Timestamp:', report.timestamp);
  console.log('👑 Super Admin ID:', report.superAdminId);
  console.log('🏢 Coordenador ID:', report.coordinatorId);
  console.log('💬 Total de mensagens:', report.totalMessages);
  console.log('🔴 Mensagens não lidas:', report.unreadCount);
  
  if (report.unreadMessages.length > 0) {
    console.group('📝 Mensagens não lidas:');
    report.unreadMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.created_at}] ${msg.content.substring(0, 50)}...`);
    });
    console.groupEnd();
  }

  if (report.issues.length > 0) {
    console.group('⚠️ Problemas detectados:');
    report.issues.forEach((issue, index) => {
      console.warn(`${index + 1}. ${issue}`);
    });
    console.groupEnd();
  }

  if (report.recommendations.length > 0) {
    console.group('💡 Recomendações:');
    report.recommendations.forEach((rec, index) => {
      console.info(`${index + 1}. ${rec}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
}

// Funções de conveniência para uso no console
(window as any).chatDebug = {
  validateUnreadCounter,
  runCounterStressTest,
  logChatDebugReport,
  
  // Função rápida para debug
  quickCheck: async (superAdminId: string, coordinatorId: string) => {
    const report = await validateUnreadCounter(superAdminId, coordinatorId);
    logChatDebugReport(report);
    return report;
  }
};

console.log('🔧 Chat Debug Utils loaded! Use chatDebug.quickCheck(superAdminId, coordinatorId) for quick validation.');