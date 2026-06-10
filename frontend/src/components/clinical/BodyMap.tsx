import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BodyMapProps {
  selectedRegions: string[];
  onChange: (regions: string[]) => void;
}

interface RegionPoint {
  id: string;
  label: string;
  side: "anterior" | "posterior";
  top: string;  // Posição vertical absoluta (%)
  left: string; // Posição horizontal absoluta (%)
}

const REGIONS: RegionPoint[] = [
  // FRENTE (Anterior) - Esquerda do contêiner (0% a 50%)
  { id: "Cervical (Anterior)", label: "Cervical", side: "anterior", top: "15%", left: "25%" },
  { id: "Ombro Direito", label: "Ombro D", side: "anterior", top: "25%", left: "12%" },
  { id: "Ombro Esquerdo", label: "Ombro E", side: "anterior", top: "25%", left: "38%" },
  { id: "Tórax/Abdômen", label: "Tórax/Abdômen", side: "anterior", top: "35%", left: "25%" },
  { id: "Cotovelo/Mão D", label: "Cotovelo/Mão D", side: "anterior", top: "45%", left: "7%" },
  { id: "Cotovelo/Mão E", label: "Cotovelo/Mão E", side: "anterior", top: "45%", left: "43%" },
  { id: "Quadril (Anterior)", label: "Quadril/Pelve", side: "anterior", top: "52%", left: "25%" },
  { id: "Joelho Direito", label: "Joelho D", side: "anterior", top: "72%", left: "18%" },
  { id: "Joelho Esquerdo", label: "Joelho E", side: "anterior", top: "72%", left: "32%" },
  { id: "Tornozelo/Pé D", label: "Tornozelo/Pé D", side: "anterior", top: "90%", left: "18%" },
  { id: "Tornozelo/Pé E", label: "Tornozelo/Pé E", side: "anterior", top: "90%", left: "32%" },

  // COSTAS (Posterior) - Direita do contêiner (50% a 100%)
  { id: "Cervical (Posterior)", label: "Cervical Post.", side: "posterior", top: "15%", left: "75%" },
  { id: "Coluna Torácica", label: "Coluna Torácica", side: "posterior", top: "30%", left: "75%" },
  { id: "Coluna Lombar", label: "Coluna Lombar", side: "posterior", top: "46%", left: "75%" },
  { id: "Quadril/Glúteos", label: "Glúteos", side: "posterior", top: "54%", left: "75%" },
  { id: "Joelho D (Posterior)", label: "Joelho D Post.", side: "posterior", top: "72%", left: "68%" },
  { id: "Joelho E (Posterior)", label: "Joelho E Post.", side: "posterior", top: "72%", left: "82%" },
  { id: "Tornozelo/Pé D (Posterior)", label: "Pé D Post.", side: "posterior", top: "90%", left: "68%" },
  { id: "Tornozelo/Pé E (Posterior)", label: "Pé E Post.", side: "posterior", top: "90%", left: "82%" },
];

