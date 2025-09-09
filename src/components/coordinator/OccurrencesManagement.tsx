import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  Eye,
  Edit,
  Calendar,
  User,
  Building,
  Filter
} from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

interface OccurrencesManagementProps {
  onStatsUpdate?: () => void;
}

export default function OccurrencesManagement({ onStatsUpdate }: OccurrencesManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchOccurrences();
  }, [profile?.condominium_id, statusFilter]);

  const fetchOccurrences = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      
      // Primeira consulta para pegar as ocorrências
      let occurrencesQuery = supabase
        .from('occurrences')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        occurrencesQuery = occurrencesQuery.eq('status', statusFilter);
      }

      const { data: occurrencesData, error: occurrencesError } = await occurrencesQuery;

      if (occurrencesError) throw occurrencesError;

      // Segunda consulta para pegar os perfis dos usuários
      if (occurrencesData && occurrencesData.length > 0) {
        const userIds = occurrencesData.map(occurrence => occurrence.reported_by);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, apartment_number')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combinar os dados
        const occurrencesWithProfiles = occurrencesData.map(occurrence => ({
          ...occurrence,
          reported_by_profile: profilesData?.find(p => p.user_id === occurrence.reported_by)
        }));

        setOccurrences(occurrencesWithProfiles);
      } else {
        setOccurrences([]);
      }
    } catch (error) {
      console.error('Error fetching occurrences:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ocorrências.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (occurrenceId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resolvida') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolution_notes = resolutionNotes;
      }

      const { error } = await supabase
        .from('occurrences')
        .update(updateData)
        .eq('id', occurrenceId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status da ocorrência atualizado com sucesso!",
      });

      fetchOccurrences();
      onStatsUpdate?.();
      setIsDetailsModalOpen(false);
      setResolutionNotes('');
    } catch (error) {
      console.error('Error updating occurrence status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da ocorrência.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'aberta': { label: 'Aberta', variant: 'destructive' as const, icon: AlertTriangle },
      'em_andamento': { label: 'Em Andamento', variant: 'default' as const, icon: Clock },
      'resolvida': { label: 'Resolvida', variant: 'secondary' as const, icon: CheckCircle },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    if (!statusInfo) return null;

    const IconComponent = statusInfo.icon;

    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      'reclamacao': { label: 'Reclamação', variant: 'outline' as const },
      'manutencao': { label: 'Manutenção', variant: 'secondary' as const },
      'sugestao': { label: 'Sugestão', variant: 'default' as const },
      'seguranca': { label: 'Segurança', variant: 'destructive' as const },
    };

    const categoryInfo = categoryMap[category as keyof typeof categoryMap];
    return categoryInfo ? (
      <Badge variant={categoryInfo.variant}>{categoryInfo.label}</Badge>
    ) : null;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      'baixa': { label: 'Baixa', color: 'text-green-600' },
      'media': { label: 'Média', color: 'text-yellow-600' },
      'alta': { label: 'Alta', color: 'text-orange-600' },
      'urgente': { label: 'Urgente', color: 'text-red-600' },
    };

    const priorityInfo = priorityMap[priority as keyof typeof priorityMap];
    return priorityInfo ? (
      <span className={`font-medium ${priorityInfo.color}`}>
        {priorityInfo.label}
      </span>
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {occurrences.filter(o => o.status === 'aberta').length}
                </p>
                <p className="text-sm text-muted-foreground">Abertas</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {occurrences.filter(o => o.status === 'em_andamento').length}
                </p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {occurrences.filter(o => o.status === 'resolvida').length}
                </p>
                <p className="text-sm text-muted-foreground">Resolvidas</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{occurrences.length}</p>
                <p className="text-sm text-muted-foreground">Total de Ocorrências</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occurrences Table */}
      <Card className="feature-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Todas as Ocorrências ({occurrences.length})</CardTitle>
              <CardDescription>
                Gerencie todas as ocorrências reportadas pelos moradores
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="aberta">Abertas</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="resolvida">Resolvidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {occurrences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ocorrência encontrada.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Morador</TableHead>
                    <TableHead>Apartamento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occurrences.map((occurrence) => (
                    <TableRow key={occurrence.id}>
                      <TableCell className="font-mono">
                        #{occurrence.occurrence_number.toString().padStart(3, '0')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {occurrence.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {occurrence.reported_by_profile?.first_name} {occurrence.reported_by_profile?.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {occurrence.reported_by_profile?.apartment_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(occurrence.category)}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={occurrence.status} 
                          onValueChange={(newStatus) => handleStatusUpdate(occurrence.id, newStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aberta">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                Aberta
                              </div>
                            </SelectItem>
                            <SelectItem value="em_andamento">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-blue-600" />
                                Em Andamento
                              </div>
                            </SelectItem>
                            <SelectItem value="resolvida">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                Resolvida
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(occurrence.priority)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(occurrence.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOccurrence(occurrence);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occurrence Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Ocorrência #{selectedOccurrence?.occurrence_number?.toString().padStart(3, '0')}
            </DialogTitle>
            <DialogDescription>
              Detalhes e gerenciamento da ocorrência
            </DialogDescription>
          </DialogHeader>

          {selectedOccurrence && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Título</label>
                  <p className="text-sm font-medium">{selectedOccurrence.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedOccurrence.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <div className="mt-1">{getCategoryBadge(selectedOccurrence.category)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <div className="mt-1">{getPriorityBadge(selectedOccurrence.priority)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reportado por</label>
                  <p className="text-sm">{selectedOccurrence.reported_by_profile?.first_name} {selectedOccurrence.reported_by_profile?.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Apartamento</label>
                  <p className="text-sm">{selectedOccurrence.reported_by_profile?.apartment_number}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                  {selectedOccurrence.description}
                </p>
              </div>

              {/* Location */}
              {selectedOccurrence.location && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Local</label>
                  <p className="mt-1 text-sm">{selectedOccurrence.location}</p>
                </div>
              )}

              {/* Resolution Notes */}
              {selectedOccurrence.status === 'resolvida' && selectedOccurrence.resolution_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas de Resolução</label>
                  <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                    {selectedOccurrence.resolution_notes}
                  </p>
                </div>
              )}

              {/* Status Management */}
              {selectedOccurrence.status !== 'resolvida' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Alterar Status</label>
                    <Select 
                      value={selectedOccurrence.status} 
                      onValueChange={(newStatus) => {
                        if (newStatus !== 'resolvida') {
                          handleStatusUpdate(selectedOccurrence.id, newStatus);
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="resolvida">Resolver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedOccurrence.status === 'em_andamento' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Notas de Resolução (obrigatório para resolver)
                      </label>
                      <Textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Descreva como a ocorrência foi resolvida..."
                        rows={3}
                      />
                      <Button 
                        onClick={() => handleStatusUpdate(selectedOccurrence.id, 'resolvida')}
                        disabled={!resolutionNotes.trim()}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Resolvida
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                <div>
                  <label className="font-medium">Criada em:</label>
                  <p>{formatDate(selectedOccurrence.created_at)}</p>
                </div>
                {selectedOccurrence.resolved_at && (
                  <div>
                    <label className="font-medium">Resolvida em:</label>
                    <p>{formatDate(selectedOccurrence.resolved_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}