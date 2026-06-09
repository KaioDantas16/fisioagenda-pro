import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import { waLink } from "@/lib/whatsapp";

type Props = {
  patientName?: string | null;
  phone?: string | null;
  email?: string | null;
  trigger?: React.ReactNode;
};

const TEMPLATES = [
  { label: "Lembrete de sessão", text: (n: string) => `Olá ${n}, passando para lembrar do nosso atendimento. Por favor, confirme sua presença. — Lenilson, CREFITO-9` },
  { label: "Confirmação", text: (n: string) => `Olá ${n}, sua sessão foi confirmada. Nos vemos em breve! — Lenilson, CREFITO-9` },
  { label: "Agradecimento", text: (n: string) => `Olá ${n}, obrigado pela presença na sessão de hoje. Lembre-se das orientações combinadas. — Lenilson, CREFITO-9` },
  { label: "Reagendamento", text: (n: string) => `Olá ${n}, preciso reagendar nossa sessão. Pode me passar uma nova disponibilidade? — Lenilson, CREFITO-9` },
];

export function MessageModal({ patientName, phone, email, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const firstName = (patientName ?? "").split(" ")[0] || "tudo bem";
  const [text, setText] = useState(TEMPLATES[0].text(firstName));

  const wa = waLink(phone, text);
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent("FisioAgenda Pro")}&body=${encodeURIComponent(text)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4 mr-1" />Mensagem</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader><DialogTitle>{patientName ? `Contato — ${patientName}` : "Enviar mensagem"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Modelos rápidos</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.label} type="button"
                  onClick={() => setText(t.text(firstName))}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-muted/70">
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{text.length}/1000</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button asChild={!!wa} disabled={!wa}
              className="bg-[#25D366] hover:bg-[#1ebe57] text-white">
              {wa ? <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</a> : <span>WhatsApp</span>}
            </Button>
            <Button asChild={!!mailto} disabled={!mailto} variant="outline">
              {mailto ? <a href={mailto}><Mail className="h-4 w-4 mr-1" />E-mail</a> : <span>E-mail</span>}
            </Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copiado"); }}>
              <Copy className="h-4 w-4 mr-1" />Copiar
            </Button>
          </div>
          {!phone && <p className="text-xs text-muted-foreground">Sem telefone cadastrado — WhatsApp indisponível.</p>}
          {!email && <p className="text-xs text-muted-foreground">Sem e-mail cadastrado — envio por e-mail indisponível.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
