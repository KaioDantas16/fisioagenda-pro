import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileDown, Heart, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { APPOINTMENT_STATUS, CLINIC } from "@/lib/brand";
import { downloadSessionReceiptPDF } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal-paciente")({
  head: () => ({ meta: [{ title: "Meu portal — FisioAgenda Pro" }] }),
  component: PortalPaciente,
});

function PortalPaciente() {
  const { data: patient, isLoading } = useQuery({
    queryKey: ["my-patient"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("patient_user_id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: sessions = [] } = useQuery({
    enabled: !!patient?.id,
    queryKey: ["my-sessions", patient?.id],
    queryFn: async () =>
      (await supabase
        .from("sessions")
        .select("*")
        .eq("patient_id", patient!.id)
        .order("starts_at", { ascending: false })).data ?? [],
  });

  const { data: records = [] } = useQuery({
    enabled: !!patient?.id,
    queryKey: ["my-records", patient?.id],
    queryFn: async () =>
      (await supabase
        .from("records")
        .select("plan, record_date, pain_scale")
        .eq("patient_id", patient!.id)
        .order("record_date", { ascending: false })).data ?? [],
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!patient)
    return (
      <Card className="p-6">
        <p className="font-medium mb-2">Acesso ainda não vinculado</p>
        <p className="text-sm text-muted-foreground">
          Peça ao seu fisioterapeuta para vincular este e-mail ao seu cadastro.
        </p>
      </Card>
    );

  const now = new Date();
  const upcoming = sessions
    .filter((s: any) => new Date(s.starts_at) >= now)
    .reverse()
    .slice(0, 3);
  const past = sessions.filter((s: any) => new Date(s.starts_at) < now);

  return (
    <div className="space-y-6">
      <Card className="p-5 gradient-brand text-white">
        <p className="text-xs opacity-80">Bem-vindo(a)</p>
        <h1 className="text-2xl font-display font-bold mt-1">{patient.full_name}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs opacity-90">
          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{CLINIC.phone}</span>
          <span>{CLINIC.shortName} · {CLINIC.owner}</span>
        </div>
      </Card>

      <section>
        <h2 className="font-display font-bold mb-2 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Próximas sessões</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão agendada.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((s: any) => {
              const st = APPOINTMENT_STATUS[s.status] ?? APPOINTMENT_STATUS.agendado;
              return (
                <Card key={s.id} className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center text-[10px]">
                    <span className="font-bold leading-none text-base">{format(new Date(s.starts_at), "dd")}</span>
                    <span className="uppercase">{format(new Date(s.starts_at), "MMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.procedure ?? "Sessão"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(s.starts_at), "HH:mm")} · {s.duration_minutes} min</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${st.className}`}>{st.label}</span>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold mb-2 flex items-center gap-2"><Heart className="h-4 w-4 text-accent" /> Orientações recentes</h2>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem orientações registradas ainda.</p>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 5).map((r: any, i: number) => (
              <Card key={i} className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{format(new Date(r.record_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                <p className="text-sm whitespace-pre-line">{r.plan ?? "—"}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold mb-2">Histórico de sessões</h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não realizou nenhuma sessão.</p>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {past.map((s: any) => {
                const st = APPOINTMENT_STATUS[s.status] ?? APPOINTMENT_STATUS.agendado;
                return (
                  <li key={s.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.procedure ?? "Sessão"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.starts_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${st.className}`}>{st.label}</span>
                    <Button size="sm" variant="ghost" onClick={() => {
                      try {
                        downloadSessionReceiptPDF({ patient, session: s });
                      } catch {
                        toast.error("Não foi possível gerar o comprovante");
                      }
                    }}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
