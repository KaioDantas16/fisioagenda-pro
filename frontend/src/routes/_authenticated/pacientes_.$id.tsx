import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
// useServerFn replaced by direct async call (Supabase-only architecture)

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, MessageCircle, Plus, FileDown, Trash2, KeyRound, Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CLASSIFICATIONS } from "@/lib/brand";
import { MessageModal } from "@/components/MessageModal";
import { downloadProntuarioPDF, downloadFrequenciaPDF } from "@/lib/pdf";
import { format } from "date-fns";
import { createPatientPortalAccess } from "@/lib/patient-portal.functions";
import { COMMON_CID10 } from "@/lib/clinical-constants";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AnamneseTab } from "@/components/clinical/AnamneseTab";
import { FunctionalTab } from "@/components/clinical/FunctionalTab";
import { PainMapTab } from "@/components/clinical/PainMapTab";
import { RomTab } from "@/components/clinical/RomTab";
import { TestsTab } from "@/components/clinical/TestsTab";
import { PerimetryTab } from "@/components/clinical/PerimetryTab";
import { EvolutionTab } from "@/components/clinical/EvolutionTab";
import { AttachmentsTab } from "@/components/clinical/AttachmentsTab";
import { NeuroTab } from "@/components/clinical/NeuroTab";
import { PackagesTab } from "@/components/clinical/PackagesTab";

export const Route = createFileRoute("/_authenticated/pacientes_/$id")({
  head: () => ({ meta: [{ title: "Paciente — FisioAgenda Pro" }] }),
  component: PatientProfile,
});

