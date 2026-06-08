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
import { SPECIAL_TEST_RESULTS, BODY_REGIONS, TEST_CATALOG } from "@/lib/clinical-constants";

const RESULT_COLOR: Record<string, string> = {
  positivo: "bg-destructive text-destructive-foreground",
  negativo: "bg-success text-success-foreground",
  inconclusivo: "bg-warning text-warning-foreground",
};

export function TestsTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["tests", patientId],
    queryFn: async () => (await (supabase.from as any)("special_tests").select("*").eq("patient_id", patientId).order("performed_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ performed_at: format(new Date(), "yyyy-MM-dd"), test_name: "", region: "", result: "inconclusivo" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.test_name.trim()) return toast.error("Informe o nome do teste");
    const { error } = await (supabase.from as any)("special_tests").insert({ ...form, patient_id: patientId });
    if (error) return toast.error(error.message);
    toast.success("Teste registrado");
    setOpen(false); setForm({ performed_at: format(new Date(), "yyyy-MM-dd"), test_name: "", region: "", result: "inconclusivo" });
    qc.invalidateQueries({ queryKey: ["tests", patientId] });
  }
  async function remove(id: string) {
    await (supabase.from as any)("special_tests").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["tests", patientId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Novo teste</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader><DialogTitle>Teste especial</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3 max-h-[70vh] overflow-y-auto">
              <div><Label>Data</Label><Input type="date" value={form.performed_at} onChange={(e) => setForm({ ...form, performed_at: e.target.value })} /></div>
              <div><Label>Teste (catálogo)</Label>
                <Select value={form.test_name} onValueChange={(v) => {
                  const region = TEST_CATALOG.find((g) => g.tests.includes(v))?.region ?? "";
                  setForm({ ...form, test_name: v, region });
                }}>
                  <SelectTrigger><SelectValue placeholder="Escolha do catálogo ou digite abaixo" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {TEST_CATALOG.map((g) => (
                      <div key={g.region}>
                        <div className="px-2 py-1 text-xs font-bold text-muted-foreground">{g.region}</div>
                        {g.tests.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Ou nome livre</Label><Input value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} placeholder="Outro teste" /></div>
              <div><Label>Região</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{BODY_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Resultado</Label>
                <Select value={form.result} onValueChange={(v) => setForm({ ...form, result: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SPECIAL_TEST_RESULTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Observação</Label><Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-brand text-white">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhum teste registrado.</p>
      ) : list.map((t: any) => (
        <div key={t.id} className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t.test_name} {t.region && <span className="text-muted-foreground">· {t.region}</span>}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(t.performed_at), "dd/MM/yyyy")} {t.notes && `· ${t.notes}`}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded font-bold capitalize ${RESULT_COLOR[t.result] ?? ""}`}>{t.result}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}
