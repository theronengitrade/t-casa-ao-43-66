import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Home, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { roleLabels, type CoordinationMemberFormData } from "@/lib/validations/coordinationMember";

interface Resident {
  id: string;
  apartment_number: string;
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
    coordination_staff_id: string | null;
  };
}

type CoordinationRole = 'coordinator' | 'financial' | 'security' | 'maintenance' | 'administration' | 'secretary';

interface PromotionResult {
  success: boolean;
  error?: string;
  coordination_staff_id?: string;
  message?: string;
}

interface PromoteResidentModalProps {
  residents: Resident[];
  onPromotionSuccess: () => void;
}

export const PromoteResidentModal = ({ residents, onPromotionSuccess }: PromoteResidentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string>("");
  const [role, setRole] = useState<CoordinationRole | "">("");
  const [position, setPosition] = useState<string>("");
  const [hasSystemAccess, setHasSystemAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Filter residents who are not already coordination members
  const availableResidents = residents.filter(
    resident => !resident.profile.coordination_staff_id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !role || !position) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('promote_resident_to_coordination', {
        _resident_id: selectedResident,
        _role: role as CoordinationRole,
        _position: position,
        _has_system_access: hasSystemAccess
      });

      if (error) throw error;

      const result = data as unknown as PromotionResult;
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      toast({
        title: "Residente promovido",
        description: "Residente promovido com sucesso à coordenação!"
      });

      // Force profile refresh for all users to sync coordination status
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      // Reset form
      setSelectedResident("");
      setRole("");
      setPosition("");
      setHasSystemAccess(true);
      setIsOpen(false);
      onPromotionSuccess();
    } catch (error: any) {
      console.error('Error promoting resident:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao promover residente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedResidentData = availableResidents.find(r => r.id === selectedResident);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Promover Residente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Promover Residente à Coordenação</DialogTitle>
          <DialogDescription>
            Selecione um residente para promover a membro da coordenação com acesso específico às funcionalidades do sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Residente */}
          <div className="space-y-2">
            <Label htmlFor="resident">Residente *</Label>
            <Select value={selectedResident} onValueChange={setSelectedResident}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um residente" />
              </SelectTrigger>
              <SelectContent>
                {availableResidents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{resident.apartment_number}</span>
                      <span>-</span>
                      <span>{resident.profile.first_name} {resident.profile.last_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableResidents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todos os residentes já são membros da coordenação ou não há residentes disponíveis.
              </p>
            )}
          </div>

          {/* Preview do residente selecionado */}
          {selectedResidentData && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {selectedResidentData.profile.first_name} {selectedResidentData.profile.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center space-x-2">
                    <Home className="h-3 w-3" />
                    <span>Apartamento {selectedResidentData.apartment_number}</span>
                  </div>
                  {selectedResidentData.profile.phone && (
                    <div className="text-sm text-muted-foreground">
                      📞 {selectedResidentData.profile.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Função na Coordenação */}
          <div className="space-y-2">
            <Label htmlFor="role">Função na Coordenação *</Label>
            <Select value={role} onValueChange={(value: CoordinationRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cargo/Posição */}
          <div className="space-y-2">
            <Label htmlFor="position">Cargo/Posição *</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Ex: Responsável Financeiro, Coordenador de Manutenção..."
              disabled={isLoading}
            />
          </div>

          {/* Acesso ao Sistema */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Acesso ao Sistema</Label>
              <p className="text-xs text-muted-foreground">
                Permitir acesso às funcionalidades específicas da coordenação
              </p>
            </div>
            <Switch
              checked={hasSystemAccess}
              onCheckedChange={setHasSystemAccess}
              disabled={isLoading}
            />
          </div>

          {/* Preview das Permissões */}
          {role && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Permissões desta função:</h4>
              <div className="flex flex-wrap gap-1">
                {role === 'coordinator' && <Badge variant="default">Todas as permissões</Badge>}
                {role === 'financial' && (
                  <>
                    <Badge variant="secondary">Pagamentos</Badge>
                    <Badge variant="secondary">Despesas</Badge>
                    <Badge variant="secondary">Relatórios Financeiros</Badge>
                  </>
                )}
                {role === 'security' && (
                  <>
                    <Badge variant="secondary">Visitantes</Badge>
                    <Badge variant="secondary">Códigos QR</Badge>
                    <Badge variant="secondary">Ocorrências</Badge>
                  </>
                )}
                {role === 'maintenance' && (
                  <>
                    <Badge variant="secondary">Planos de Ação</Badge>
                    <Badge variant="secondary">Prestadores de Serviços</Badge>
                    <Badge variant="secondary">Ocorrências</Badge>
                  </>
                )}
                {role === 'administration' && (
                  <>
                    <Badge variant="secondary">Anúncios</Badge>
                    <Badge variant="secondary">Documentos</Badge>
                    <Badge variant="secondary">Reserva de Espaços</Badge>
                    <Badge variant="secondary">Residentes</Badge>
                  </>
                )}
                {role === 'secretary' && (
                  <>
                    <Badge variant="secondary">Anúncios</Badge>
                    <Badge variant="secondary">Documentos</Badge>
                    <Badge variant="secondary">Visitantes</Badge>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="mobile-buttons-container">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedResident || !role || !position}>
              {isLoading ? "Promovendo..." : "Promover"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};