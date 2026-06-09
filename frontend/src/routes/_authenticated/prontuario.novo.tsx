import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, UserPlus, FileText, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prontuario/novo")({
  head: () => ({ meta: [{ title: "Novo prontuário — FisioAgenda Pro" }] }),
  component: NovoProntuario,
});

function maskCPF(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function NovoProntuario() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ full_name: "", phone: "", cpf: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  // SOAP form
  const [pain, setPain] = useState([0]);
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [saving, setSaving] = useState(false);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await supabase.from("patients").select("id, full_name, phone, cpf").order("full_name")).data ?? [],
  });

  const matches = useMemo(() => {
    if (!q.trim()) return [];
    const ql = q.toLowerCase();
    return patients
      .filter((p: any) => p.full_name?.toLowerCase().includes(ql) || (p.phone ?? "").includes(q))
      .slice(0, 6);
  }, [q, patients]);

  const exact = matches.find((p: any) => p.full_name?.toLowerCase() === q.toLowerCase().trim());

  async function quickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (quick.full_name.trim().length < 2) return toast.error("Informe o nome completo");
    const payload = {
      full_name: quick.full_name.trim(),
      phone: quick.phone || null,
      cpf: quick.cpf || null,
      classification: "estavel",
    };
    const { data, error } = await supabase.from("patients").insert(payload).select().single();
    if (error) return toast.error(error.message);
    toast.success("Paciente cadastrado");
    setSelected(data);
    setQ(data.full_name);
    setQuickOpen(false);
    setQuick({ full_name: "", phone: "", cpf: "" });
    qc.invalidateQueries({ queryKey: ["patients"] });
  }

  async function saveRecord() {
    if (!selected?.id) return toast.error("Selecione um paciente");
    setSaving(true);
    const { error } = await supabase.from("records").insert({
      patient_id: selected.id,
      pain_scale: pain[0],
      subjective: soap.subjective || null,
      objective: soap.objective || null,
      assessment: soap.assessment || null,
      plan: soap.plan || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Prontuário registrado");
    navigate({ to: "/pacientes/$id", params: { id: selected.id } });
  }

  const painColor =
    pain[0] <= 3 ? "text-success" : pain[0] <= 6 ? "text-amber-600" : "text-destructive";

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Novo prontuário</h1>
        <p className="text-sm text-muted-foreground">Busque o paciente ou cadastre na hora.</p>
      </div>

      <Card className="p-4 space-y-3">
        <Label>Paciente</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            className="pl-9"
            placeholder="Digite o nome ou telefone..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setSelected(null); }}
          />
        </div>

        {selected && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 text-success border border-success/20">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">{selected.full_name} selecionado</span>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setSelected(null); setQ(""); }}>
              Trocar
            </Button>
          </div>
        )}

        {!selected && q.trim().length >= 2 && (
          <div className="border rounded-xl overflow-hidden">
            {matches.map((p: any) => (
              <button key={p.id} type="button" onClick={() => setSelected(p)}
                className="w-full text-left p-3 hover:bg-muted flex items-center gap-3 border-b last:border-b-0">
                <div className="h-8 w-8 rounded-full gradient-brand text-white flex items-center justify-center text-xs font-bold">
                  {p.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.full_name}</p>
                  {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                </div>
              </button>
            ))}
            {!exact && (
              <button type="button" onClick={() => {
                setQuick({ ...quick, full_name: q });
                setQuickOpen(true);
              }} className="w-full text-left p-3 hover:bg-primary/5 flex items-center gap-3 text-primary">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">Cadastrar “{q}” agora</span>
              </button>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Label className="text-base font-display font-bold">Escala de dor (EVA)</Label>
          <span className={`text-2xl font-bold ${painColor}`}>{pain[0]}/10</span>
        </div>
        <Slider value={pain} onValueChange={setPain} min={0} max={10} step={1} />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Sem dor</span><span>Moderada</span><span>Insuportável</span>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <Label>S — Subjetivo (o que o paciente relata)</Label>
        <Textarea rows={3} value={soap.subjective} onChange={(e) => setSoap({ ...soap, subjective: e.target.value })} />
      </Card>
      <Card className="p-4 space-y-3">
        <Label>O — Objetivo (achados do fisioterapeuta)</Label>
        <Textarea rows={3} value={soap.objective} onChange={(e) => setSoap({ ...soap, objective: e.target.value })} />
      </Card>
      <Card className="p-4 space-y-3">
        <Label>A — Avaliação</Label>
        <Textarea rows={3} value={soap.assessment} onChange={(e) => setSoap({ ...soap, assessment: e.target.value })} />
      </Card>
      <Card className="p-4 space-y-3">
        <Label>P — Plano e orientações</Label>
        <Textarea rows={3} value={soap.plan} onChange={(e) => setSoap({ ...soap, plan: e.target.value })} />
      </Card>

      <div className="flex gap-3 sticky bottom-20 md:bottom-4 z-10">
        <Button className="flex-1 gradient-brand text-white" onClick={saveRecord} disabled={saving || !selected}>
          {saving ? "Salvando..." : "Salvar prontuário"}
        </Button>
      </div>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro rápido</DialogTitle>
            <DialogDescription className="sr-only">Cadastre rapidamente um novo paciente para o prontuário.</DialogDescription>
          </DialogHeader>
          <form onSubmit={quickCreate} className="space-y-3">
            <div>
              <Label>Nome completo *</Label>
              <Input value={quick.full_name} onChange={(e) => setQuick({ ...quick, full_name: e.target.value })} required />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={quick.phone} onChange={(e) => setQuick({ ...quick, phone: e.target.value })} placeholder="(64) 9..." />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={quick.cpf} onChange={(e) => setQuick({ ...quick, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" />
            </div>
            <Button type="submit" className="w-full gradient-brand text-white">
              Cadastrar e selecionar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
