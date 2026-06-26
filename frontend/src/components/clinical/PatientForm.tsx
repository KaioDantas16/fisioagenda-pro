import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { maskCPF } from "@/lib/cpf";
import { CLASSIFICATIONS } from "@/lib/brand";

export const emptyPatientForm = {
  full_name: "", phone: "", email: "", birth_date: "",
  address: "", notes: "", cpf: "", rg: "", gender: "", insurance: "",
  profissao: "", escolaridade: "", estado_civil: "", cep: "",
  doctor_name: "", insurance_plan: "", sessions_authorized: "",
  classification: "estavel",
};

interface PatientFormProps {
  initialData?: any;
  onSubmit: (payload: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PatientForm({ initialData, onSubmit, onCancel, isSubmitting = false }: PatientFormProps) {
  const [form, setForm] = useState(emptyPatientForm);

  useEffect(() => {
    if (initialData) {
      setForm({ ...emptyPatientForm, ...initialData });
    } else {
      setForm(emptyPatientForm);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* 1. Dados pessoais */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">Dados pessoais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome completo *</Label>
              <Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={form.cpf || ""} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" inputMode="numeric" />
            </div>
            <div>
              <Label>RG</Label>
              <Input value={form.rg || ""} onChange={(e) => setForm({ ...form, rg: e.target.value })} />
            </div>
            <div>
              <Label>Nascimento</Label>
              <Input type="date" value={form.birth_date || ""} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <Label>Gênero</Label>
              <Select value={form.gender || ""} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado civil</Label>
              <Select value={form.estado_civil || ""} onValueChange={(v) => setForm({ ...form, estado_civil: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Escolaridade</Label>
              <Select value={form.escolaridade || ""} onValueChange={(v) => setForm({ ...form, escolaridade: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {["Fundamental", "Médio", "Superior", "Pós-graduação"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Profissão</Label>
              <Input value={form.profissao || ""} onChange={(e) => setForm({ ...form, profissao: e.target.value })} />
            </div>
          </div>
        </section>

        {/* 2. Contato */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">Contato</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(64) 9..." />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        </section>

        {/* 3. Endereço */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">Endereço</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>CEP</Label>
              <Input value={form.cep || ""} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </section>

        {/* 4. Convênio */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">Convênio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Convênio/Plano</Label>
              <Input value={form.insurance || ""} onChange={(e) => setForm({ ...form, insurance: e.target.value })} placeholder="Particular" />
            </div>
            <div>
              <Label>Sessões autorizadas</Label>
              <Input type="number" value={form.sessions_authorized || ""} onChange={(e) => setForm({ ...form, sessions_authorized: e.target.value })} />
            </div>
          </div>
        </section>

        {/* 5. Informações clínicas */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações clínicas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Médico solicitante</Label>
              <Input value={form.doctor_name || ""} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} placeholder="Nome + CRM" />
            </div>
            <div>
              <Label>Classificação clínica</Label>
              <Select value={form.classification || "estavel"} onValueChange={(v) => setForm({ ...form, classification: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CLASSIFICATIONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 pt-4 border-t bg-card/50 flex justify-end gap-3 shrink-0">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="gradient-brand text-white" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
