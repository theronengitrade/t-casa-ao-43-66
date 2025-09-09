import React, { useState } from 'react';
import { Clock, QrCode, User, MapPin, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useVisitorQRCode } from '@/hooks/useVisitorQRCode';

interface Visitor {
  id: string;
  name: string;
  phone?: string;
  document_number?: string;
  purpose?: string;
  visit_date: string;
  residents: {
    apartment_number: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface VisitorQRCodeGeneratorProps {
  visitors: Visitor[];
}

export const VisitorQRCodeGenerator: React.FC<VisitorQRCodeGeneratorProps> = ({
  visitors,
}) => {
  const [selectedVisitor, setSelectedVisitor] = useState<string>('');
  const [expirationHours, setExpirationHours] = useState<number>(12);
  const [qrCodeData, setQRCodeData] = useState<{
    url: string;
    token: string;
    visitor: Visitor;
  } | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);

  const { loading, generateQRCode } = useVisitorQRCode();

  const handleGenerateQRCode = async () => {
    if (!selectedVisitor) {
      toast.error('Selecione um visitante');
      return;
    }

    const visitor = visitors.find(v => v.id === selectedVisitor);
    if (!visitor) {
      toast.error('Visitante não encontrado');
      return;
    }

    const result = await generateQRCode(selectedVisitor, expirationHours);
    if (result) {
      setQRCodeData({
        url: result.qrCodeUrl,
        token: result.token,
        visitor,
      });
      setShowQRDialog(true);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData) return;

    const link = document.createElement('a');
    link.href = qrCodeData.url;
    link.download = `qrcode-${qrCodeData.visitor.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR Code baixado com sucesso!');
  };

  const copyToken = async () => {
    if (!qrCodeData?.token) return;

    try {
      await navigator.clipboard.writeText(qrCodeData.token);
      toast.success('Token copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar token');
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerar QR Code para Visitante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visitor-select">Selecionar Visitante</Label>
            <Select value={selectedVisitor} onValueChange={setSelectedVisitor}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um visitante cadastrado..." />
              </SelectTrigger>
              <SelectContent>
                {visitors.map((visitor) => (
                  <SelectItem key={visitor.id} value={visitor.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{visitor.name}</span>
                      <Badge variant="secondary">
                        Apto {visitor.residents.apartment_number}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVisitor && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              {(() => {
                const visitor = visitors.find(v => v.id === selectedVisitor);
                if (!visitor) return null;
                
                return (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{visitor.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        Apartamento {visitor.residents.apartment_number} - 
                        {visitor.residents.profiles.first_name} {visitor.residents.profiles.last_name}
                      </span>
                    </div>
                    {visitor.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{visitor.phone}</span>
                      </div>
                    )}
                    {visitor.purpose && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{visitor.purpose}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expiration-select">Tempo de Expiração</Label>
            <Select value={expirationHours.toString()} onValueChange={(value) => setExpirationHours(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hora</SelectItem>
                <SelectItem value="2">2 horas</SelectItem>
                <SelectItem value="4">4 horas</SelectItem>
                <SelectItem value="6">6 horas</SelectItem>
                <SelectItem value="12">12 horas (padrão)</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              O QR Code expirará automaticamente após o tempo selecionado
            </p>
          </div>

          <Button 
            onClick={handleGenerateQRCode}
            disabled={!selectedVisitor || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gerando QR Code...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-4 w-4" />
                Gerar QR Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog do QR Code */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code Gerado</DialogTitle>
          </DialogHeader>
          
          {qrCodeData && (
            <div className="space-y-4">
              {/* Informações do Visitante */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{qrCodeData.visitor.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Apartamento {qrCodeData.visitor.residents.apartment_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expira em {expirationHours}h</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <img 
                  src={qrCodeData.url} 
                  alt="QR Code do Visitante" 
                  className="border rounded-lg"
                />
              </div>

              {/* Token */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Token (para referência):
                </Label>
                <div className="p-2 bg-muted rounded text-center font-mono text-xs break-all">
                  {qrCodeData.token}
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={downloadQRCode} variant="outline" size="sm">
                  Baixar QR Code
                </Button>
                <Button onClick={copyToken} variant="outline" size="sm">
                  Copiar Token
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Compartilhe este QR Code com o visitante para facilitar a entrada na portaria.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};