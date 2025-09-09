import React, { useState, useEffect } from 'react';
import { QrCode, Clock, User, MapPin, AlertCircle, Download, Copy, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useVisitorQRCode, VisitorQRCodeData } from '@/hooks/useVisitorQRCode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Visitor {
  id: string;
  name: string;
  phone?: string;
  document_number?: string;
  purpose?: string;
  approved: boolean;
}

export const VisitorQRCodeManagement: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [qrCodes, setQRCodes] = useState<VisitorQRCodeData[]>([]);
  const [loading, setLoading] = useState(true);

  const { generateQRCode, loading: generatingQR } = useVisitorQRCode();

  useEffect(() => {
    fetchVisitorsAndQRCodes();
  }, []);

  const fetchVisitorsAndQRCodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar visitantes aprovados do usuário
      const { data: visitorsData } = await supabase
        .from('visitors')
        .select('id, name, phone, document_number, purpose, approved')
        .eq('resident_id', user.id)
        .eq('approved', true);

      setVisitors(visitorsData || []);

      // Buscar QR Codes ativos
      const { data: qrData } = await supabase
        .from('visitor_qrcodes')
        .select(`
          id,
          visitor_id,
          token,
          expires_at,
          used_at,
          created_at,
          visitors!inner(
            name,
            phone,
            document_number,
            purpose
          )
        `)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (qrData) {
        const formattedQRCodes: VisitorQRCodeData[] = qrData.map(item => ({
          id: item.id,
          visitor_id: item.visitor_id,
          token: item.token,
          expires_at: item.expires_at,
          used_at: item.used_at,
          visitor_name: (item.visitors as any)?.name || '',
          apartment_number: '',
          resident_name: '',
        }));
        setQRCodes(formattedQRCodes);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (visitorId: string, hours: number = 12) => {
    const result = await generateQRCode(visitorId, hours);
    if (result) {
      await fetchVisitorsAndQRCodes();
      return result;
    }
  };

  const handleDeleteQRCode = async (qrId: string) => {
    if (!confirm('Tem certeza que deseja invalidar este QR Code?')) return;

    try {
      const { error } = await supabase
        .from('visitor_qrcodes')
        .delete()
        .eq('id', qrId);

      if (error) throw error;

      toast.success('QR Code invalidado com sucesso');
      await fetchVisitorsAndQRCodes();

    } catch (error) {
      console.error('Erro ao invalidar QR Code:', error);
      toast.error('Erro ao invalidar QR Code');
    }
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copiado!');
    } catch (error) {
      toast.error('Erro ao copiar token');
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    } else {
      return `${minutes}m restantes`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">QR Codes de Visitantes</h2>
        <p className="text-muted-foreground">
          Gere QR Codes temporários para facilitar a entrada de seus visitantes
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Os QR Codes gerados são temporários e podem ser usados apenas uma vez. 
          Compartilhe o código com seu visitante para que ele possa apresentar na portaria.
        </AlertDescription>
      </Alert>

      {/* QR Codes Ativos */}
      {qrCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Codes Ativos ({qrCodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {qrCodes.map((qr) => {
                const visitor = visitors.find(v => v.id === qr.visitor_id);
                const isExpiringSoon = new Date(qr.expires_at).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000; // 2 horas
                
                return (
                  <Card key={qr.id} className={`border ${isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Visitante Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{qr.visitor_name}</span>
                        </div>
                        {visitor?.phone && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Tel: {visitor.phone}
                          </p>
                        )}
                      </div>

                      {/* Status e Tempo */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={isExpiringSoon ? "destructive" : "default"}>
                            {isExpiringSoon ? "Expirando em breve" : "Ativo"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getTimeRemaining(qr.expires_at)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Criado: {format(new Date(qr.created_at || ''), 'dd/MM/yyyy HH:mm', { locale: pt })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Expira: {format(new Date(qr.expires_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Token */}
                      <div className="p-2 bg-muted rounded text-center font-mono text-xs break-all">
                        {qr.token}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToken(qr.token)}
                          className="flex-1"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQRCode(qr.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gerar Novo QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Novo QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          {visitors.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visitors.map((visitor) => (
                <Card key={visitor.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{visitor.name}</span>
                      </div>
                      {visitor.phone && (
                        <p className="text-sm text-muted-foreground">
                          Tel: {visitor.phone}
                        </p>
                      )}
                      {visitor.document_number && (
                        <p className="text-xs text-muted-foreground">
                          Doc: {visitor.document_number}
                        </p>
                      )}
                      {visitor.purpose && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {visitor.purpose}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleGenerateQR(visitor.id, 12)}
                        disabled={generatingQR}
                        size="sm"
                        className="w-full"
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        12h
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleGenerateQR(visitor.id, 4)}
                          disabled={generatingQR}
                          size="sm"
                          variant="outline"
                        >
                          4h
                        </Button>
                        <Button
                          onClick={() => handleGenerateQR(visitor.id, 24)}
                          disabled={generatingQR}
                          size="sm"
                          variant="outline"
                        >
                          24h
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum visitante aprovado disponível.</p>
              <p className="text-sm">
                Primeiro, você precisa ter visitantes cadastrados e aprovados pelo coordenador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};