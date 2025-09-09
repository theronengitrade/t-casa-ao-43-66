import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  UserPlus, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Home,
  Phone,
  Mail,
  User,
  Building2,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { useResidentRegistration } from "@/hooks/useResidentRegistration";
import { useState } from 'react';

interface NewResidentRegistrationProps {
  onClose?: () => void;
}

const NewResidentRegistration = ({ onClose }: NewResidentRegistrationProps) => {
  const {
    registrationData,
    updateData,
    currentStep,
    isLoading,
    validationResult,
    isRegistrationComplete,
    nextStep,
    prevStep,
    reset
  } = useResidentRegistration();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (isRegistrationComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">Registo Concluído!</CardTitle>
          <CardDescription>
            A sua conta foi criada com sucesso. Verifique o seu email para confirmar a conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Enviámos um email de confirmação para <strong>{registrationData.email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Após confirmar o email, poderá fazer login no sistema.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} className="flex-1">
              Voltar ao Login
            </Button>
            <Button onClick={reset} variant="outline" className="flex-1">
              Novo Registo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Registo de Novo Morador
        </CardTitle>
        <CardDescription>
          Passo {currentStep} de 4 - Complete os seus dados para criar a conta
        </CardDescription>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Passo 1: Código de Ligação */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Key className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Código de Ligação</h3>
              <p className="text-sm text-muted-foreground">
                Insira o código fornecido pelo condomínio e o seu apartamento
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="linkingCode">Código de Ligação *</Label>
                <Input
                  id="linkingCode"
                  type="text"
                  placeholder="Ex: a1b2c3d4e5f6g7h8"
                  value={registrationData.linkingCode}
                  onChange={(e) => updateData('linkingCode', e.target.value.toLowerCase())}
                  className="font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  16 caracteres hexadecimais fornecidos pelo condomínio
                </p>
              </div>

              <div>
                <Label htmlFor="apartmentNumber">Número do Apartamento *</Label>
                <Input
                  id="apartmentNumber"
                  type="text"
                  placeholder="Ex: 101, A-301, T2-B"
                  value={registrationData.apartmentNumber}
                  onChange={(e) => updateData('apartmentNumber', e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div>
                <Label htmlFor="floor">Andar</Label>
                <Input
                  id="floor"
                  type="text"
                  placeholder="Ex: 1º, 3º, Rés-do-chão"
                  value={registrationData.floor}
                  onChange={(e) => updateData('floor', e.target.value)}
                />
              </div>
            </div>

            {validationResult && (
              <div className={`p-4 rounded-lg ${validationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center gap-2">
                  {validationResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {validationResult.success ? 'Código Válido!' : 'Código Inválido'}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {validationResult.success 
                    ? `Condomínio: ${validationResult.condominium_name}`
                    : validationResult.error
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Passo 2: Dados Pessoais */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              <p className="text-sm text-muted-foreground">
                Preencha as suas informações pessoais
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Primeiro Nome *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="João"
                  value={registrationData.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Último Nome *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Silva"
                  value={registrationData.lastName}
                  onChange={(e) => updateData('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="joao.silva@email.com"
                  value={registrationData.email}
                  onChange={(e) => updateData('email', e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+244 900 000 000"
                  value={registrationData.phone}
                  onChange={(e) => updateData('phone', e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="familyMembers">Agregado Familiar</Label>
                <Input
                  id="familyMembers"
                  type="number"
                  placeholder="0"
                  value={registrationData.familyMembers}
                  onChange={(e) => updateData('familyMembers', e.target.value)}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número de membros da família
                </p>
              </div>

              <div>
                <Label htmlFor="parkingSpaces">Estacionamento</Label>
                <Input
                  id="parkingSpaces"
                  type="number"
                  placeholder="0"
                  value={registrationData.parkingSpaces}
                  onChange={(e) => updateData('parkingSpaces', e.target.value)}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número de lugares de estacionamento
                </p>
              </div>
            </div>

            {validationResult?.success && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Building2 className="h-5 w-5" />
                  <span className="font-semibold">Condomínio Selecionado</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  {validationResult.condominium_name} - Apartamento {registrationData.apartmentNumber}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Passo 3: Palavra-passe */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Definir Palavra-passe</h3>
              <p className="text-sm text-muted-foreground">
                Crie uma palavra-passe segura para a sua conta
              </p>
            </div>

            <div>
              <Label htmlFor="password">Palavra-passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={registrationData.password}
                  onChange={(e) => updateData('password', e.target.value)}
                  className="pl-9 pr-9"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pelo menos 6 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Palavra-passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repita a palavra-passe"
                  value={registrationData.confirmPassword}
                  onChange={(e) => updateData('confirmPassword', e.target.value)}
                  className="pl-9 pr-9"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {registrationData.password && registrationData.confirmPassword && 
             registrationData.password !== registrationData.confirmPassword && (
              <div className="text-red-600 text-sm">
                As palavras-passe não coincidem
              </div>
            )}
          </div>
        )}

        {/* Passo 4: Resumo */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Resumo do Registo</h3>
              <p className="text-sm text-muted-foreground">
                Verifique os dados antes de finalizar
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Condomínio</h4>
                  <p className="text-sm">{validationResult?.condominium_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Apartamento</h4>
                  <p className="text-sm">{registrationData.apartmentNumber} - {registrationData.floor}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Nome Completo</h4>
                  <p className="text-sm">{registrationData.firstName} {registrationData.lastName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Contactos</h4>
                  <p className="text-sm">{registrationData.email}</p>
                  <p className="text-sm">{registrationData.phone}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Agregado Familiar</h4>
                    <p className="text-sm">{registrationData.familyMembers || 0} membro(s)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Estacionamento</h4>
                    <p className="text-sm">{registrationData.parkingSpaces || 0} lugar(es)</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> Após confirmar, será enviado um email de verificação. 
                  Confirme o email para activar a sua conta.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Navegação */}
        <div className="flex justify-between pt-4">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {onClose && (
              <Button onClick={onClose} variant="ghost">
                Cancelar
              </Button>
            )}
            
            <Button
              onClick={nextStep}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : currentStep === 4 ? (
                <>
                  Finalizar Registo
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewResidentRegistration;