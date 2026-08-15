import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, MessageCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  buildPatientSummaryWhatsAppMessage,
  buildReportShareWhatsAppMessage,
  copyShareMessage,
  openWhatsAppShare,
} from "@/lib/whatsapp-share";

type ShareKind = "summary" | "report";

type Props = {
  kind?: ShareKind;
  patientId?: string;
  patientName?: string | null;
  phone?: string | null;
  professionalName?: string | null;
  dateLabel?: string | null;
  trigger?: React.ReactNode;
};

export function WhatsAppShareDialog({
  kind = "report",
  patientName,
  phone,
  professionalName,
  dateLabel,
  trigger,
}: Props) {
  const builder = kind === "summary" ? buildPatientSummaryWhatsAppMessage : buildReportShareWhatsAppMessage;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => builder({ patientName, professionalName, dateLabel }));

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next);
      if (next) setText(builder({ patientName, professionalName, dateLabel }));
    }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar no WhatsApp</DialogTitle>
          <DialogDescription>
            Mensagem pronta, sem conteúdo clínico completo. Confira antes de enviar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} maxLength={1200} />
          <p className="text-[11px] text-muted-foreground flex items-start gap-2">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Por segurança, o conteúdo clínico completo deve ser conferido pelo profissional antes de compartilhar.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-[#25D366] hover:bg-[#1ebe57] text-white"
              onClick={async () => {
                openWhatsAppShare(phone, text);
                toast.success("WhatsApp aberto");
              }}
            >
              <MessageCircle className="h-4 w-4 mr-1" />Abrir WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await copyShareMessage(text);
                toast.success("Mensagem copiada");
              }}
            >
              <Copy className="h-4 w-4 mr-1" />Copiar mensagem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
