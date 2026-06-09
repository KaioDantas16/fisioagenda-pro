import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { BODY_REGIONS, SIDES, PAIN_QUALITY } from "@/lib/clinical-constants";
import { Textarea } from "@/components/ui/textarea";

const TIMING_OPTIONS = ["Manhã", "Tarde", "Noite", "Madrugada", "Contínua", "Aos esforços", "Em repouso"];

function painColor(v: number) {
  if (v <= 3) return "bg-success text-success-foreground";
  if (v <= 6) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

export function PainMapTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data: entries = [] } = useQuery({
    queryKey: ["pain_map", patientId],
    queryFn: async () => (await (supabase.from as any)("pain_map_entries").select("*").eq("patient_id", patientId).order("entry_date", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selected, setSelected] = useState<Record<string, { intensity: number; side: string; quality: string; timing: string; factors_better: string; factors_worse: string }>>({});

  function toggle(region: string) {
    setSelected((s) => {
      const n = { ...s };
      if (n[region]) delete n[region]; else n[region] = { intensity: 5, side: "Central", quality: "", timing: "", factors_better: "", factors_worse: "" };
      return n;
    });
  }

  async function save() {
    const rows = Object.entries(selected).map(([region, v]) => ({
      patient_id: patientId, entry_date: date, region,
      intensity: v.intensity, side: v.side,
      quality: v.quality || null, timing: v.timing || null,
      factors_better: v.factors_better || null, factors_worse: v.factors_worse || null,
    }));
    if (rows.length === 0) return toast.error("Selecione ao menos uma região");
    const { error } = await (supabase.from as any)("pain_map_entries").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} regiões registradas`);
    setOpen(false); setSelected({});
    qc.invalidateQueries({ queryKey: ["pain_map", patientId] });
  }
  async function remove(id: string) {
    await (supabase.from as any)("pain_map_entries").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["pain_map", patientId] });
  }

  // group by date
  const grouped: Record<string, any[]> = {};
  for (const e of entries as any[]) {
    (grouped[e.entry_date] ??= []).push(e);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Mapear dor</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mapa corporal de dor</DialogTitle>
              <DialogDescription className="sr-only">Adicione um novo ponto de dor com região, lado, intensidade e qualidade.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BODY_REGIONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted">
                    <Checkbox checked={!!selected[r]} onCheckedChange={() => toggle(r)} />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
              {Object.keys(selected).length > 0 && (
                <div className="bg-muted/40 rounded-xl p-3 space-y-3">
                  {Object.entries(selected).map(([region, v]) => (
                    <div key={region} className="space-y-2 p-2 rounded-lg bg-card">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{region}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${painColor(v.intensity)}`}>{v.intensity}/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={10} value={v.intensity}
                          onChange={(e) => setSelected({ ...selected, [region]: { ...v, intensity: Number(e.target.value) } })}
                          className="flex-1" />
                        <Select value={v.side} onValueChange={(s) => setSelected({ ...selected, [region]: { ...v, side: s } })}>
                          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{SIDES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={v.quality} onValueChange={(s) => setSelected({ ...selected, [region]: { ...v, quality: s } })}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Qualidade da dor" /></SelectTrigger>
                          <SelectContent>{PAIN_QUALITY.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={v.timing} onValueChange={(s) => setSelected({ ...selected, [region]: { ...v, timing: s } })}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Momento/timing" /></SelectTrigger>
                          <SelectContent>{TIMING_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Textarea rows={1} placeholder="Melhora com..." value={v.factors_better}
                          onChange={(e) => setSelected({ ...selected, [region]: { ...v, factors_better: e.target.value } })} />
                        <Textarea rows={1} placeholder="Piora com..." value={v.factors_worse}
                          onChange={(e) => setSelected({ ...selected, [region]: { ...v, factors_worse: e.target.value } })} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={save} className="w-full gradient-brand text-white">Salvar mapeamento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhum mapeamento de dor registrado.</p>
      ) : Object.entries(grouped).map(([d, list]) => (
        <div key={d} className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-sm font-medium mb-2">{format(new Date(d), "dd/MM/yyyy")}</p>
          <div className="space-y-1">
            {list.map((e: any) => (
              <div key={e.id} className="flex items-start gap-2 text-xs py-1 border-b last:border-0">
                <span className={`px-2 py-0.5 rounded font-bold ${painColor(e.intensity)}`}>{e.intensity}/10</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{e.region}</span>
                  {e.side && e.side !== "Central" && <span className="text-muted-foreground"> · {e.side}</span>}
                  {e.quality && <span className="text-muted-foreground"> · {e.quality}</span>}
                  {e.timing && <span className="text-muted-foreground"> · {e.timing}</span>}
                  {(e.factors_better || e.factors_worse) && (
                    <p className="text-muted-foreground mt-0.5">
                      {e.factors_better && <span>↑ melhora: {e.factors_better}</span>}
                      {e.factors_better && e.factors_worse && " · "}
                      {e.factors_worse && <span>↓ piora: {e.factors_worse}</span>}
                    </p>
                  )}
                </div>
                <button onClick={() => remove(e.id)} className="text-destructive opacity-70 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
