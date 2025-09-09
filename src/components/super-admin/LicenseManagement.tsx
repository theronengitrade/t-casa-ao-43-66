import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, 
  Building2, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface License {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  condominium: {
    id: string;
    name: string;
  };
}

interface LicenseManagementProps {
  onStatsUpdate: () => void;
}

const LicenseManagement = ({ onStatsUpdate }: LicenseManagementProps) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          id,
          status,
          start_date,
          end_date,
          created_at,
          condominium:condominiums!licenses_condominium_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar licenças",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLicense = async (licenseId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('licenses')
        .update({ status: newStatus })
        .eq('id', licenseId);

      if (error) throw error;

      await fetchLicenses();
      onStatsUpdate();

      toast({
        title: "Licença atualizada",
        description: `Licença ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso`,
      });
    } catch (error) {
      console.error('Error toggling license:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar licença",
        variant: "destructive"
      });
    }
  };

  const handleRenewLicense = async (licenseId: string) => {
    try {
      // Calculate new end date (1 year from current end date or today, whichever is later)
      const currentLicense = licenses.find(l => l.id === licenseId);
      if (!currentLicense) return;

      const currentEndDate = new Date(currentLicense.end_date);
      const today = new Date();
      const startDate = currentEndDate > today ? currentEndDate : today;
      const newEndDate = new Date(startDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      const { error } = await supabase
        .from('licenses')
        .update({ 
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          end_date: newEndDate.toISOString().split('T')[0]
        })
        .eq('id', licenseId);

      if (error) throw error;

      await fetchLicenses();
      onStatsUpdate();

      toast({
        title: "Licença renovada",
        description: "Licença renovada por mais 1 ano",
      });
    } catch (error) {
      console.error('Error renewing license:', error);
      toast({
        title: "Erro",
        description: "Erro ao renovar licença",
        variant: "destructive"
      });
    }
  };

  const getLicenseStatusInfo = (license: License) => {
    const endDate = new Date(license.end_date);
    const now = new Date();
    const daysToExpire = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (license.status === 'paused') {
      return {
        badge: 'secondary',
        label: 'Pausada',
        icon: <Pause className="h-3 w-3" />,
        description: 'Licença pausada pelo administrador'
      };
    }

    if (daysToExpire < 0) {
      return {
        badge: 'destructive',
        label: 'Expirada',
        icon: <AlertTriangle className="h-3 w-3" />,
        description: `Expirou há ${Math.abs(daysToExpire)} dias`
      };
    }

    if (daysToExpire <= 30) {
      return {
        badge: 'outline',
        label: 'A expirar',
        icon: <AlertTriangle className="h-3 w-3" />,
        description: `Expira em ${daysToExpire} dias`
      };
    }

    return {
      badge: 'default',
      label: 'Ativa',
      icon: <CheckCircle className="h-3 w-3" />,
      description: `Expira em ${daysToExpire} dias`
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">A carregar licenças...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Gestão de Licenças</span>
        </CardTitle>
        <CardDescription>
          Controle e renovação de licenças anuais dos condomínios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condomínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Fim</TableHead>
                <TableHead>Dias para Expirar</TableHead>
                <TableHead className="w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const statusInfo = getLicenseStatusInfo(license);
                const endDate = new Date(license.end_date);
                const now = new Date();
                const daysToExpire = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{license.condominium.name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={statusInfo.badge as any} className="flex items-center space-x-1 w-fit">
                          {statusInfo.icon}
                          <span>{statusInfo.label}</span>
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {statusInfo.description}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        {new Date(license.start_date).toLocaleDateString('pt-PT')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        {new Date(license.end_date).toLocaleDateString('pt-PT')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className={`font-medium ${
                        daysToExpire < 0 ? 'text-red-600' :
                        daysToExpire <= 30 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {daysToExpire < 0 ? `${Math.abs(daysToExpire)} dias atrás` : `${daysToExpire} dias`}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleLicense(license.id, license.status)}
                        >
                          {license.status === 'active' ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRenewLicense(license.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Renovar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {licenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma licença encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseManagement;