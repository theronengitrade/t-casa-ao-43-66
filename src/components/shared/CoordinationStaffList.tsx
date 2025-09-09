import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Phone, 
  Calendar,
  Shield,
  DollarSign,
  Wrench,
  FileText,
  UserCog,
  Building2
} from "lucide-react";
import { useCoordinationStaff } from "@/hooks/useCoordinationStaff";

const roleLabels = {
  coordinator: "Coordenador",
  financial: "Financeiro", 
  security: "Segurança",
  maintenance: "Manutenção",
  administration: "Administração",
  secretary: "Secretaria"
};

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

export const CoordinationStaffList = () => {
  const { members, loading } = useCoordinationStaff();

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Membros da Coordenação</span>
        </CardTitle>
        <CardDescription>
          Equipa responsável pela gestão do condomínio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum membro da coordenação registado
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role];
              return (
                <Card key={member.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.position}</p>
                      </div>
                      <Badge variant={roleColors[member.role]} className="flex items-center space-x-1">
                        <RoleIcon className="h-3 w-3" />
                        <span>{roleLabels[member.role]}</span>
                      </Badge>
                    </div>
                    
                    {member.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Desde {new Date(member.assigned_date).toLocaleDateString('pt-PT')}</span>
                    </div>
                    
                    {member.has_system_access && (
                      <Badge variant="outline" className="text-xs w-fit">
                        <Shield className="h-3 w-3 mr-1" />
                        Acesso ao Sistema
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};