export function BodyMap({ selectedRegions, onChange }: BodyMapProps) {
  const toggleRegion = (regionId: string) => {
    const isSelected = selectedRegions.includes(regionId);
    let newSelection: string[];
    if (isSelected) {
      newSelection = selectedRegions.filter((r) => r !== regionId);
    } else {
      newSelection = [...selectedRegions, regionId];
    }
    onChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground">Mapa Corporal (Marque as regiões de dor/tratamento)</span>
        {selectedRegions.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-destructive hover:underline font-medium"
          >
            Limpar seleção
          </button>
        )}
      </div>
      <div className="relative w-full max-w-sm h-80 mx-auto border rounded-2xl bg-card shadow-inner flex overflow-hidden select-none">
        
        {/* Painel da Esquerda: Frente (Anterior) */}
        <div className="w-1/2 h-full relative border-r border-border/50 flex flex-col items-center justify-center p-2">
          <span className="absolute top-2 left-2 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Anterior</span>
          
          {/* Silhueta Frente SVG */}
          <svg viewBox="0 0 100 120" className="w-4/5 h-4/5 opacity-10 text-muted-foreground dark:text-slate-400 fill-current">
            {/* Cabeça e Pescoço */}
            <circle cx="50" cy="15" r="9" />
            <rect x="47" y="24" width="6" height="6" rx="1" />
            {/* Tronco */}
            <path d="M36 30 h28 r4 l-2 32 r-2 h-24 l-2 -32 z" />
            {/* Braço Direito */}
            <path d="M33 30 l-6 24 c-1 3 -3 3 -4 0 l-3 -24 c-1 -3 1 -3 3 0 l4 18 z" />
            {/* Braço Esquerdo */}
            <path d="M67 30 l6 24 c1 3 3 3 4 0 l3 -24 c1 -3 -1 -3 -3 0 l-4 18 z" />
            {/* Pelve */}
            <path d="M38 62 h24 l-2 12 h-20 z" />
            {/* Perna Direita */}
            <path d="M38 74 l-2 28 c0 3 -2 3 -3 0 l-2 -28 z" />
            {/* Perna Esquerda */}
            <path d="M62 74 l2 28 c0 3 2 3 3 0 l2 -28 z" />
          </svg>
        </div>

        {/* Painel da Direita: Costas (Posterior) */}
        <div className="w-1/2 h-full relative flex flex-col items-center justify-center p-2">
          <span className="absolute top-2 right-2 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Posterior</span>
          
          {/* Silhueta Costas SVG */}
          <svg viewBox="0 0 100 120" className="w-4/5 h-4/5 opacity-10 text-muted-foreground dark:text-slate-400 fill-current">
            {/* Cabeça e Pescoço */}
            <circle cx="50" cy="15" r="9" />
            <rect x="47" y="24" width="6" height="6" rx="1" />
            {/* Tronco */}
            <path d="M36 30 h28 r4 l-2 32 r-2 h-24 l-2 -32 z" />
            {/* Linha da coluna posterior */}
            <line x1="50" y1="30" x2="50" y2="62" stroke="white" strokeWidth="1" strokeDasharray="2" />
            {/* Braços */}
            <path d="M33 30 l-6 24 c-1 3 -3 3 -4 0 l-3 -24 c-1 -3 1 -3 3 0 l4 18 z" />
            <path d="M67 30 l6 24 c1 3 3 3 4 0 l3 -24 c1 -3 -1 -3 -3 0 l-4 18 z" />
            {/* Pelve */}
            <path d="M38 62 h24 l-2 12 h-20 z" />
            {/* Pernas */}
            <path d="M38 74 l-2 28 c0 3 -2 3 -3 0 l-2 -28 z" />
            <path d="M62 74 l2 28 c0 3 2 3 3 0 l2 -28 z" />
          </svg>
        </div>

        {/* Renderização absoluta dos botões interativos sobrepostos */}
        {REGIONS.map((point) => {
          const isSelected = selectedRegions.includes(point.id);
          return (
            <button
              key={point.id}
              type="button"
              onClick={() => toggleRegion(point.id)}
              style={{ top: point.top, left: point.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 flex items-center justify-center"
              title={point.label}
            >
              {/* Ponto Interativo */}
              <span
                className={cn(
                  "h-4 w-4 rounded-full border border-white shadow flex items-center justify-center transition-all duration-300 scale-100 group-hover:scale-125 cursor-pointer",
                  isSelected
                    ? "bg-destructive animate-pulse border-destructive-foreground"
                    : "bg-slate-300 hover:bg-primary/80 dark:bg-slate-600"
                )}
              >
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>

              {/* Tooltip Hover */}
              <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded absolute bottom-full mb-1 whitespace-nowrap shadow-md z-20">
                {point.label}
              </span>
            </button>
          );
        })}
      </div>
      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center justify-center p-2 border rounded-xl bg-muted/20">
          <span className="text-[10px] font-bold text-muted-foreground mr-1">Marcados:</span>
          {selectedRegions.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-medium"
            >
              {REGIONS.find((p) => p.id === r)?.label || r}
              <button
                type="button"
                onClick={() => toggleRegion(r)}
                className="hover:text-destructive/80 font-bold ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
