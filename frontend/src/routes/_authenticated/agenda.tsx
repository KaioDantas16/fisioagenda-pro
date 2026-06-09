import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { addDays, format, startOfWeek, endOfWeek, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SERVICES, APPOINTMENT_STATUS } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({ meta: [{ title: "Agenda — FisioAgenda Pro" }] }),
  component: Agenda,
});

function Agenda() {
  const qc = useQueryClient();
  const [anchor, setAnchor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    service: SERVICES[0],
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration_minutes: 60,
    price: "",
    notes: "",
  });

  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const { data: weekAppts = [] } = useQuery({
    queryKey: ["appts", "week", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(full_name, phone)")
        .gte("starts_at", startOfDay(weekStart).toISOString())
        .lte("starts_at", endOfDay(endOfWeek(weekStart, { weekStartsOn: 0 })).toISOString())
        .order("starts_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, full_name").order("full_name");
      return data ?? [];
    },
  });

  const dayAppts = weekAppts.filter((a: any) => isSameDay(new Date(a.starts_at), selected));

  function openNew(d?: Date) {
    const dt = d ?? selected;
    setForm({ ...form, date: format(dt, "yyyy-MM-dd") });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id) return toast.error("Selecione um paciente");
    const starts_at = new Date(`${form.date}T${form.time}:00`).toISOString();
    const { error } = await supabase.from("appointments").insert({
      patient_id: form.patient_id,
      service: form.service,
      starts_at,
      duration_minutes: Number(form.duration_minutes),
      price: form.price ? Number(form.price) : null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Agendamento criado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["appts"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  }

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["appts"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agendamento excluído");
    qc.invalidateQueries({ queryKey: ["appts"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: ptBR })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Anterior" title="Semana anterior" onClick={() => setAnchor(addDays(anchor, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => { setAnchor(new Date()); setSelected(new Date()); }}>Hoje</Button>
          <Button variant="outline" size="icon" aria-label="Próxima" title="Próxima semana" onClick={() => setAnchor(addDays(anchor, 7))}><ChevronRight className="h-4 w-4" /></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-brand text-white" onClick={() => openNew()}><Plus className="h-4 w-4 mr-2" />Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo agendamento</DialogTitle>
                <DialogDescription className="sr-only">Crie um novo agendamento para um paciente.</DialogDescription>
              </DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div>
                  <Label>Paciente *</Label>
                  <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {patients.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Cadastre um paciente em "Pacientes" primeiro.</p>
                  )}
                </div>
                <div>
                  <Label>Serviço</Label>
                  <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Hora</Label>
                    <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Duração (min)</Label>
                    <Input type="number" min={15} step={15} value={form.duration_minutes}
                      onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full gradient-brand text-white">Agendar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const count = weekAppts.filter((a: any) => isSameDay(new Date(a.starts_at), d)).length;
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`p-3 rounded-xl text-center transition-all ${
                isSel ? "gradient-brand text-white shadow-card" : "bg-card hover:bg-muted shadow-card"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide opacity-80">{format(d, "EEE", { locale: ptBR })}</p>
              <p className={`text-xl font-display font-bold ${isToday && !isSel ? "text-primary" : ""}`}>{format(d, "d")}</p>
              <p className="text-[10px] mt-1 opacity-90">{count > 0 ? `${count} ag.` : "—"}</p>
            </button>
          );
        })}
      </div>

      {/* Day list */}
      <div className="bg-card rounded-2xl shadow-card p-5">
        <h3 className="text-lg mb-3">
          {format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h3>
        {dayAppts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum atendimento neste dia.</p>
        ) : (
          <ul className="divide-y divide-border">
            {dayAppts.map((a: any) => {
              const status = APPOINTMENT_STATUS[a.status] ?? APPOINTMENT_STATUS.agendado;
              return (
                <li key={a.id} className="py-3 flex items-center gap-4">
                  <div className="text-center w-16 shrink-0">
                    <p className="font-display font-bold text-lg text-primary">{format(new Date(a.starts_at), "HH:mm")}</p>
                    <p className="text-[10px] text-muted-foreground">{a.duration_minutes}min</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.patients?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.service}{a.price ? ` · R$ ${Number(a.price).toFixed(2)}` : ""}</p>
                  </div>
                  <Select value={a.status} onValueChange={(v) => changeStatus(a.id, v)}>
                    <SelectTrigger className={`w-32 h-8 text-xs ${status.className} border-0`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPOINTMENT_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>}
                    title="Excluir agendamento?"
                    description="Esta ação não pode ser desfeita. O agendamento será removido permanentemente."
                    confirmLabel="Excluir permanentemente"
                    destructive
                    onConfirm={() => remove(a.id)} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
