import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type InstallOutcome = "accepted" | "dismissed" | "unavailable" | null;

const SHOW_GUIDE_EVENT = "fisio-pwa-show-guide";

let capturedPrompt: BeforeInstallPromptEvent | null = null;
let listenersBound = false;
const subscribers = new Set<() => void>();

function isStandaloneNow() {
  if (typeof window === "undefined") return false;
  const displayStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const safariStandalone =
    "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return displayStandalone || safariStandalone;
}

function notify() {
  subscribers.forEach((fn) => fn());
}

function bindGlobalListeners() {
  if (typeof window === "undefined" || listenersBound) return;
  listenersBound = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    capturedPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    capturedPrompt = null;
    notify();
  });
}

export function usePwaInstall() {
  const [, setTick] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [installOutcome, setInstallOutcome] = useState<InstallOutcome>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    bindGlobalListeners();
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/i.test(ua);
    const isSafari =
      isIOSDevice &&
      /WebKit/i.test(ua) &&
      !/CriOS|EdgiOS|FxiOS|Chrome|Edg/i.test(ua);

    setIsStandalone(isStandaloneNow());
    setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    setIsIOS(isSafari);
    setIsAndroid(/Android/i.test(ua));

    const refresh = () => {
      setIsStandalone(isStandaloneNow());
      setTick((value) => value + 1);
    };
    subscribers.add(refresh);

    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener?.("change", refresh);

    return () => {
      subscribers.delete(refresh);
      media.removeEventListener?.("change", refresh);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<Exclude<InstallOutcome, null>> => {
    const promptEvent = capturedPrompt;
    if (!promptEvent) {
      setInstallOutcome("unavailable");
      window.dispatchEvent(new Event(SHOW_GUIDE_EVENT));
      return "unavailable";
    }

    setBusy(true);
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      capturedPrompt = null;
      notify();
      setInstallOutcome(outcome);
      if (outcome === "accepted") {
        setIsStandalone(true);
      } else {
        window.dispatchEvent(new Event(SHOW_GUIDE_EVENT));
      }
      return outcome;
    } catch {
      setInstallOutcome("unavailable");
      window.dispatchEvent(new Event(SHOW_GUIDE_EVENT));
      return "unavailable";
    } finally {
      setBusy(false);
    }
  }, []);

  const openGuide = useCallback(() => {
    window.dispatchEvent(new Event(SHOW_GUIDE_EVENT));
    requestAnimationFrame(() => {
      document.getElementById("install-app-prompt")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return {
    canInstall: !!capturedPrompt && !isStandalone,
    isStandalone,
    isAndroid,
    isIOS,
    isDesktop,
    installOutcome,
    busy,
    promptInstall,
    openGuide,
    showGuideEvent: SHOW_GUIDE_EVENT,
  };
}
