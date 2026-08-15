import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X, Download, Share, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("pwa-prompt-dismissed") === "true") {
      setDismissed(true);
      return;
    }

    const isStandAloneMatch = window.matchMedia("(display-mode: standalone)").matches;
    const isSafariStandAlone = "standalone" in window.navigator && (window.navigator as any).standalone;
    setIsStandalone(isStandAloneMatch || !!isSafariStandAlone);
    setIsDesktop(window.matchMedia("(min-width: 768px)").matches);

    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const isIOSDevice = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const isSafari =
      isIOSDevice &&
      webkit &&
      !ua.match(/CriOS/i) &&
      !ua.match(/EdgiOS/i) &&
      !ua.match(/Chrome/i) &&
      !ua.match(/Edg/i);

    setIsIOS(isSafari);
    setIsAndroid(/Android/i.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsStandalone(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (dismissed || isStandalone) {
    return null;
  }

  const showAndroidButton = !!deferredPrompt;
  const showIosHint = isIOS;
  const showAndroidHint = isAndroid && !deferredPrompt;
  const showOnDesktop = !!deferredPrompt;

  if (isDesktop && !showOnDesktop) {
    return null;
  }

  if (!showAndroidButton && !showIosHint && !showAndroidHint && !showOnDesktop) {
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

          {showAndroidButton && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleInstallClick} className="gradient-brand text-white">
                <Download className="h-4 w-4" />
                Instalar aplicativo
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Agora não
              </Button>
            </div>
          )}

          {showAndroidHint && (
            <div className="mt-3 space-y-2">
              <p className="rounded-xl border bg-background px-3 py-2 text-xs text-muted-foreground">
                No Android, abra pelo Chrome, toque no menu <strong className="text-foreground">⋮</strong> e escolha{" "}
                <strong className="text-foreground">Instalar aplicativo</strong>.
              </p>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Agora não
              </Button>
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
