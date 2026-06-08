import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_PHOTO_URL, CLINIC, APPOINTMENT_STATUS } from "@/lib/brand";
import { Calendar, Users, Activity, TrendingUp, Phone, Plus, UserPlus, FileText } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel — FisioAgenda Pro" }] }),
  component: Dashboard,
});

function Dashboard() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", format(today, "yyyy-MM-dd")],
    queryFn: async () => {
      const [activePatients, todayCount, weekCount, monthAll, monthAttended] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .gte("starts_at", startOfDay(today).toISOString())
          .lte("starts_at", endOfDay(today).toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .gte("starts_at", startOfDay(weekStart).toISOString())
          .lte("starts_at", endOfDay(weekEnd).toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .gte("starts_at", monthStart.toISOString())
          .lte("starts_at", monthEnd.toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true })
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
  });

  const { data: nextAppts = [] } = useQuery({
    queryKey: ["dashboard-next-5"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, patients(full_name, phone)")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="gradient-brand rounded-2xl p-6 lg:p-8 text-white shadow-lg-brand flex flex-col sm:flex-row items-center gap-6">
        <img src={OWNER_PHOTO_URL} alt={CLINIC.owner} className="h-20 w-20 lg:h-24 lg:w-24 rounded-full object-cover ring-4 ring-white/30" />
        <div className="text-center sm:text-left">
          <p className="text-sm opacity-90">Bem-vindo de volta,</p>
          <h2 className="text-2xl lg:text-3xl text-white">{CLINIC.owner}</h2>
          <p className="text-sm opacity-90 mt-1">{CLINIC.crefito} · {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
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
