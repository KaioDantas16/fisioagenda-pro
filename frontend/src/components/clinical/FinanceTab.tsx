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
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fmtBRL } from "@/lib/cpf";
import {
  CheckCircle, DollarSign, Clock, Edit2, CreditCard
} from "lucide-react";

interface FinanceTabProps {
  patientId: string;
  patient: any;
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

export function FinanceTab({ patientId, patient, onChange }: FinanceTabProps) {
  const qc = useQueryClient();
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    price: "",
    payment_method: "",
    payment_status: "pendente",
    payment_date: format(new Date(), "yyyy-MM-dd"),
    financial_notes: ""
  });

  // Buscar agendamentos (consultas) do paciente
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["appointments-finance", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
  });

  // Calcular métricas financeiras das consultas (appointments)
  const totalPaid = appointments
    .filter((a) => a.payment_status === "pago")
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  const totalPending = appointments
    .filter((a) => a.payment_status === "pendente")
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  const totalGeneral = totalPaid + totalPending;

  // Marcar agendamento como pago rapidamente
  async function handleMarkAsPaid(appt: any) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const { error } = await supabase
      .from("appointments")
      .update({
        payment_status: "pago",
        payment_date: todayStr
      })
      .eq("id", appt.id);

    if (error) {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
      return;
    }

    toast.success("Pagamento registrado com sucesso ✓");
    refetch();
    onChange();
    qc.invalidateQueries({ queryKey: ["appointments-finance", patientId] });
    qc.invalidateQueries({ queryKey: ["dashboard-finance"] });
  }

  // Abrir modal de edição financeira do agendamento
  function handleOpenEdit(appt: any) {
    setEditingAppointment(appt);
    setForm({
      price: appt.price !== null && appt.price !== undefined ? String(appt.price) : "",
      payment_method: appt.payment_method || "pix",
      payment_status: appt.payment_status || "pendente",
      payment_date: appt.payment_date || format(new Date(), "yyyy-MM-dd"),
      financial_notes: appt.financial_notes || ""
    });
    setOpen(true);
  }

  // Salvar alterações financeiras do agendamento
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppointment) return;

    const priceNum = form.price ? Number(form.price) : null;
    const { error } = await supabase
      .from("appointments")
      .update({
        price: priceNum,
        payment_method: form.payment_method || null,
        payment_status: form.payment_status,
        payment_date: form.payment_status === "pago" ? form.payment_date : null,
        financial_notes: form.financial_notes || null
      })
      .eq("id", editingAppointment.id);

    if (error) {
      toast.error(`Erro ao salvar alterações: ${error.message}`);
      return;
    }

    toast.success("Financeiro do agendamento atualizado ✓");
    setOpen(false);
    setEditingAppointment(null);
    refetch();
    onChange();
    qc.invalidateQueries({ queryKey: ["appointments-finance", patientId] });
    qc.invalidateQueries({ queryKey: ["dashboard-finance"] });
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

  function safeFormatDate(dateStr: string | null | undefined, dateFormat: string) {
    if (!dateStr) return "—";
    const dateObj = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00");
    if (isNaN(dateObj.getTime())) return "—";
    return format(dateObj, dateFormat, { locale: ptBR });
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
        <h3 className="text-base font-semibold mb-4 text-foreground font-display">Agendamentos e Faturamento</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando dados financeiros...</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento encontrado para este paciente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-bold uppercase text-muted-foreground">
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Serviço/Procedimento</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Status Pagamento</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Data Pagto</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments.map((a) => {
                  const statusLabel = PAYMENT_STATUSES.find(st => st.value === (a.payment_status || "pendente"))?.label || "Pendente";
                  const methodLabel = PAYMENT_METHODS.find(m => m.value === a.payment_method)?.label || "—";
                  return (
                    <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 whitespace-nowrap font-medium">
                        {safeFormatDate(a.starts_at, "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="p-3">{a.service || "—"}</td>
                      <td className="p-3 font-semibold">{a.price ? fmtBRL(a.price) : "R$ 0,00"}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(a.payment_status || "pendente")}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-3">{methodLabel}</td>
                      <td className="p-3">
                        {a.payment_status === "pago" && a.payment_date 
                          ? safeFormatDate(a.payment_date, "dd/MM/yyyy") 
                          : "—"}
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        {a.payment_status !== "pago" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(a)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 h-8 text-xs font-medium"
                          >
                            Marcar Pago
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(a)}
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
            <DialogTitle>Editar Financeiro do Agendamento</DialogTitle>
            <DialogDescription>
              Ajuste os valores, métodos e status de pagamento correspondentes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor da Consulta (R$)</Label>
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
                  value={form.payment_method || undefined}
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
                  value={form.payment_status || "pendente"}
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
                    value={form.payment_date || ""}
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
                value={form.financial_notes || ""}
                onChange={(e) => setForm({ ...form, financial_notes: e.target.value })}
                placeholder="Ex: Pago via Pix integralmente"
              />
            </div>

            <Button type="submit" className="w-full gradient-brand text-white">Salvar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
