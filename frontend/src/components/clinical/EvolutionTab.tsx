import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { FileDown } from "lucide-react";
import { downloadClinicalEvolutionPDF } from "@/lib/pdf";

export function EvolutionTab({ patientId, patient }: { patientId: string; patient: any }) {
  const { data: records = [] } = useQuery({
    queryKey: ["records-asc", patientId],
    queryFn: async () => (await supabase.from("records").select("*").eq("patient_id", patientId).order("record_date", { ascending: true })).data ?? [],
  });

  const chartData = records.map((r: any) => ({
    date: format(new Date(r.record_date), "dd/MM"),
    EVA: r.pain_scale ?? null,
    Evolução: (r as any).evolution_score ?? null,
  }));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => downloadClinicalEvolutionPDF({ patient, records })}>
          <FileDown className="h-4 w-4 mr-1" />PDF evolução
        </Button>
      </div>
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <p className="text-sm font-medium mb-3">Evolução clínica — EVA e escore</p>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis domain={[0, 10]} className="text-xs" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="EVA" stroke="hsl(var(--destructive))" strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="Evolução" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <p className="text-sm font-medium mb-2">Cronologia</p>
        <div className="divide-y divide-border">
          {records.slice().reverse().map((r: any) => (
            <div key={r.id} className="py-2 text-sm flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20">{format(new Date(r.record_date), "dd/MM/yyyy")}</span>
              {typeof r.pain_scale === "number" && <span className="text-xs font-bold text-destructive">EVA {r.pain_scale}</span>}
              {typeof r.evolution_score === "number" && <span className="text-xs font-bold text-primary">Score {r.evolution_score}</span>}
              <span className="flex-1 truncate text-muted-foreground">{r.assessment ?? r.subjective ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
