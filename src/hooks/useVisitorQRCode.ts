import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export interface VisitorQRCodeData {
  id: string;
  visitor_id: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at?: string;
  visitor_name: string;
  apartment_number: string;
  resident_name: string;
}

export interface QRCodeValidationResult {
  success: boolean;
  error?: string;
  code?: string;
  visitor?: {
    id: string;
    name: string;
    phone?: string;
    document_number?: string;
    purpose?: string;
    apartment_number: string;
    resident_name: string;
    entry_time: string;
  };
  qrcode?: {
    id: string;
    created_at: string;
    expires_at: string;
    used_at: string;
  };
}

export const useVisitorQRCode = () => {
  const [loading, setLoading] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);

  // Gerar QR Code para visitante
  const generateQRCode = async (
    visitorId: string,
    expirationHours: number = 12
  ): Promise<{ qrCodeUrl: string; token: string } | null> => {
    setLoading(true);
    
    try {
      // 1. Obter dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      // 2. Obter condomínio do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('condominium_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.condominium_id) {
        toast.error('Erro ao obter dados do condomínio');
        return null;
      }

      // 3. Gerar token único
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_visitor_qrcode_token');

      if (tokenError || !tokenData) {
        console.error('Erro ao gerar token:', tokenError);
        toast.error('Erro ao gerar token único');
        return null;
      }

      // 4. Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      // 5. Inserir registro do QR Code
      const { error: insertError } = await supabase
        .from('visitor_qrcodes')
        .insert({
          visitor_id: visitorId,
          condominium_id: profile.condominium_id,
          created_by: user.id,
          token: tokenData,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error('Erro ao inserir QR Code:', insertError);
        toast.error('Erro ao gerar QR Code');
        return null;
      }

      // 6. Gerar imagem do QR Code
      const qrCodeUrl = await QRCode.toDataURL(tokenData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      toast.success('QR Code gerado com sucesso!');
      
      return { 
        qrCodeUrl, 
        token: tokenData 
      };

    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro inesperado ao gerar QR Code');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Validar e processar QR Code escaneado
  const validateQRCode = async (token: string): Promise<QRCodeValidationResult | null> => {
    setScannerLoading(true);
    
    try {
      // 1. Obter dados do usuário atual (porteiro)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      // 2. Obter condomínio do porteiro
      const { data: profile } = await supabase
        .from('profiles')
        .select('condominium_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.condominium_id) {
        toast.error('Erro ao obter dados do condomínio');
        return null;
      }

      // 3. Validar QR Code através da função do banco de dados
      const { data: validationResult, error } = await supabase
        .rpc('validate_and_process_visitor_qrcode', {
          _token: token,
          _scanner_condominium_id: profile.condominium_id,
        });

      if (error) {
        console.error('Erro na validação:', error);
        toast.error('Erro ao validar QR Code');
        return null;
      }

      const result = validationResult as unknown as QRCodeValidationResult;

      if (result.success) {
        toast.success('QR Code validado com sucesso! Entrada registrada.');
      } else {
        toast.error(result.error || 'QR Code inválido');
      }

      return result;

    } catch (error) {
      console.error('Erro ao validar QR Code:', error);
      toast.error('Erro inesperado ao validar QR Code');
      return null;
    } finally {
      setScannerLoading(false);
    }
  };

  // Buscar QR Codes ativos de um visitante
  const getActiveQRCodes = async (visitorId: string): Promise<VisitorQRCodeData[]> => {
    try {
      const { data, error } = await supabase
        .from('visitor_qrcodes')
        .select(`
          id,
          visitor_id,
          token,
          expires_at,
          used_at,
          visitors!inner(
            name,
            residents!inner(
              apartment_number,
              profiles!inner(
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('visitor_id', visitorId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar QR Codes:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        visitor_id: item.visitor_id,
        token: item.token,
        expires_at: item.expires_at,
        used_at: item.used_at,
        visitor_name: (item.visitors as any)?.name || '',
        apartment_number: (item.visitors as any)?.residents?.apartment_number || '',
        resident_name: `${(item.visitors as any)?.residents?.profiles?.first_name || ''} ${(item.visitors as any)?.residents?.profiles?.last_name || ''}`.trim(),
      })) || [];

    } catch (error) {
      console.error('Erro ao buscar QR Codes:', error);
      return [];
    }
  };

  return {
    loading,
    scannerLoading,
    generateQRCode,
    validateQRCode,
    getActiveQRCodes,
  };
};