function PatientProfile() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: patient } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["records", id],
    queryFn: async () => (await supabase.from("records").select("*").eq("patient_id", id).order("record_date", { ascending: false })).data ?? [],
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", id],
    queryFn: async () => (await supabase.from("sessions").select("*").eq("patient_id", id).order("starts_at", { ascending: false })).data ?? [],
  });
  const { data: vitals = [] } = useQuery({
    queryKey: ["vitals", id],
    queryFn: async () => (await supabase.from("vital_signs").select("*").eq("patient_id", id).order("measured_at", { ascending: false })).data ?? [],
  });
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", id],
    queryFn: async () => (await supabase.from("goals").select("*").eq("patient_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const invAll = () => {
    qc.invalidateQueries({ queryKey: ["records", id] });
    qc.invalidateQueries({ queryKey: ["sessions", id] });
    qc.invalidateQueries({ queryKey: ["vitals", id] });
    qc.invalidateQueries({ queryKey: ["goals", id] });
  };

  if (!patient) return <p className="text-muted-foreground">Carregando...</p>;
  const cls = CLASSIFICATIONS[patient.classification] ?? CLASSIFICATIONS.estavel;

  async function exportPDF() {
    const [an, fa, pm, rm, st, pe] = await Promise.all([
      (supabase.from as any)("anamnese").select("*").eq("patient_id", id).maybeSingle(),
      (supabase.from as any)("functional_assessment").select("*").eq("patient_id", id),
      (supabase.from as any)("pain_map_entries").select("*").eq("patient_id", id),
      (supabase.from as any)("rom_measurements").select("*").eq("patient_id", id),
      (supabase.from as any)("special_tests").select("*").eq("patient_id", id),
      (supabase.from as any)("perimetry").select("*").eq("patient_id", id),
    ]);
    downloadProntuarioPDF({
      patient, records, vitals, sessions,
      anamnese: an.data, functional: fa.data ?? [], painMap: pm.data ?? [],
      rom: rm.data ?? [], tests: st.data ?? [], perimetry: pe.data ?? [],
    });
  }
  function exportFrequencia() {
    const label = format(new Date(), "MM/yyyy");
    downloadFrequenciaPDF({ patient, sessions, periodLabel: label });
  }

  async function updateClass(value: string) {
    const { error } = await supabase.from("patients").update({ classification: value }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Classificação atualizada");
    qc.invalidateQueries({ queryKey: ["patient", id] });
    qc.invalidateQueries({ queryKey: ["patients"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/pacientes"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl truncate">{patient.full_name}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {patient.phone ?? "—"}{patient.email ? ` · ${patient.email}` : ""}
          </p>
        </div>
        <MessageModal patientName={patient.full_name} phone={patient.phone} email={patient.email}
          trigger={<Button variant="outline" size="icon" title="Mensagem"><MessageCircle className="h-4 w-4" /></Button>} />
        <Button variant="outline" onClick={exportPDF}><FileDown className="h-4 w-4 mr-1" />PDF</Button>
        <DeletePatientButton patientId={id} patientName={patient.full_name} />
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card flex flex-wrap items-center gap-3">
        <div className="text-xs">
          <Label className="text-xs">Classificação</Label>
          <Select value={patient.classification} onValueChange={updateClass}>
            <SelectTrigger className={`mt-1 h-8 w-44 ${cls.className} border`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CLASSIFICATIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {patient.birth_date && <div className="text-xs"><span className="text-muted-foreground">Nasc.: </span>{format(new Date(patient.birth_date), "dd/MM/yyyy")}</div>}
        {patient.cpf && <div className="text-xs"><span className="text-muted-foreground">CPF: </span>{patient.cpf}</div>}
        {patient.insurance && <div className="text-xs"><span className="text-muted-foreground">Plano: </span>{patient.insurance}</div>}
        <div className="ml-auto">
          <PortalAccessControl patient={patient} onChange={() => qc.invalidateQueries({ queryKey: ["patient", id] })} />
        </div>
      </div>

      <Tabs defaultValue="records">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 w-full">
          <TabsTrigger value="records">SOAP</TabsTrigger>
          <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
          <TabsTrigger value="functional">Funcional</TabsTrigger>
          <TabsTrigger value="painmap">Mapa de dor</TabsTrigger>
          <TabsTrigger value="rom">ADM</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="neuro">Neurológico</TabsTrigger>
          <TabsTrigger value="perimetry">Perimetria</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="vitals">Sinais Vitais</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="packages">Pacotes</TabsTrigger>
          <TabsTrigger value="attachments">Anexos</TabsTrigger>
        </TabsList>
        <TabsContent value="records" className="mt-4"><RecordsTab patientId={id} records={records} onChange={invAll} /></TabsContent>
        <TabsContent value="anamnese" className="mt-4"><AnamneseTab patientId={id} patient={patient} /></TabsContent>
        <TabsContent value="functional" className="mt-4"><FunctionalTab patientId={id} /></TabsContent>
        <TabsContent value="painmap" className="mt-4"><PainMapTab patientId={id} /></TabsContent>
        <TabsContent value="rom" className="mt-4"><RomTab patientId={id} /></TabsContent>
        <TabsContent value="tests" className="mt-4"><TestsTab patientId={id} /></TabsContent>
        <TabsContent value="neuro" className="mt-4"><NeuroTab patientId={id} /></TabsContent>
        <TabsContent value="perimetry" className="mt-4"><PerimetryTab patientId={id} /></TabsContent>
        <TabsContent value="evolution" className="mt-4"><EvolutionTab patientId={id} patient={patient} /></TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <div className="flex justify-end mb-2"><Button variant="outline" size="sm" onClick={exportFrequencia}><FileDown className="h-3.5 w-3.5 mr-1" />Frequência (mês)</Button></div>
          <SessionsTab patientId={id} patient={patient} sessions={sessions} onChange={invAll} />
        </TabsContent>
        <TabsContent value="vitals" className="mt-4"><VitalsTab patientId={id} vitals={vitals} onChange={invAll} /></TabsContent>
        <TabsContent value="goals" className="mt-4"><GoalsTab patientId={id} goals={goals} onChange={invAll} /></TabsContent>
        <TabsContent value="packages" className="mt-4"><PackagesTab patientId={id} /></TabsContent>
        <TabsContent value="attachments" className="mt-4"><AttachmentsTab patientId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}

function painColor(v: number) {
  if (v <= 3) return "bg-success";
  if (v <= 6) return "bg-warning";
  return "bg-destructive";
}

function RecordsTab({ patientId, records, onChange }: any) {
  const [open, setOpen] = useState(false);
  const initial = {
    record_date: format(new Date(), "yyyy-MM-dd"),
    subjective: "", objective: "", assessment: "", plan: "", pain_scale: 0,
    cid10: "", pain_location_text: "", evolution_score: 5,
  };
  const [form, setForm] = useState<any>(initial);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("records").insert({ ...form, patient_id: patientId } as any);
    if (error) return toast.error(error.message);
    toast.success("Prontuário salvo");
    setOpen(false); setForm(initial);
    onChange();
  }
  async function remove(rid: string) {
    const { error } = await supabase.from("records").delete().eq("id", rid);
    if (error) return toast.error(error.message);
    toast.success("Prontuário excluído");
    onChange();
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Novo SOAP</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Prontuário SOAP</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} />
              </div>
              <div>
                <Label className="font-bold text-primary">S — Subjetivo</Label>
                <Textarea rows={3} placeholder="Queixa principal, história relatada pelo paciente..."
                  value={form.subjective} onChange={(e) => setForm({ ...form, subjective: e.target.value })} />
              </div>
              <div>
                <Label className="font-bold text-primary">O — Objetivo</Label>
                <Textarea rows={3} placeholder="Achados do exame físico, testes, medições..."
                  value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
              </div>
              <div>
                <Label className="font-bold text-primary">A — Avaliação</Label>
                <Textarea rows={3} placeholder="Hipótese diagnóstica, análise clínica..."
                  value={form.assessment} onChange={(e) => setForm({ ...form, assessment: e.target.value })} />
              </div>
              <div>
                <Label className="font-bold text-primary">P — Plano</Label>
                <Textarea rows={3} placeholder="Condutas, exercícios prescritos, próximos passos..."
                  value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>CID-10</Label>
                  <Input list="cid10-list" value={form.cid10} onChange={(e) => setForm({ ...form, cid10: e.target.value })} placeholder="Ex: M54.5" />
                  <datalist id="cid10-list">
                    {COMMON_CID10.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                  </datalist>
                </div>
                <div>
                  <Label>Localização da dor</Label>
                  <Input value={form.pain_location_text} onChange={(e) => setForm({ ...form, pain_location_text: e.target.value })} placeholder="Ex: Lombar D irradiando para MID" />
                </div>
              </div>
              <div>
                <Label>Escala de dor EVA: <span className={`inline-block ml-2 px-2 py-0.5 rounded text-white text-sm font-bold ${painColor(form.pain_scale)}`}>{form.pain_scale}/10</span></Label>
                <input type="range" min={0} max={10} value={form.pain_scale}
                  onChange={(e) => setForm({ ...form, pain_scale: Number(e.target.value) })}
                  className="w-full mt-2 accent-primary" style={{ accentColor: form.pain_scale <= 3 ? "#22c55e" : form.pain_scale <= 6 ? "#f59e0b" : "#ef4444" }} />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Sem dor</span><span>Dor máxima</span></div>
              </div>
              <div>
                <Label>Escore de evolução (0-10): <span className="font-bold text-primary ml-2">{form.evolution_score}/10</span></Label>
                <input type="range" min={0} max={10} value={form.evolution_score}
                  onChange={(e) => setForm({ ...form, evolution_score: Number(e.target.value) })}
                  className="w-full mt-2 accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Piora</span><span>Melhora total</span></div>
              </div>
              <Button type="submit" className="w-full gradient-brand text-white">Salvar prontuário</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhum prontuário registrado.</p>
      ) : records.map((r: any) => (
        <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{format(new Date(r.record_date), "dd/MM/yyyy")}</div>
            <div className="flex items-center gap-2">
              {typeof r.pain_scale === "number" && (
                <span className={`text-xs px-2 py-0.5 rounded text-white font-bold ${painColor(r.pain_scale)}`}>EVA {r.pain_scale}/10</span>
              )}
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon" className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}
                title="Excluir prontuário?"
                description="Esta ação não pode ser desfeita. O prontuário SOAP será removido permanentemente."
                confirmLabel="Excluir permanentemente"
                destructive
                onConfirm={() => remove(r.id)} />
            </div>
          </div>
          {(r.cid10 || r.pain_location_text) && (
            <p className="text-xs text-muted-foreground">{r.cid10 && <span className="font-bold">CID {r.cid10}</span>}{r.cid10 && r.pain_location_text && " · "}{r.pain_location_text}</p>
          )}
          <SoapField label="S" text={r.subjective} />
          <SoapField label="O" text={r.objective} />
          <SoapField label="A" text={r.assessment} />
          <SoapField label="P" text={r.plan} />
        </div>
      ))}
    </div>
  );
}

function SoapField({ label, text }: { label: string; text?: string | null }) {
  if (!text) return null;
  return (
    <div className="text-sm">
      <span className="font-bold text-primary mr-2">{label}:</span>
      <span className="whitespace-pre-wrap">{text}</span>
    </div>
  );
}

function SessionsTab({ patientId, patient, sessions, onChange }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration_minutes: 60, procedure: "", price: "", payment_method: "", status: "agendado", notes: "",
  });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("sessions").insert({
      patient_id: patientId,
      starts_at: new Date(form.starts_at).toISOString(),
      duration_minutes: Number(form.duration_minutes),
      procedure: form.procedure || null,
      price: form.price ? Number(form.price) : null,
      payment_method: form.payment_method || null,
      status: form.status,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Sessão registrada");
    setOpen(false);
    onChange();
  }
  async function remove(sid: string) {
    const { error } = await supabase.from("sessions").delete().eq("id", sid);
    if (error) return toast.error(error.message);
    toast.success("Sessão excluída");
    onChange();
  }
  async function exportReceipt(session: any) {
    const { downloadSessionReceiptPDF } = await import("@/lib/pdf");
    downloadSessionReceiptPDF({ patient, session });
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Nova sessão</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova sessão</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Data e hora</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Duração (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                      <SelectItem value="faltou">Faltou</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Procedimento</Label><Input value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Forma de pagamento</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-brand text-white">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhuma sessão registrada.</p>
      ) : sessions.map((s: any) => (
        <div key={s.id} className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{format(new Date(s.starts_at), "dd/MM/yyyy HH:mm")} · {s.duration_minutes}min</p>
            <p className="text-xs text-muted-foreground truncate">{s.procedure ?? "—"} · {s.status}{s.price ? ` · R$ ${Number(s.price).toFixed(2)}` : ""}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportReceipt(s)}><FileDown className="h-3.5 w-3.5 mr-1" />Recibo</Button>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-3.5 w-3.5" /></Button>}
            title="Excluir sessão?"
            description="Esta ação não pode ser desfeita. A sessão será removida permanentemente do histórico."
            confirmLabel="Excluir permanentemente"
            destructive
            onConfirm={() => remove(s.id)} />
        </div>
      ))}
    </div>
  );
}

