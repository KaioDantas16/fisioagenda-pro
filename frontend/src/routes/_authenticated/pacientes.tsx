import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveTherapistId } from "@/hooks/use-effective-therapist-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, MessageCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CLASSIFICATIONS } from "@/lib/brand";
import { maskCPF } from "@/lib/cpf";
import { MessageModal } from "@/components/MessageModal";
import { PatientForm } from "@/components/clinical/PatientForm";

export const Route = createFileRoute("/_authenticated/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — FisioAgenda Pro" }] }),
  component: Pacientes,
});

function Pacientes() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: therapistId } = useEffectiveTherapistId();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", therapistId],
    queryFn: async () => {
      if (!therapistId) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("therapist_id", therapistId)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!therapistId,
  });

  const filtered = patients.filter((p: any) => {
    if (classFilter !== "all" && p.classification !== classFilter) return false;
    if (!q) return true;
    const ql = q.toLowerCase();
    return p.full_name?.toLowerCase().includes(ql) || (p.phone ?? "").includes(q);
  });

  async function save(payloadForm: any) {
    if (payloadForm.full_name.trim().length < 2) return toast.error("Informe o nome completo");
    const payload: any = {
      ...payloadForm,
      birth_date: payloadForm.birth_date || null,
      email: payloadForm.email || null,
      cpf: payloadForm.cpf || null,
      gender: payloadForm.gender || null,
      insurance: payloadForm.insurance || null,
      sessions_authorized: payloadForm.sessions_authorized ? Number(payloadForm.sessions_authorized) : null,
      therapist_id: therapistId,
    };
    const { error } = await supabase.from("patients").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Paciente cadastrado");
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
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2 border-b shrink-0">
              <DialogTitle>Novo paciente</DialogTitle>
              <DialogDescription className="sr-only">Cadastre um novo paciente preenchendo os dados básicos.</DialogDescription>
            </DialogHeader>
            <PatientForm 
              onSubmit={save}
              onCancel={() => setOpen(false)}
            />
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
