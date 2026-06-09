import logoAsset from "@/assets/logo.asset.json";
import lenilsonAsset from "@/assets/lenilson.asset.json";

// Asset URLs are stored as Lovable-internal URLs. We strip the lovable proxy prefix
// and serve from /assets (Vite public folder) when running outside Lovable.
function resolveAssetUrl(url: string, fallback: string): string {
  if (!url) return fallback;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return fallback;
}

export const LOGO_URL = resolveAssetUrl(
  logoAsset.url,
  "/logo.jpeg",
);
export const OWNER_PHOTO_URL = resolveAssetUrl(
  lenilsonAsset.url,
  "/lenilson.jpeg",
);

export const CLINIC = {
  name: "Centro Especializado Equilíbrio e Movimento",
  shortName: "FisioAgenda Pro",
  address: "Avenida Flores da Cunha, 3211 — Centro, Caldas Novas - GO",
  phone: "(64) 99298-8185",
  instagram: "@lenilson_gouveia",
  owner: "Lenilson Gouveia de Jesus",
  crefito: "CREFITO-9",
};

export const SERVICES = [
  "Massoterapia",
  "Massagem Esportiva/Desportiva",
  "Ventosaterapia",
  "Pedras Quentes",
  "Dry Needling",
  "Liberação Miofascial",
  "Quiropraxia",
  "Drenagem Linfática",
  "Fisioterapia Analítica",
  "Mobilização Articular",
  "Recovery/Recuperação Muscular",
  "Eletroterapia (TENS/FES/Ultrassom)",
  "Cinesioterapia",
  "Alongamento Terapêutico",
  "RPG",
  "Pilates Clínico",
  "Bandagem Funcional (Kinesio Taping)",
  "Acupuntura",
  "Crioterapia",
  "Termoterapia",
  "Hidroterapia",
  "Treino Funcional Terapêutico",
];

export const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-primary/10 text-primary" },
  confirmado: { label: "Confirmado", className: "bg-accent/15 text-accent-dark" },
  realizado: { label: "Realizado", className: "bg-success/15 text-success" },
  cancelado: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
  faltou: { label: "Faltou", className: "bg-destructive/15 text-destructive" },
};

