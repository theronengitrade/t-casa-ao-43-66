import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Search, 
  Download, 
  Calendar,
  File,
  Filter,
  Eye,
  Upload
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DocumentUploadModal from "./DocumentUploadModal";

interface ResidentDocumentsProps {
  profile: any;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  file_size: number | null;
  file_path: string;
  is_public: boolean;
  created_at: string;
  uploaded_by: string;
}

const ResidentDocuments = ({ profile }: ResidentDocumentsProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erro ao carregar documentos",
        description: "Não foi possível carregar os documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [profile]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📋';
  };

  const getFileTypeBadge = (fileType: string) => {
    const type = fileType.split('/')[1]?.toUpperCase() || fileType.toUpperCase();
    
    const colorMap: Record<string, string> = {
      'PDF': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'JPG': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'JPEG': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'PNG': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'DOC': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'DOCX': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'XLS': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'XLSX': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };

    return (
      <Badge className={colorMap[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}>
        {type}
      </Badge>
    );
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (typeFilter === "all") return matchesSearch;
    
    return matchesSearch && document.file_type.includes(typeFilter);
  });

  const documentTypes = Array.from(new Set(documents.map(doc => {
    const mainType = doc.file_type.split('/')[0];
    return mainType;
  })));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documentos</h2>
        <p className="text-muted-foreground">
          Aceda aos documentos públicos do condomínio
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Documentos Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{documentTypes.length}</p>
                <p className="text-sm text-muted-foreground">Tipos de Arquivo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Download className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {formatFileSize(documents.reduce((total, doc) => total + (doc.file_size || 0), 0))}
                </p>
                <p className="text-sm text-muted-foreground">Tamanho Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de Arquivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="application">Documentos</SelectItem>
                <SelectItem value="image">Imagens</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Documentos</span>
            <Button onClick={() => setShowUploadModal(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Enviar Documento
            </Button>
          </CardTitle>
          <CardDescription>
            {filteredDocuments.length} de {documents.length} documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum documento disponível</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ainda não existem documentos públicos neste condomínio.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data de Upload</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(document.file_type)}</span>
                        <div>
                          <p className="font-medium">{document.title}</p>
                          {document.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getFileTypeBadge(document.file_type)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatFileSize(document.file_size)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(document.created_at).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" disabled>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredDocuments.length === 0 && documents.length > 0 && (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum resultado encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros para ver outros documentos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Documentos Disponíveis
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Regulamentos internos do condomínio</li>
                <li>• Atas de assembleias e reuniões</li>
                <li>• Relatórios financeiros</li>
                <li>• Comunicados e circulares</li>
                <li>• Documentos técnicos e plantas</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Como Aceder
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Todos os documentos listados são de acesso público para residentes. 
                Para documentos privados ou específicos do seu apartamento, contacte a administração.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentUploadModal 
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        profile={profile}
        onUploadSuccess={fetchDocuments}
      />
    </div>
  );
};

export default ResidentDocuments;