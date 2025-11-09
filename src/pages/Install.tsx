import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, Chrome, Apple } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const navigate = useNavigate();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      toast.success('App instalado com sucesso!');
      setTimeout(() => navigate('/'), 2000);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-4 mb-4 w-fit">
              <Check className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O PostControl já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Hero Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-6 mb-4 w-fit">
              <Smartphone className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl">Instale o PostControl</CardTitle>
            <CardDescription className="text-base">
              Acesse mais rápido e trabalhe offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInstallable && (
              <Button
                onClick={handleInstall}
                size="lg"
                className="w-full max-w-xs gap-2"
              >
                <Download className="h-5 w-5" />
                Instalar Agora
              </Button>
            )}

            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Acesso Offline</p>
                  <p className="text-sm text-muted-foreground">
                    Continue trabalhando sem internet
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Mais Rápido</p>
                  <p className="text-sm text-muted-foreground">
                    Carregamento instantâneo
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Sem Downloads</p>
                  <p className="text-sm text-muted-foreground">
                    Não ocupa espaço na loja
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções Android */}
        {isAndroid && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Chrome className="h-6 w-6 text-primary" />
                <CardTitle>Instalar no Android</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Toque no menu (⋮) no canto superior direito</li>
                <li>Selecione "Instalar app" ou "Adicionar à tela inicial"</li>
                <li>Confirme tocando em "Instalar"</li>
                <li>O app aparecerá na sua tela inicial</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Instruções iOS */}
        {isIOS && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Apple className="h-6 w-6 text-primary" />
                <CardTitle>Instalar no iPhone/iPad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Toque no botão "Compartilhar" (□↑) na barra inferior</li>
                <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar" no canto superior direito</li>
                <li>O app aparecerá na sua tela inicial</li>
              </ol>
              <p className="text-xs text-muted-foreground italic">
                Nota: A instalação automática não é suportada pelo Safari. 
                Use o método manual acima.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Install;
