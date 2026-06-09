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
import { JOINTS, MOVEMENTS, SIDES, getRomNormal } from "@/lib/clinical-constants";

export function RomTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["rom", patientId],
    queryFn: async () => (await (supabase.from as any)("rom_measurements").select("*").eq("patient_id", patientId).order("measured_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ measured_at: format(new Date(), "yyyy-MM-dd"), joint: "Ombro", movement: "Flexão", side: "Direito" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await (supabase.from as any)("rom_measurements").insert({
      patient_id: patientId, ...form,
      active_degrees: form.active_degrees ? Number(form.active_degrees) : null,
      passive_degrees: form.passive_degrees ? Number(form.passive_degrees) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Medida registrada");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["rom", patientId] });
  }
  async function remove(id: string) {
    await (supabase.from as any)("rom_measurements").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["rom", patientId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Nova medida</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Amplitude de movimento (ADM)</DialogTitle>
              <DialogDescription className="sr-only">Registre medidas ativas e passivas de articulações.</DialogDescription>
            </DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Data</Label><Input type="date" value={form.measured_at} onChange={(e) => setForm({ ...form, measured_at: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Articulação</Label>
                  <Select value={form.joint} onValueChange={(v) => setForm({ ...form, joint: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{JOINTS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Movimento</Label>
                  <Select value={form.movement} onValueChange={(v) => setForm({ ...form, movement: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MOVEMENTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Lado</Label>
                  <Select value={form.side} onValueChange={(v) => setForm({ ...form, side: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SIDES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground self-end pb-2">
                  Normal: <span className="font-bold text-primary">{getRomNormal(form.joint, form.movement) ?? "—"}°</span>
                </div>
                <div><Label>Ativo (°)</Label><Input type="number" value={form.active_degrees ?? ""} onChange={(e) => setForm({ ...form, active_degrees: e.target.value })} /></div>
                <div><Label>Passivo (°)</Label><Input type="number" value={form.passive_degrees ?? ""} onChange={(e) => setForm({ ...form, passive_degrees: e.target.value })} /></div>
              </div>
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
              <th className="p-3 text-left">Data</th><th className="p-3 text-left">Articulação</th><th className="p-3 text-left">Movimento</th>
              <th className="p-3 text-left">Lado</th><th className="p-3">Ativo</th><th className="p-3">Passivo</th><th className="p-3">Normal</th><th></th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((r: any) => {
                const normal = getRomNormal(r.joint, r.movement);
                return (
                  <tr key={r.id}>
                    <td className="p-3">{format(new Date(r.measured_at), "dd/MM/yyyy")}</td>
                    <td className="p-3">{r.joint}</td>
                    <td className="p-3">{r.movement}</td>
                    <td className="p-3">{r.side ?? "—"}</td>
                    <td className="p-3 text-center">{r.active_degrees ?? "—"}°</td>
                    <td className="p-3 text-center">{r.passive_degrees ?? "—"}°</td>
                    <td className="p-3 text-center text-muted-foreground">{normal ?? "—"}°</td>
                    <td className="p-2"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
