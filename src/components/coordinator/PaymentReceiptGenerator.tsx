import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentGenerator } from "@/components/shared/DocumentGenerator";
import { Search, Filter, Receipt } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface PaymentRecord {
  id: string;
  resident_id: string;
  description: string;
  amount: number;
  currency: string;
  payment_date: string;
  reference_month: string;
  resident: {
    apartment_number: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export function PaymentReceiptGenerator() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [condominiumInfo, setCondominiumInfo] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchCondominiumInfo();
      fetchPayments();
    }
  }, [profile?.condominium_id, selectedMonth]);

  const fetchCondominiumInfo = async () => {
    if (!profile?.condominium_id) return;

    try {
      const { data, error } = await supabase
        .from('condominiums')
        .select('name, address, phone, email')
        .eq('id', profile.condominium_id)
        .single();

      if (error) throw error;
      if (data) setCondominiumInfo(data);
    } catch (error) {
      console.error('Error fetching condominium info:', error);
    }
  };

  const fetchPayments = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('payments')
        .select(`
          id,
          resident_id,
          description,
          amount,
          currency,
          payment_date,
          reference_month,
          residents!inner(
            apartment_number,
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .eq('status', 'paid')
        .not('payment_date', 'is', null);

      if (selectedMonth && selectedMonth !== 'all') {
        query = query.eq('reference_month', selectedMonth);
      }

      const { data, error } = await query
        .order('payment_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = data?.map(payment => ({
        ...payment,
        resident: {
          apartment_number: payment.residents.apartment_number,
          profile: {
            first_name: payment.residents.profiles.first_name,
            last_name: payment.residents.profiles.last_name
          }
        }
      })) || [];

      setPayments(transformedData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pagamentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const residentName = `${payment.resident.profile.first_name} ${payment.resident.profile.last_name}`.toLowerCase();
    const apartment = payment.resident.apartment_number.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return residentName.includes(search) || apartment.includes(search) || payment.description.toLowerCase().includes(search);
  });

  const generateReceipt = (payment: PaymentRecord) => {
    const receiptData = {
      recipient: {
        name: `${payment.resident.profile.first_name} ${payment.resident.profile.last_name}`,
        apartment: payment.resident.apartment_number
      },
      description: payment.description,
      amount: payment.amount,
      currency: payment.currency,
      paymentDate: payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: pt }) : undefined
    };

    return (
      <DocumentGenerator
        type="resident_receipt"
        data={receiptData}
        condominiumInfo={condominiumInfo}
        coordinatorName={`${profile?.first_name} ${profile?.last_name}`}
        size="sm"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Comprovativos de Pagamento</h2>
          <p className="text-muted-foreground">
            Gere comprovativos para residentes que efetuaram pagamentos
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do residente, apartamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="month">Mês de Referência</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(new Date().getFullYear(), i, 1);
                    const value = format(date, 'yyyy-MM-dd');
                    const label = format(date, 'MMMM yyyy', { locale: pt });
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fetchPayments} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Pagamentos Efetuados ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando pagamentos...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-muted-foreground">
                Não há pagamentos que correspondam aos critérios selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/20 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">
                        {payment.resident.profile.first_name} {payment.resident.profile.last_name}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        Apt. {payment.resident.apartment_number}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-primary">
                        {payment.amount.toFixed(2)} {payment.currency}
                      </span>
                      <span className="text-muted-foreground">
                        Pago em: {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: pt }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {generateReceipt(payment)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}