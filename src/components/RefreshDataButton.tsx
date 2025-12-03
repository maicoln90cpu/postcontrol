import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RefreshDataButtonProps {
  onRefresh?: () => Promise<void> | void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export const RefreshDataButton = ({
  onRefresh,
  variant = "outline",
  size = "sm",
  className = "",
  showLabel = true,
}: RefreshDataButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // 1. Invalidar todo o cache do React Query
      await queryClient.invalidateQueries();
      
      // 2. Limpar cache do Service Worker (PWA/Mobile)
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          // Limpar apenas caches de dados, não assets estáticos
          const dataCaches = cacheNames.filter(name => 
            name.includes('api') || name.includes('data') || name.includes('runtime')
          );
          await Promise.all(dataCaches.map(name => caches.delete(name)));
        } catch (cacheError) {
          console.warn('Não foi possível limpar cache do SW:', cacheError);
        }
      }
      
      // 3. Callback customizado (ex: recarregar dados específicos)
      if (onRefresh) {
        await onRefresh();
      }
      
      toast({
        title: "Dados atualizados!",
        description: "Informações recarregadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className}
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""} ${showLabel ? "mr-2" : ""}`} />
      {showLabel && (isRefreshing ? "Atualizando..." : "Atualizar")}
    </Button>
  );
};
