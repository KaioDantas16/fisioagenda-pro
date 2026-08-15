import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { X, Download, Share, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallAppPrompt() {
  const {
    canInstall,
    isStandalone,
    isAndroid,
    isIOS,
    isDesktop,
    busy,
    promptInstall,
    showGuideEvent,
  } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-prompt-dismissed") === "true") {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    const reveal = () => {
      setDismissed(false);
      setShowGuide(true);
      localStorage.removeItem("pwa-prompt-dismissed");
      requestAnimationFrame(() => {
        document.getElementById("install-app-prompt")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    window.addEventListener(showGuideEvent, reveal);
    return () => window.removeEventListener(showGuideEvent, reveal);
  }, [showGuideEvent]);

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome !== "accepted") {
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowGuide(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isStandalone) {
    return null;
  }

  const showAndroidNative = canInstall;
  const showHowTo = (isAndroid && !canInstall) || showGuide;
  const showIosHint = isIOS;
  const visibleOnDesktop = isDesktop && canInstall;

  if (dismissed && !showGuide) {
    return null;
  }

  if (isDesktop && !visibleOnDesktop && !showGuide) {
    return null;
  }

  if (!showAndroidNative && !showHowTo && !showIosHint && !visibleOnDesktop) {
    return null;
  }

  return (
    <div
      id="install-app-prompt"
      className="relative mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-primary/5 p-4"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground"
        onClick={handleDismiss}
        aria-label="Agora não"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-card">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-foreground">Instale o FisioAgenda Pro</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse mais rápido pelo ícone na tela inicial, com aparência de aplicativo.
          </p>

          {showAndroidNative && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleInstallClick} disabled={busy} className="gradient-brand text-white">
                <Download className="h-4 w-4" />
                Instalar aplicativo
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Agora não
              </Button>
            </div>
          )}

          {showHowTo && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">Como instalar no celular</p>
              <div className="rounded-xl border bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground space-y-1.5">
                <p>Para instalar:</p>
                <p>1. Toque no menu ⋮ do Chrome.</p>
                <p>2. Escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</p>
                <p>3. Se estiver no Xiaomi, verifique permissão de atalhos do Chrome.</p>
                <p>Se o app já estiver instalado, remova o atalho antigo e tente novamente.</p>
              </div>
              {!showAndroidNative && (
                <Button size="sm" variant="outline" onClick={handleDismiss}>
                  Agora não
                </Button>
              )}
            </div>
          )}

          {showIosHint && (
            <div className="mt-3 space-y-2">
              <p className="rounded-xl border bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                No iPhone, abra pelo Safari, toque em <Share className="mx-1 inline h-3.5 w-3.5" />{" "}
                <strong className="text-foreground">Compartilhar</strong> e escolha{" "}
                <strong className="text-foreground">Adicionar à Tela de Início</strong>.
              </p>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Agora não
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
