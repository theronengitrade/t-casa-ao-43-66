import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  Edit,
  Trash2,
  Phone, 
  Calendar,
  Shield,
  DollarSign,
  Wrench,
  FileText,
  UserCog,
  Building2,
  MoreHorizontal
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCoordinationStaff, type CoordinationMember } from "@/hooks/useCoordinationStaff";
import { AddCoordinationMemberModal } from "./AddCoordinationMemberModal";
import { PromoteResidentModal } from "./PromoteResidentModal";
import { CoordinationMemberForm } from "./CoordinationMemberForm";
import { CoordinationMemberFormData, roleLabels } from "@/lib/validations/coordinationMember";
import { useResidentPromotion } from "@/hooks/useResidentPromotion";
import { CoordinationPermissionsDebug } from "./CoordinationPermissionsDebug";

const roleIcons = {
  coordinator: UserCog,
  financial: DollarSign,
  security: Shield,
  maintenance: Wrench,
  administration: Building2,
  secretary: FileText
};

const roleColors = {
  coordinator: "default",
  financial: "secondary",
  security: "destructive", 
  maintenance: "outline",
  administration: "secondary",
  secretary: "outline"
} as const;

export const CoordinationStaffManagement = () => {
  const { members, loading, updateMember, deleteMember, fetchMembers } = useCoordinationStaff();
  const { residents, loading: residentsLoading } = useResidentPromotion();
  const [editingMember, setEditingMember] = useState<CoordinationMember | null>(null);

  const handleEdit = (member: CoordinationMember) => {
    setEditingMember(member);
  };

  const handleUpdate = async (data: CoordinationMemberFormData) => {
    if (!editingMember) return;
    
    try {
      await updateMember(editingMember.id, data);
      setEditingMember(null);
    } catch (error) {
      // Error já tratado no hook
      throw error;
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      try {
        await deleteMember(id);
      } catch (error) {
        // Error já tratado no hook
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">A carregar membros da coordenação...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CoordinationPermissionsDebug />
      
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Gestão da Coordenação</span>
            </CardTitle>
            <CardDescription>
              Gerir membros da equipa de coordenação
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <PromoteResidentModal 
              residents={residents}
              onPromotionSuccess={fetchMembers}
            />
            <AddCoordinationMemberModal />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Acesso Sistema</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role];
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.position}</div>
                        {member.user_id && (
                          <div className="flex items-center space-x-1 text-xs text-green-600">
                            <Shield className="h-3 w-3" />
                            <span>Residente do condomínio</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={roleColors[member.role]} className="flex items-center space-x-1 w-fit">
                        <RoleIcon className="h-3 w-3" />
                        <span>{roleLabels[member.role]}</span>
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {member.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {member.has_system_access ? (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Não</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(member.assigned_date).toLocaleDateString('pt-PT')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[90] bg-background border shadow-md">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(member)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(member.id)}
                            className="text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum membro da coordenação registado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog 
        open={!!editingMember} 
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
      >
        <DialogContent 
          className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto z-[9998]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Membro da Coordenação</DialogTitle>
            <DialogDescription>
              Atualize os dados do membro da equipa. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          
          {editingMember && (
            <CoordinationMemberForm
              onSubmit={handleUpdate}
              onCancel={handleCancelEdit}
              initialData={{
                name: editingMember.name,
                position: editingMember.position,
                phone: editingMember.phone || '',
                role: editingMember.role,
                has_system_access: editingMember.has_system_access
              }}
              submitLabel="Atualizar"
            />
          )}
        </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};