import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Link2, 
  RefreshCw, 
  Copy, 
  Users, 
  Building2,
  QrCode,
  Eye,
  Search,
  AlertCircle
} from "lucide-react";

interface Condominium {
  id: string;
  name: string;
  address: string;
  resident_linking_code: string;
  created_at: string;
  _count?: {
    residents: number;
  };
}

interface RegenerationResult {
  success: boolean;
  old_code?: string;
  new_code?: string;
  attempts?: number;
  error?: string;
  message?: string;
}

const LinkingCodeManagement = () => {
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCondominium, setSelectedCondominium] = useState<Condominium | null>(null);
  const { toast } = useToast();

  const fetchCondominiums = async () => {
    try {
      setLoading(true);
      
      // Fetch condominiums with resident count
      const { data: condosData, error: condosError } = await supabase
        .from('condominiums')
        .select('*')
        .order('created_at', { ascending: false });

      if (condosError) throw condosError;

      // Get resident counts for each condominium
      const condosWithCounts = await Promise.all(
        condosData.map(async (condo) => {
          const { count } = await supabase
            .from('residents')
            .select('*', { count: 'exact', head: true })
            .eq('condominium_id', condo.id);

          return {
            ...condo,
            _count: { residents: count || 0 }
          };
        })
      );

      setCondominiums(condosWithCounts);
    } catch (error: any) {
      console.error('Error fetching condominiums:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os condomínios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateCode = async (condominiumId: string) => {
    try {
      console.log('🔄 [Admin] Regenerating linking code for condominium:', condominiumId);
      
      // Usar função de regeneração centralizada e segura
      const { data: result, error } = await supabase.rpc(
        'regenerate_linking_code',
        { _condominium_id: condominiumId }
      );

      if (error) {
        console.error('❌ [Admin] RPC error:', error);
        throw error;
      }

      const regenerationResult = result as unknown as RegenerationResult;

      if (!regenerationResult?.success) {
        console.error('❌ [Admin] Regeneration failed:', regenerationResult);
        throw new Error(regenerationResult?.error || 'Falha na regeneração do código');
      }

      console.log('✅ [Admin] Code regenerated successfully:', {
        old: regenerationResult.old_code,
        new: regenerationResult.new_code,
        attempts: regenerationResult.attempts
      });

      toast({
        title: "✅ Código regenerado com sucesso",
        description: `Novo código: ${regenerationResult.new_code} (${regenerationResult.attempts} tentativas)`
      });

      fetchCondominiums();
    } catch (error: any) {
      console.error('❌ [Admin] Error regenerating code:', error);
      toast({
        title: "Erro ao regenerar código",
        description: error.message || "Erro interno na regeneração",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`
    });
  };

  useEffect(() => {
    fetchCondominiums();
  }, []);

  const filteredCondominiums = condominiums.filter(condo =>
    condo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condo.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condo.resident_linking_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Códigos de Ligação</h2>
          <p className="text-muted-foreground">
            Gerir códigos de ligação para registo de moradores
          </p>
        </div>
        <Button onClick={fetchCondominiums} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Pesquisar Condomínios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Pesquisar por nome, endereço ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Badge variant="secondary">
              {filteredCondominiums.length} de {condominiums.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{condominiums.length}</p>
                <p className="text-sm text-muted-foreground">Condomínios Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {condominiums.reduce((sum, condo) => sum + (condo._count?.residents || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Moradores Registados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Link2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{condominiums.length}</p>
                <p className="text-sm text-muted-foreground">Códigos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Condominiums Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Condomínios e Códigos</CardTitle>
          <CardDescription>
            Códigos de ligação para registo automático de moradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">A carregar...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Código de Ligação</TableHead>
                  <TableHead>Moradores</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCondominiums.map((condo) => (
                  <TableRow key={condo.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{condo.name}</p>
                        <p className="text-sm text-muted-foreground">{condo.address}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono text-base px-3 py-1 tracking-wider bg-background">
                          {condo.resident_linking_code}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(condo.resident_linking_code, "Código de ligação")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {condo._count?.residents || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(condo.created_at).toLocaleDateString('pt-PT')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCondominium(condo)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <QrCode className="h-5 w-5" />
                                <span>Código de Ligação - {selectedCondominium?.name}</span>
                              </DialogTitle>
                            </DialogHeader>
                            
                            {selectedCondominium && (
                              <div className="space-y-6">
                                 <div className="text-center p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-dashed border-primary/20">
                                   <div className="text-5xl font-mono font-bold mb-3 text-primary tracking-[0.2em] select-all">
                                     {selectedCondominium.resident_linking_code}
                                   </div>
                                   <p className="text-muted-foreground mb-3">
                                     Código para registo de moradores
                                   </p>
                                   <p className="text-xs text-muted-foreground">
                                     💡 Clique no código para selecioná-lo facilmente
                                   </p>
                                 </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Condomínio</Label>
                                    <p className="font-medium">{selectedCondominium.name}</p>
                                  </div>
                                  <div>
                                    <Label>Moradores Registados</Label>
                                    <p className="font-medium">{selectedCondominium._count?.residents || 0}</p>
                                  </div>
                                </div>

                                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                                    <div>
                                      <h4 className="font-medium text-orange-800 dark:text-orange-200">
                                        Instruções para Moradores
                                      </h4>
                                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                        Os moradores devem usar este código no registo da conta. 
                                        O código liga automaticamente o morador ao condomínio correto.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => copyToClipboard(selectedCondominium.resident_linking_code, "Código")}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copiar Código
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => regenerateCode(selectedCondominium.id)}
                                    className="flex-1"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Regenerar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateCode(condo.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Regenerar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredCondominiums.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum condomínio encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os termos de pesquisa ou crie um novo condomínio.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkingCodeManagement;