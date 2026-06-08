import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PERIMETRY_SEGMENTS, SIDES } from "@/lib/clinical-constants";

export function PerimetryTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["perimetry", patientId],
    queryFn: async () => (await (supabase.from as any)("perimetry").select("*").eq("patient_id", patientId).order("measured_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ measured_at: format(new Date(), "yyyy-MM-dd"), segment: "Coxa", side: "Direito", measurement_cm: "" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.measurement_cm) return toast.error("Informe a medida em cm");
    const { error } = await (supabase.from as any)("perimetry").insert({ ...form, patient_id: patientId, measurement_cm: Number(form.measurement_cm) });
    if (error) return toast.error(error.message);
    toast.success("Medida registrada");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["perimetry", patientId] });
  }
  async function remove(id: string) {
    await (supabase.from as any)("perimetry").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["perimetry", patientId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Nova medida</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader><DialogTitle>Perimetria</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Data</Label><Input type="date" value={form.measured_at} onChange={(e) => setForm({ ...form, measured_at: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Segmento</Label>
                  <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PERIMETRY_SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Lado</Label>
                  <Select value={form.side} onValueChange={(v) => setForm({ ...form, side: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SIDES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Medida (cm)</Label><Input type="number" step="0.1" value={form.measurement_cm} onChange={(e) => setForm({ ...form, measurement_cm: e.target.value })} required /></div>
              <div><Label>Observação</Label><Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-brand text-white">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhuma medida registrada.</p>
      ) : (
        <div className="bg-card rounded-2xl shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
              <th className="p-3 text-left">Data</th><th className="p-3 text-left">Segmento</th><th className="p-3 text-left">Lado</th>
              <th className="p-3 text-center">Medida</th><th className="p-3 text-left">Observação</th><th></th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((r: any) => (
                <tr key={r.id}>
                  <td className="p-3">{format(new Date(r.measured_at), "dd/MM/yyyy")}</td>
                  <td className="p-3">{r.segment}</td>
                  <td className="p-3">{r.side ?? "—"}</td>
                  <td className="p-3 text-center font-bold text-primary">{r.measurement_cm} cm</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.notes ?? "—"}</td>
                  <td className="p-2"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
