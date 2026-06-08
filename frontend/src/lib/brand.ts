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

export const THEMES: Record<string, { label: string; vars: Record<string, string> }> = {
  default: {
    label: "Azul Equilíbrio (padrão)",
    vars: { "--primary": "oklch(0.54 0.13 248)", "--accent": "oklch(0.68 0.17 145)", "--background": "oklch(0.984 0.012 240)" },
  },
  ocean: {
    label: "Oceano Profundo",
    vars: { "--primary": "oklch(0.42 0.14 235)", "--accent": "oklch(0.72 0.14 195)", "--background": "oklch(0.985 0.012 220)" },
  },
  forest: {
    label: "Floresta Calma",
    vars: { "--primary": "oklch(0.48 0.13 160)", "--accent": "oklch(0.68 0.16 130)", "--background": "oklch(0.985 0.012 140)" },
  },
  sunset: {
    label: "Pôr do Sol",
    vars: { "--primary": "oklch(0.58 0.18 35)", "--accent": "oklch(0.72 0.17 65)", "--background": "oklch(0.985 0.012 60)" },
  },
  violet: {
    label: "Violeta Sereno",
    vars: { "--primary": "oklch(0.52 0.18 290)", "--accent": "oklch(0.68 0.17 320)", "--background": "oklch(0.985 0.012 295)" },
  },
  graphite: {
    label: "Grafite Profissional",
    vars: { "--primary": "oklch(0.35 0.04 250)", "--accent": "oklch(0.55 0.13 200)", "--background": "oklch(0.97 0.005 240)" },
  },
};

export function applyTheme(themeKey: string) {
  if (typeof document === "undefined") return;
  const theme = THEMES[themeKey] ?? THEMES.default;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