function VitalsTab({ patientId, vitals, onChange }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ systolic: "", diastolic: "", heart_rate: "", respiratory_rate: "", temperature: "", spo2: "", weight: "", height: "", notes: "" });
  const bmi = form.weight && form.height ? (Number(form.weight) / (Number(form.height) ** 2)).toFixed(2) : null;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const num = (k: string) => (form[k] ? Number(form[k]) : null);
    const { error } = await supabase.from("vital_signs").insert({
      patient_id: patientId, systolic: num("systolic"), diastolic: num("diastolic"),
      heart_rate: num("heart_rate"), respiratory_rate: num("respiratory_rate"),
      temperature: num("temperature"), spo2: num("spo2"),
      weight: num("weight"), height: num("height"), notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Sinais vitais registrados");
    setOpen(false);
    setForm({ systolic: "", diastolic: "", heart_rate: "", respiratory_rate: "", temperature: "", spo2: "", weight: "", height: "", notes: "" });
    onChange();
  }
  async function remove(vid: string) {
    const { error } = await supabase.from("vital_signs").delete().eq("id", vid);
    if (error) return toast.error(error.message);
    toast.success("Registro excluído");
    onChange();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Novo registro</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Sinais Vitais</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>PA Sistólica (mmHg)</Label><Input type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: e.target.value })} /></div>
                <div><Label>PA Diastólica (mmHg)</Label><Input type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: e.target.value })} /></div>
                <div><Label>FC (bpm)</Label><Input type="number" value={form.heart_rate} onChange={(e) => setForm({ ...form, heart_rate: e.target.value })} /></div>
                <div><Label>FR (irpm)</Label><Input type="number" value={form.respiratory_rate} onChange={(e) => setForm({ ...form, respiratory_rate: e.target.value })} /></div>
                <div><Label>Temperatura (°C)</Label><Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
                <div><Label>SpO2 (%)</Label><Input type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} /></div>
                <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
                <div><Label>Altura (m)</Label><Input type="number" step="0.01" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></div>
              </div>
              {bmi && <div className="bg-primary/10 rounded-xl p-3 text-sm"><span className="font-bold text-primary">IMC calculado:</span> {bmi} kg/m²</div>}
              <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-brand text-white">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {vitals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhum registro de sinais vitais.</p>
      ) : (
        <div className="bg-card rounded-2xl shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-3">Data</th><th className="p-3">PA</th><th className="p-3">FC</th><th className="p-3">FR</th>
                <th className="p-3">Temp</th><th className="p-3">SpO2</th><th className="p-3">Peso</th><th className="p-3">Alt</th><th className="p-3">IMC</th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vitals.map((v: any) => (
                <tr key={v.id}>
                  <td className="p-3 whitespace-nowrap">{format(new Date(v.measured_at), "dd/MM HH:mm")}</td>
                  <td className="p-3">{v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : "—"}</td>
                  <td className="p-3">{v.heart_rate ?? "—"}</td>
                  <td className="p-3">{v.respiratory_rate ?? "—"}</td>
                  <td className="p-3">{v.temperature ?? "—"}</td>
                  <td className="p-3">{v.spo2 ?? "—"}</td>
                  <td className="p-3">{v.weight ?? "—"}</td>
                  <td className="p-3">{v.height ?? "—"}</td>
                  <td className="p-3 font-bold text-primary">{v.bmi ?? "—"}</td>
                  <td className="p-2"><ConfirmDialog
                    trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                    title="Excluir registro?"
                    description="Esta ação não pode ser desfeita. O registro de sinais vitais será removido permanentemente."
                    confirmLabel="Excluir permanentemente"
                    destructive
                    onConfirm={() => remove(v.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GoalsTab({ patientId, goals, onChange }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_date: "", progress: 0, status: "em_andamento" });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Informe o título da meta");
    const { error } = await supabase.from("goals").insert({
      patient_id: patientId, title: form.title, description: form.description || null,
      target_date: form.target_date || null, progress: form.progress, status: form.status,
    });
    if (error) return toast.error(error.message);
    toast.success("Meta criada");
    setOpen(false);
    setForm({ title: "", description: "", target_date: "", progress: 0, status: "em_andamento" });
    onChange();
  }
  async function updateProgress(gid: string, progress: number) {
    await supabase.from("goals").update({ progress, status: progress === 100 ? "concluida" : "em_andamento" }).eq("id", gid);
    onChange();
  }
  async function remove(gid: string) {
    const { error } = await supabase.from("goals").delete().eq("id", gid);
    if (error) return toast.error(error.message);
    toast.success("Meta excluída");
    onChange();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Nova meta</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader><DialogTitle>Nova meta terapêutica</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Prazo</Label><Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-brand text-white">Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhuma meta cadastrada.</p>
      ) : goals.map((g: any) => (
        <div key={g.id} className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{g.title}</p>
              {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
              {g.target_date && <p className="text-xs text-muted-foreground mt-1">Prazo: {format(new Date(g.target_date), "dd/MM/yyyy")}</p>}
            </div>
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon" className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}
              title="Excluir meta?"
              description="Esta ação não pode ser desfeita. A meta terapêutica será removida permanentemente."
              confirmLabel="Excluir permanentemente"
              destructive
              onConfirm={() => remove(g.id)} />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium">{g.progress}%</span>
              {g.status === "concluida" && <span className="text-xs text-success font-bold">✓ Concluída</span>}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-brand transition-all" style={{ width: `${g.progress}%` }} />
            </div>
            <input type="range" min={0} max={100} step={5} value={g.progress}
              onChange={(e) => updateProgress(g.id, Number(e.target.value))} className="w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PortalAccessControl({ patient, onChange }: { patient: any; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(patient.email ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const createAccess = createPatientPortalAccess;

  if (patient.patient_user_id) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-success/15 text-success border border-success/30">
        <ShieldCheck className="h-3.5 w-3.5" /> Portal ativo
      </span>
    );
  }

  async function submit() {
    setLoading(true);
    try {
      const res = await createAccess({ data: { patientId: patient.id, email } });
      setResult(res);
      toast.success("Acesso criado");
      onChange();
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao criar acesso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <KeyRound className="h-3.5 w-3.5" /> Criar acesso ao portal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acesso ao portal do paciente</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-3">
            <p className="text-sm">Acesso criado para <strong>{result.email}</strong>. Anote a senha agora — ela só será mostrada uma vez.</p>
            <div className="p-4 rounded-xl bg-muted font-mono text-lg text-center break-all select-all">
              {result.tempPassword}
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => {
              navigator.clipboard.writeText(result.tempPassword);
              toast.success("Senha copiada");
            }}>
              <Copy className="h-4 w-4" /> Copiar senha
            </Button>
            <p className="text-xs text-muted-foreground">
              No primeiro acesso o paciente deverá trocar a senha.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Será criado um login para o paciente acessar o portal e ver suas sessões e orientações.
            </p>
            <div>
              <Label>E-mail do paciente</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="paciente@exemplo.com" />
            </div>
            <Button className="w-full gradient-brand text-white" onClick={submit} disabled={loading || !email}>
              {loading ? "Criando..." : "Gerar senha temporária"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeletePatientButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  async function remove() {
    setBusy(true);
    const { error } = await (supabase as any).rpc("delete_patient_cascade", { _patient_id: patientId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Paciente "${patientName}" excluído ✓`);
    qc.invalidateQueries({ queryKey: ["patients"] });
    navigate({ to: "/pacientes" });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" title="Excluir paciente" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação remove em cascata <strong>todos os dados</strong> de {patientName}: prontuários, sessões, sinais vitais, anamnese, avaliações, anexos e metas. <strong>Não é possível desfazer.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Para confirmar, digite <strong>EXCLUIR</strong>:</Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="EXCLUIR" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={busy || confirmText !== "EXCLUIR"}
            onClick={remove}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {busy ? "Excluindo..." : "Excluir definitivamente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
