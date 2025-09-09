import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  Search, 
  Download, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFinancialSync, PaymentData } from "@/hooks/useFinancialSync";
import { formatCurrency } from "@/lib/currency";

interface ResidentPaymentsProps {
  profile: any;
  condominiumInfo: any;
}

const ResidentPayments = ({ profile, condominiumInfo }: ResidentPaymentsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [residentId, setResidentId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // ✅ SINCRONIZAÇÃO UNIFICADA: Usar hook centralizado para todos os pagamentos
  const { 
    payments: allPayments, 
    loading,
    refreshData 
  } = useFinancialSync(profile?.condominium_id);
  
  // Filtrar pagamentos do residente atual
  const [residentPayments, setResidentPayments] = useState<PaymentData[]>([]);

  // Buscar ID do residente e filtrar pagamentos
  useEffect(() => {
    const fetchResidentData = async () => {
      if (!profile?.id) return;

      try {
        console.log('🔍 ResidentPayments - Fetching resident data for profile:', profile.id);

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
        console.log('🔍 ResidentPayments - Found resident ID:', residentData.id);

        // Filtrar pagamentos do residente
        const myPayments = allPayments.filter(payment => 
          payment.resident_id === residentData.id
        );

        console.log('🔍 ResidentPayments - Filtered payments for resident:', myPayments.length);
        setResidentPayments(myPayments);

      } catch (error: any) {
        console.error('Error fetching resident data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do residente",
          variant: "destructive"
        });
      }
    };

    fetchResidentData();
  }, [profile?.id, allPayments]);

  // Usar os pagamentos sincronizados automaticamente

  const formatCurrencyLocal = (amount: number) => {
    return formatCurrency(amount, condominiumInfo?.currency || 'AOA');
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = status === 'pending' && new Date(dueDate) < new Date();
    
    if (isOverdue) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Em Atraso
        </Badge>
      );
    }

    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPayments = residentPayments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.reference_month.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    
    const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();
    const filterStatus = statusFilter === 'overdue' ? isOverdue : payment.status === statusFilter;
    
    return matchesSearch && filterStatus;
  });

  const totalPending = residentPayments.filter(p => p.status === 'pending').length;
  const totalOverdue = residentPayments.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date()).length;
  const totalPaid = residentPayments.filter(p => p.status === 'paid').length;

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
      <div>
        <h2 className="text-2xl font-bold">Meus Pagamentos</h2>
        <p className="text-muted-foreground">
          Consulte o histórico e status dos seus pagamentos
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalPending}</p>
                <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{totalOverdue}</p>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalPaid}</p>
                <p className="text-sm text-muted-foreground">Pagamentos Realizados</p>
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
                placeholder="Pesquisar por descrição ou mês..."
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
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Pagamentos</span>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
          <CardDescription>
            {filteredPayments.length} de {residentPayments.length} pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {residentPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum pagamento encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ainda não existem registos de pagamentos para este apartamento.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Mês de Referência</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Data de Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.reference_month).toLocaleDateString('pt-PT', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrencyLocal(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(payment.due_date).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.payment_date ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span>{new Date(payment.payment_date).toLocaleDateString('pt-PT')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status, payment.due_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredPayments.length === 0 && residentPayments.length > 0 && (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum resultado encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros para ver outros pagamentos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções de Pagamento</CardTitle>
          <CardDescription>
            Como realizar os seus pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Formas de Pagamento Aceites
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Transferência bancária</li>
                <li>• Multibanco (Portugal)</li>
                <li>• Expressão do Atlântico (Angola)</li>
                <li>• Pagamento presencial na administração</li>
              </ul>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                Importante
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Para atualização automática do status, contacte a administração após realizar o pagamento 
                com o comprovativo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentPayments;