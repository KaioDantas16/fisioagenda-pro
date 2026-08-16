import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, CheckCircle2, MessageSquare, Mail, Copy, AlertCircle, Paperclip, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  supportContact,
  buildSupportProtocol,
  buildSupportMessage,
  buildMailtoUrl
} from "@/lib/support-contact";
import { buildSupportShareWhatsAppMessage, copyShareMessage, openWhatsAppShare } from "@/lib/whatsapp-share";

export const Route = createFileRoute("/_authenticated/suporte")({
  head: () => ({ meta: [{ title: "Suporte — FisioAgenda Pro" }] }),
  component: Suporte,
});

const CATEGORIES = {
  duvida: "Dúvida de uso",
  erro: "Relatar um erro",
  melhoria: "Sugestão de melhoria",
  financeiro: "Financeiro/Assinatura",
  acesso: "Problemas de acesso",
  urgente: "Urgência técnica"
};

const PRIORITIES = {
  baixa: "Baixa (não impede o uso)",
  normal: "Normal (dúvida ou erro simples)",
  alta: "Alta (impacta atendimentos)",
  urgente: "Urgente (sistema inoperante)"
};

const STATUS_LABELS = {
  open: "Aberto",
  in_progress: "Em atendimento",
  resolved: "Resolvido",
  closed: "Fechado"
};

const STATUS_CLASS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const PRIORITY_CLASS: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  normal: "bg-primary/10 text-primary",
  alta: "bg-amber-100 text-amber-800",
  urgente: "bg-destructive/15 text-destructive",
};

