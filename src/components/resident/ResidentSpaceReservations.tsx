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
  MapPin, 
  Plus, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResidentSpaceReservationsProps {
  profile: any;
}

interface SpaceReservation {
  id: string;
  space_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const AVAILABLE_SPACES = [
  "Salão de Festas",
  "Área de Churrasqueira", 
  "Quadra de Esportes",
  "Piscina",
  "Sala de Reuniões",
  "Área de Lazer Infantil",
  "Academia",
  "Salão de Jogos"
];

const ResidentSpaceReservations = ({ profile }: ResidentSpaceReservationsProps) => {
  const [reservations, setReservations] = useState<SpaceReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [residentId, setResidentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    space_name: "",
    reservation_date: "",
    start_time: "",
    end_time: "",
    purpose: ""
  });
  const { toast } = useToast();

  const fetchReservations = async () => {
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

      // Fetch space reservations for this resident
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('space_reservations')
        .select('*')
        .eq('resident_id', residentData.id)
        .order('created_at', { ascending: false });

      if (reservationsError) throw reservationsError;

      setReservations(reservationsData || []);
    } catch (error: any) {
      console.error('Error fetching space reservations:', error);
      toast({
        title: "Erro ao carregar reservas",
        description: "Não foi possível carregar os dados de reservas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [profile]);

  const handleCreateReservation = async () => {
    if (!residentId || !formData.space_name || !formData.reservation_date || !formData.start_time || !formData.end_time) {
      toast({
        title: "Campos obrigatórios",
        description: "Espaço, data, horário de início e fim são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Check if end time is after start time
    if (formData.end_time <= formData.start_time) {
      toast({
        title: "Horário inválido",
        description: "O horário de fim deve ser posterior ao horário de início",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('space_reservations')
        .insert({
          resident_id: residentId,
          condominium_id: profile.condominium_id,
          space_name: formData.space_name,
          reservation_date: formData.reservation_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          purpose: formData.purpose || null,
          approved: false
        });

      if (error) throw error;

      toast({
        title: "Reserva solicitada",
        description: "Solicitação enviada para aprovação da administração"
      });

      setShowCreateDialog(false);
      resetForm();
      fetchReservations();
    } catch (error: any) {
      console.error('Error creating space reservation:', error);
      toast({
        title: "Erro ao solicitar reserva",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      space_name: "",
      reservation_date: "",
      start_time: "",
      end_time: "",
      purpose: ""
    });
  };

  const getStatusBadge = (reservation: SpaceReservation) => {
    const isPastReservation = new Date(reservation.reservation_date) < new Date();
    
    if (reservation.approved === true) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovada
        </Badge>
      );
    } else if (reservation.approved === false && reservation.approved_at) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitada
        </Badge>
      );
    } else if (isPastReservation && !reservation.approved_at) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expirada
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

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.space_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (reservation.purpose && reservation.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === "all") return matchesSearch;
    
    const isPastReservation = new Date(reservation.reservation_date) < new Date();
    
    if (statusFilter === "approved") return matchesSearch && reservation.approved === true;
    if (statusFilter === "rejected") return matchesSearch && reservation.approved === false && reservation.approved_at;
    if (statusFilter === "pending") return matchesSearch && !reservation.approved_at;
    if (statusFilter === "expired") return matchesSearch && !reservation.approved_at && isPastReservation;
    
    return matchesSearch;
  });

  const totalPending = reservations.filter(r => !r.approved_at).length;
  const totalApproved = reservations.filter(r => r.approved === true).length;
  const totalRejected = reservations.filter(r => r.approved === false && r.approved_at).length;
  const totalExpired = reservations.filter(r => !r.approved_at && new Date(r.reservation_date) < new Date()).length;

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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Minhas Reservas de Espaços</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerir solicitações de reserva de espaços públicos do condomínio
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Nova Reserva de Espaço</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="spaceName">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Espaço *
                </Label>
                <Select value={formData.space_name} onValueChange={(value) => setFormData(prev => ({ ...prev, space_name: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um espaço" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SPACES.map((space) => (
                      <SelectItem key={space} value={space}>
                        {space}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservationDate">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data da Reserva *
                </Label>
                <Input
                  id="reservationDate"
                  type="date"
                  value={formData.reservation_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, reservation_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Início *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Fim *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Propósito da Reserva</Label>
                <Textarea
                  id="purpose"
                  placeholder="Descreva brevemente o motivo da reserva..."
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateReservation} className="flex-1">
                  Solicitar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{totalPending}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{totalApproved}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{totalRejected}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Rejeitadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar reservas..."
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
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Lista de Reservas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredReservations.length} de {reservations.length} reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhuma reserva registada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando uma reserva de espaço.
              </p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Primeira Reserva
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Espaço</TableHead>
                    <TableHead className="text-xs sm:text-sm">Data</TableHead>
                    <TableHead className="text-xs sm:text-sm">Horário</TableHead>
                    <TableHead className="text-xs sm:text-sm">Propósito</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="font-medium text-xs sm:text-sm">{reservation.space_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="text-xs sm:text-sm">{new Date(reservation.reservation_date).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="text-xs sm:text-sm">{reservation.start_time} - {reservation.end_time}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs sm:text-sm max-w-xs truncate" title={reservation.purpose || ''}>
                          {reservation.purpose || 'Não especificado'}
                        </p>
                      </TableCell>
                       <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(reservation)}
                          {reservation.rejection_reason && (
                            <div className="bg-red-50 dark:bg-red-950 p-2 rounded-md max-w-xs">
                              <p className="text-xs text-red-700 dark:text-red-300">
                                <strong>Motivo:</strong> {reservation.rejection_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredReservations.length === 0 && reservations.length > 0 && (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum resultado encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros para ver outras reservas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentSpaceReservations;