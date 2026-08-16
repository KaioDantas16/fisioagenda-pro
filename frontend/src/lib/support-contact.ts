/** Optional public contact. Configure VITE_SUPPORT_WHATSAPP_NUMBER and VITE_SUPPORT_EMAIL in the frontend env. */
export const supportContact = {
  whatsappNumber: import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || "",
  email: import.meta.env.VITE_SUPPORT_EMAIL || "",
};

export function buildSupportProtocol(id: string) {
  return `SUP-${id.slice(0, 8).toUpperCase()}`;
}

export function buildSupportMessage(input: {
  protocol: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
}) {
  return [
    `Olá, preciso de suporte no FisioAgenda Pro.`,
    ``,
    `Protocolo: ${input.protocol}`,
    `Categoria: ${input.category}`,
    `Prioridade: ${input.priority}`,
    `Assunto: ${input.subject}`,
    ``,
    `Mensagem:`,
    input.message,
  ].join("\n");
}

export function buildMailtoUrl(email: string, subject: string, message: string) {
  if (!email) return "";
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
