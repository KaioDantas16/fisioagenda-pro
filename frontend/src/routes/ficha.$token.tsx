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
            <div>
              <Label>Cartão SUS</Label>
              <Input name="sus_card" onChange={handleChange} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Plano e sangue</h2>
            <div>
              <Label>Plano de saúde</Label>
              <Input name="health_plan_name" onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo Sanguíneo</Label>
                <Input name="blood_type" onChange={handleChange} placeholder="Ex: O" />
              </div>
              <div>
                <Label>Fator RH</Label>
                <Input name="rh_factor" onChange={handleChange} placeholder="Ex: +" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Doenças que já teve</h2>
            <div>
              <Label>Quais doenças infantis ou outras você já teve?</Label>
              <Input name="past_diseases" onChange={handleChange} placeholder="Catapora, sarampo, etc." />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Condições atuais</h2>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="heart" name="has_heart_condition" onCheckedChange={(c) => handleChange({ target: { name: 'has_heart_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="heart">Problemas cardíacos</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="diabetes" name="has_diabetes" onCheckedChange={(c) => handleChange({ target: { name: 'has_diabetes', type: 'checkbox', checked: c }})} />
                <Label htmlFor="diabetes">Diabetes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="kidney" name="has_kidney_condition" onCheckedChange={(c) => handleChange({ target: { name: 'has_kidney_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="kidney">Problemas renais</Label>
              </div>
              {formData.has_kidney_condition && <Input name="kidney_condition" onChange={handleChange} placeholder="Detalhes do problema renal" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="psycho" name="has_psychological_condition" onCheckedChange={(c) => handleChange({ target: { name: 'has_psychological_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="psycho">Problemas psicológicos</Label>
              </div>
              {formData.has_psychological_condition && <Input name="psychological_condition" onChange={handleChange} placeholder="Detalhes" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="other_cond" name="has_other_condition" onCheckedChange={(c) => handleChange({ target: { name: 'has_other_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="other_cond">Outros problemas de saúde</Label>
              </div>
              {formData.has_other_condition && <Input name="other_conditions" onChange={handleChange} placeholder="Quais?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="meds" name="has_current_medication" onCheckedChange={(c) => handleChange({ target: { name: 'has_current_medication', type: 'checkbox', checked: c }})} />
                <Label htmlFor="meds">Faz uso de algum medicamento?</Label>
              </div>
              {formData.has_current_medication && <Input name="current_medications" onChange={handleChange} placeholder="Quais medicamentos?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="allergy" name="has_allergy" onCheckedChange={(c) => handleChange({ target: { name: 'has_allergy', type: 'checkbox', checked: c }})} />
                <Label htmlFor="allergy">Tem alergias?</Label>
              </div>
              {formData.has_allergy && <Input name="allergies" onChange={handleChange} placeholder="Quais alergias?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="allergy_meds" name="has_allergy_medication" onCheckedChange={(c) => handleChange({ target: { name: 'has_allergy_medication', type: 'checkbox', checked: c }})} />
                <Label htmlFor="allergy_meds">Usa remédio para alergia?</Label>
              </div>
              {formData.has_allergy_medication && <Input name="allergy_medications" onChange={handleChange} placeholder="Quais remédios?" className="ml-6" />}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Histórico recente</h2>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="injury" name="has_recent_injury" onCheckedChange={(c) => handleChange({ target: { name: 'has_recent_injury', type: 'checkbox', checked: c }})} />
                <Label htmlFor="injury">Ferimento recente?</Label>
              </div>
              {formData.has_recent_injury && <Input name="recent_injury" onChange={handleChange} placeholder="Detalhes do ferimento" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="fracture" name="has_recent_fracture" onCheckedChange={(c) => handleChange({ target: { name: 'has_recent_fracture', type: 'checkbox', checked: c }})} />
                <Label htmlFor="fracture">Fratura recente?</Label>
              </div>
              {formData.has_recent_fracture && (
                <div className="ml-6 space-y-2 mt-2">
                  <Input name="recent_fracture" onChange={handleChange} placeholder="Local da fratura" />
                  <Input name="immobilization_time" onChange={handleChange} placeholder="Tempo imobilizado" />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox id="surgery" name="has_surgery_history" onCheckedChange={(c) => handleChange({ target: { name: 'has_surgery_history', type: 'checkbox', checked: c }})} />
                <Label htmlFor="surgery">Passou por cirurgias?</Label>
              </div>
              {formData.has_surgery_history && <Input name="surgeries" onChange={handleChange} placeholder="Quais e quando?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="hosp" name="has_recent_hospitalization" onCheckedChange={(c) => handleChange({ target: { name: 'has_recent_hospitalization', type: 'checkbox', checked: c }})} />
                <Label htmlFor="hosp">Internação nos últimos 5 anos?</Label>
              </div>
              {formData.has_recent_hospitalization && <Input name="recent_hospitalization" onChange={handleChange} placeholder="Motivo da internação" className="ml-6" />}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Deficiência ou condição específica</h2>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="disability" name="has_disability_or_specific_condition" onCheckedChange={(c) => handleChange({ target: { name: 'has_disability_or_specific_condition', type: 'checkbox', checked: c }})} />
              <Label htmlFor="disability">Possui alguma deficiência ou condição?</Label>
            </div>
            {formData.has_disability_or_specific_condition && <Input name="disability_or_specific_condition" onChange={handleChange} placeholder="Especifique" className="ml-6" />}

            <div className="mt-4">
              <Label>Observação Médica Geral</Label>
              <Input name="general_observation" onChange={handleChange} placeholder="Algo mais que o profissional deva saber?" />
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

          <section className="pt-4">
            <h2 className="text-xl font-semibold border-b pb-4 mb-4">Revisão e envio</h2>
            <Button type="submit" className="w-full">Finalizar e Enviar Ficha</Button>
          </section>
        </form>
      </div>
    </div>
  );
}
