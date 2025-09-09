import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, CheckCircle, XCircle, User, MapPin, Clock, Phone, FileText, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import QrScanner from 'qr-scanner';
import { useVisitorQRCode, QRCodeValidationResult } from '@/hooks/useVisitorQRCode';

export const VisitorQRCodeScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [validationResult, setValidationResult] = useState<QRCodeValidationResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const { scannerLoading, validateQRCode } = useVisitorQRCode();

  // Inicializar scanner
  useEffect(() => {
    const initScanner = async () => {
      if (videoRef.current && !qrScannerRef.current) {
        try {
          // Verificar permissão da câmera
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);

          // Inicializar QrScanner
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            async (result) => {
              await handleScanResult(result.data);
            },
            {
              returnDetailedScanResult: true,
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );

        } catch (error) {
          console.error('Erro ao inicializar scanner:', error);
          setHasPermission(false);
        }
      }
    };

    initScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, []);

  const handleScanResult = async (token: string) => {
    if (scannerLoading) return;

    console.log('QR Code escaneado:', token);
    
    const result = await validateQRCode(token);
    if (result) {
      setValidationResult(result);
      setShowResultDialog(true);
      
      if (result.success) {
        stopScanner();
      }
    }
  };

  const startScanner = async () => {
    if (!qrScannerRef.current || !hasPermission) return;

    try {
      await qrScannerRef.current.start();
      setIsScanning(true);
    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      setHasPermission(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleManualValidation = async () => {
    if (!manualToken.trim()) return;

    const result = await validateQRCode(manualToken.trim());
    if (result) {
      setValidationResult(result);
      setShowResultDialog(true);
      setManualToken('');
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-8 w-8 text-green-500" />
    ) : (
      <XCircle className="h-8 w-8 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Scanner de Câmera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner de QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPermission === false && (
            <Alert>
              <AlertDescription>
                Permissão da câmera necessária para escanear QR Codes. 
                Verifique as configurações do navegador e recarregue a página.
              </AlertDescription>
            </Alert>
          )}

          {hasPermission === true && (
            <>
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Camera className="h-16 w-16 text-white/70" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!isScanning ? (
                  <Button 
                    onClick={startScanner} 
                    className="flex-1"
                    disabled={scannerLoading}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Iniciar Scanner
                  </Button>
                ) : (
                  <Button 
                    onClick={stopScanner} 
                    variant="destructive" 
                    className="flex-1"
                  >
                    <CameraOff className="mr-2 h-4 w-4" />
                    Parar Scanner
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Entrada Manual */}
      <Card>
        <CardHeader>
          <CardTitle>Validação Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-token">Token do QR Code</Label>
            <Input
              id="manual-token"
              placeholder="Cole ou digite o token aqui..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualValidation();
                }
              }}
            />
          </div>

          <Button 
            onClick={handleManualValidation}
            disabled={!manualToken.trim() || scannerLoading}
            className="w-full"
          >
            {scannerLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Validando...
              </>
            ) : (
              'Validar Token'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de Resultado */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {validationResult?.success ? 'Entrada Autorizada' : 'Acesso Negado'}
            </DialogTitle>
          </DialogHeader>
          
          {validationResult && (
            <div className="space-y-4">
              {/* Status */}
              <div className={`p-4 rounded-lg border ${getStatusColor(validationResult.success)}`}>
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(validationResult.success)}
                </div>
                
                {validationResult.success ? (
                  <div className="text-center space-y-2">
                    <p className="font-medium text-green-700">
                      QR Code válido! Entrada registrada com sucesso.
                    </p>
                    {validationResult.visitor && (
                      <p className="text-sm text-green-600">
                        Entrada registrada em {format(new Date(validationResult.visitor.entry_time), 'dd/MM/yyyy às HH:mm', { locale: pt })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-medium text-red-700">
                      {validationResult.error || 'QR Code inválido'}
                    </p>
                    {validationResult.code && (
                      <Badge variant="destructive" className="mt-2">
                        {validationResult.code}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Dados do Visitante (se sucesso) */}
              {validationResult.success && validationResult.visitor && (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Dados do Visitante</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{validationResult.visitor.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        Apartamento {validationResult.visitor.apartment_number} - {validationResult.visitor.resident_name}
                      </span>
                    </div>
                    
                    {validationResult.visitor.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{validationResult.visitor.phone}</span>
                      </div>
                    )}
                    
                    {validationResult.visitor.document_number && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Doc: {validationResult.visitor.document_number}</span>
                      </div>
                    )}
                    
                    {validationResult.visitor.purpose && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <span>{validationResult.visitor.purpose}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações do QR Code (se sucesso) */}
              {validationResult.success && validationResult.qrcode && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      Criado em: {format(new Date(validationResult.qrcode.created_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      Usado em: {format(new Date(validationResult.qrcode.used_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setShowResultDialog(false)}
                className="w-full"
                variant={validationResult.success ? "default" : "destructive"}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};