export const CLASSIFICATIONS: Record<string, { label: string; className: string; dot: string }> = {
  urgente: { label: "Urgente", className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  atencao: { label: "Atenção", className: "bg-warning/15 text-amber-700 border-amber-300", dot: "bg-warning" },
  estavel: { label: "Estável", className: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary" },
  alta:    { label: "Alta",    className: "bg-success/15 text-success border-success/30", dot: "bg-success" },
};

const baseLightVars = {
  "--foreground": "oklch(0.22 0.04 240)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.22 0.04 240)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0.22 0.04 240)",
  "--primary-foreground": "oklch(0.99 0.005 240)",
  "--secondary": "oklch(0.96 0.02 240)",
  "--secondary-foreground": "oklch(0.30 0.06 245)",
  "--muted": "oklch(0.95 0.015 240)",
  "--muted-foreground": "oklch(0.52 0.04 240)",
  "--accent-foreground": "oklch(0.99 0.005 145)",
  "--border": "oklch(0.90 0.03 235)",
  "--input": "oklch(0.92 0.02 235)",
  "--sidebar": "oklch(1 0 0)",
  "--sidebar-foreground": "oklch(0.22 0.04 240)",
  "--sidebar-primary": "oklch(0.54 0.13 248)",
  "--sidebar-primary-foreground": "oklch(0.99 0.005 240)",
  "--sidebar-accent": "oklch(0.95 0.03 245)",
  "--sidebar-accent-foreground": "oklch(0.30 0.06 245)",
  "--sidebar-border": "oklch(0.90 0.03 235)",
  "--sidebar-ring": "oklch(0.54 0.13 248)",
  "--shadow-card": "0 4px 20px rgba(26, 111, 181, 0.08)",
  "--shadow-lg": "0 10px 40px rgba(26, 111, 181, 0.12)",
};

export const THEMES: Record<string, { label: string; vars: Record<string, string> }> = {
  default: {
    label: "Azul Equilíbrio (padrão)",
    vars: {
      ...baseLightVars,
      "--primary": "oklch(0.54 0.13 248)",
      "--primary-dark": "oklch(0.46 0.13 250)",
      "--primary-light": "oklch(0.95 0.03 245)",
      "--accent": "oklch(0.68 0.17 145)",
      "--accent-dark": "oklch(0.58 0.17 145)",
      "--background": "oklch(0.984 0.012 240)",
      "--ring": "oklch(0.54 0.13 248)",
    },
  },
  ocean: {
    label: "Oceano Profundo",
    vars: {
      ...baseLightVars,
      "--primary": "oklch(0.42 0.14 235)",
      "--primary-dark": "oklch(0.35 0.14 240)",
      "--primary-light": "oklch(0.94 0.03 230)",
      "--accent": "oklch(0.72 0.14 195)",
      "--accent-dark": "oklch(0.62 0.14 195)",
      "--background": "oklch(0.985 0.012 220)",
      "--ring": "oklch(0.42 0.14 235)",
    },
  },
  forest: {
    label: "Floresta Calma",
    vars: {
      ...baseLightVars,
      "--primary": "oklch(0.48 0.13 160)",
      "--primary-dark": "oklch(0.40 0.13 165)",
      "--primary-light": "oklch(0.94 0.03 155)",
      "--accent": "oklch(0.68 0.16 130)",
      "--accent-dark": "oklch(0.58 0.16 130)",
      "--background": "oklch(0.985 0.012 140)",
      "--ring": "oklch(0.48 0.13 160)",
    },
  },
  sunset: {
    label: "Pôr do Sol",
    vars: {
      ...baseLightVars,
      "--primary": "oklch(0.58 0.18 35)",
      "--primary-dark": "oklch(0.50 0.18 35)",
      "--primary-light": "oklch(0.95 0.03 35)",
      "--accent": "oklch(0.72 0.17 65)",
      "--accent-dark": "oklch(0.62 0.17 65)",
      "--background": "oklch(0.985 0.012 60)",
      "--ring": "oklch(0.58 0.18 35)",
    },
  },
  violet: {
    label: "Violeta Sereno",
    vars: {
      ...baseLightVars,
      "--primary": "oklch(0.52 0.18 290)",
      "--primary-dark": "oklch(0.44 0.18 295)",
      "--primary-light": "oklch(0.95 0.03 285)",
      "--accent": "oklch(0.68 0.17 320)",
      "--accent-dark": "oklch(0.58 0.17 320)",
      "--background": "oklch(0.985 0.012 295)",
      "--ring": "oklch(0.52 0.18 290)",
    },
  },
  graphite: {
    label: "Grafite Profissional",
    vars: {
      ...baseLightVars,
      "--primary": "oklch(0.35 0.04 250)",
      "--primary-dark": "oklch(0.28 0.04 250)",
      "--primary-light": "oklch(0.93 0.01 250)",
      "--accent": "oklch(0.55 0.13 200)",
      "--accent-dark": "oklch(0.47 0.13 200)",
      "--background": "oklch(0.97 0.005 240)",
      "--ring": "oklch(0.35 0.04 250)",
    },
  },
  dark: {
    label: "Modo Escuro Premium",
    vars: {
      "--background": "#0F172A",
      "--foreground": "#F8FAFC",
      "--card": "#1E293B",
      "--card-foreground": "#F8FAFC",
      "--popover": "#1E293B",
      "--popover-foreground": "#F8FAFC",
      "--primary": "#38BDF8",
      "--primary-foreground": "#0F172A",
      "--primary-dark": "#0284C7",
      "--primary-light": "rgba(56, 189, 248, 0.15)",
      "--secondary": "#1E293B",
      "--secondary-foreground": "#CBD5E1",
      "--muted": "#334155",
      "--muted-foreground": "#CBD5E1",
      "--accent": "#8B5CF6",
      "--accent-foreground": "#F8FAFC",
      "--accent-dark": "#7C3AED",
      "--border": "#334155",
      "--input": "#334155",
      "--ring": "#38BDF8",
      "--sidebar": "#1E293B",
      "--sidebar-foreground": "#F8FAFC",
      "--sidebar-primary": "#38BDF8",
      "--sidebar-primary-foreground": "#0F172A",
      "--sidebar-accent": "#334155",
      "--sidebar-accent-foreground": "#F8FAFC",
      "--sidebar-border": "#334155",
      "--sidebar-ring": "#38BDF8",
      "--shadow-card": "0 4px 20px rgba(0, 0, 0, 0.4)",
      "--shadow-lg": "0 10px 40px rgba(0, 0, 0, 0.6)",
    },
  },
};

export function applyTheme(themeKey: string) {
  if (typeof document === "undefined") return;
  const theme = THEMES[themeKey] ?? THEMES.default;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  
  if (themeKey === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
