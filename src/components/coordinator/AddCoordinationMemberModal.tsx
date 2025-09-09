import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CoordinationMemberForm } from "./CoordinationMemberForm";
import { CoordinationMemberFormData } from "@/lib/validations/coordinationMember";
import { useCoordinationStaff, CreateCoordinationMemberData } from "@/hooks/useCoordinationStaff";

export function AddCoordinationMemberModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { createMember } = useCoordinationStaff();

  const handleSubmit = async (data: CoordinationMemberFormData) => {
    try {
      const memberData: CreateCoordinationMemberData = {
        name: data.name,
        position: data.position,
        phone: data.phone || undefined,
        role: data.role,
        has_system_access: data.has_system_access,
        assigned_date: new Date().toISOString().split('T')[0]
      };

      await createMember(memberData);
      setIsOpen(false);
    } catch (error) {
      // Error já tratado no hook
      throw error;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto z-[9998]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Adicionar Membro da Coordenação</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo membro da equipa. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        
        <CoordinationMemberForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Adicionar"
        />
      </DialogContent>
    </Dialog>
  );
}