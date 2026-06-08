import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileDown, Save } from "lucide-react";
import { downloadAnamnesePDF } from "@/lib/pdf";
import { COMORBIDITIES, TREATMENT_OBJECTIVES } from "@/lib/clinical-constants";

const FIELDS: { key: string; label: string; rows?: number }[] = [
  { key: "chief_complaint", label: "Queixa principal", rows: 3 },
  { key: "history_present", label: "História da moléstia atual (HMA)", rows: 3 },
  { key: "history_past", label: "História pregressa", rows: 2 },
  { key: "surgeries", label: "Cirurgias prévias (com datas)" },
  { key: "medications", label: "Medicações em uso" },
  { key: "allergies", label: "Alergias" },
  { key: "habits", label: "Hábitos (tabagismo, etilismo)" },
  { key: "family_history", label: "Antecedentes familiares" },
  { key: "occupation", label: "Ocupação / postura no trabalho" },
  { key: "physical_activity", label: "Atividade física (tipo + frequência)" },
  { key: "sleep", label: "Sono (horas por noite e qualidade)" },
];

function splitList(s?: string | null): string[] {
  return (s ?? "").split(";").map((x) => x.trim()).filter(Boolean);
}
function joinList(arr: string[]): string { return arr.join("; "); }

export function AnamneseTab({ patientId, patient }: { patientId: string; patient: any }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["anamnese", patientId],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("anamnese").select("*").eq("patient_id", patientId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  const comorb = splitList(form.notes?.match(/Comorbidades:(.*?)(\n|$)/)?.[1]);
  const objectives = splitList(form.notes?.match(/Objetivos:(.*?)(\n|$)/)?.[1]);
  const stressLevel = Number(form.notes?.match(/Estresse:(\d+)/)?.[1] ?? 0);
  const doctorName = form.notes?.match(/Médico solicitante:(.*?)(\n|$)/)?.[1]?.trim() ?? "";
  const insurancePlan = form.notes?.match(/Convênio:(.*?)(\n|$)/)?.[1]?.trim() ?? "";
  const sessionsAuth = form.notes?.match(/Sessões autorizadas:(\d+)/)?.[1] ?? "";

  function setNotesField(key: string, value: string) {
    const lines = (form.notes ?? "").split("\n").filter((l: string) => !l.startsWith(`${key}:`));
    if (value.trim()) lines.push(`${key}: ${value}`);
    setForm({ ...form, notes: lines.join("\n") });
  }

  function toggleComorb(c: string) {
    const next = comorb.includes(c) ? comorb.filter((x) => x !== c) : [...comorb, c];
    setNotesField("Comorbidades", joinList(next));
  }
  function toggleObjective(o: string) {
    const next = objectives.includes(o) ? objectives.filter((x) => x !== o) : [...objectives, o];
    setNotesField("Objetivos", joinList(next));
  }

  async function save() {
    const payload = { ...form, patient_id: patientId };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.therapist_id; delete payload.created_by;
    const { error } = data
      ? await (supabase.from as any)("anamnese").update(payload).eq("id", data.id)
      : await (supabase.from as any)("anamnese").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Anamnese salva");
    qc.invalidateQueries({ queryKey: ["anamnese", patientId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => downloadAnamnesePDF({ patient, anamnese: form })}>
          <FileDown className="h-4 w-4 mr-1" />PDF
        </Button>
        <Button className="gradient-brand text-white" onClick={save}>
          <Save className="h-4 w-4 mr-1" />Salvar
        </Button>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.rows && f.rows > 2 ? "md:col-span-2" : ""}>
            <Label>{f.label}</Label>
            {f.rows ? (
              <Textarea rows={f.rows} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            ) : (
              <Input value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
        <p className="text-sm font-medium">Convênio e médico solicitante</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label>Médico solicitante</Label>
            <Input value={doctorName} onChange={(e) => setNotesField("Médico solicitante", e.target.value)} placeholder="Nome + especialidade" />
          </div>
          <div><Label>Convênio / plano</Label>
            <Input value={insurancePlan} onChange={(e) => setNotesField("Convênio", e.target.value)} placeholder="Particular, Unimed..." />
          </div>
          <div><Label>Sessões autorizadas</Label>
            <Input type="number" value={sessionsAuth} onChange={(e) => setNotesField("Sessões autorizadas", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card space-y-2">
        <p className="text-sm font-medium">Comorbidades</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COMORBIDITIES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={comorb.includes(c)} onCheckedChange={() => toggleComorb(c)} />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card space-y-2">
        <p className="text-sm font-medium">Objetivos do tratamento</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TREATMENT_OBJECTIVES.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={objectives.includes(o)} onCheckedChange={() => toggleObjective(o)} />
              {o}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <Label>Nível de estresse: <span className="font-bold text-primary">{stressLevel}/10</span></Label>
        <input type="range" min={0} max={10} value={stressLevel}
          onChange={(e) => setNotesField("Estresse", e.target.value)} className="w-full mt-2" />
      </div>
    </div>
  );
}
