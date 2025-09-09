import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  Shield,
  Clock,
  MessageCircle,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at: string | null;
  updated_at: string;
}

interface SuperAdmin {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export default function SuperAdminChat() {
  const { user, profile } = useAuth();
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.role === 'coordinator') {
      fetchSuperAdmin();
    }
  }, [profile]);

  useEffect(() => {
    if (superAdmin) {
      fetchMessages();
    }
  }, [superAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Setup realtime listeners for messages with enhanced logging
  useRealtime(
    {
      table: 'messages',
      event: '*'
    },
    (payload) => {
      console.log('🔄 COORDINATOR_REALTIME:', payload.eventType, 'event received');
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        console.log('📨 NEW_MESSAGE:', 'From:', newMessage.sender_id, 'To:', newMessage.recipient_id);
        
        // If it's a message in this conversation, add it
        if ((newMessage.sender_id === user?.id && superAdmin && newMessage.recipient_id === superAdmin.user_id) ||
            (superAdmin && newMessage.sender_id === superAdmin.user_id && newMessage.recipient_id === user?.id)) {
          
          console.log('✅ MESSAGE_RELEVANT: Adding to conversation');
          
          // Replace temporary message if it exists, otherwise add new message
          setMessages(prev => {
            // If this is our own message, replace any temporary message with same content
            if (newMessage.sender_id === user?.id) {
              const tempMessageIndex = prev.findIndex(msg => 
                msg.id.startsWith('temp-') && 
                msg.content === newMessage.content &&
                msg.sender_id === newMessage.sender_id
              );
              if (tempMessageIndex !== -1) {
                console.log('🔄 REPLACE_TEMP: Replacing temporary message');
                const newMessages = [...prev];
                newMessages[tempMessageIndex] = newMessage;
                return newMessages;
              }
            }
            return [...prev, newMessage];
          });
          
          // If it's from super admin, mark as read immediately since conversation is open
          if (newMessage.sender_id === superAdmin.user_id && newMessage.recipient_id === user?.id) {
            console.log('📖 AUTO_READ: Marking incoming message as read immediately');
            markMessageAsRead(newMessage.id);
          }
        } else {
          console.log('❌ MESSAGE_IRRELEVANT: Not for this conversation');
        }
        
      } else if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as Message;
        
        if ((updatedMessage.sender_id === user?.id && superAdmin && updatedMessage.recipient_id === superAdmin.user_id) ||
            (superAdmin && updatedMessage.sender_id === superAdmin.user_id && updatedMessage.recipient_id === user?.id)) {
          
          console.log('🔄 UPDATE_MESSAGE: Updating message in conversation');
          setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
          
          // If message was marked as read, update unread count
          if (updatedMessage.read_at && updatedMessage.sender_id === superAdmin.user_id) {
            console.log('📖 COUNT_DECREMENT: Message marked as read, decreasing unread count');
            setUnreadCount(prev => {
              const newCount = Math.max(0, prev - 1);
              console.log('📊 UNREAD_COUNT: Updated from', prev, 'to', newCount);
              return newCount;
            });
          }
        }
        
      } else if (payload.eventType === 'DELETE') {
        const deletedMessage = payload.old as Message;
        console.log('🗑️ DELETE_MESSAGE: Removing message from conversation');
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
      }
    }
  );

  const fetchSuperAdmin = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, phone')
        .eq('role', 'super_admin')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setSuperAdmin(data);
    } catch (error) {
      console.error('Error fetching super admin:', error);
      toast.error('Erro ao carregar administrador');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!superAdmin || !user) return;

    try {
      console.log('🔍 COORDINATOR_FETCH: Starting message fetch with super admin:', superAdmin.first_name, superAdmin.last_name);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${superAdmin.user_id}),and(sender_id.eq.${superAdmin.user_id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Count and mark unread messages from super admin as read
      const unreadMessages = data?.filter(msg => 
        msg.sender_id === superAdmin.user_id && 
        msg.recipient_id === user.id && 
        !msg.read_at
      ) || [];
      
      console.log('📊 COORDINATOR_UNREAD: Found', unreadMessages.length, 'unread messages from super admin');
      setUnreadCount(0); // Set to 0 immediately since we're viewing the conversation

      // Mark messages from super admin as read
      if (unreadMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('sender_id', superAdmin.user_id)
          .eq('recipient_id', user.id)
          .is('read_at', null);

        if (updateError) {
          console.error('❌ COORDINATOR_ERROR: Failed to mark messages as read:', updateError);
        } else {
          console.log('✅ COORDINATOR_SUCCESS: Marked', unreadMessages.length, 'messages as read');
        }
      }

    } catch (error) {
      console.error('❌ COORDINATOR_ERROR: Failed to fetch messages:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .is('read_at', null);

      if (error) {
        console.error('Error marking single message as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !superAdmin || !user) return;

    const messageContent = newMessage.trim();
    
    // Optimistic update - show message immediately
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: user.id,
      recipient_id: superAdmin.user_id,
      created_at: new Date().toISOString(),
      read_at: null,
      updated_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: superAdmin.user_id,
          content: messageContent,
          message_type: 'text'
        });

      if (error) throw error;

      toast.success('Mensagem enviada');
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageContent); // Restore message in input
      toast.error('Erro ao enviar mensagem');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Mensagem eliminada');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Erro ao eliminar mensagem');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">A carregar chat...</p>
        </div>
      </div>
    );
  }

  if (!superAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-medium">Super administrador não encontrado</h3>
              <p className="text-muted-foreground">
                Não foi possível estabelecer conexão com o super administrador
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center space-x-2">
          <MessageSquare className="h-8 w-8" />
          <span>Chat com Super Administrador</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} novas
            </Badge>
          )}
        </h2>
        <p className="text-lg text-muted-foreground mt-2">
          Comunicação direta com a administração central
        </p>
      </div>

      <Card className="h-[700px]">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{superAdmin.first_name} {superAdmin.last_name}</span>
                <Badge variant="outline" className="text-xs">
                  Super Admin
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Administração Central - T-Casa
              </p>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 flex flex-col h-[580px]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ainda não há mensagens</p>
                  <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex group ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 relative ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {new Date(message.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center space-x-1">
                          {message.sender_id === user?.id && message.read_at && (
                            <span className="text-xs opacity-70">✓✓</span>
                          )}
                          {message.sender_id === user?.id && (
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:text-destructive"
                              title="Eliminar mensagem"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              As mensagens são entregues em tempo real
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}