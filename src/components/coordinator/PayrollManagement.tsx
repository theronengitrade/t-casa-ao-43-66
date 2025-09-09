import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calculator, 
  Calendar, 
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Edit,
  CheckCircle,
  Clock,
  Plus
} from "lucide-react";
import { usePayrollManagement } from "@/hooks/usePayrollManagement";
import { formatCurrency } from "@/lib/currency";

const PayrollManagement = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editingPayroll, setEditingPayroll] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { 
    payrollEntries, 
    loading, 
    generating,
    fetchPayrollEntries,
    generateMonthlyPayroll,
    updatePayrollEntry,
    processPayment,
    getPayrollStats
  } = usePayrollManagement();

  const currentMonthEntries = payrollEntries.filter(
    entry => entry.reference_month === selectedMonth + '-01'
  );

  const stats = getPayrollStats(selectedMonth + '-01');

  const handleGeneratePayroll = async () => {
    await generateMonthlyPayroll(selectedMonth + '-01');
  };

  const handleEditPayroll = (entry: any) => {
    setEditingPayroll(entry);
    setShowEditDialog(true);
  };

  const handleUpdatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;

    try {
      await updatePayrollEntry(editingPayroll.id, {
        base_salary: editingPayroll.base_salary,
        allowances: editingPayroll.allowances,
        overtime_hours: editingPayroll.overtime_hours,
        overtime_rate: editingPayroll.overtime_rate,
        overtime_amount: editingPayroll.overtime_hours * editingPayroll.overtime_rate,
        deductions: editingPayroll.deductions,
        social_security_deduction: editingPayroll.social_security_deduction,
        income_tax_deduction: editingPayroll.income_tax_deduction,
        other_deductions: editingPayroll.other_deductions,
        notes: editingPayroll.notes
      });
      setShowEditDialog(false);
      setEditingPayroll(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleProcessPayment = async (payrollId: string) => {
    await processPayment(payrollId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">A carregar folha de pagamento...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Funcionários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalNet)}</p>
                <p className="text-xs text-muted-foreground">Salário Líquido Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalDeductions)}</p>
                <p className="text-xs text-muted-foreground">Descontos Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.paidCount}/{stats.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Pagamentos Feitos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Folha de Pagamento</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthStr = date.toISOString().slice(0, 7);
                    return (
                      <SelectItem key={monthStr} value={monthStr}>
                        {date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleGeneratePayroll}
                disabled={generating || currentMonthEntries.length > 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {generating ? 'A Gerar...' : 'Gerar Folha'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Gestão da folha de pagamento mensal dos funcionários
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentMonthEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma folha de pagamento encontrada para este mês</p>
              <p className="text-sm">Clique em "Gerar Folha" para criar automaticamente</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Salário Base</TableHead>
                    <TableHead>Subsídios</TableHead>
                    <TableHead>Horas Extra</TableHead>
                    <TableHead>Descontos</TableHead>
                    <TableHead>Líquido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMonthEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{entry.employee?.name}</div>
                          <div className="text-sm text-muted-foreground">{entry.employee?.position}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(entry.base_salary)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {entry.allowances > 0 ? formatCurrency(entry.allowances) : '-'}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {entry.overtime_hours > 0 && (
                            <>
                              <div className="text-sm">{entry.overtime_hours}h</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(entry.overtime_amount)}
                              </div>
                            </>
                          )}
                          {entry.overtime_hours === 0 && '-'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>SS: {formatCurrency(entry.social_security_deduction)}</div>
                          <div>IRT: {formatCurrency(entry.income_tax_deduction)}</div>
                          {entry.other_deductions > 0 && (
                            <div>Outros: {formatCurrency(entry.other_deductions)}</div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-bold text-green-600">
                          {formatCurrency(entry.net_salary)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={entry.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {entry.payment_status === 'paid' ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pago
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </div>
                          )}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayroll(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {entry.payment_status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessPayment(entry.id)}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Payroll Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Folha de Pagamento</DialogTitle>
            <DialogDescription>
              Ajustar valores da folha de pagamento de {editingPayroll?.employee?.name}
            </DialogDescription>
          </DialogHeader>
          
          {editingPayroll && (
            <form onSubmit={handleUpdatePayroll} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salário Base</Label>
                  <Input
                    type="number"
                    value={editingPayroll.base_salary}
                    onChange={(e) => setEditingPayroll({
                      ...editingPayroll,
                      base_salary: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subsídios</Label>
                  <Input
                    type="number"
                    value={editingPayroll.allowances}
                    onChange={(e) => setEditingPayroll({
                      ...editingPayroll,
                      allowances: Number(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Horas Extra</Label>
                  <Input
                    type="number"
                    value={editingPayroll.overtime_hours}
                    onChange={(e) => setEditingPayroll({
                      ...editingPayroll,
                      overtime_hours: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxa Hora Extra</Label>
                  <Input
                    type="number"
                    value={editingPayroll.overtime_rate}
                    onChange={(e) => setEditingPayroll({
                      ...editingPayroll,
                      overtime_rate: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Horas Extra</Label>
                  <Input
                    type="number"
                    value={editingPayroll.overtime_hours * editingPayroll.overtime_rate}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Segurança Social</Label>
                  <Input
                    type="number"
                    value={editingPayroll.social_security_deduction}
                    onChange={(e) => setEditingPayroll({
                      ...editingPayroll,
                      social_security_deduction: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IRT</Label>
                  <Input
                    type="number"
                    value={editingPayroll.income_tax_deduction}
                    onChange={(e) => setEditingPayroll({
                      ...editingPayroll,
                      income_tax_deduction: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outros Descontos</Label>
                  <Input
                    type="number"
                    value={editingPayroll.other_deductions}
                    onChange={(e) => setEditingPayroll({
                      ...editingPayroll,
                      other_deductions: Number(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={editingPayroll.notes || ''}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                    notes: e.target.value
                  })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Atualizar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollManagement;