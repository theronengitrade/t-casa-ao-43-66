import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Plus, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Filter,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

interface ResidentOccurrencesProps {
  profile: any;
}

export default function ResidentOccurrences({ profile }: ResidentOccurrencesProps) {
  const { toast } = useToast();
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'reclamacao',
    priority: 'media',
    location: ''
  });

  useEffect(() => {
    fetchOccurrences();
  }, [profile?.condominium_id, statusFilter]);

  const fetchOccurrences = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('occurrences')
        .select(`
          *
        `)
        .eq('condominium_id', profile.condominium_id)
        .eq('reported_by', profile.user_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOccurrences(data || []);
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

  const createOccurrence = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('occurrences')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          location: formData.location,
          condominium_id: profile.condominium_id,
          reported_by: profile.user_id
        } as any);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ocorrência registada com sucesso."
      });

      setIsCreateModalOpen(false);
      resetForm();
      fetchOccurrences();
    } catch (error) {
      console.error('Error creating occurrence:', error);
      toast({
        title: "Erro",
        description: "Erro ao registar ocorrência.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'reclamacao',
      priority: 'media',
      location: ''
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'aberta': return 'destructive';
      case 'em_andamento': return 'default';
      case 'resolvida': return 'outline';
      case 'fechada': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'secondary';
      case 'media': return 'default';
      case 'alta': return 'destructive';
      case 'urgente': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta': return 'Aberta';
      case 'em_andamento': return 'Em Andamento';
      case 'resolvida': return 'Resolvida';
      case 'fechada': return 'Fechada';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'alta': return 'Alta';
      case 'urgente': return 'Urgente';
      default: return priority;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'reclamacao': return 'Reclamação';
      case 'sugestao': return 'Sugestão';
      case 'manutencao': return 'Manutenção';
      case 'limpeza': return 'Limpeza';
      case 'seguranca': return 'Segurança';
      case 'ruido': return 'Ruído';
      default: return category;
    }
  };

  const handleViewDetails = (occurrence: any) => {
    setSelectedOccurrence(occurrence);
    setIsDetailsModalOpen(true);
  };

  const categories = [
    { value: 'reclamacao', label: 'Reclamação' },
    { value: 'sugestao', label: 'Sugestão' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'limpeza', label: 'Limpeza' },
    { value: 'seguranca', label: 'Segurança' },
    { value: 'ruido', label: 'Ruído' }
  ];

  const priorities = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Ocorrências</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Registe e acompanhe ocorrências, reclamações e sugestões
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="aberta">Abertas</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="resolvida">Resolvidas</SelectItem>
              <SelectItem value="fechada">Fechadas</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Ocorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registar Nova Ocorrência</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título da ocorrência"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(pri => (
                        <SelectItem key={pri.value} value={pri.value}>{pri.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Local onde ocorreu (opcional)"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva detalhadamente a ocorrência"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createOccurrence}>
                    Registar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <AlertTriangle className="h-6 w-6 text-red-600" />
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
                <Clock className="h-6 w-6 text-blue-600" />
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
                <CheckCircle className="h-6 w-6 text-green-600" />
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
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="feature-card">
        <CardHeader>
          <CardTitle>Minhas Ocorrências ({occurrences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {occurrences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ocorrência encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Título</TableHead>
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
                      <TableCell>
                        <div>
                          <p className="font-medium">{occurrence.title}</p>
                          {occurrence.location && (
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {occurrence.location}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(occurrence.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(occurrence.status)}>
                          {getStatusLabel(occurrence.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(occurrence.priority)}>
                          {getPriorityLabel(occurrence.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(occurrence.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(occurrence)}
                          title="Ver Detalhes"
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

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Ocorrência #{selectedOccurrence?.occurrence_number?.toString().padStart(3, '0')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOccurrence && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Título</label>
                  <p className="text-sm">{selectedOccurrence.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p className="text-sm">{getCategoryLabel(selectedOccurrence.category)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedOccurrence.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedOccurrence.status)}>
                      {getStatusLabel(selectedOccurrence.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <div className="mt-1">
                    <Badge variant={getPriorityBadgeVariant(selectedOccurrence.priority)}>
                      {getPriorityLabel(selectedOccurrence.priority)}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedOccurrence.location && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Localização</label>
                  <p className="text-sm">{selectedOccurrence.location}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                  <p className="text-sm">{formatDate(selectedOccurrence.created_at)}</p>
                </div>
                {selectedOccurrence.resolved_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Resolução</label>
                    <p className="text-sm">{formatDate(selectedOccurrence.resolved_at)}</p>
                  </div>
                )}
              </div>

              {selectedOccurrence.assigned_profile && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Atribuído a</label>
                  <p className="text-sm">
                    {selectedOccurrence.assigned_profile.first_name} {selectedOccurrence.assigned_profile.last_name}
                  </p>
                </div>
              )}

              {selectedOccurrence.resolution_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas de Resolução</label>
                  <p className="text-sm">{selectedOccurrence.resolution_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}