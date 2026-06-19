import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveTherapistId } from "@/hooks/use-effective-therapist-id";
import { OWNER_PHOTO_URL, CLINIC, APPOINTMENT_STATUS, CLASSIFICATIONS } from "@/lib/brand";
import { useClinicAssets } from "@/hooks/use-clinic-assets";
import {
  Calendar, Users, Activity, TrendingUp, Phone, Plus, UserPlus, FileText,
  AlertTriangle, Cake, CheckCircle, DollarSign, Clock,
} from "lucide-react";
import { fmtBRL } from "@/lib/cpf";
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel — FisioAgenda Pro" }] }),
  component: Dashboard,
});

function Dashboard() {
  const today = new Date();
  const { data: therapistId } = useEffectiveTherapistId();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const { ownerPhotoUrl } = useClinicAssets();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", format(today, "yyyy-MM-dd"), therapistId],
    queryFn: async () => {
      if (!therapistId) return null;
      const [activePatients, todayCount, weekCount, monthAll, monthAttended] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("active", true).eq("therapist_id", therapistId),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("therapist_id", therapistId)
          .gte("starts_at", startOfDay(today).toISOString())
          .lte("starts_at", endOfDay(today).toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("therapist_id", therapistId)
          .gte("starts_at", startOfDay(weekStart).toISOString())
          .lte("starts_at", endOfDay(weekEnd).toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("therapist_id", therapistId)
          .gte("starts_at", monthStart.toISOString())
          .lte("starts_at", monthEnd.toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("therapist_id", therapistId)
          .gte("starts_at", monthStart.toISOString())
          .lte("starts_at", monthEnd.toISOString())
          .eq("status", "realizado"),
      ]);
      const total = monthAll.count ?? 0;
      const attended = monthAttended.count ?? 0;
      const attendance = total ? (attended / total) * 100 : 0;
      return {
        activePatients: activePatients.count ?? 0,
        todayCount: todayCount.count ?? 0,
        weekCount: weekCount.count ?? 0,
        attendance,
      };
    },
    enabled: !!therapistId,
  });

  const { data: financeStats } = useQuery({
    queryKey: ["dashboard-finance", therapistId],
    queryFn: async () => {
      if (!therapistId) return null;
      
      // 1. Recebimentos de hoje (pago e payment_date = hoje)
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const { data: todayPayments } = await supabase
        .from("appointments")
        .select("price")
        .eq("therapist_id", therapistId)
        .eq("payment_status", "pago")
        .eq("payment_date", todayStr);
        
      const receivedToday = (todayPayments ?? []).reduce((sum, s) => sum + (Number(s.price) || 0), 0);

      // 2. Pendências em aberto (status = pendente)
      const { data: pendingSessions } = await supabase
        .from("appointments")
        .select("price, patient_id, patients(full_name)")
        .eq("therapist_id", therapistId)
        .eq("payment_status", "pendente");
        
      const pendingOpen = (pendingSessions ?? []).reduce((sum, s) => sum + (Number(s.price) || 0), 0);

      // 3. Faturamento do mês (pago e payment_date no mês atual)
      const monthStartStr = format(monthStart, "yyyy-MM-dd");
      const monthEndStr = format(monthEnd, "yyyy-MM-dd");
      
      const { data: monthPayments } = await supabase
        .from("appointments")
        .select("price, payment_method")
        .eq("therapist_id", therapistId)
        .eq("payment_status", "pago")
        .gte("payment_date", monthStartStr)
        .lte("payment_date", monthEndStr);

      const faturamentoMonth = (monthPayments ?? []).reduce((sum, s) => sum + (Number(s.price) || 0), 0);

      // 4. Faturamento por método de pagamento
      const methodMap: Record<string, number> = { pix: 0, dinheiro: 0, cartao: 0, convenio: 0, outro: 0 };
      (monthPayments ?? []).forEach((s) => {
        const method = s.payment_method || "outro";
        const val = Number(s.price) || 0;
        if (method in methodMap) {
          methodMap[method] += val;
        } else {
          methodMap[method] = (methodMap[method] || 0) + val;
        }
      });
      const faturamentoByMethod = Object.entries(methodMap).map(([key, value]) => ({
        method: key === "cartao" ? "Cartão" : key === "pix" ? "Pix" : key === "dinheiro" ? "Dinheiro" : key === "convenio" ? "Convênio" : "Outro",
        value
      }));

      // 5. Pacientes com pendência
      const pendingByPatientMap: Record<string, { name: string; amount: number; count: number; id: string }> = {};
      (pendingSessions ?? []).forEach((s: any) => {
        const pId = s.patient_id;
        const pName = s.patients?.full_name || "Desconhecido";
        const amt = Number(s.price) || 0;
        if (!pendingByPatientMap[pId]) {
          pendingByPatientMap[pId] = { id: pId, name: pName, amount: 0, count: 0 };
        }
        pendingByPatientMap[pId].amount += amt;
        pendingByPatientMap[pId].count += 1;
      });
      const pendingPatients = Object.values(pendingByPatientMap).sort((a, b) => b.amount - a.amount);

      return {
        receivedToday,
        pendingOpen,
        faturamentoMonth,
        faturamentoByMethod,
        pendingPatients
      };
    },
    enabled: !!therapistId
  });

  const { data: nextAppts = [] } = useQuery({
    queryKey: ["dashboard-next-5", therapistId],
    queryFn: async () => {
      if (!therapistId) return [];
      const { data } = await supabase
        .from("appointments")
        .select("*, patients(full_name, phone)")
        .eq("therapist_id", therapistId)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(5);
      return data ?? [];
    },
    enabled: !!therapistId,
  });

  const { data: attentionPatients = [] } = useQuery({
    queryKey: ["dashboard-attention", therapistId],
    queryFn: async () => {
      if (!therapistId) return [];
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, classification, phone")
        .eq("therapist_id", therapistId)
        .in("classification", ["urgente", "atencao"])
        .eq("active", true);
      // ordena: urgente primeiro
      return (data ?? []).sort(
        (a: any, b: any) => (a.classification === "urgente" ? 0 : 1) - (b.classification === "urgente" ? 0 : 1),
      );
    },
    enabled: !!therapistId,
  });

  const { data: birthdays = [] } = useQuery({
    queryKey: ["dashboard-birthdays", format(today, "MM"), therapistId],
    queryFn: async () => {
      if (!therapistId) return [];
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, birth_date")
        .eq("therapist_id", therapistId)
        .not("birth_date", "is", null)
        .eq("active", true);
      const m = today.getMonth();
      return (data ?? [])
        .filter((p: any) => p.birth_date && new Date(p.birth_date).getUTCMonth() === m)
        .sort((a: any, b: any) =>
          new Date(a.birth_date).getUTCDate() - new Date(b.birth_date).getUTCDate(),
        );
    },
    enabled: !!therapistId,
  });

  const { data: weeklyChart = [] } = useQuery({
    queryKey: ["dashboard-week-chart", format(weekStart, "yyyy-MM-dd"), therapistId],
    queryFn: async () => {
      if (!therapistId) return [];
      const { data } = await supabase
        .from("appointments")
        .select("starts_at")
        .eq("therapist_id", therapistId)
        .gte("starts_at", startOfDay(weekStart).toISOString())
        .lte("starts_at", endOfDay(weekEnd).toISOString());
      const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const counts = [0, 0, 0, 0, 0, 0, 0];
      (data ?? []).forEach((a: any) => {
        const dow = new Date(a.starts_at).getDay();
        counts[dow] += 1;
      });
      return labels.map((label, i) => ({ day: label, sessoes: counts[i] }));
    },
    enabled: !!therapistId,
  });

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic_settings", therapistId],
    queryFn: async () => {
      if (!therapistId) return null;
      const { data } = await supabase.from("clinic_settings").select("*").maybeSingle();
      return data;
    },
    enabled: !!therapistId,
  });

  const professionalName = clinicSettings?.professional_name || CLINIC.owner;
  const crefitoText = clinicSettings?.crefito && clinicSettings.crefito.trim().length > 0 
    ? clinicSettings.crefito.trim() + " · " 
    : "";

  return (
    <div className="space-y-6">
      <div className="gradient-brand rounded-2xl p-6 lg:p-8 text-white shadow-lg-brand flex flex-col sm:flex-row items-center gap-6">
        <img src={ownerPhotoUrl} alt={professionalName} className="h-20 w-20 lg:h-24 lg:w-24 rounded-full object-cover ring-4 ring-white/30" />
        <div className="text-center sm:text-left">
          <p className="text-sm opacity-90">Bem-vindo de volta,</p>
          <h2 className="text-2xl lg:text-3xl text-white">{professionalName}</h2>
          <p className="text-sm opacity-90 mt-1">{crefitoText}{format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={Users} label="Pacientes ativos" value={String(stats?.activePatients ?? 0)} />
        <StatCard icon={Calendar} label="Sessões hoje" value={String(stats?.todayCount ?? 0)} />
        <StatCard icon={Activity} label="Sessões esta semana" value={String(stats?.weekCount ?? 0)} />
        <StatCard icon={TrendingUp} label="Presença do mês" value={`${(stats?.attendance ?? 0).toFixed(0)}%`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="gradient-brand text-white"><Link to="/agenda"><Plus className="h-4 w-4 mr-1" />Novo agendamento</Link></Button>
        <Button asChild variant="outline"><Link to="/pacientes"><UserPlus className="h-4 w-4 mr-1" />Novo paciente</Link></Button>
        <Button asChild variant="outline"><Link to="/pacientes"><FileText className="h-4 w-4 mr-1" />Ver pacientes</Link></Button>
      </div>

      {/* Balanço Financeiro */}
      {financeStats && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Balanço Financeiro</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-card rounded-2xl p-4 lg:p-5 shadow-card flex items-center gap-3 border border-emerald-100 dark:border-emerald-950/30">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div>
                <p className="text-[11px] lg:text-xs text-muted-foreground leading-tight">Recebidos hoje</p>
                <p className="text-xl lg:text-2xl font-display font-bold leading-tight text-emerald-600 dark:text-emerald-400">
                  {fmtBRL(financeStats.receivedToday)}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 lg:p-5 shadow-card flex items-center gap-3 border border-amber-100 dark:border-amber-950/30">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div>
                <p className="text-[11px] lg:text-xs text-muted-foreground leading-tight">Pendências em aberto</p>
                <p className="text-xl lg:text-2xl font-display font-bold leading-tight text-amber-600 dark:text-amber-400">
                  {fmtBRL(financeStats.pendingOpen)}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 lg:p-5 shadow-card flex items-center gap-3 border border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-primary flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div>
                <p className="text-[11px] lg:text-xs text-muted-foreground leading-tight">Faturamento do mês</p>
                <p className="text-xl lg:text-2xl font-display font-bold leading-tight">
                  {fmtBRL(financeStats.faturamentoMonth)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Faturamento por Método */}
            <div className="bg-card rounded-2xl p-6 shadow-card border">
              <h4 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wider">Faturamento por Método (Mês Atual)</h4>
              <div className="space-y-3">
                {financeStats.faturamentoByMethod.map((item) => {
                  const percent = financeStats.faturamentoMonth > 0 
                    ? Math.round((item.value / financeStats.faturamentoMonth) * 100) 
                    : 0;
                  return (
                    <div key={item.method} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{item.method}</span>
                        <span className="text-muted-foreground">{fmtBRL(item.value)} ({percent}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full gradient-brand" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pacientes com Pendência */}
            <div className="bg-card rounded-2xl p-6 shadow-card border">
              <h4 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wider">Pacientes com Pendência</h4>
              {financeStats.pendingPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma pendência financeira em aberto 🎉</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {financeStats.pendingPatients.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/45 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                          {p.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.count} sessões em atraso</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{fmtBRL(p.amount)}</span>
                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Link to="/pacientes/$id" params={{ id: p.id }} search={{ tab: "finance" }}>Ver Perfil</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* CARD: Pacientes que precisam de atenção */}
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg">Precisam de atenção</h3>
          </div>
          {attentionPatients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Todos os pacientes estão estáveis 🎉</p>
          ) : (
            <ul className="space-y-2">
              {attentionPatients.slice(0, 6).map((p: any) => {
                const cls = CLASSIFICATIONS[p.classification] ?? CLASSIFICATIONS.estavel;
                return (
                  <li key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                    <div className="h-9 w-9 rounded-full gradient-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {p.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <p className="flex-1 min-w-0 text-sm font-medium truncate">{p.full_name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${cls.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} />{cls.label}
                    </span>
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Link to="/pacientes/$id" params={{ id: p.id }}>Ver perfil</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* GRÁFICO: Sessões por dia da semana */}
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg">Sessões por dia (semana atual)</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`${v} sessões`, ""]}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Bar dataKey="sessoes" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CARD: Aniversariantes do mês (oculto se vazio) */}
      {birthdays.length > 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="h-5 w-5 text-pink-500" />
            <h3 className="text-lg">Aniversariantes de {format(today, "MMMM", { locale: ptBR })}</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {birthdays.map((p: any) => (
              <Link key={p.id} to="/pacientes/$id" params={{ id: p.id }}
                className="flex items-center gap-3 p-2 rounded-xl border hover:border-primary/40 hover:bg-muted/40 transition-colors">
                <div className="h-9 w-9 rounded-full bg-pink-500/15 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {p.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(p.birth_date), "dd/MM", { locale: ptBR })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg">Próximas 5 sessões</h3>
          <Link to="/agenda" className="text-sm text-primary font-medium hover:underline">Ver agenda</Link>
        </div>
        {nextAppts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma sessão futura agendada.</p>
        ) : (
          <ul className="divide-y divide-border">
            {nextAppts.map((a: any) => {
              const st = APPOINTMENT_STATUS[a.status] ?? APPOINTMENT_STATUS.agendado;
              return (
                <li key={a.id} className="py-3 flex items-center gap-4">
                  <div className="text-center w-20 shrink-0">
                    <p className="font-display font-bold text-lg text-primary">{format(new Date(a.starts_at), "HH:mm")}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(a.starts_at), "d MMM", { locale: ptBR })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.patients?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.service}</p>
                  </div>
                  {a.patients?.phone && (
                    <a href={`tel:${a.patients.phone}`} className="text-muted-foreground hover:text-primary"><Phone className="h-4 w-4" /></a>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.className}`}>{st.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 lg:p-5 shadow-card flex items-center gap-3 lg:gap-4">
      <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl gradient-brand flex items-center justify-center text-white shrink-0">
        <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] lg:text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-xl lg:text-2xl font-display font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// kept for backward compatibility - OWNER_PHOTO_URL used as fallback
export const _ownerFallback = OWNER_PHOTO_URL;
