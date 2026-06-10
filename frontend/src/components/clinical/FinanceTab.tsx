import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fmtBRL } from "@/lib/cpf";
import {
  CheckCircle, DollarSign, Clock, Edit2, CreditCard, AlertCircle
} from "lucide-react";

interface FinanceTabProps {
  patientId: string;
  patient: any;
  sessions: any[];
  onChange: () => void;
}

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "convenio", label: "Convênio" },
  { value: "outro", label: "Outro" }
];

const PAYMENT_STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
  { value: "isento", label: "Isento" }
];

export function FinanceTab({ patientId, patient, sessions, onChange }: FinanceTabProps) {
  const qc = useQueryClient();
  const [editingSession, setEditingSession] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    price: "",
    payment_method: "",
    payment_status: "pendente",
    payment_date: format(new Date(), "yyyy-MM-dd"),
    financial_notes: ""
  });

  // Calcular métricas financeiras das sessões
  const totalPaid = sessions
    .filter((s) => s.payment_status === "pago")
    .reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  const totalPending = sessions
    .filter((s) => s.payment_status === "pendente" || !s.payment_status)
    .reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  const totalGeneral = totalPaid + totalPending;

  // Marcar sessão como paga rapidamente
  async function handleMarkAsPaid(session: any) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const { error } = await supabase
      .from("sessions")
      .update({
        payment_status: "pago",
        payment_date: todayStr
      })
      .eq("id", session.id);

    if (error) {
      toast.error(`Erro ao atualizar pagamento: ${error.message}`);
      return;
    }

    toast.success("Pagamento registrado com sucesso ✓");
    onChange();
    qc.invalidateQueries({ queryKey: ["sessions", patientId] });
  }

  // Abrir modal de edição financeira da sessão
  function handleOpenEdit(session: any) {
    setEditingSession(session);
    setForm({
      price: session.price !== null && session.price !== undefined ? String(session.price) : "",
      payment_method: session.payment_method || "pix",
      payment_status: session.payment_status || "pendente",
      payment_date: session.payment_date || format(new Date(), "yyyy-MM-dd"),
      financial_notes: session.financial_notes || ""
    });
    setOpen(true);
  }

  // Salvar alterações financeiras da sessão
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSession) return;

    const priceNum = form.price ? Number(form.price) : null;
    const { error } = await supabase
      .from("sessions")
      .update({
        price: priceNum,
        payment_method: form.payment_method || null,
        payment_status: form.payment_status,
        payment_date: form.payment_status === "pago" ? form.payment_date : null,
        financial_notes: form.financial_notes || null
      })
      .eq("id", editingSession.id);

    if (error) {
      toast.error(`Erro ao salvar alterações: ${error.message}`);
      return;
    }

    toast.success("Financeiro da sessão atualizado ✓");
    setOpen(false);
    setEditingSession(null);
    onChange();
    qc.invalidateQueries({ queryKey: ["sessions", patientId] });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pago":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
      case "cancelado":
        return "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-200";
      case "isento":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900";
    }
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 border border-emerald-100 dark:border-emerald-950/30">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Recebido</p>
            <p className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">{fmtBRL(totalPaid)}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 border border-amber-100 dark:border-amber-950/30">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Pendente</p>
            <p className="text-xl font-bold font-display text-amber-600 dark:text-amber-400">{fmtBRL(totalPending)}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 border border-slate-100 dark:border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Geral</p>
            <p className="text-xl font-bold font-display">{fmtBRL(totalGeneral)}</p>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico Financeiro */}
      <div className="bg-card rounded-2xl p-4 shadow-card border">
        <h3 className="text-base font-semibold mb-4 text-foreground">Sessões e Faturamento</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sessão encontrada para este paciente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-bold uppercase text-muted-foreground">
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Procedimento</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Status Pagamento</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Data Pagto</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.map((s) => {
                  const statusLabel = PAYMENT_STATUSES.find(st => st.value === (s.payment_status || "pendente"))?.label || "Pendente";
                  const methodLabel = PAYMENT_METHODS.find(m => m.value === s.payment_method)?.label || "—";
                  return (
                    <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 whitespace-nowrap font-medium">
                        {format(new Date(s.starts_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="p-3">{s.procedure || "—"}</td>
                      <td className="p-3 font-semibold">{s.price ? fmtBRL(s.price) : "R$ 0,00"}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(s.payment_status || "pendente")}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-3">{methodLabel}</td>
                      <td className="p-3">
                        {s.payment_status === "pago" && s.payment_date 
                          ? format(new Date(s.payment_date + "T12:00:00"), "dd/MM/yyyy") 
                          : "—"}
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        {s.payment_status !== "pago" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(s)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 h-8 text-xs font-medium"
                          >
                            Marcar Pago
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Editar Detalhes Financeiros */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Financeiro da Sessão</DialogTitle>
            <DialogDescription>
              Ajuste os valores, métodos e status de pagamento correspondentes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor da Sessão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Ex: 150.00"
                />
              </div>

              <div>
                <Label>Método de Pagamento</Label>
                <Select
                  value={form.payment_method}
                  onValueChange={(v) => setForm({ ...form, payment_method: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status de Pagamento</Label>
                <Select
                  value={form.payment_status}
                  onValueChange={(v) => setForm({ ...form, payment_status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((st) => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.payment_status === "pago" && (
                <div>
                  <Label>Data de Recebimento</Label>
                  <Input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Observação Financeira</Label>
              <Textarea
                rows={2}
                value={form.financial_notes}
                onChange={(e) => setForm({ ...form, financial_notes: e.target.value })}
                placeholder="Ex: Pago em dinheiro com desconto do pacote"
              />
            </div>

            <Button type="submit" className="w-full gradient-brand text-white">Salvar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
