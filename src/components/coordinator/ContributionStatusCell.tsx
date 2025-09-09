import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSpecificContributions } from '@/hooks/useSpecificContributions';

interface ContributionStatusCellProps {
  contributionId: string;
  currentStatus: string;
  currentPaymentDate?: string;
  residentName: string;
}

export function ContributionStatusCell({ 
  contributionId, 
  currentStatus, 
  currentPaymentDate,
  residentName 
}: ContributionStatusCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(
    currentPaymentDate ? new Date(currentPaymentDate) : undefined
  );
  const [showDateDialog, setShowDateDialog] = useState(false);
  const { updateContributionStatus, loading } = useSpecificContributions();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    
    if (status === 'paid' && !paymentDate) {
      setShowDateDialog(true);
    } else {
      handleSave(status);
    }
  };

  const handleSave = async (status: string = newStatus) => {
    try {
      const paymentDateStr = status === 'paid' && paymentDate 
        ? format(paymentDate, 'yyyy-MM-dd') 
        : undefined;
        
      await updateContributionStatus(contributionId, status, paymentDateStr);
      setIsEditing(false);
      setShowDateDialog(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCancel = () => {
    setNewStatus(currentStatus);
    setPaymentDate(currentPaymentDate ? new Date(currentPaymentDate) : undefined);
    setIsEditing(false);
    setShowDateDialog(false);
  };

  const handleDateConfirm = () => {
    if (paymentDate) {
      handleSave('paid');
    }
  };

  if (isEditing) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Select value={newStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleSave()}
            disabled={loading}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Data do Pagamento</DialogTitle>
              <DialogDescription>
                Selecione a data do pagamento para {residentName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? (
                      format(paymentDate, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleDateConfirm}
                  disabled={!paymentDate || loading}
                >
                  {loading ? 'Salvando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Badge 
      variant={getStatusBadgeVariant(currentStatus)}
      className="cursor-pointer hover:opacity-80"
      onClick={() => setIsEditing(true)}
    >
      {getStatusLabel(currentStatus)}
    </Badge>
  );
}