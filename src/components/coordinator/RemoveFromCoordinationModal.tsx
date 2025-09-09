import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMinus, Home, User, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoordinationMember {
  id: string;
  apartment_number: string;
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
    coordination_staff_id: string;
  };
}

interface RemoveFromCoordinationModalProps {
  members: CoordinationMember[];
  onRemovalSuccess: () => void;
}

export const RemoveFromCoordinationModal = ({ members, onRemovalSuccess }: RemoveFromCoordinationModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRemove = async () => {
    if (!selectedMember) return;

    const member = members.find(m => m.id === selectedMember);
    if (!member) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('remove_from_coordination', {
        _coordination_staff_id: member.profile.coordination_staff_id
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      toast({
        title: "Membro removido",
        description: "Membro removido da coordenação com sucesso!"
      });

      // Force refresh
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      setSelectedMember("");
      setIsOpen(false);
      onRemovalSuccess();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover membro",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMemberData = members.find(m => m.id === selectedMember);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <UserMinus className="h-4 w-4 mr-2" />
          Remover da Coordenação
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Remover Membro da Coordenação</DialogTitle>
          <DialogDescription>
            Selecione um membro para remover da coordenação. Esta ação removerá todos os acessos especiais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aviso */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Atenção</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">
              Esta ação removerá permanentemente o acesso às funcionalidades de coordenação.
            </p>
          </div>

          {/* Seleção do Membro */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Membro da Coordenação</label>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum membro da coordenação disponível para remoção.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMember === member.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {member.profile.first_name} {member.profile.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <Home className="h-3 w-3" />
                          <span>Apartamento {member.apartment_number}</span>
                        </div>
                        {member.profile.phone && (
                          <div className="text-sm text-muted-foreground">
                            📞 {member.profile.phone}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">
                        Coordenação
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRemove}
              variant="destructive"
              disabled={isLoading || !selectedMember}
            >
              {isLoading ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};