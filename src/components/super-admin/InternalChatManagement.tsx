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
  Search, 
  User, 
  Building2,
  Clock,
  MessageCircle,
  Phone,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import "@/utils/chatDebug";

interface Coordinator {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  condominium_id: string;
  condominium_name: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    read_at: string | null;
  };
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at: string | null;
  updated_at: string;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_id: string | null;
  last_activity: string | null;
}

export default function InternalChatManagement() {
  const { user, profile } = useAuth();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchCoordinators();
    }
    
    // Cleanup function to clear any pending debounced refreshes
    return () => {
      if (debouncedRefresh.current) {
        clearTimeout(debouncedRefresh.current);
        debouncedRefresh.current = null;
      }
    };
  }, [profile]);

  // Debounced refresh function to prevent multiple simultaneous calls
  const debouncedRefresh = useRef<NodeJS.Timeout | null>(null);
  
  const scheduleCoordinatorsRefresh = () => {
    if (debouncedRefresh.current) {
      clearTimeout(debouncedRefresh.current);
    }
    debouncedRefresh.current = setTimeout(() => {
      fetchCoordinators();
    }, 300);
  };

  // Setup realtime listeners for messages with optimized updates
  useRealtime(
    {
      table: 'messages',
      event: '*'
    },
    (payload) => {
      console.log('Message realtime update:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        
        // Update current conversation messages if relevant
        if (selectedCoordinator && 
            ((newMessage.sender_id === user?.id && newMessage.recipient_id === selectedCoordinator.user_id) ||
             (newMessage.sender_id === selectedCoordinator.user_id && newMessage.recipient_id === user?.id))) {
          setMessages(prev => [...prev, newMessage]);
          
          // If it's a new message from the selected coordinator, mark it as read immediately
          if (newMessage.sender_id === selectedCoordinator.user_id && newMessage.recipient_id === user?.id) {
            markMessageAsRead(newMessage.id);
          }
        }
        
        // Optimized coordinator list update: only update affected coordinator
        if (user?.id) {
          const isIncomingMessage = newMessage.recipient_id === user.id;
          const isOutgoingMessage = newMessage.sender_id === user.id;
          
          if (isIncomingMessage || isOutgoingMessage) {
            const affectedCoordinatorId = isIncomingMessage ? newMessage.sender_id : newMessage.recipient_id;
            
            setCoordinators(prev => prev.map(coord => {
              if (coord.user_id === affectedCoordinatorId) {
                return {
                  ...coord,
                  last_message: {
                    content: newMessage.content,
                    created_at: newMessage.created_at,
                    sender_id: newMessage.sender_id,
                    read_at: newMessage.read_at
                  },
                  // Update unread count: increment if incoming and not from selected coordinator
                  unread_count: isIncomingMessage && (!selectedCoordinator || selectedCoordinator.user_id !== affectedCoordinatorId)
                    ? coord.unread_count + 1 
                    : coord.unread_count
                };
              }
              return coord;
            }));
            
            // Resort the list by last message time
            setTimeout(() => {
              setCoordinators(prev => [...prev].sort((a, b) => {
                const timeA = a.last_message?.created_at || '1970-01-01';
                const timeB = b.last_message?.created_at || '1970-01-01';
                return new Date(timeB).getTime() - new Date(timeA).getTime();
              }));
            }, 100);
          }
        }
        
      } else if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as Message;
        
        // Update current conversation messages if relevant
        if (selectedCoordinator &&
            ((updatedMessage.sender_id === user?.id && updatedMessage.recipient_id === selectedCoordinator.user_id) ||
             (updatedMessage.sender_id === selectedCoordinator.user_id && updatedMessage.recipient_id === user?.id))) {
          setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
        }
        
        // Handle read status updates to decrease unread count
        if (updatedMessage.read_at && user?.id === updatedMessage.recipient_id) {
          setCoordinators(prev => prev.map(coord => {
            if (coord.user_id === updatedMessage.sender_id) {
              return {
                ...coord,
                unread_count: Math.max(0, coord.unread_count - 1)
              };
            }
            return coord;
          }));
        }
        
      } else if (payload.eventType === 'DELETE') {
        const deletedMessage = payload.old as Message;
        
        // Remove from current conversation
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        
        // Schedule refresh to update last message in coordinators list
        scheduleCoordinatorsRefresh();
      }
    }
  );


  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      
      // Get all coordinators with their condominium info
      const { data: coordinatorsData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          phone,
          condominium_id,
          condominiums (
            name
          )
        `)
        .eq('role', 'coordinator')
        .not('condominium_id', 'is', null);

      if (error) throw error;

      // For each coordinator, get the last message and unread count
      const coordinatorsWithMessages = await Promise.all(
        coordinatorsData.map(async (coord: any) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, read_at')
            .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${coord.user_id}),and(sender_id.eq.${coord.user_id},recipient_id.eq.${user?.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count (messages from coordinator to super admin that are unread)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', coord.user_id)
            .eq('recipient_id', user?.id)
            .is('read_at', null);

          return {
            id: coord.id,
            user_id: coord.user_id,
            first_name: coord.first_name,
            last_name: coord.last_name,
            phone: coord.phone,
            condominium_id: coord.condominium_id,
            condominium_name: coord.condominiums?.name || 'Condomínio',
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      // Sort by last activity (most recent first)
      coordinatorsWithMessages.sort((a, b) => {
        const timeA = a.last_message?.created_at || '1970-01-01';
        const timeB = b.last_message?.created_at || '1970-01-01';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setCoordinators(coordinatorsWithMessages);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast.error('Erro ao carregar coordenadores');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (coordinatorUserId: string) => {
    try {
      console.log('🔍 FETCH_MESSAGES: Starting for coordinator:', coordinatorUserId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${coordinatorUserId}),and(sender_id.eq.${coordinatorUserId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Count unread messages before marking as read
      const unreadMessages = data?.filter(msg => 
        msg.sender_id === coordinatorUserId && 
        msg.recipient_id === user?.id && 
        !msg.read_at
      ) || [];

      console.log('📊 UNREAD_COUNT: Found', unreadMessages.length, 'unread messages from coordinator:', coordinatorUserId);

      // Mark messages from coordinator as read
      if (unreadMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('sender_id', coordinatorUserId)
          .eq('recipient_id', user?.id)
          .is('read_at', null);

        if (updateError) {
          console.error('❌ ERROR: Marking messages as read:', updateError);
        } else {
          console.log('✅ SUCCESS: Marked', unreadMessages.length, 'messages as read for coordinator:', coordinatorUserId);
          
          // Immediately update the specific coordinator's unread count
          setCoordinators(prev => prev.map(coord => {
            if (coord.user_id === coordinatorUserId) {
              console.log('🔄 UPDATE: Resetting unread count for coordinator:', coord.first_name, coord.last_name);
              return { ...coord, unread_count: 0 };
            }
            return coord;
          }));
        }
      } else {
        console.log('ℹ️ INFO: No unread messages to mark for coordinator:', coordinatorUserId);
      }

    } catch (error) {
      console.error('❌ ERROR: Failed to fetch messages:', error);
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
    if (!newMessage.trim() || !selectedCoordinator || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedCoordinator.user_id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      // Messages will be updated via realtime listener
    } catch (error) {
      console.error('Error sending message:', error);
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
      // Messages will be updated via realtime listener
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Erro ao eliminar mensagem');
    }
  };

  const handleSelectCoordinator = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);
    fetchMessages(coordinator.user_id);
  };

  const filteredCoordinators = coordinators.filter(coord =>
    `${coord.first_name} ${coord.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coord.condominium_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">A carregar conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Chat Interno</h2>
        <p className="text-lg text-muted-foreground mt-2">
          Comunicação direta com coordenadores
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Coordinators List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Coordenadores</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar coordenador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[580px]">
              {filteredCoordinators.map((coordinator) => (
                <div
                  key={coordinator.id}
                  onClick={() => handleSelectCoordinator(coordinator)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedCoordinator?.id === coordinator.id ? 'bg-primary/10 border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {coordinator.first_name.charAt(0)}{coordinator.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {coordinator.first_name} {coordinator.last_name}
                        </p>
                        {coordinator.unread_count > 0 && (
                          <Badge variant="default" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                            {coordinator.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{coordinator.condominium_name}</span>
                      </div>
                      {coordinator.last_message && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground truncate">
                            {coordinator.last_message.content}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(coordinator.last_message.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredCoordinators.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum coordenador encontrado</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {selectedCoordinator ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedCoordinator.first_name.charAt(0)}{selectedCoordinator.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedCoordinator.first_name} {selectedCoordinator.last_name}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{selectedCoordinator.condominium_name}</span>
                      </div>
                      {selectedCoordinator.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{selectedCoordinator.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0 flex flex-col h-[580px]">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
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
                              {new Date(message.created_at).toLocaleTimeString('pt-BR', {
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
                    ))}
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
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-medium">Selecione um coordenador</h3>
                  <p className="text-muted-foreground">
                    Escolha um coordenador para iniciar uma conversa
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}