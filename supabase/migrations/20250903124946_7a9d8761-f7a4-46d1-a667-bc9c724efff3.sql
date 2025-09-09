-- Adicionar campos de IBAN à tabela condominiums
ALTER TABLE public.condominiums 
ADD COLUMN iban_quota_normal text,
ADD COLUMN iban_contribuicoes_especificas text;