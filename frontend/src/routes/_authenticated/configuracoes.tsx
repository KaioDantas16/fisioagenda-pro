import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveTherapistId } from "@/hooks/use-effective-therapist-id";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { THEMES, applyTheme } from "@/lib/brand";
import { waLink } from "@/lib/whatsapp";
import { useCurrentUser } from "@/hooks/use-current-user";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { downloadFinancialPDF, downloadMonthlyReportPDF } from "@/lib/pdf";
import { Plus, Trash2, MessageCircle, FileDown, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — FisioAgenda Pro" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useCurrentUser();
  useEffect(() => {
    if (!isLoading && me && !me.isAdmin) {
      toast.error("Acesso restrito a administradores.");
      navigate({ to: "/dashboard" });
    }
  }, [me, isLoading, navigate]);

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!me?.isAdmin) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          {me?.isSuperAdmin ? "Painel de super administrador" : "Painel da clínica"}
        </p>
      </div>
      <Tabs defaultValue="clinic">
        <TabsList className={cn("grid w-full h-auto", me?.isSuperAdmin ? "grid-cols-2 sm:grid-cols-6" : "grid-cols-1 sm:grid-cols-3")}>
          <TabsTrigger value="clinic">Clínica</TabsTrigger>
          {me?.isSuperAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
          <TabsTrigger value="theme">Aparência</TabsTrigger>
          {me?.isSuperAdmin && <TabsTrigger value="integrations">Integrações</TabsTrigger>}
          {me?.isSuperAdmin && <TabsTrigger value="logs">Logs</TabsTrigger>}
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="clinic" className="mt-5"><ClinicTab /></TabsContent>
        {me?.isSuperAdmin && <TabsContent value="users" className="mt-5"><UsersTab /></TabsContent>}
        <TabsContent value="theme" className="mt-5"><ThemeTab /></TabsContent>
        {me?.isSuperAdmin && <TabsContent value="integrations" className="mt-5"><IntegrationsTab /></TabsContent>}
        {me?.isSuperAdmin && <TabsContent value="logs" className="mt-5"><LogsTab /></TabsContent>}
        <TabsContent value="reports" className="mt-5"><ReportsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ClinicTab() {
  const qc = useQueryClient();
  const { data: clinic, isSuccess } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: async () => (await supabase.from("clinic_settings").select("*").maybeSingle()).data,
  });
  const [form, setForm] = useState<any>(null);
  const [newSpec, setNewSpec] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isSuccess && !form) {
      setForm(clinic || {
        name: "Centro Especializado Equilíbrio e Movimento",
        address: "Caldas Novas, GO",
        phone: "(64) 9 0000-0000",
        instagram: "@lenilson_gouveia",
        professional_name: "Lenilson Gouveia de Jesus",
        crefito: "CREFITO-9",
        specialties: ["Fisioterapia ortopédica", "Fisioterapia neurológica", "RPG", "Pilates clínico"],
        theme: "default"
      });
    }
  }, [clinic, isSuccess, form]);

  if (!form) return <p className="text-muted-foreground text-sm">Carregando...</p>;

  async function save() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return toast.error("Usuário não autenticado");
    const therapistId = form.therapist_id || userData.user.id;

    const { data: savedData, error } = await supabase.from("clinic_settings").upsert({
      id: form.id || undefined,
      therapist_id: therapistId,
      name: form.name,
      address: form.address,
      phone: form.phone,
      instagram: form.instagram,
      professional_name: form.professional_name,
      crefito: form.crefito,
      professional_photo_url: form.professional_photo_url,
      logo_url: form.logo_url,
      specialties: form.specialties,
      theme: form.theme || "default",
    }, {
      onConflict: "therapist_id"
    }).select().maybeSingle();

    if (error) return toast.error(error.message);
    if (savedData) setForm(savedData);
    
    toast.success("Configurações salvas ✓");
    qc.invalidateQueries({ queryKey: ["clinic_settings"] });
  }

  async function uploadAsset(file: File, kind: "photo" | "logo") {
    if (kind === "photo" && file.size > 4 * 1024 * 1024) {
      return toast.error("Arquivo grande demais (máx 4 MB).");
    }
    if (kind === "logo" && file.size > 2 * 1024 * 1024) {
      return toast.error("Arquivo grande demais (máx 2 MB).");
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return toast.error("Usuário não autenticado");
    const therapistId = form.therapist_id || userData.user.id;

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `branding/${therapistId}/${kind === "logo" ? "logo" : "photo"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-assets").upload(path, file, { upsert: true });
    
    if (error) {
      setUploading(false);
      console.error("Storage upload error:", error);
      return toast.error("Não foi possível enviar a imagem. Verifique o bucket/políticas do Supabase Storage.");
    }

    const { data: signed } = await supabase.storage
      .from("clinic-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 anos
      
    setForm({
      ...form,
      [kind === "logo" ? "logo_url" : "professional_photo_url"]: signed?.signedUrl,
    });
    setUploading(false);
    toast.success(kind === "logo" ? "Logo enviado ✓" : "Foto enviada ✓");
  }

  async function upload(file: File) { return uploadAsset(file, "photo"); }

  function addSpec() {
    if (!newSpec.trim()) return;
    setForm({ ...form, specialties: [...(form.specialties ?? []), newSpec.trim()] });
    setNewSpec("");
  }
  function removeSpec(i: number) {
    const next = [...(form.specialties ?? [])]; next.splice(i, 1);
    setForm({ ...form, specialties: next });
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Nome da clínica</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Endereço</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div><Label>Instagram</Label><Input value={form.instagram ?? ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
        <div><Label>Nome do profissional</Label><Input value={form.professional_name ?? ""} onChange={(e) => setForm({ ...form, professional_name: e.target.value })} /></div>
        <div><Label>CREFITO</Label><Input value={form.crefito ?? ""} onChange={(e) => setForm({ ...form, crefito: e.target.value })} /></div>
        <div>
          <Label>Logo da clínica</Label>
          <div className="flex items-center gap-3 mt-1">
            {form.logo_url && <img src={form.logo_url} alt="" className="h-12 w-12 rounded-full object-cover bg-muted" />}
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted text-sm">
              <Upload className="h-4 w-4" />{uploading ? "Enviando..." : "Enviar logo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAsset(e.target.files[0], "logo")} />
            </label>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">PNG/JPG até 2 MB. Aparece na sidebar e no cabeçalho dos PDFs.</p>
        </div>
        <div>
          <Label>Foto do profissional</Label>
          <div className="flex items-center gap-3 mt-1">
            {form.professional_photo_url && <img src={form.professional_photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted text-sm">
              <Upload className="h-4 w-4" />{uploading ? "Enviando..." : "Enviar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">PNG/JPG até 4 MB. Aparece no card de boas-vindas do dashboard.</p>
        </div>
      </div>
      <div>
        <Label>Especialidades</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {(form.specialties ?? []).map((s: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
              {s}<button onClick={() => removeSpec(i)} className="hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input placeholder="Nova especialidade" value={newSpec} onChange={(e) => setNewSpec(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())} />
          <Button type="button" variant="outline" onClick={addSpec}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
      <Button className="gradient-brand text-white" onClick={save}>Salvar</Button>
    </div>
  );
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let p = ""; for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p + "@1";
}

function UsersTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; phone?: string } | null>(null);
  const [form, setForm] = useState({ email: "", full_name: "", phone: "", role: "fisio" });

  const { data: users = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
  });

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const password = generatePassword();
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password,
      options: { data: { full_name: form.full_name, phone: form.phone } },
    });
    if (error) return toast.error(error.message);
    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: form.role as any });
      await supabase.from("profiles").update({ full_name: form.full_name }).eq("id", data.user.id);
    }
    setCreated({ email: form.email, password, phone: form.phone });
    setForm({ email: "", full_name: "", phone: "", role: "fisio" });
    qc.invalidateQueries({ queryKey: ["users-list"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreated(null); }}>
          <DialogTrigger asChild><Button className="gradient-brand text-white"><Plus className="h-4 w-4 mr-1" />Novo usuário</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{created ? "Usuário criado" : "Criar usuário"}</DialogTitle>
              <DialogDescription className="sr-only">{created ? "Credenciais geradas para acesso." : "Crie um novo usuário no sistema."}</DialogDescription>
            </DialogHeader>
            {created ? (
              <div className="space-y-3">
                <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-sm space-y-1">
                  <p><b>E-mail:</b> {created.email}</p>
                  <p><b>Senha temporária:</b> <span className="font-mono">{created.password}</span></p>
                </div>
                {created.phone && (() => {
                  const wa = waLink(created.phone, `Seu acesso FisioAgenda Pro: email ${created.email} senha ${created.password}`);
                  return wa ? (
                    <a href={wa} target="_blank" rel="noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#25D366] text-white font-medium">
                      <MessageCircle className="h-4 w-4" />Enviar por WhatsApp
                    </a>
                  ) : null;
                })()}
                <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            ) : (
              <form onSubmit={createUser} className="space-y-3">
                <div><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
                <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div><Label>Telefone (WhatsApp)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Função</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="fisio">Fisioterapeuta</SelectItem>
                      <SelectItem value="staff">Recepção/Staff</SelectItem>
                      <SelectItem value="paciente">Paciente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Uma senha temporária será gerada automaticamente.</p>
                <Button type="submit" className="w-full gradient-brand text-white">Criar usuário</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <ul className="divide-y divide-border">
          {users.map((u: any) => (
            <li key={u.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-brand text-white flex items-center justify-center font-bold shrink-0">{u.full_name?.[0]?.toUpperCase() ?? "U"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Funções: {u.roles.join(", ") || "—"}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ThemeTab() {
  const qc = useQueryClient();
  const { data: clinic } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: async () => (await supabase.from("clinic_settings").select("*").maybeSingle()).data,
  });
  async function pick(key: string) {
    applyTheme(key);
    if (typeof localStorage !== "undefined") localStorage.setItem("fisio-theme", key);
    
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const therapistId = clinic?.therapist_id || userData.user.id;
      const { error } = await supabase.from("clinic_settings").upsert({
        id: clinic?.id || undefined,
        therapist_id: therapistId,
        theme: key,
        name: clinic?.name || "Centro Especializado Equilíbrio e Movimento",
        professional_name: clinic?.professional_name || "Lenilson Gouveia de Jesus",
        crefito: clinic?.crefito || "CREFITO-9",
        specialties: clinic?.specialties || ["Fisioterapia ortopédica", "Fisioterapia neurológica", "RPG", "Pilates clínico"],
      }, {
        onConflict: "therapist_id"
      });
      
      if (!error) {
        qc.invalidateQueries({ queryKey: ["clinic_settings"] });
        toast.success("Tema aplicado ✓");
      } else {
        toast.error(error.message);
      }
    }
  }
  const current = clinic?.theme ?? "default";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Object.entries(THEMES).map(([k, t]) => (
        <button key={k} onClick={() => pick(k)}
          className={`bg-card rounded-2xl p-4 shadow-card text-left border-2 transition ${current === k ? "border-primary" : "border-transparent hover:border-muted"}`}>
          <div className="h-16 rounded-lg mb-2" style={{ background: `linear-gradient(135deg, ${t.vars["--primary"]}, ${t.vars["--accent"]})` }} />
          <p className="font-medium text-sm">{t.label}</p>
          {current === k && <p className="text-xs text-primary mt-1">✓ Ativo</p>}
        </button>
      ))}
    </div>
  );
}

function LogsTab() {
  const { data: logs = [] } = useQuery({
    queryKey: ["login_attempts"],
    queryFn: async () => (await supabase.from("login_attempts").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  return (
    <div className="bg-card rounded-2xl shadow-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left text-xs text-muted-foreground">
            <th className="p-3">E-mail</th><th className="p-3">Data/hora</th><th className="p-3">IP</th><th className="p-3">Dispositivo</th><th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum registro ainda.</td></tr>}
          {logs.map((l: any) => (
            <tr key={l.id}>
              <td className="p-3 truncate max-w-[200px]">{l.email}</td>
              <td className="p-3 whitespace-nowrap">{format(new Date(l.created_at), "dd/MM/yyyy HH:mm:ss")}</td>
              <td className="p-3 font-mono text-xs">{l.ip_address ?? "—"}</td>
              <td className="p-3 text-xs truncate max-w-[260px]">{l.user_agent ?? "—"}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.success ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {l.success ? "Sucesso" : "Falha"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportsTab() {
  const { data: therapistId } = useEffectiveTherapistId();

  async function loadCurrentMonthData() {
    if (!therapistId) throw new Error("Therapist ID not loaded");
    const now = new Date();
    const ms = startOfMonth(now), me = endOfMonth(now);
    const [{ data: patients }, { data: appts }] = await Promise.all([
      supabase.from("patients").select("*").eq("active", true).eq("therapist_id", therapistId).order("full_name"),
      supabase.from("appointments").select("*").eq("therapist_id", therapistId).gte("starts_at", ms.toISOString()).lte("starts_at", me.toISOString()),
    ]);
    const list = (patients ?? []).map((p: any) => ({
      ...p,
      session_count: (appts ?? []).filter((a: any) => a.patient_id === p.id).length,
    }));
    const total = (appts ?? []).length;
    const attended = (appts ?? []).filter((a: any) => a.status === "realizado").length;
    const revenue = (appts ?? [])
      .filter((a: any) => a.payment_status === "pago")
      .reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
    const pendingTotal = (appts ?? [])
      .filter((a: any) => a.payment_status === "pendente" || !a.payment_status)
      .reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
    return { now, patients: list, appointments: appts ?? [], total, attended, revenue, pendingTotal };
  }

  async function genMonthly() {
    const { now, patients, total, attended, revenue, pendingTotal } = await loadCurrentMonthData();
    downloadMonthlyReportPDF({
      monthLabel: format(now, "MM-yyyy"),
      patients,
      totals: { 
        totalPatients: patients.length, 
        totalSessions: total, 
        attendance: total ? (attended / total) * 100 : 0, 
        revenue,
        pendingTotal
      },
    });
  }

  async function genFinancial() {
    const { now, patients, appointments, revenue, pendingTotal } = await loadCurrentMonthData();
    const patientNames = new Map(patients.map((p: any) => [p.id, p.full_name]));
    const methodTotals = new Map<string, { method: string; total: number; count: number }>();
    const patientTotals = new Map<string, { full_name: string; total: number; sessions: number }>();

    appointments.forEach((a: any) => {
      if (a.payment_status !== "pago") return;

      const amount = Number(a.price) || 0;
      const method = a.payment_method || "Não informado";
      const currentMethod = methodTotals.get(method) ?? { method, total: 0, count: 0 };
      currentMethod.total += amount;
      currentMethod.count += 1;
      methodTotals.set(method, currentMethod);

      const patientId = a.patient_id || "sem-paciente";
      const fullName = patientNames.get(a.patient_id) ?? "Paciente não informado";
      const currentPatient = patientTotals.get(patientId) ?? { full_name: fullName, total: 0, sessions: 0 };
      currentPatient.total += amount;
      currentPatient.sessions += 1;
      patientTotals.set(patientId, currentPatient);
    });

    downloadFinancialPDF({
      periodLabel: format(now, "MM-yyyy"),
      byMethod: [...methodTotals.values()].sort((a, b) => b.total - a.total),
      topPatients: [...patientTotals.values()].sort((a, b) => b.total - a.total).slice(0, 10),
      grandTotal: revenue,
      pendingTotal: pendingTotal,
    });
  }
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card space-y-3">
      <h3 className="text-lg">Relatórios</h3>
      <p className="text-sm text-muted-foreground">Gere relatórios mensais consolidados em PDF.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={genMonthly} className="gradient-brand text-white"><FileDown className="h-4 w-4 mr-1" />Relatório do mês atual</Button>
        <Button onClick={genFinancial} variant="outline"><FileDown className="h-4 w-4 mr-1" />Financeiro do mês atual</Button>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const qc = useQueryClient();
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["integration_settings"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("integration_settings")
        .select("*").maybeSingle();
      if (error && !/relation .* does not exist|PGRST205/i.test(error.message ?? "")) throw error;
      return data ?? { whatsapp_reminders_enabled: false, pix_enabled: false, whatsapp_test_phone: "" };
    },
  });

  async function toggleWA(enabled: boolean) {
    const { error } = await (supabase.from as any)("integration_settings")
      .update({ whatsapp_reminders_enabled: enabled }).eq("id", (settings as any)?.id);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "Lembretes WhatsApp ativados ✓" : "Lembretes desativados");
    qc.invalidateQueries({ queryKey: ["integration_settings"] });
  }

  async function togglePix(enabled: boolean) {
    const { error } = await (supabase.from as any)("integration_settings")
      .update({ pix_enabled: enabled }).eq("id", (settings as any)?.id);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "Cobrança Pix ativada ✓" : "Cobrança Pix desativada");
    qc.invalidateQueries({ queryKey: ["integration_settings"] });
  }

  async function sendTest() {
    if (!/^\d{10,11}$/.test(testPhone.replace(/\D/g, ""))) {
      return toast.error("Telefone inválido. Use DDD + número (10 ou 11 dígitos).");
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-reminder", {
        body: { test_phone: testPhone.replace(/\D/g, "") },
      });
      setTesting(false);
      if (error) {
        const msg = error.message || "Erro desconhecido";
        if (msg.includes("Failed to send a request") || msg.includes("Edge Function") || msg.includes("fetch")) {
          return toast.error(
            "Integração WhatsApp não configurada ou Edge Function 'send-reminder' não implantada. " +
            "Realize o deploy da função no Supabase e configure as credenciais EVOLUTION_* nos Secrets."
          );
        }
        return toast.error(msg);
      }
      if (data?.ok) {
        toast.success("Mensagem de teste enviada ✓");
      } else {
        toast.error("Falha ao enviar. Confira os Secrets EVOLUTION_* nas Edge Functions.");
      }
    } catch (e: any) {
      setTesting(false);
      toast.error(
        "A Edge Function 'send-reminder' não está respondendo. " +
        "Certifique-se de configurar as credenciais EVOLUTION_* nos Secrets do Supabase."
      );
    }
  }

  const waOn = !!(settings as any)?.whatsapp_reminders_enabled;
  const pixOn = !!(settings as any)?.pix_enabled;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg">Cobrança Pix automática</h3>
            <p className="text-sm text-muted-foreground">
              Ao criar pacote com forma "Pix", gera QR Code automaticamente via Mercado Pago.
              {pixOn ? " — Ativo." : " — Inativo."}
            </p>
          </div>
          <Button variant={pixOn ? "outline" : "default"}
            className={pixOn ? "" : "gradient-brand text-white"}
            onClick={() => togglePix(!pixOn)}>
            {pixOn ? "Desativar" : "Ativar"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
          Configure o Secret <code className="font-mono">MERCADOPAGO_ACCESS_TOKEN</code> em
          Supabase Dashboard → Edge Functions → Secrets.
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg">Lembretes WhatsApp automáticos</h3>
            <p className="text-sm text-muted-foreground">
              Envia mensagem 1 dia antes da sessão. {waOn ? "Próximo envio: hoje às 18h." : "— Inativo."}
            </p>
          </div>
          <Button variant={waOn ? "outline" : "default"}
            className={waOn ? "" : "gradient-brand text-white"}
            onClick={() => toggleWA(!waOn)}>
            {waOn ? "Desativar" : "Ativar"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input placeholder="(64) 99999-9999 — número para teste"
            value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
          <Button variant="outline" onClick={sendTest} disabled={testing || !testPhone}>
            {testing ? "Enviando…" : "Testar agora"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
          Configure os Secrets <code className="font-mono">EVOLUTION_API_URL</code>,
          {" "}<code className="font-mono">EVOLUTION_API_KEY</code> e
          {" "}<code className="font-mono">EVOLUTION_INSTANCE</code>.
          O agendamento diário precisa do pg_cron — veja /app/memory/DEPLOY_GUIDE.md
        </div>
      </div>
    </div>
  );
}

