-- Adicionar campos de banco e destinatário para os IBANs
ALTER TABLE public.condominiums 
ADD COLUMN banco_quota_normal text,
ADD COLUMN destinatario_quota_normal text,
ADD COLUMN banco_contribuicoes_especificas text,
ADD COLUMN destinatario_contribuicoes_especificas text;