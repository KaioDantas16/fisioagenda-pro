import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, MessageCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CLASSIFICATIONS } from "@/lib/brand";
import { maskCPF } from "@/lib/cpf";
import { MessageModal } from "@/components/MessageModal";

export const Route = createFileRoute("/_authenticated/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — FisioAgenda Pro" }] }),
  component: Pacientes,
});

const emptyForm = {
  full_name: "", phone: "", email: "", birth_date: "",
  address: "", notes: "", cpf: "", rg: "", gender: "", insurance: "",
  profissao: "", escolaridade: "", estado_civil: "", cep: "",
  doctor_name: "", insurance_plan: "", sessions_authorized: "",
  classification: "estavel",
};

function Pacientes() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = patients.filter((p: any) => {
    if (classFilter !== "all" && p.classification !== classFilter) return false;
    if (!q) return true;
    const ql = q.toLowerCase();
    return p.full_name?.toLowerCase().includes(ql) || (p.phone ?? "").includes(q);
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return toast.error("Informe o nome completo");
    const payload: any = {
      ...form,
      birth_date: form.birth_date || null,
      email: form.email || null,
      cpf: form.cpf || null,
      gender: form.gender || null,
      insurance: form.insurance || null,
      sessions_authorized: form.sessions_authorized ? Number(form.sessions_authorized) : null,
    };
    const { error } = await supabase.from("patients").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Paciente cadastrado");
    setForm(emptyForm);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["patients"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{patients.length} cadastrados · {filtered.length} filtrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-2" />Novo paciente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo paciente</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div>
                <Label>Nome completo *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(64) 9..." />
                </div>
                <div>
                  <Label>Nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" inputMode="numeric" />
                </div>
                <div>
                  <Label>Gênero</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Convênio/Plano</Label>
                  <Input value={form.insurance} onChange={(e) => setForm({ ...form, insurance: e.target.value })} placeholder="Particular" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>RG</Label>
                  <Input value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} />
                </div>
                <div>
                  <Label>Estado civil</Label>
                  <Select value={form.estado_civil} onValueChange={(v) => setForm({ ...form, estado_civil: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Profissão</Label>
                  <Input value={form.profissao} onChange={(e) => setForm({ ...form, profissao: e.target.value })} />
                </div>
                <div>
                  <Label>Escolaridade</Label>
                  <Select value={form.escolaridade} onValueChange={(v) => setForm({ ...form, escolaridade: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {["Fundamental", "Médio", "Superior", "Pós-graduação"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>CEP</Label>
                  <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" />
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Médico solicitante</Label>
                  <Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} placeholder="Nome + CRM" />
                </div>
                <div>
                  <Label>Sessões autorizadas</Label>
                  <Input type="number" value={form.sessions_authorized} onChange={(e) => setForm({ ...form, sessions_authorized: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Classificação clínica</Label>
                <Select value={form.classification} onValueChange={(v) => setForm({ ...form, classification: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLASSIFICATIONS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <Button type="submit" className="w-full gradient-brand text-white">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as classificações</SelectItem>
            {Object.entries(CLASSIFICATIONS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground text-sm">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">Nenhum paciente encontrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p: any) => {
              const cls = CLASSIFICATIONS[p.classification] ?? CLASSIFICATIONS.estavel;
              return (
                <li key={p.id} role="button" tabIndex={0}
                  onClick={() => navigate({ to: "/pacientes/$id", params: { id: p.id } })}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate({ to: "/pacientes/$id", params: { id: p.id } }); } }}
                  aria-label={`Abrir perfil de ${p.full_name}`}
                  className="cursor-pointer p-3 sm:p-4 flex items-center gap-3 hover:bg-muted/40 focus:bg-muted/40 outline-none transition-colors">
                  <div className="h-10 w-10 rounded-full gradient-brand text-white flex items-center justify-center font-display font-bold shrink-0">
                    {p.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.full_name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${cls.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} />{cls.label}
                      </span>
                      {p.phone && <span>{p.phone}</span>}
                    </div>
                  </div>
                  {(p.phone || p.email) && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <MessageModal patientName={p.full_name} phone={p.phone} email={p.email}
                        trigger={<button title="Mensagem" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#25D366]/15 text-[#1d9d4d] hover:bg-[#25D366]/25">
                          <MessageCircle className="h-4 w-4" />
                        </button>} />
                    </div>
                  )}
                  <span className="h-9 w-9 inline-flex items-center justify-center rounded-full text-muted-foreground pointer-events-none">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
