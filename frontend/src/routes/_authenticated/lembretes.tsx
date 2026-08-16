import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BellRing, Clock, Copy, MessageSquare, AlertCircle, Info, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffectiveTherapistId } from "@/hooks/use-effective-therapist-id";
import {
  buildPatientReminderMessage,
  buildProfessionalReminderMessage,
  calculateReminderTime,
  ReminderOffset,
  ReminderRecipient
} from "@/lib/reminders";
import { openWhatsAppShare } from "@/lib/whatsapp-share";

export const Route = createFileRoute("/_authenticated/lembretes")({
  head: () => ({ meta: [{ title: "Lembretes — FisioAgenda Pro" }] }),
  component: Lembretes,
});

type ReminderPreview = {
  id: string; // fake id for mapping
  appointmentId: string;
  patientName: string;
  patientPhone: string | null;
  appointmentDate: string;
  offset: ReminderOffset;
  recipient: ReminderRecipient;
  message: string;
  status: "Preparado" | "Pendente" | "Sem telefone" | "Futuro";
};

function Lembretes() {
  const { data: therapistId } = useEffectiveTherapistId();
  const [filters, setFilters] = useState({
    offset24h: true,
    offset10m: true,
    toPatient: true,
    toProfessional: true,
    channelWhatsapp: true,
  });

  const { data: upcomingAppointments = [], isLoading } = useQuery({
    queryKey: ["upcoming-appointments", therapistId],
    enabled: !!therapistId,
    queryFn: async () => {
      if (!therapistId) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("appointments")
        .select("id, starts_at, therapist_id, patient_id, patient:patients(id, full_name, phone)")
        .eq("therapist_id", therapistId)
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(50);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic_settings", therapistId],
    enabled: !!therapistId,
    queryFn: async () => {
      if (!therapistId) return null;
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("professional_name")
        .eq("therapist_id", therapistId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const generateReminders = (): ReminderPreview[] => {
    const reminders: ReminderPreview[] = [];

    upcomingAppointments.forEach((appt: any) => {
      const dateLabel = format(new Date(appt.starts_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const pName = appt.patient?.full_name || "Paciente";
      const pPhone = appt.patient?.phone || null;
      const profName = clinicSettings?.professional_name || "Seu Fisioterapeuta";

      // 24h Patient
      if (filters.offset24h && filters.toPatient) {
        const msg = buildPatientReminderMessage({ patientName: pName, appointmentDateLabel: dateLabel, professionalName: profName });
        const time = calculateReminderTime(appt.starts_at, 1440);
        reminders.push({
          id: `${appt.id}-pat-24h`, appointmentId: appt.id, patientName: pName, patientPhone: pPhone,
          appointmentDate: appt.starts_at, offset: 1440, recipient: "patient", message: msg,
          status: pPhone ? (isAfter(new Date(), time) ? "Pendente" : "Futuro") : "Sem telefone"
        });
      }
      // 10m Patient
      if (filters.offset10m && filters.toPatient) {
        const msg = buildPatientReminderMessage({ patientName: pName, appointmentDateLabel: dateLabel, professionalName: profName });
        const time = calculateReminderTime(appt.starts_at, 10);
        reminders.push({
          id: `${appt.id}-pat-10m`, appointmentId: appt.id, patientName: pName, patientPhone: pPhone,
          appointmentDate: appt.starts_at, offset: 10, recipient: "patient", message: msg,
          status: pPhone ? (isAfter(new Date(), time) ? "Pendente" : "Futuro") : "Sem telefone"
        });
      }
      // 24h Prof
      if (filters.offset24h && filters.toProfessional) {
        const msg = buildProfessionalReminderMessage({ patientName: pName, appointmentDateLabel: dateLabel });
        const time = calculateReminderTime(appt.starts_at, 1440);
        reminders.push({
          id: `${appt.id}-prof-24h`, appointmentId: appt.id, patientName: pName, patientPhone: pPhone,
          appointmentDate: appt.starts_at, offset: 1440, recipient: "professional", message: msg,
          status: isAfter(new Date(), time) ? "Pendente" : "Futuro"
        });
      }
      // 10m Prof
      if (filters.offset10m && filters.toProfessional) {
        const msg = buildProfessionalReminderMessage({ patientName: pName, appointmentDateLabel: dateLabel });
        const time = calculateReminderTime(appt.starts_at, 10);
        reminders.push({
          id: `${appt.id}-prof-10m`, appointmentId: appt.id, patientName: pName, patientPhone: pPhone,
          appointmentDate: appt.starts_at, offset: 10, recipient: "professional", message: msg,
          status: isAfter(new Date(), time) ? "Pendente" : "Futuro"
        });
      }
    });

    return reminders;
  };

  const reminders = generateReminders();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Mensagem copiada para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar a mensagem");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <BellRing className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Central de Lembretes</h1>
          <p className="text-muted-foreground text-sm">Visualize os lembretes de consulta para pacientes e profissional, com preparação para envio por WhatsApp oficial.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <Clock className="w-6 h-6 text-blue-500 mb-1" />
            <p className="text-sm font-medium text-blue-900">24 horas</p>
            <p className="text-xs text-blue-600">Confirmação prévia</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-100">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <Clock className="w-6 h-6 text-orange-500 mb-1" />
            <p className="text-sm font-medium text-orange-900">10 minutos</p>
            <p className="text-xs text-orange-600">Aviso imediato</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <MessageSquare className="w-6 h-6 text-green-500 mb-1" />
            <p className="text-sm font-medium text-green-900">Paciente</p>
            <p className="text-xs text-green-600">Evitar faltas</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <BellRing className="w-6 h-6 text-purple-500 mb-1" />
            <p className="text-sm font-medium text-purple-900">Profissional</p>
            <p className="text-xs text-purple-600">Organização</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            O envio automático por WhatsApp ainda não está ligado. Nesta versão, os interruptores só filtram o que aparece nesta tela. Nada é salvo no servidor. Você pode copiar ou abrir a mensagem no WhatsApp do celular.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Filtros desta tela</CardTitle>
            <CardDescription>Não são salvos. Servem só para montar a lista agora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex-1 cursor-pointer">Lembrete 24h antes</Label>
              <Switch checked={filters.offset24h} onCheckedChange={(v) => setFilters({...filters, offset24h: v})} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex-1 cursor-pointer">Lembrete 10m antes</Label>
              <Switch checked={filters.offset10m} onCheckedChange={(v) => setFilters({...filters, offset10m: v})} />
            </div>
            <hr className="my-2" />
            <div className="flex items-center justify-between">
              <Label className="flex-1 cursor-pointer">Para Paciente</Label>
              <Switch checked={filters.toPatient} onCheckedChange={(v) => setFilters({...filters, toPatient: v})} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex-1 cursor-pointer">Para Profissional</Label>
              <Switch checked={filters.toProfessional} onCheckedChange={(v) => setFilters({...filters, toProfessional: v})} />
            </div>
            <hr className="my-2" />
            <div className="flex items-center justify-between opacity-70">
              <Label className="flex-1">Canal: WhatsApp</Label>
              <Switch checked={filters.channelWhatsapp} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Próximos Lembretes</CardTitle>
            <CardDescription>Baseados na agenda futura do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Buscando consultas futuras...</p>
            ) : upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                <p>Nenhuma consulta futura encontrada para gerar lembretes.</p>
              </div>
            ) : reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                <p>Nenhum lembrete gerado com os filtros atuais.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reminders.map(rem => (
                  <div key={rem.id} className="border rounded-xl p-4 space-y-3 bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 border-b pb-3">
                      <div>
                        <p className="font-semibold text-sm">{rem.patientName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {format(new Date(rem.appointmentDate), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          rem.status === 'Futuro' ? 'bg-gray-100 text-gray-600' :
                          rem.status === 'Sem telefone' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rem.status}
                        </span>
                        <div className="flex gap-1 text-[10px] uppercase font-mono text-muted-foreground">
                          <span>{rem.offset === 1440 ? '24h' : '10m'}</span>
                          <span>•</span>
                          <span>{rem.recipient === 'patient' ? 'Paciente' : 'Profissional'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap font-mono relative group">
                      {rem.message}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background"
                        onClick={() => void copyToClipboard(rem.message)}
                        title="Copiar mensagem"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => void copyToClipboard(rem.message)}>
                        <Copy className="w-4 h-4 mr-2" /> Copiar
                      </Button>
                      {rem.recipient === 'patient' ? (
                        rem.patientPhone ? (
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => openWhatsAppShare(rem.patientPhone, rem.message)}>
                            <MessageSquare className="w-4 h-4 mr-2" /> Abrir WhatsApp
                          </Button>
                        ) : (
                          <Button size="sm" disabled variant="outline" className="flex-1">
                            <PhoneOff className="w-4 h-4 mr-2" /> Sem número
                          </Button>
                        )
                      ) : (
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => toast.info("Lembrete interno (sistema/app futuro). Copie o texto se desejar enviar para si mesmo.")}>
                          <BellRing className="w-4 h-4 mr-2" /> Interno
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
