import { waLink } from "@/lib/whatsapp";

export type PatientShareInput = {
  patientName?: string | null;
  professionalName?: string | null;
  dateLabel?: string | null;
  phone?: string | null;
};

export function buildPatientSummaryWhatsAppMessage(input: PatientShareInput) {
  return [
    `Olá! Segue um resumo de contato do atendimento fisioterapêutico.`,
    ``,
    `Paciente: ${input.patientName || "—"}`,
    input.dateLabel ? `Data: ${input.dateLabel}` : "",
    input.professionalName ? `Profissional: ${input.professionalName}` : "",
    ``,
    `Documento gerado pelo FisioAgenda Pro.`,
    `Por segurança, este resumo não inclui conteúdo clínico completo.`,
  ].filter((line) => line !== "").join("\n");
}

export function buildAppointmentReminderWhatsAppMessage(input: PatientShareInput & {
  appointmentDateLabel: string;
}) {
  return [
    `Olá${input.patientName ? `, ${input.patientName}` : ""}!`,
    `Lembrete do seu atendimento fisioterapêutico.`,
    ``,
    `Data: ${input.appointmentDateLabel}`,
    input.professionalName ? `Profissional: ${input.professionalName}` : "",
    ``,
    `Mensagem gerada pelo FisioAgenda Pro.`,
  ].filter(Boolean).join("\n");
}

export function buildReportShareWhatsAppMessage(input: PatientShareInput) {
  return [
    `Olá! Segue o relatório/prontuário referente ao atendimento fisioterapêutico.`,
    ``,
    `Paciente: ${input.patientName || "—"}`,
    `Data: ${input.dateLabel || "—"}`,
    `Profissional: ${input.professionalName || "—"}`,
    ``,
    `Documento gerado pelo FisioAgenda Pro.`,
    ``,
    `Por segurança, o conteúdo clínico completo deve ser conferido pelo profissional antes de compartilhar.`,
  ].join("\n");
}

export function buildSupportShareWhatsAppMessage(input: {
  protocol: string;
  subject: string;
  status: string;
}) {
  return [
    `Resumo de chamado — FisioAgenda Pro`,
    ``,
    `Protocolo: ${input.protocol}`,
    `Assunto: ${input.subject}`,
    `Status: ${input.status}`,
    ``,
    `Gerado pelo FisioAgenda Pro. Não inclui dados clínicos.`,
  ].join("\n");
}

export function openWhatsAppShare(phone: string | null | undefined, message: string) {
  const url = waLink(phone, message);
  if (!url) {
    const fallback = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(fallback, "_blank", "noopener,noreferrer");
    return fallback;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}

export async function copyShareMessage(message: string) {
  await navigator.clipboard.writeText(message);
  return message;
}
