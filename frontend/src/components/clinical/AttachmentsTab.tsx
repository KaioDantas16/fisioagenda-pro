import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

export function AttachmentsTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: list = [] } = useQuery({
    queryKey: ["attachments", patientId],
    queryFn: async () => (await (supabase.from as any)("attachments").select("*").eq("patient_id", patientId).order("created_at", { ascending: false })).data ?? [],
  });

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const path = `patients/${patientId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("clinic-assets").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await (supabase.from as any)("attachments").insert({
        patient_id: patientId, file_name: file.name, mime_type: file.type, size_bytes: file.size, storage_path: path,
      });
      if (dbErr) throw dbErr;
      toast.success("Arquivo enviado");
      qc.invalidateQueries({ queryKey: ["attachments", patientId] });
    } catch (err: any) {
      toast.error(err.message ?? "Falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function download(a: any) {
    const { data, error } = await supabase.storage.from("clinic-assets").createSignedUrl(a.storage_path, 60);
    if (error || !data) return toast.error("Falha ao gerar link");
    window.open(data.signedUrl, "_blank");
  }

  async function remove(a: any) {
    if (!confirm("Excluir anexo?")) return;
    await supabase.storage.from("clinic-assets").remove([a.storage_path]);
    await (supabase.from as any)("attachments").delete().eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["attachments", patientId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <input ref={fileRef} type="file" className="hidden" onChange={upload} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gradient-brand text-white">
          <Upload className="h-4 w-4 mr-1" />{uploading ? "Enviando..." : "Enviar arquivo"}
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl shadow-card">Nenhum anexo.</p>
      ) : list.map((a: any) => (
        <div key={a.id} className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{a.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(a.created_at), "dd/MM/yyyy HH:mm")} · {(a.size_bytes / 1024).toFixed(1)} KB · {a.mime_type ?? "—"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => download(a)}><Download className="h-3.5 w-3.5 mr-1" />Abrir</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}
