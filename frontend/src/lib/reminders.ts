export type ReminderOffset = 1440 | 10;
export type ReminderRecipient = "patient" | "professional";

export function formatReminderOffset(minutes: ReminderOffset) {
  return minutes === 1440 ? "24 horas antes" : "10 minutos antes";
}

export function buildReminderIdempotencyKey(input: {
  appointmentId: string;
  recipientType: ReminderRecipient;
  offsetMinutes: ReminderOffset;
}) {
  return [
    input.appointmentId,
    input.recipientType,
    input.offsetMinutes,
  ].join(":");
}

export function calculateReminderTime(appointmentStart: string | Date, offsetMinutes: ReminderOffset) {
  const date = new Date(appointmentStart);
  return new Date(date.getTime() - offsetMinutes * 60 * 1000);
}

export function buildPatientReminderMessage(input: {
  patientName?: string | null;
  appointmentDateLabel: string;
  professionalName?: string | null;
}) {
  return [
    `Olá${input.patientName ? `, ${input.patientName}` : ""}!`,
    `Passando para lembrar da sua consulta no FisioAgenda Pro.`,
    `Data/horário: ${input.appointmentDateLabel}.`,
    input.professionalName ? `Profissional: ${input.professionalName}.` : "",
    `Caso precise remarcar, entre em contato com antecedência.`,
  ].filter(Boolean).join("\n");
}

export function buildProfessionalReminderMessage(input: {
  patientName?: string | null;
  appointmentDateLabel: string;
}) {
  return [
    `Lembrete de atendimento no FisioAgenda Pro.`,
    input.patientName ? `Paciente: ${input.patientName}.` : "",
    `Data/horário: ${input.appointmentDateLabel}.`,
    `Verifique o prontuário antes da consulta.`,
  ].filter(Boolean).join("\n");
}
