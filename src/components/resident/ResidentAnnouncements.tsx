import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Search, 
  Calendar,
  AlertTriangle,
  Info,
  Megaphone,
  Eye,
  Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResidentAnnouncementsProps {
  profile: any;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
  is_urgent: boolean;
  published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const ResidentAnnouncements = ({ profile }: ResidentAnnouncementsProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out expired announcements
      const activeAnnouncements = data?.filter(announcement => 
        !announcement.expires_at || new Date(announcement.expires_at) > new Date()
      ) || [];

      setAnnouncements(activeAnnouncements);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Erro ao carregar anúncios",
        description: "Não foi possível carregar os anúncios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [profile]);

  const getPriorityBadge = (priority: number, isUrgent: boolean) => {
    if (isUrgent) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Urgente
        </Badge>
      );
    }

    switch (priority) {
      case 1:
        return (
          <Badge variant="secondary">
            <Info className="h-3 w-3 mr-1" />
            Baixa
          </Badge>
        );
      case 2:
        return (
          <Badge variant="default">
            Normal
          </Badge>
        );
      case 3:
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Alta
          </Badge>
        );
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (priorityFilter === "all") return matchesSearch;
    
    if (priorityFilter === "urgent") return matchesSearch && announcement.is_urgent;
    
    return matchesSearch && announcement.priority.toString() === priorityFilter;
  });

  const urgentCount = announcements.filter(a => a.is_urgent).length;
  const highPriorityCount = announcements.filter(a => a.priority === 3 && !a.is_urgent).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Anúncios</h2>
        <p className="text-muted-foreground">
          Acompanhe as novidades e comunicações do condomínio
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{announcements.length}</p>
                <p className="text-sm text-muted-foreground">Total de Anúncios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{urgentCount}</p>
                <p className="text-sm text-muted-foreground">Anúncios Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Megaphone className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{highPriorityCount}</p>
                <p className="text-sm text-muted-foreground">Alta Prioridade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar anúncios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgentes</SelectItem>
                <SelectItem value="3">Alta Prioridade</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="1">Baixa Prioridade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum anúncio disponível</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não existem anúncios publicados para este condomínio.
              </p>
            </CardContent>
          </Card>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum resultado encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros para ver outros anúncios.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className={announcement.is_urgent ? "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/30" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{announcement.title}</span>
                      {getPriorityBadge(announcement.priority, announcement.is_urgent)}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(announcement.created_at).toLocaleDateString('pt-PT', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      {announcement.expires_at && (
                        <span className="text-orange-600 flex items-center">
                          Expira: {new Date(announcement.expires_at).toLocaleDateString('pt-PT')}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-muted-foreground line-clamp-3">
                    {announcement.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <span>{selectedAnnouncement.title}</span>
                    {getPriorityBadge(selectedAnnouncement.priority, selectedAnnouncement.is_urgent)}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Publicado em {new Date(selectedAnnouncement.created_at).toLocaleDateString('pt-PT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAnnouncement(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{selectedAnnouncement.content}</div>
              </div>
              
              {selectedAnnouncement.expires_at && (
                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-orange-800 dark:text-orange-200">
                        Data de Expiração
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Este anúncio expira em {new Date(selectedAnnouncement.expires_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResidentAnnouncements;