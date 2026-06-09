import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { fmtBRL } from "@/lib/cpf";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Pkg = {
  id: string;
  patient_id: string;
  package_name: string;
  total_sessions: number;
  used_sessions: number;
  price_total: number;
  discount_pct: number;
  payment_method?: string | null;
  payment_status?: string | null;
  valid_until?: string | null;
  notes?: string | null;
};

const TEMPLATES = [
  { label: "5 sessões — 5% desc", sessions: 5, discount: 5 },
  { label: "10 sessões — 10% desc", sessions: 10, discount: 10 },
  { label: "20 sessões — 15% desc", sessions: 20, discount: 15 },
];

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Convênio", "Boleto"];

function pkgStatus(p: Pkg): { label: string; cls: string } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expired = p.valid_until && new Date(p.valid_until) < today;
  if (p.used_sessions >= p.total_sessions) {
    return { label: "Concluído", cls: "bg-primary/10 text-primary border-primary/30" };
  }
  if (expired) {
    return { label: "Vencido", cls: "bg-destructive/10 text-destructive border-destructive/30" };
  }
  if (p.payment_status === "pendente") {
    return { label: "Aguarda pagamento", cls: "bg-amber-100 text-amber-700 border-amber-300" };
  }
  return { label: "Ativo", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" };
}

export function PackagesTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState("100");
  const [form, setForm] = useState({
    package_name: "10 sessões — Fisioterapia",
    total_sessions: "10",
    discount_pct: "10",
    payment_method: "Pix",
    payment_status: "pendente",
    valid_until: format(addDays(new Date(), 90), "yyyy-MM-dd"),
    notes: "",
  });

  const { data: list = [], isLoading } = useQuery<Pkg[]>({
    queryKey: ["packages", patientId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("session_packages")
        .select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
      if (error) {
        // Tabela ainda não criada (migration pendente) — tratamos como lista vazia.
        if (/relation .* does not exist|PGRST205/i.test(error.message ?? "")) {
          console.warn("[PackagesTab] session_packages table not provisioned yet. Apply migration: /app/frontend/supabase/migrations/202606080001_session_packages.sql");
          return [];
        }
        throw error;
      }
      return (data ?? []) as Pkg[];
    },
    retry: false,
  });

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setForm((f) => ({
      ...f,
      package_name: `${t.sessions} sessões — Fisioterapia`,
      total_sessions: String(t.sessions),
      discount_pct: String(t.discount),
    }));
  }

  const unitNum = Number(unit) || 0;
  const totalSessions = Number(form.total_sessions) || 0;
  const grossTotal = unitNum * totalSessions;
  const discount = (Number(form.discount_pct) || 0) / 100;
  const finalTotal = grossTotal * (1 - discount);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.package_name || !totalSessions || !finalTotal) {
      return toast.error("Preencha nome, número de sessões e valor.");
    }
    const { error } = await (supabase.from as any)("session_packages").insert({
      patient_id: patientId,
      package_name: form.package_name,
      total_sessions: totalSessions,
      price_total: Number(finalTotal.toFixed(2)),
      discount_pct: Number(form.discount_pct) || 0,
      payment_method: form.payment_method,
      payment_status: form.payment_status,
      valid_until: form.valid_until || null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Pacote criado com sucesso ✓");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["packages", patientId] });
  }

  async function useSession(p: Pkg) {
    if (p.used_sessions >= p.total_sessions) {
      return toast.error("Pacote já concluído.");
    }
    const next = p.used_sessions + 1;
    const { error } = await (supabase.from as any)("session_packages")
      .update({ used_sessions: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    const remaining = p.total_sessions - next;
    toast.success(`Sessão registrada — ${remaining} restantes`);
    qc.invalidateQueries({ queryKey: ["packages", patientId] });
  }

  async function markPaid(p: Pkg) {
    const { error } = await (supabase.from as any)("session_packages")
      .update({ payment_status: "pago" }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Pacote marcado como pago ✓");
    qc.invalidateQueries({ queryKey: ["packages", patientId] });
  }

  async function remove(p: Pkg) {
    const { error } = await (supabase.from as any)("session_packages").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Pacote excluído");
    qc.invalidateQueries({ queryKey: ["packages", patientId] });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white">
              <Plus className="h-4 w-4 mr-1" />Novo pacote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo pacote de sessões</DialogTitle>
              <DialogDescription>
                Crie um pacote com desconto. Quanto mais sessões, maior a aderência ao tratamento e o ticket médio.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 mb-2">
              {TEMPLATES.map((t) => (
                <button key={t.label} type="button" onClick={() => applyTemplate(t)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                  {t.label}
                </button>
              ))}
            </div>
            <form onSubmit={create} className="space-y-3">
              <div>
                <Label>Nome do pacote</Label>
                <Input value={form.package_name} onChange={(e) => setForm({ ...form, package_name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Número de sessões</Label>
                  <Input type="number" min={1} value={form.total_sessions}
                    onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} required />
                </div>
                <div>
                  <Label>Valor unitário (R$)</Label>
                  <Input type="number" min={0} step="0.01" value={unit}
                    onChange={(e) => setUnit(e.target.value)} required />
                </div>
                <div>
                  <Label>Desconto (%)</Label>
                  <Input type="number" min={0} max={100} value={form.discount_pct}
                    onChange={(e) => setForm({ ...form, discount_pct: e.target.value })} />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input type="date" value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
                </div>
                <div>
                  <Label>Forma de pagamento</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status pagamento</Label>
                  <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span><span>{fmtBRL(grossTotal)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Desconto {form.discount_pct}%</span><span>-{fmtBRL(grossTotal - finalTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary text-base mt-1">
                  <span>Total</span><span>{fmtBRL(finalTotal)}</span>
                </div>
              </div>
              <Button type="submit" className="w-full gradient-brand text-white">Criar pacote</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center bg-card rounded-2xl shadow-card">
          Nenhum pacote criado. Pacotes aumentam aderência e ticket médio.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const st = pkgStatus(p);
            const pct = Math.min(100, Math.round((p.used_sessions / p.total_sessions) * 100));
            return (
              <li key={p.id} className="bg-card rounded-2xl p-4 shadow-card space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-brand text-white flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.package_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.used_sessions}/{p.total_sessions} sessões · {fmtBRL(p.price_total)}
                      {p.valid_until && ` · vence ${format(new Date(p.valid_until), "dd/MM/yyyy")}`}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-brand transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <ConfirmDialog
                    trigger={<Button size="sm" variant="outline" disabled={p.used_sessions >= p.total_sessions}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Usar 1 sessão
                    </Button>}
                    title="Registrar uso de uma sessão?"
                    description={`Restantes após uso: ${p.total_sessions - p.used_sessions - 1} sessões.`}
                    confirmLabel="Confirmar uso"
                    onConfirm={() => useSession(p)} />
                  {p.payment_status !== "pago" && (
                    <Button size="sm" variant="outline" onClick={() => markPaid(p)}>
                      Marcar como pago
                    </Button>
                  )}
                  <ConfirmDialog
                    trigger={<Button size="sm" variant="ghost" className="text-destructive">Excluir</Button>}
                    title="Excluir pacote?"
                    description={`O pacote "${p.package_name}" e seu histórico de uso serão removidos.`}
                    confirmLabel="Excluir permanentemente"
                    destructive
                    onConfirm={() => remove(p)} />
                </div>
                {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
