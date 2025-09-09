import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Calendar,
  Eye,
  EyeOff,
  Clock,
  Users,
  Megaphone
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import CreateAnnouncementModal from "./CreateAnnouncementModal";

interface AnnouncementsManagementProps {
  onStatsUpdate: () => void;
}

export function AnnouncementsManagement({ onStatsUpdate }: AnnouncementsManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('condominium_id', profile?.condominium_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar anúncios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Anúncio excluído com sucesso"
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o anúncio",
        variant: "destructive"
      });
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Anúncio ${!currentStatus ? 'publicado' : 'despublicado'} com sucesso`
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o anúncio",
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <Badge variant="secondary">Baixa</Badge>;
      case 2:
        return <Badge variant="outline">Normal</Badge>;
      case 3:
        return <Badge variant="destructive">Alta</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Anúncios</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Criar e gerir anúncios para os moradores
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Anúncio
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar anúncios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Megaphone className="h-5 w-5" />
            <span>Lista de Anúncios ({filteredAnnouncements.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum anúncio encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando o seu primeiro anúncio.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Anúncio
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-2">
                          {announcement.is_urgent && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{announcement.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {announcement.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(announcement.priority)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={announcement.published ? "default" : "secondary"}>
                        {announcement.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(announcement.created_at), "dd/MM/yyyy", { locale: pt })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {announcement.expires_at ? (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(announcement.expires_at), "dd/MM/yyyy", { locale: pt })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sem expiração</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublished(announcement.id, announcement.published)}
                        >
                          {announcement.published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Anúncio</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAnnouncement(announcement.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateAnnouncementModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        profile={profile}
        onSuccess={fetchAnnouncements}
      />
    </div>
  );
}