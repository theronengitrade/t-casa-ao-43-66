import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Receipt, FileCheck } from "lucide-react";
import { format } from "date-fns";

interface DocumentGeneratorProps {
  type: 'service_receipt' | 'resident_receipt' | 'service_acceptance';
  data: {
    recipient: {
      name: string;
      nif?: string;
      address?: string;
      apartment?: string;
    };
    description: string;
    amount: number;
    currency: string;
    paymentMethod?: string;
    paymentDate?: string;
    startDate?: string;
    completionDate?: string;
    observations?: string;
  };
  condominiumInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  coordinatorName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function DocumentGenerator({ 
  type, 
  data, 
  condominiumInfo, 
  coordinatorName,
  variant = "outline",
  size = "sm",
  className = ""
}: DocumentGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateDocument = async () => {
    try {
      setLoading(true);
      
      const { ReportGenerator } = await import("@/lib/reportGenerator");
      const reportGenerator = new ReportGenerator();
      
      const receiptNumber = `${type.toUpperCase()}-${Date.now()}`;
      const currentDate = format(new Date(), 'dd/MM/yyyy');
      
      const receiptData = {
        receiptNumber,
        date: currentDate,
        condominiumInfo: {
          ...condominiumInfo,
          logo: undefined // Add logo path if available
        },
        recipient: data.recipient,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        coordinatorName,
        startDate: data.startDate,
        completionDate: data.completionDate,
        observations: data.observations
      };

      let filename = '';
      let documentTitle = '';

      switch (type) {
        case 'service_receipt':
          await reportGenerator.generateServiceProviderReceipt(receiptData);
          filename = `recibo-prestador-${receiptNumber}.pdf`;
          documentTitle = 'Recibo de Pagamento';
          break;
        
        case 'resident_receipt':
          await reportGenerator.generateResidentReceipt(receiptData);
          filename = `comprovativo-residente-${receiptNumber}.pdf`;
          documentTitle = 'Comprovativo de Pagamento';
          break;
        
        case 'service_acceptance':
          await reportGenerator.generateServiceAcceptanceReport(receiptData);
          filename = `termo-aceitacao-${receiptNumber}.pdf`;
          documentTitle = 'Termo de Aceitação';
          break;
        
        default:
          throw new Error('Tipo de documento não suportado');
      }

      reportGenerator.save(filename);
      
      toast({
        title: "Documento Gerado",
        description: `${documentTitle} gerado e baixado com sucesso!`
      });

    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar documento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'service_receipt':
        return Receipt;
      case 'resident_receipt':
        return FileCheck;
      case 'service_acceptance':
        return FileText;
      default:
        return FileText;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'service_receipt':
        return 'Recibo';
      case 'resident_receipt':
        return 'Comprovativo';
      case 'service_acceptance':
        return 'Termo';
      default:
        return 'Documento';
    }
  };

  const IconComponent = getIcon();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={generateDocument}
      disabled={loading}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <IconComponent className="h-4 w-4 mr-2" />
      )}
      {loading ? 'Gerando...' : `Gerar ${getLabel()}`}
    </Button>
  );
}