import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { RemanescenteData } from "@/hooks/useRemanescenteAnual";
import { formatCurrency, CurrencyType } from "@/lib/currency";

interface RemanescenteCardProps {
  data: RemanescenteData;
  currency: CurrencyType;
}

export const RemanescenteCard = ({ data, currency }: RemanescenteCardProps) => {
  const saldoPositivo = data.saldo_disponivel >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Receita Atual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita {data.ano_atual}</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.receita_atual, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Quotas recebidas no ano
          </p>
        </CardContent>
      </Card>

      {/* Despesas Atual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas {data.ano_atual}</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.despesas_aprovadas || data.despesas_atual || 0, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Gastos realizados no ano
          </p>
        </CardContent>
      </Card>

      {/* Remanescente de Anos Anteriores */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remanescente</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(data.remanescente_total, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Disponível de anos anteriores
          </p>
        </CardContent>
      </Card>

      {/* Saldo Total Disponível */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
          <DollarSign className={`h-4 w-4 ${saldoPositivo ? 'text-green-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${saldoPositivo ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.saldo_disponivel, currency)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={saldoPositivo ? "default" : "destructive"}>
              {saldoPositivo ? "Positivo" : "Negativo"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Total disponível
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};