import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { useAuthStore } from "@/stores/authStore";
import { useGTM } from "@/hooks/useGTM";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Criar instância única do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos (reduzido de 5)
      gcTime: 1000 * 60 * 5, // 5 minutos (reduzido de 10)
      retry: 1,
      refetchOnWindowFocus: true, // ✅ CORREÇÃO MOBILE: recarregar ao voltar para aba
      refetchOnReconnect: true, // ✅ CORREÇÃO MOBILE: recarregar ao reconectar rede
      refetchOnMount: true, // ✅ CORREÇÃO MOBILE: sempre buscar dados ao montar componente
    },
  },
});

// Injetar queryClient no authStore para permitir limpeza no logout
useAuthStore.getState().setQueryClient(queryClient);

// Componente wrapper para usar hooks
const AppWrapper = () => {
  useGTM(); // Carregar GTM automaticamente
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppWrapper />
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

// Fallback manual para registro do SW
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => console.log('✅ SW registrado manualmente:', registration.scope))
      .catch(error => console.error('❌ Falha no registro manual do SW:', error));
  });
}
