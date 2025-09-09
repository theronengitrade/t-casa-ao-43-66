import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Plus, 
  Calendar,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResidentVisitorsProps {
  profile: any;
}

interface Visitor {
  id: string;
  name: string;
  document_number: string | null;
  phone: string | null;
  visit_date: string;
  visit_time: string | null;
  purpose: string | null;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

const ResidentVisitors = ({ profile }: ResidentVisitorsProps) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [residentId, setResidentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    document_number: "",
    phone: "",
    visit_date: "",
    visit_time: "",
    purpose: ""
  });
  const { toast } = useToast();

  const fetchVisitors = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // First get the resident record
      const { data: residentData, error: residentError } = await supabase
        .from('residents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (residentError) {
        console.error('Error fetching resident:', residentError);
        return;
      }

      setResidentId(residentData.id);

      // Fetch visitors for this resident
      const { data: visitorsData, error: visitorsError } = await supabase
        .from('visitors')
        .select('*')
        .eq('resident_id', residentData.id)
        .order('created_at', { ascending: false });

      if (visitorsError) throw visitorsError;

      setVisitors(visitorsData || []);
    } catch (error: any) {
      console.error('Error fetching visitors:', error);
      toast({
        title: "Erro ao carregar visitantes",
        description: "Não foi possível carregar os dados de visitantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [profile]);

  const handleCreateVisitor = async () => {
    if (!residentId || !formData.name || !formData.visit_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e data da visita são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('visitors')
        .insert({
          resident_id: residentId,
          condominium_id: profile.condominium_id,
          name: formData.name,
          document_number: formData.document_number || null,
          phone: formData.phone || null,
          visit_date: formData.visit_date,
          visit_time: formData.visit_time || null,
          purpose: formData.purpose || null,
          approved: false
        });

      if (error) throw error;

      toast({
        title: "Visitante registado",
        description: "Solicitação enviada para aprovação da administração"
      });

      setShowCreateDialog(false);
      resetForm();
      fetchVisitors();
    } catch (error: any) {
      console.error('Error creating visitor:', error);
      toast({
        title: "Erro ao registar visitante",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      document_number: "",
      phone: "",
      visit_date: "",
      visit_time: "",
      purpose: ""
    });
  };

  const getStatusBadge = (approved: boolean, visitDate: string) => {
    const isPastVisit = new Date(visitDate) < new Date();
    
    if (approved) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      );
    } else if (isPastVisit) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expirado
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (visitor.purpose && visitor.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === "all") return matchesSearch;
    
    const isPastVisit = new Date(visitor.visit_date) < new Date();
    
    if (statusFilter === "approved") return matchesSearch && visitor.approved;
    if (statusFilter === "pending") return matchesSearch && !visitor.approved && !isPastVisit;
    if (statusFilter === "expired") return matchesSearch && !visitor.approved && isPastVisit;
    
    return matchesSearch;
  });

  const totalPending = visitors.filter(v => !v.approved && new Date(v.visit_date) >= new Date()).length;
  const totalApproved = visitors.filter(v => v.approved).length;
  const totalExpired = visitors.filter(v => !v.approved && new Date(v.visit_date) < new Date()).length;

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
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meus Visitantes</h2>
          <p className="text-muted-foreground">
            Gerir solicitações de visitantes para o seu apartamento
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Visitante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Visitante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visitorName">
                  <User className="h-4 w-4 inline mr-1" />
                  Nome do Visitante *
                </Label>
                <Input
                  id="visitorName"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  placeholder="BI, Passaporte, etc."
                  value={formData.document_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitorPhone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Telefone
                </Label>
                <Input
                  id="visitorPhone"
                  placeholder="+244 900 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visitDate">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Data da Visita *
                  </Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitTime">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Hora da Visita
                  </Label>
                  <Input
                    id="visitTime"
                    type="time"
                    value={formData.visit_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, visit_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Propósito da Visita</Label>
                <Textarea
                  id="purpose"
                  placeholder="Descreva brevemente o motivo da visita..."
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateVisitor} className="flex-1">
                  Solicitar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalPending}</p>
                <p className="text-sm text-muted-foreground">Pendentes de Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalApproved}</p>
                <p className="text-sm text-muted-foreground">Visitantes Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{totalExpired}</p>
                <p className="text-sm text-muted-foreground">Solicitações Expiradas</p>
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
                placeholder="Pesquisar visitantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Visitors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Visitantes</CardTitle>
          <CardDescription>
            {filteredVisitors.length} de {visitors.length} visitantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visitors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum visitante registado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando uma solicitação de visitante.
              </p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Primeira Solicitação
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Data da Visita</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Propósito</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{visitor.name}</p>
                        {visitor.document_number && (
                          <p className="text-sm text-muted-foreground">
                            Doc: {visitor.document_number}
                          </p>
                        )}
                        {visitor.phone && (
                          <p className="text-sm text-muted-foreground">
                            Tel: {visitor.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(visitor.visit_date).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {visitor.visit_time ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{visitor.visit_time}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate" title={visitor.purpose || ''}>
                        {visitor.purpose || 'Não especificado'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(visitor.approved, visitor.visit_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredVisitors.length === 0 && visitors.length > 0 && (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum resultado encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros para ver outros visitantes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções para Visitantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Como Funciona
              </h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Crie uma solicitação com os dados do visitante</li>
                <li>A solicitação é enviada para aprovação da administração</li>
                <li>Após aprovação, o visitante pode aceder ao condomínio</li>
                <li>Solicitações não aprovadas expiram na data da visita</li>
              </ol>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                Regras Importantes
              </h4>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside">
                <li>Solicite visitantes com antecedência mínima de 24 horas</li>
                <li>Forneça informações correctas e completas</li>
                <li>Visitantes devem apresentar identificação na portaria</li>
                <li>Você é responsável pelos seus visitantes durante a permanência</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentVisitors;