import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { fmtBRL } from "@/lib/cpf";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  packageId: string;
  amount: number;
  description: string;
  patientName: string;
  onPaid?: () => void;
};

type PixData = {
  pix_code: string;
  qr_code_base64: string;
  payment_id: string;
  expires_at: string;
};

export function PixCheckoutModal({
  open, onOpenChange, packageId, amount, description, patientName, onPaid,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixData | null>(null);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(30 * 60);

  useEffect(() => {
    if (!open) { setPix(null); setPaid(false); setError(null); return; }
    if (pix) return;
    setLoading(true);
    supabase.functions.invoke("create-pix", {
      body: {
        amount: Number(amount.toFixed(2)),
        description,
        patient_name: patientName,
        package_id: packageId,
      },
    }).then(({ data, error }) => {
      if (error || data?.error) {
        setError(error?.message ?? data?.error ?? "Falha ao gerar Pix.");
      } else if (data?.pix_code) {
        setPix(data as PixData);
      } else {
        setError("Edge Function 'create-pix' indisponível. Verifique o deploy e os Secrets do Mercado Pago.");
      }
      setLoading(false);
    });
  }, [open, packageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown 30 min
  useEffect(() => {
    if (!pix || paid) return;
    setRemaining(30 * 60);
    const i = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(i);
  }, [pix, paid]);

  async function checkPaid() {
    if (!pix) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("check-pix-status", {
      body: { payment_id: pix.payment_id, package_id: packageId },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data?.paid) {
      setPaid(true);
      toast.success("Pagamento confirmado! Pacote ativo ✓");
      onPaid?.();
      setTimeout(() => onOpenChange(false), 1500);
    } else {
      toast.info(`Status: ${data?.status ?? "desconhecido"}. Tente novamente em alguns segundos.`);
    }
  }

  function copy() {
    if (!pix?.pix_code) return;
    navigator.clipboard.writeText(pix.pix_code);
    toast.success("Código Pix copiado");
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />Pagamento Pix
          </DialogTitle>
          <DialogDescription>
            {patientName} · {fmtBRL(amount)} · expira em {mm}:{ss}
          </DialogDescription>
        </DialogHeader>

        {loading && !pix && (
          <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-6 w-6 animate-spin" />Gerando QR Code…
          </div>
        )}

        {error && (
          <div className="py-4 text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</div>
        )}

        {paid && (
          <div className="py-10 flex flex-col items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-12 w-12" />
            <p className="font-display font-bold text-lg">Pagamento confirmado!</p>
          </div>
        )}

        {pix && !paid && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-2xl border flex items-center justify-center">
              <img
                src={`data:image/png;base64,${pix.qr_code_base64}`}
                alt="QR Code Pix"
                className="h-56 w-56" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Copia e cola Pix</p>
              <div className="rounded-xl bg-muted p-2 break-all text-[10px] font-mono max-h-20 overflow-auto">
                {pix.pix_code}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copy}>
                <Copy className="h-4 w-4 mr-1" />Copiar código
              </Button>
              <Button className="gradient-brand text-white" onClick={checkPaid} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Já paguei
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
