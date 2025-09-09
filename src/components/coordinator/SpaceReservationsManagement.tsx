import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Search, Calendar, Clock, User, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface SpaceReservation {
  id: string;
  space_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  resident?: {
    apartment_number: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

interface SpaceReservationsManagementProps {
  onStatsUpdate: () => void;
}

export function SpaceReservationsManagement({ onStatsUpdate }: SpaceReservationsManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<SpaceReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('space_reservations')
        .select(`
          *,
          resident:residents(
            apartment_number,
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('condominium_id', profile?.condominium_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations((data as any) || []);
    } catch (error) {
      console.error('Error fetching space reservations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar reservas de espaços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('space_reservations')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: profile?.user_id,
        })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Reserva aprovada com sucesso.",
      });

      fetchReservations();
      onStatsUpdate();
    } catch (error) {
      console.error('Error approving reservation:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar reserva.",
        variant: "destructive",
      });
    }
  };

  const handleRejectReservation = async () => {
    if (!selectedReservation || !rejectionReason.trim()) return;

    try {
      const { error } = await supabase
        .from('space_reservations')
        .update({
          approved: false,
          approved_at: new Date().toISOString(),
          approved_by: profile?.user_id,
          rejection_reason: rejectionReason.trim(),
        })
        .eq('id', selectedReservation);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Reserva rejeitada com observação.",
      });

      setRejectionDialogOpen(false);
      setSelectedReservation(null);
      setRejectionReason("");
      fetchReservations();
      onStatsUpdate();
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar reserva.",
        variant: "destructive",
      });
    }
  };

  const openRejectionDialog = (reservationId: string) => {
    setSelectedReservation(reservationId);
    setRejectionDialogOpen(true);
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.space_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.resident?.apartment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.resident?.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reservation.resident?.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === "pending") {
      return !reservation.approved_at && matchesSearch;
    } else if (activeTab === "approved") {
      return reservation.approved === true && matchesSearch;
    } else if (activeTab === "rejected") {
      return reservation.approved === false && reservation.approved_at && matchesSearch;
    }
    
    return matchesSearch;
  });

  const ReservationTable = ({ reservations }: { reservations: SpaceReservation[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Espaço</TableHead>
            <TableHead>Apartamento</TableHead>
            <TableHead>Morador</TableHead>
            <TableHead>Data/Horário</TableHead>
            <TableHead>Propósito</TableHead>
            <TableHead>Estado</TableHead>
            {activeTab === "pending" && <TableHead>Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{reservation.space_name}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {reservation.resident?.apartment_number}
              </TableCell>
              <TableCell>
                {reservation.resident?.profile ? (
                  `${reservation.resident.profile.first_name} ${reservation.resident.profile.last_name}`
                ) : (
                  <span className="text-gray-400 italic">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-sm">
                      {format(new Date(reservation.reservation_date), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {reservation.start_time} - {reservation.end_time}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm max-w-xs truncate" title={reservation.purpose || ""}>
                  {reservation.purpose || "N/A"}
                </p>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                   <Badge 
                    variant={
                      reservation.approved === true ? "default" : 
                      reservation.approved === false && reservation.approved_at ? "destructive" : 
                      "outline"
                    }
                  >
                    {reservation.approved === true ? "Aprovada" : 
                     reservation.approved === false && reservation.approved_at ? "Rejeitada" : 
                     "Pendente"}
                  </Badge>
                  {reservation.approved_at && (
                    <p className="text-xs text-gray-400">
                      {format(new Date(reservation.approved_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                  {reservation.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-950 p-2 rounded-md">
                      <div className="flex items-start space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {reservation.rejection_reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TableCell>
              {!reservation.approved_at && (
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApproveReservation(reservation.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRejectionDialog(reservation.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gestão de Reservas de Espaços
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Aprovar e gerir reservas de espaços públicos do condomínio
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Lista de Reservas</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar reservas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                Pendentes ({reservations.filter(r => !r.approved_at).length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs sm:text-sm">
                Aprovadas ({reservations.filter(r => r.approved === true).length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                Rejeitadas ({reservations.filter(r => r.approved === false && r.approved_at).length})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todas ({reservations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <ReservationTable reservations={filteredReservations} />
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              <ReservationTable reservations={filteredReservations} />
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <ReservationTable reservations={filteredReservations} />
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <ReservationTable reservations={filteredReservations} />
            </TabsContent>
          </Tabs>

          {filteredReservations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm">Nenhuma reserva encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <X className="w-5 h-5 text-red-600" />
              <span>Rejeitar Reserva</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">
                Motivo da Recusa <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Descreva o motivo da recusa desta reserva..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este motivo será exibido para o morador.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectionDialogOpen(false);
                  setSelectedReservation(null);
                  setRejectionReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectReservation}
                disabled={!rejectionReason.trim()}
              >
                Rejeitar Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}