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
import { Check, X, Search, Calendar, Clock, User, Phone, QrCode, Scan } from "lucide-react";
import { format } from "date-fns";
import { VisitorQRCodeGenerator } from "./VisitorQRCodeGenerator";
import { VisitorQRCodeScanner } from "./VisitorQRCodeScanner";

interface Visitor {
  id: string;
  name: string;
  document_number: string;
  phone: string;
  visit_date: string;
  visit_time: string;
  purpose: string;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  residents: {
    apartment_number: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface VisitorsManagementProps {
  onStatsUpdate: () => void;
}

export function VisitorsManagement({ onStatsUpdate }: VisitorsManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select(`
          *,
          residents(
            apartment_number,
            profiles(first_name, last_name)
          )
        `)
        .eq('condominium_id', profile?.condominium_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar visitantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVisitor = async (visitorId: string) => {
    try {
      const { error } = await supabase
        .from('visitors')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: profile?.user_id,
        })
        .eq('id', visitorId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Visitante aprovado com sucesso.",
      });

      fetchVisitors();
      onStatsUpdate();
    } catch (error) {
      console.error('Error approving visitor:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar visitante.",
        variant: "destructive",
      });
    }
  };

  const handleRejectVisitor = async (visitorId: string) => {
    if (!confirm("Tem certeza que deseja rejeitar este visitante?")) return;

    try {
      const { error } = await supabase
        .from('visitors')
        .delete()
        .eq('id', visitorId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Visitante rejeitado.",
      });

      fetchVisitors();
      onStatsUpdate();
    } catch (error) {
      console.error('Error rejecting visitor:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar visitante.",
        variant: "destructive",
      });
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.residents?.apartment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visitor.residents?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (visitor.residents?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === "pending") {
      return !visitor.approved && matchesSearch;
    } else if (activeTab === "approved") {
      return visitor.approved && matchesSearch;
    } else if (activeTab === "qr-generator") {
      return visitor.approved && matchesSearch; // Só visitantes aprovados podem gerar QR
    } else if (activeTab === "qr-scanner") {
      return matchesSearch;
    }
    
    return matchesSearch;
  });

  const VisitorTable = ({ visitors }: { visitors: Visitor[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Visitante</TableHead>
          <TableHead>Apartamento</TableHead>
          <TableHead>Morador</TableHead>
          <TableHead>Data/Hora</TableHead>
          <TableHead>Propósito</TableHead>
          <TableHead>Estado</TableHead>
          {activeTab === "pending" && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {visitors.map((visitor) => (
          <TableRow key={visitor.id}>
            <TableCell>
              <div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{visitor.name}</span>
                </div>
                {visitor.phone && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-500">{visitor.phone}</span>
                  </div>
                )}
                {visitor.document_number && (
                  <p className="text-xs text-gray-400 mt-1">Doc: {visitor.document_number}</p>
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {visitor.residents?.apartment_number}
            </TableCell>
            <TableCell>
              {visitor.residents?.profiles ? (
                `${visitor.residents.profiles.first_name} ${visitor.residents.profiles.last_name}`
              ) : (
                <span className="text-gray-400 italic">N/A</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-sm">
                  {format(new Date(visitor.visit_date), "dd/MM/yyyy")}
                </span>
              </div>
              {visitor.visit_time && (
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{visitor.visit_time}</span>
                </div>
              )}
            </TableCell>
            <TableCell>
              <p className="text-sm">{visitor.purpose || "N/A"}</p>
            </TableCell>
            <TableCell>
              <Badge variant={visitor.approved ? "default" : "outline"}>
                {visitor.approved ? "Aprovado" : "Pendente"}
              </Badge>
              {visitor.approved && visitor.approved_at && (
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(visitor.approved_at), "dd/MM/yyyy HH:mm")}
                </p>
              )}
            </TableCell>
            {activeTab === "pending" && (
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApproveVisitor(visitor.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRejectVisitor(visitor.id)}
                    className="text-red-600 hover:text-red-700"
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Visitantes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Aprovar e gerir visitantes do condomínio
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={showQRGenerator ? "default" : "outline"}
            onClick={() => {
              setShowQRGenerator(!showQRGenerator);
              setShowQRScanner(false);
            }}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Gerar QR Code
          </Button>
          <Button
            variant={showQRScanner ? "default" : "outline"}
            onClick={() => {
              setShowQRScanner(!showQRScanner);
              setShowQRGenerator(false);
            }}
          >
            <Scan className="w-4 h-4 mr-2" />
            Scanner QR
          </Button>
        </div>
      </div>

      {/* Componentes de QR Code */}
      {showQRGenerator && (
        <VisitorQRCodeGenerator 
          visitors={visitors.filter(v => v.approved)} 
        />
      )}

      {showQRScanner && <VisitorQRCodeScanner />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Visitantes</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar visitantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pendentes ({visitors.filter(v => !v.approved).length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprovados ({visitors.filter(v => v.approved).length})
              </TabsTrigger>
              <TabsTrigger value="all">
                Todos ({visitors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <VisitorTable visitors={filteredVisitors} />
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              <VisitorTable visitors={filteredVisitors} />
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <VisitorTable visitors={filteredVisitors} />
            </TabsContent>
          </Tabs>

          {filteredVisitors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum visitante encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}