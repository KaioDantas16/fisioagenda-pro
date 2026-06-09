import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/ConfirmDialog";


const FIELDS = [
  { key: "posture", label: "Postura" },
  { key: "gait", label: "Marcha" },
  { key: "balance", label: "Equilíbrio" },
  { key: "strength", label: "Força global" },
  { key: "coordination", label: "Coordenação" },
  { key: "adl", label: "Atividades de vida diária (AVDs)" },
  { key: "functional_scale", label: "Escala funcional / pontuação" },
  { key: "notes", label: "Observações" },
];

export function FunctionalTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["functional", patientId],
    queryFn: async () => (await (supabase.from as any)("functional_assessment").select("*").eq("patient_id", patientId).order("assessment_date", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ assessment_date: format(new Date(), "yyyy-MM-dd") });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await (supabase.from as any)("functional_assessment").insert({ ...form, patient_id: patientId });
    if (error) return toast.error(error.message);
    toast.success("Avaliação registrada");
    setOpen(false); setForm({ assessment_date: format(new Date(), "yyyy-MM-dd") });
    qc.invalidateQueries({ queryKey: ["functional", patientId] });
  }
  async function remove(id: string) {
    const { error } = await (supabase.from as any)("functional_assessment").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Avaliação excluída");
    qc.invalidateQueries({ queryKey: ["functional", patientId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Nova avaliação</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Avaliação funcional</DialogTitle>
              <DialogDescription className="sr-only">Registre uma nova avaliação funcional do paciente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Data</Label><Input type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} required /></div>
              {FIELDS.map((f) => (
                <div key={f.key}><Label>{f.label}</Label>
                  <Textarea rows={2} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <Button type="submit" className="w-full gradient-brand text-white">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhuma avaliação registrada.</p>
      ) : list.map((a: any) => (
        <div key={a.id} className="bg-card rounded-2xl p-4 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{format(new Date(a.assessment_date), "dd/MM/yyyy")}</p>
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
              title="Excluir avaliação funcional?"
              description="Esta ação não pode ser desfeita. A avaliação será removida permanentemente."
              confirmLabel="Excluir permanentemente"
              destructive
              onConfirm={() => remove(a.id)} />
          </div>
          {FIELDS.map((f) => a[f.key] ? (
            <div key={f.key} className="text-sm"><span className="font-bold text-primary">{f.label}: </span><span className="whitespace-pre-wrap">{a[f.key]}</span></div>
          ) : null)}
        </div>
      ))}
    </div>
  );
}
