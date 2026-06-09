import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { DERMATOMES, MUSCLE_GROUPS, STRENGTH_SCALE, SIDES } from "@/lib/clinical-constants";

const CATEGORIES = [
  { value: "forca", label: "Força muscular (0-5)" },
  { value: "sensibilidade", label: "Sensibilidade (dermátomo)" },
  { value: "reflexo", label: "Reflexo (0-4)" },
];

const SENS_VALUES = ["Normal", "Hipoestesia", "Hiperestesia", "Anestesia", "Parestesia"];
const REFLEX_VALUES = ["0 — Ausente", "1 — Hipoativo", "2 — Normal", "3 — Vivo", "4 — Clônus"];

export function NeuroTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["neuro", patientId],
    queryFn: async () => (await (supabase.from as any)("neuro_assessment").select("*").eq("patient_id", patientId).order("assessed_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const initial = { assessed_at: format(new Date(), "yyyy-MM-dd"), category: "forca", item: "", side: "Direito", value: "", notes: "" };
  const [form, setForm] = useState<any>(initial);

  const items = form.category === "forca" ? MUSCLE_GROUPS : form.category === "sensibilidade" ? DERMATOMES : ["Patelar", "Aquileu", "Bicipital", "Tricipital", "Estilo-radial"];
  const values = form.category === "forca" ? STRENGTH_SCALE.map((s) => s.label) : form.category === "sensibilidade" ? SENS_VALUES : REFLEX_VALUES;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.item || !form.value) return toast.error("Preencha item e valor");
    const { error } = await (supabase.from as any)("neuro_assessment").insert({ ...form, patient_id: patientId });
    if (error) return toast.error(error.message);
    toast.success("Registro neurológico salvo");
    setOpen(false); setForm(initial);
    qc.invalidateQueries({ queryKey: ["neuro", patientId] });
  }
  async function remove(id: string) {
    await (supabase.from as any)("neuro_assessment").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["neuro", patientId] });
  }

  const grouped: Record<string, any[]> = {};
  for (const e of list as any[]) (grouped[e.category] ??= []).push(e);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Novo registro</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Avaliação neurológica</DialogTitle>
              <DialogDescription className="sr-only">Registre dermátomos, força muscular, sensibilidade e reflexos do paciente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Data</Label><Input type="date" value={form.assessed_at} onChange={(e) => setForm({ ...form, assessed_at: e.target.value })} /></div>
              <div><Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, item: "", value: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Item</Label>
                <Select value={form.item} onValueChange={(v) => setForm({ ...form, item: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent className="max-h-72">{items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Lado</Label>
                <Select value={form.side} onValueChange={(v) => setForm({ ...form, side: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SIDES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Resultado</Label>
                <Select value={form.value} onValueChange={(v) => setForm({ ...form, value: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Observação</Label><Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-brand text-white">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhuma avaliação neurológica registrada.</p>
      ) : Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-sm font-bold mb-2 capitalize">{CATEGORIES.find((c) => c.value === cat)?.label ?? cat}</p>
          <div className="space-y-1">
            {items.map((n: any) => (
              <div key={n.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                <span className="font-medium flex-1">{n.item} <span className="text-muted-foreground text-xs">· {n.side}</span></span>
                <span className="text-xs font-bold text-primary">{n.value}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(n.assessed_at), "dd/MM/yyyy")}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(n.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
