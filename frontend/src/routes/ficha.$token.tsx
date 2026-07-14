import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { isMinor } from '@/lib/medical-intake/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export const Route = createFileRoute('/ficha/$token')({
  component: PublicMedicalIntakePage,
});

function PublicMedicalIntakePage() {
  const { token } = Route.useParams();
  const [formData, setFormData] = useState<any>({});
  const [submitted, setSubmitted] = useState(false);

  const PUBLIC_MEDICAL_INTAKE_ENABLED = import.meta.env.VITE_PUBLIC_MEDICAL_INTAKE_ENABLED === 'true';

  if (!PUBLIC_MEDICAL_INTAKE_ENABLED) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Serviço indisponível</h2>
          <p className="text-gray-600">A Ficha Médica Digital está temporariamente desativada.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const showGuardianSection = isMinor(formData.birth_date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate local send without real save
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Ficha recebida para conferência</h2>
          <p className="text-gray-600">Obrigado! Suas informações foram enviadas com sucesso e aguardam validação do profissional.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Ficha Médica</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Identificação</h2>
            <div>
              <Label>Nome completo</Label>
              <Input name="full_name" onChange={handleChange} required />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" name="birth_date" onChange={handleChange} required />
            </div>
            <div>
              <Label>CPF</Label>
              <Input name="cpf" onChange={handleChange} placeholder="000.000.000-00" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Plano e sangue</h2>
            <div>
              <Label>Tipo Sanguíneo</Label>
              <Input name="blood_type" onChange={handleChange} placeholder="Ex: O+" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Condições atuais</h2>
            <div className="flex items-center space-x-2">
              <Checkbox id="heart" name="has_heart_condition" onCheckedChange={(c) => handleChange({ target: { name: 'has_heart_condition', type: 'checkbox', checked: c }})} />
              <Label htmlFor="heart">Problemas cardíacos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="diabetes" name="has_diabetes" onCheckedChange={(c) => handleChange({ target: { name: 'has_diabetes', type: 'checkbox', checked: c }})} />
              <Label htmlFor="diabetes">Diabetes</Label>
            </div>
          </section>

          {showGuardianSection && (
            <section className="space-y-4 bg-orange-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold border-b pb-2">Responsável e consentimento</h2>
              <div>
                <Label>Nome do responsável</Label>
                <Input name="guardian_name" onChange={handleChange} required />
              </div>
              <div>
                <Label>CPF do responsável</Label>
                <Input name="guardian_cpf" onChange={handleChange} required />
              </div>
              <div className="flex items-start space-x-2 mt-4">
                <Checkbox id="consent" name="consent_accepted" required onCheckedChange={(c) => handleChange({ target: { name: 'consent_accepted', type: 'checkbox', checked: c }})} />
                <Label htmlFor="consent" className="text-sm">Declaro que as informações são verdadeiras e autorizo o uso para fins de avaliação.</Label>
              </div>
            </section>
          )}

          <Button type="submit" className="w-full">Revisar e Enviar</Button>
        </form>
      </div>
    </div>
  );
}
