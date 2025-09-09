import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseFileUploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

interface UseFileUploadReturn {
  uploading: boolean;
  progress: number;
  uploadFile: (file: File, fileName?: string) => Promise<string | null>;
  deleteFile: (filePath: string) => Promise<boolean>;
  getFileUrl: (filePath: string) => string;
}

export const useFileUpload = (options: UseFileUploadOptions): UseFileUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File, fileName?: string): Promise<string | null> => {
    const { bucket, folder, maxSize = 50 * 1024 * 1024, allowedTypes } = options;

    // Validate file size
    if (file.size > maxSize) {
      toast({
        title: "Ficheiro muito grande",
        description: `O ficheiro não pode exceder ${Math.round(maxSize / (1024 * 1024))}MB`,
        variant: "destructive"
      });
      return null;
    }

    // Validate file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de ficheiro não suportado",
        description: `Tipos permitidos: ${allowedTypes.join(', ')}`,
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = fileName || `${timestamp}_${randomId}.${fileExtension}`;
      
      // Create file path
      const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      setProgress(100);
      
      toast({
        title: "Upload concluído",
        description: "Ficheiro enviado com sucesso!"
      });

      return data.path;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao enviar ficheiro",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(options.bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      toast({
        title: "Ficheiro eliminado",
        description: "Ficheiro removido com sucesso!"
      });

      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Erro ao eliminar",
        description: error.message || "Erro ao remover ficheiro",
        variant: "destructive"
      });
      return false;
    }
  };

  const getFileUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  return {
    uploading,
    progress,
    uploadFile,
    deleteFile,
    getFileUrl
  };
};