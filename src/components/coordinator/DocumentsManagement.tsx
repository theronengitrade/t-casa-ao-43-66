import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Download, Trash2, FileText, Eye, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_public: boolean;
  uploaded_by: string;
  created_at: string;
  uploader: {
    first_name: string;
    last_name: string;
  };
}

export function DocumentsManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_public: true,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploader:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .eq('condominium_id', profile?.condominium_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${profile?.condominium_id}/${fileName}`;

      // Note: In a real implementation, you would upload to Supabase Storage
      // For this demo, we'll simulate the file upload
      const { error } = await supabase
        .from('documents')
        .insert({
          title: formData.title,
          description: formData.description,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          is_public: formData.is_public,
          uploaded_by: profile?.user_id,
          condominium_id: profile?.condominium_id,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Documento carregado com sucesso.",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar documento.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Tem certeza que deseja remover este documento?")) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Documento removido com sucesso.",
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover documento.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      is_public: true,
    });
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📁';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "public") {
      return doc.is_public && matchesSearch;
    } else if (activeTab === "private") {
      return !doc.is_public && matchesSearch;
    }
    
    return matchesSearch;
  });

  const DocumentForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file">Arquivo *</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
        />
        {selectedFile && (
          <p className="text-sm text-gray-500 mt-1">
            {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Título do documento"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do documento"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_public"
          checked={formData.is_public}
          onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked as boolean })}
        />
        <Label htmlFor="is_public">Documento público (visível para todos os moradores)</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false);
            resetForm();
          }}
        >
          Cancelar
        </Button>
        <Button onClick={handleFileUpload}>
          Carregar Documento
        </Button>
      </div>
    </div>
  );

  const DocumentTable = ({ documents }: { documents: Document[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Documento</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead>Carregado por</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Visibilidade</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(document.file_type)}</span>
                <div>
                  <p className="font-medium">{document.title}</p>
                  {document.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{document.description}</p>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{document.file_type.split('/')[1]?.toUpperCase()}</Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm">{formatFileSize(document.file_size)}</span>
            </TableCell>
            <TableCell>
              {document.uploader && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-sm">
                    {document.uploader.first_name} {document.uploader.last_name}
                  </span>
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-sm">
                  {format(new Date(document.created_at), "dd/MM/yyyy")}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={document.is_public ? "default" : "secondary"}>
                {document.is_public ? "Público" : "Privado"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // In a real implementation, this would download the file
                    toast({
                      title: "Info",
                      description: "Funcionalidade de download será implementada com Supabase Storage.",
                    });
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteDocument(document.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Documentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir documentos do condomínio
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Carregar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Carregar Novo Documento</DialogTitle>
            </DialogHeader>
            <DocumentForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Biblioteca de Documentos</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                Todos ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="public">
                Públicos ({documents.filter(d => d.is_public).length})
              </TabsTrigger>
              <TabsTrigger value="private">
                Privados ({documents.filter(d => !d.is_public).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <DocumentTable documents={filteredDocuments} />
            </TabsContent>

            <TabsContent value="public" className="mt-6">
              <DocumentTable documents={filteredDocuments} />
            </TabsContent>

            <TabsContent value="private" className="mt-6">
              <DocumentTable documents={filteredDocuments} />
            </TabsContent>
          </Tabs>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum documento encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}