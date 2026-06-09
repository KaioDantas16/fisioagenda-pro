import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { downloadMonthlyReportPDF } from "@/lib/pdf";
import { Plus, Trash2, MessageCircle, FileDown, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — FisioAgenda Pro" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useCurrentUser();
  useEffect(() => {
    if (!isLoading && me && !me.isSuperAdmin) {
      toast.error("Acesso restrito a super administradores.");
      navigate({ to: "/dashboard" });
    }
  }, [me, isLoading, navigate]);

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!me?.isSuperAdmin) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">Painel exclusivo de super administradores</p>
      </div>
      <Tabs defaultValue="clinic">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto">
          <TabsTrigger value="clinic">Clínica</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="theme">Aparência</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="clinic" className="mt-5"><ClinicTab /></TabsContent>
        <TabsContent value="users" className="mt-5"><UsersTab /></TabsContent>
        <TabsContent value="theme" className="mt-5"><ThemeTab /></TabsContent>
        <TabsContent value="logs" className="mt-5"><LogsTab /></TabsContent>
        <TabsContent value="reports" className="mt-5"><ReportsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ClinicTab() {
  const qc = useQueryClient();
  const { data: clinic } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: async () => (await supabase.from("clinic_settings").select("*").maybeSingle()).data,
  });
  const [form, setForm] = useState<any>(null);
  const [newSpec, setNewSpec] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => { if (clinic && !form) setForm(clinic); }, [clinic, form]);
  if (!form) return <p className="text-muted-foreground text-sm">Carregando...</p>;

  async function save() {
    const { error } = await supabase.from("clinic_settings").update({
      name: form.name, address: form.address, phone: form.phone, instagram: form.instagram,
      professional_name: form.professional_name, crefito: form.crefito,
      professional_photo_url: form.professional_photo_url,
      logo_url: form.logo_url,
      specialties: form.specialties,
    }).eq("id", form.id);
    if (error) return toast.error(error.message);
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
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `branding/${kind === "logo" ? "logo" : "lenilson"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-assets").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
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
    if (clinic?.id) {
      await supabase.from("clinic_settings").update({ theme: key }).eq("id", clinic.id);
      qc.invalidateQueries({ queryKey: ["clinic_settings"] });
      toast.success("Tema aplicado ✓");
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
  async function genMonthly() {
    const now = new Date();
    const ms = startOfMonth(now), me = endOfMonth(now);
    const [{ data: patients }, { data: appts }] = await Promise.all([
      supabase.from("patients").select("*").eq("active", true).order("full_name"),
      supabase.from("appointments").select("*").gte("starts_at", ms.toISOString()).lte("starts_at", me.toISOString()),
    ]);
    const list = (patients ?? []).map((p: any) => ({
      ...p,
      session_count: (appts ?? []).filter((a: any) => a.patient_id === p.id).length,
    }));
    const total = (appts ?? []).length;
    const attended = (appts ?? []).filter((a: any) => a.status === "realizado").length;
    const revenue = (appts ?? []).reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
    downloadMonthlyReportPDF({
      monthLabel: format(now, "MM-yyyy"),
      patients: list,
      totals: { totalPatients: list.length, totalSessions: total, attendance: total ? (attended / total) * 100 : 0, revenue },
    });
  }
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card space-y-3">
      <h3 className="text-lg">Relatórios</h3>
      <p className="text-sm text-muted-foreground">Gere relatórios mensais consolidados em PDF.</p>
      <Button onClick={genMonthly} className="gradient-brand text-white"><FileDown className="h-4 w-4 mr-1" />Relatório do mês atual</Button>
    </div>
  );
}
