import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Search, Phone, Mail, User, Shield, CheckCircle, XCircle, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceProvider {
  id: string;
  name: string;
  service_type: string;
  contact_person: string;
  phone: string;
  email: string;
  document_number: string;
  is_authorized: boolean;
  created_at: string;
}

interface ResidentServiceProvidersProps {
  profile: any;
}

export default function ResidentServiceProviders({ profile }: ResidentServiceProvidersProps) {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [authFilter, setAuthFilter] = useState("all");

  useEffect(() => {
    fetchProviders();
  }, [profile?.condominium_id]);

  const fetchProviders = async () => {
    if (!profile?.condominium_id) return;

    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar prestadores de serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAuth = authFilter === "all" || 
      (authFilter === "authorized" && provider.is_authorized) ||
      (authFilter === "not_authorized" && !provider.is_authorized);

    return matchesSearch && matchesAuth;
  });

  const authorizedCount = providers.filter(p => p.is_authorized).length;
  const notAuthorizedCount = providers.filter(p => !p.is_authorized).length;

  const serviceTypeStats = providers.reduce((acc, provider) => {
    acc[provider.service_type] = (acc[provider.service_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Prestadores de Serviços</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Prestadores de serviços autorizados no condomínio
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{providers.length}</p>
                <p className="text-sm text-muted-foreground">Total de Prestadores</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{authorizedCount}</p>
                <p className="text-sm text-muted-foreground">Autorizados</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{notAuthorizedCount}</p>
                <p className="text-sm text-muted-foreground">Não Autorizados</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {Object.keys(serviceTypeStats).length}
                </p>
                <p className="text-sm text-muted-foreground">Tipos de Serviço</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Types Overview */}
      <Card className="feature-card">
        <CardHeader>
          <CardTitle>Tipos de Serviços Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(serviceTypeStats)
              .sort(([,a], [,b]) => b - a)
              .map(([serviceType, count]) => (
                <Badge key={serviceType} variant="outline" className="text-sm">
                  {serviceType} ({count})
                </Badge>
              ))
            }
          </div>
        </CardContent>
      </Card>

      <Card className="feature-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Lista de Prestadores ({filteredProviders.length})</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar prestadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={authFilter} onValueChange={setAuthFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="authorized">Autorizados</SelectItem>
                    <SelectItem value="not_authorized">Não Autorizados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo de Serviço</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Pessoa Responsável</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          {provider.document_number && (
                            <p className="text-xs text-muted-foreground">
                              Doc: {provider.document_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.service_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {provider.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{provider.phone}</span>
                          </div>
                        )}
                        {provider.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{provider.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {provider.contact_person && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{provider.contact_person}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {provider.is_authorized ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Autorizado
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <Badge variant="destructive">
                              Não Autorizado
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProviders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum prestador encontrado com os filtros atuais.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="feature-card border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900 dark:text-blue-100">
            <Shield className="w-5 h-5" />
            <span>Informação Importante</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• Apenas prestadores <strong>autorizados</strong> podem realizar serviços no condomínio</p>
            <p>• Certifique-se sempre da autorização antes de contratar um serviço</p>
            <p>• Em caso de dúvidas, contacte a administração do condomínio</p>
            <p>• Esta lista é atualizada regularmente pela gestão do condomínio</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}