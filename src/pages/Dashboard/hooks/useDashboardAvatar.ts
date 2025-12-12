import { useState } from "react";
import { sb } from "@/lib/supabaseSafe";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { logger } from "@/lib/logger";

interface UseDashboardAvatarOptions {
  userId: string;
  profileAgencyId?: string | null;
  initialAvatarUrl?: string | null;
}

export function useDashboardAvatar({
  userId,
  profileAgencyId,
  initialAvatarUrl,
}: UseDashboardAvatarOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Update preview when initial URL changes
  const updatePreview = (url: string | null) => {
    setAvatarPreview(url);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];

    // Validate with backend
    try {
      const validation = await sb.functions.invoke("validate-image", {
        body: {
          fileSize: file.size,
          fileType: file.type,
          fileName: file.name,
        },
      });
      
      if (validation.error || !validation.data?.valid) {
        toast({
          title: "Arquivo inválido",
          description: validation.data?.error || "Erro ao validar imagem",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      logger.error("Erro ao validar imagem:", error);
    }

    // Compress avatar
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: "image/jpeg" as const,
      };
      
      const compressedFile = await imageCompression(file, options);
      logger.info(
        `Avatar comprimido: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`
      );
      
      setAvatarFile(compressedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      logger.error("Erro ao comprimir:", error);
      toast({
        title: "Erro ao processar imagem",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const saveAvatar = async () => {
    if (!avatarFile || !userId) return null;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Delete old files
      const { data: oldFiles } = await sb.storage
        .from("screenshots")
        .list("avatars", { search: userId });
        
      if (oldFiles && oldFiles.length > 0) {
        await Promise.all(
          oldFiles.map(file =>
            sb.storage.from("screenshots").remove([`avatars/${file.name}`])
          )
        );
      }

      // Upload
      const { error: uploadError } = await sb.storage
        .from("screenshots")
        .upload(fileName, avatarFile, { upsert: true });
        
      clearInterval(progressInterval);
      setUploadProgress(95);
      
      if (uploadError) throw uploadError;

      // Generate signed URL
      const { data: signedData, error: signedError } = await sb.storage
        .from("screenshots")
        .createSignedUrl(fileName, 31536000);
        
      if (signedError) throw signedError;

      // Update profile
      const { error: updateError } = await sb
        .from("profiles")
        .update({ avatar_url: signedData.signedUrl })
        .eq("id", userId);
        
      if (updateError) throw updateError;

      // Sync with agency logo if applicable
      if (profileAgencyId) {
        await sb
          .from("agencies")
          .update({ logo_url: signedData.signedUrl })
          .eq("id", profileAgencyId);
          
        await queryClient.invalidateQueries({ queryKey: ["userAgencies", userId] });
      }

      // Invalidate dashboard cache
      await queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });

      setUploadProgress(100);
      setAvatarFile(null);
      setAvatarPreview(signedData.signedUrl);

      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi salva com sucesso.",
      });

      return signedData.signedUrl;
    } catch (error: any) {
      logger.error("Erro ao salvar avatar:", error);
      toast({
        title: "Erro ao salvar foto",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    avatarFile,
    avatarPreview,
    uploading,
    uploadProgress,
    handleAvatarChange,
    saveAvatar,
    updatePreview,
  };
}
