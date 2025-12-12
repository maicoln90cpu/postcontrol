import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sb } from "@/lib/supabaseSafe";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import type { Profile } from "@/types/dashboard";

interface UseDashboardMutationsOptions {
  userId: string;
  onProfileUpdate?: () => void;
}

export function useDashboardMutations({ userId, onProfileUpdate }: UseDashboardMutationsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Optimistic profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newData: Partial<Profile>) => {
      const { error } = await sb.from("profiles").update(newData).eq("id", userId);
      if (error) throw error;
      return newData;
    },
    onMutate: async (newData) => {
      // Update local cache immediately
      queryClient.setQueryData(["dashboard", userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          profile: { ...old.profile, ...newData },
        };
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      onProfileUpdate?.();
    },
    onError: (error) => {
      logger.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      // Refetch on error
      queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
  });

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: string }) => {
      if (status !== "pending" && status !== "rejected") {
        throw new Error("Apenas submissões pendentes ou reprovadas podem ser excluídas");
      }

      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId)
        .eq("user_id", userId)
        .in("status", ["pending", "rejected"]);

      if (error) throw error;
      return { submissionId, status };
    },
    onSuccess: ({ status }) => {
      const isRejected = status === "rejected";
      toast({
        title: "Submissão excluída!",
        description: isRejected
          ? "A submissão reprovada foi removida. Você pode enviar uma nova."
          : "A postagem pendente foi removida do histórico.",
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
    onError: (error: any) => {
      logger.error("Erro ao excluir submissão:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Change password
  const changePassword = async (newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return false;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Use no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "Senha alterada!",
        description: "Sua nova senha já está ativa.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Save Instagram
  const saveInstagram = async (instagram: string) => {
    try {
      const { error } = await sb.from("profiles").update({ instagram }).eq("id", userId);
      if (error) throw error;

      toast({
        title: "Instagram atualizado!",
        description: "Seu Instagram foi salvo com sucesso.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    updateProfilePending: updateProfileMutation.isPending,
    deleteSubmission: deleteSubmissionMutation.mutateAsync,
    deleteSubmissionPending: deleteSubmissionMutation.isPending,
    changePassword,
    saveInstagram,
  };
}