function Suporte() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [form, setForm] = useState({
    category: "duvida",
    priority: "normal",
    contact_preference: "whatsapp",
    subject: "",
    message: ""
  });

  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["support-ticket-messages", openId],
    enabled: !!openId,
    queryFn: async () => {
      if (!openId) return [];
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", openId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subject.trim().length < 3) return toast.error("O assunto deve ter pelo menos 3 caracteres.");
    if (form.message.trim().length < 10) return toast.error("A mensagem deve ter pelo menos 10 caracteres.");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          category: form.category,
          priority: form.priority,
          contact_preference: form.contact_preference,
          subject: form.subject.trim(),
          message: form.message.trim()
        })
        .select()
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("O chamado foi criado, mas o protocolo não retornou.");

      toast.success("Chamado aberto com sucesso!");
      setCreatedTicket(data);
      setOpenId(data.id);
      setForm({ ...form, subject: "", message: "" });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    } catch (err: any) {
      console.error(err);
      toast.error("Falha ao abrir chamado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Mensagem copiada para a área de transferência");
  };

  async function addComment(ticketId: string) {
    if (comment.trim().length < 1) return toast.error("Escreva um comentário.");
    setCommentLoading(true);
    try {
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        message: comment.trim(),
        is_internal: false,
      });
      if (error) throw error;
      setComment("");
      qc.invalidateQueries({ queryKey: ["support-ticket-messages", ticketId] });
      toast.success("Comentário adicionado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCommentLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Suporte Técnico</h1>
          <p className="text-muted-foreground text-sm">Abra um chamado para solicitar ajuda, relatar erro ou pedir melhoria no FisioAgenda Pro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle>Abrir Novo Chamado</CardTitle>
            <CardDescription>Preencha os detalhes do problema ou solicitação.</CardDescription>
          </CardHeader>
          <CardContent>
            {createdTicket ? (
              <div className="space-y-4 bg-muted/30 p-6 rounded-xl border">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold text-lg">Chamado registrado!</span>
                </div>

                <div className="bg-background p-4 rounded-lg border font-mono text-sm flex items-center justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground">Protocolo: </span>
                    <span className="font-bold">{buildSupportProtocol(createdTicket.id)}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(buildSupportProtocol(createdTicket.id));
                    toast.success("Protocolo copiado");
                  }}>
                    <Copy className="w-4 h-4 mr-1" />Copiar protocolo
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Seu chamado foi registrado em nosso sistema. Para agilizar o atendimento, você pode enviar os detalhes diretamente para nossa equipe:
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => copyToClipboard(buildSupportMessage({
                    protocol: buildSupportProtocol(createdTicket.id),
                    category: CATEGORIES[createdTicket.category as keyof typeof CATEGORIES],
                    priority: PRIORITIES[createdTicket.priority as keyof typeof PRIORITIES],
                    subject: createdTicket.subject,
                    message: createdTicket.message
                  }))}>
                    <Copy className="w-4 h-4 mr-2" /> Copiar Mensagem
                  </Button>

                  {supportContact.whatsappNumber ? (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => openWhatsAppShare(supportContact.whatsappNumber, buildSupportMessage({
                      protocol: buildSupportProtocol(createdTicket.id),
                      category: CATEGORIES[createdTicket.category as keyof typeof CATEGORIES],
                      priority: PRIORITIES[createdTicket.priority as keyof typeof PRIORITIES],
                      subject: createdTicket.subject,
                      message: createdTicket.message
                    }))}>
                      <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="flex-1">WhatsApp Indisponível</Button>
                  )}

                  {supportContact.email ? (
                    <Button variant="outline" className="flex-1" onClick={() => window.open(buildMailtoUrl(supportContact.email, `Suporte FisioAgenda Pro: ${buildSupportProtocol(createdTicket.id)}`, buildSupportMessage({
                      protocol: buildSupportProtocol(createdTicket.id),
                      category: CATEGORIES[createdTicket.category as keyof typeof CATEGORIES],
                      priority: PRIORITIES[createdTicket.priority as keyof typeof PRIORITIES],
                      subject: createdTicket.subject,
                      message: createdTicket.message
                    })), "_self")}>
                      <Mail className="w-4 h-4 mr-2" /> E-mail
                    </Button>
                  ) : null}
                </div>

                {(!supportContact.whatsappNumber && !supportContact.email) && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Contato externo não configurado neste ambiente. Use o botão "Copiar" e envie pelo seu meio de preferência.
                  </p>
                )}

                <Button variant="ghost" className="w-full mt-4" onClick={() => setCreatedTicket(null)}>
                  Abrir outro chamado
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITIES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferência de Contato</Label>
                  <Select value={form.contact_preference} onValueChange={(v) => setForm({ ...form, contact_preference: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assunto *</Label>
                  <Input
                    placeholder="Ex: Dúvida sobre agenda"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    required
                    minLength={3}
                    maxLength={140}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem *</Label>
                  <Textarea
                    placeholder="Descreva detalhadamente o problema ou solicitação..."
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    required
                    minLength={10}
                    maxLength={4000}
                  />
                  <p className="text-xs text-muted-foreground text-right">{form.message.length}/4000</p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
                  <Paperclip className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Anexos de evidência ainda não sobem por aqui. Copie prints, descreva o horário do erro e cole o protocolo no WhatsApp/e-mail.
                    Upload seguro fica para uma fase posterior.
                  </span>
                </div>

                <Button type="submit" className="w-full gradient-brand text-white" disabled={loading}>
                  {loading ? "Enviando..." : "Abrir chamado"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Seus últimos chamados</h2>

          {isLoadingTickets ? (
            <p className="text-sm text-muted-foreground">Carregando histórico...</p>
          ) : tickets.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <LifeBuoy className="w-8 h-8 opacity-20" />
                <p>Nenhum chamado aberto até o momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const protocol = buildSupportProtocol(ticket.id);
                const share = buildSupportShareWhatsAppMessage({
                  protocol,
                  subject: ticket.subject,
                  status: STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status,
                });
                return (
                <Card key={ticket.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm line-clamp-1 flex-1" title={ticket.subject}>
                        {ticket.subject}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${STATUS_CLASS[ticket.status] || STATUS_CLASS.closed}`}>
                        {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{protocol}</span>
                      <span>•</span>
                      <span>{CATEGORIES[ticket.category as keyof typeof CATEGORIES]}</span>
                      <span className={`px-2 py-0.5 rounded-full ${PRIORITY_CLASS[ticket.priority] || PRIORITY_CLASS.normal}`}>
                        {PRIORITIES[ticket.priority as keyof typeof PRIORITIES]?.split(" (")[0] || ticket.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Aberto {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}
                      {" · "}
                      Atualizado {format(new Date(ticket.updated_at), "dd/MM/yyyy HH:mm")}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        navigator.clipboard.writeText(protocol);
                        toast.success("Protocolo copiado");
                      }}>
                        <Copy className="h-3.5 w-3.5 mr-1" />Copiar protocolo
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await copyShareMessage(share);
                        toast.success("Resumo copiado para WhatsApp");
                      }}>
                        Copiar resumo
                      </Button>
                      <Button size="sm" className="bg-[#25D366] hover:bg-[#1ebe57] text-white" onClick={() => openWhatsAppShare(supportContact.whatsappNumber, share)}>
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === ticket.id ? null : ticket.id)}>
                        {openId === ticket.id ? "Ocultar linha do tempo" : "Linha do tempo"}
                      </Button>
                    </div>

                    {openId === ticket.id && (
                      <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Linha do tempo</p>
                        <div className="space-y-2">
                          <div className="border-l-2 border-primary/40 pl-3">
                            <p className="text-xs font-medium">Chamado aberto</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}</p>
                            <p className="text-sm mt-1">{ticket.message}</p>
                          </div>
                          {messages.map((m: any) => (
                            <div key={m.id} className="border-l-2 border-muted-foreground/30 pl-3">
                              <p className="text-xs font-medium">{m.is_internal ? "Nota interna" : "Comentário"}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}</p>
                              <p className="text-sm mt-1">{m.message}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Adicionar comentário</Label>
                          <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={4000} placeholder="Atualize o chamado sem dados clínicos desnecessários." />
                          <Button size="sm" onClick={() => addComment(ticket.id)} disabled={commentLoading}>
                            {commentLoading ? "Enviando..." : "Adicionar comentário"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
