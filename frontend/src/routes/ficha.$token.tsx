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

  const fillDemoData = () => {
    setFormData({
      full_name: 'Lucas Henrique Alves',
      birth_date: '2012-05-10',
      cpf: '',
      sus_card: '000000000000000',
      health_plan_name: 'Plano Teste Saúde',
      blood_type: 'O',
      rh_factor: 'Positivo',
      has_diabetes: true,
      has_current_medication: true,
      current_medications: 'Medicamento fictício controlado para teste',
      has_allergy: true,
      allergies: 'Amendoim',
      has_allergy_medication: true,
      allergy_medications: 'Dipirona',
      has_recent_injury: true,
      recent_injury: 'Torção leve no tornozelo direito',
      general_observation: 'Atleta deve ser observado em atividades de alta intensidade.',
      guardian_name: 'Maria Alves Teste',
      guardian_cpf: '000.000.000-00',
      consent_accepted: true
    });
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-left">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-green-600 mb-2">Ficha recebida para conferência</h2>
            <p className="text-sm font-medium text-orange-600 bg-orange-50 py-1 px-3 rounded-full inline-block">Modo demonstração — nenhum dado foi salvo em banco real.</p>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <div><strong>Paciente:</strong> {formData.full_name || 'Lucas Henrique Alves'}</div>
            <div><strong>Origem:</strong> Ficha Médica Digital</div>
            <div><strong>Evento:</strong> Jogos Estudantis 2026</div>
            <div><strong>Status:</strong> Aguardando conferência</div>
            <div><strong>Risco:</strong> Revisão obrigatória</div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-red-600 mb-2">Alertas:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {isMinor(formData.birth_date) && <li>Menor de idade</li>}
                {formData.has_diabetes && <li>Diabetes</li>}
                {formData.has_allergy_medication && <li>Alergia a medicamento</li>}
                {formData.has_allergy && <li>Alergia alimentar</li>}
                {formData.has_current_medication && <li>Medicamento em uso</li>}
                {formData.has_recent_injury && <li>Ferimento recente</li>}
              </ul>
            </div>
            
            <div className="pt-4 border-t mt-4">
              <strong className="block text-gray-900 mb-1">Próximo passo:</strong>
              <p className="text-sm">O profissional deve revisar e confirmar os dados antes de validar o paciente.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 relative">
        {import.meta.env.DEV && (
          <Button type="button" variant="outline" size="sm" onClick={fillDemoData} className="absolute top-4 right-4 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300">
            Preencher com exemplo fictício
          </Button>
        )}
        <h1 className="text-2xl font-bold mb-6">Ficha Médica</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Identificação</h2>
            <div>
              <Label>Nome completo</Label>
              <Input name="full_name" value={formData.full_name || ''} onChange={handleChange} required />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} required />
            </div>
            <div>
              <Label>CPF</Label>
              <Input name="cpf" value={formData.cpf || ''} onChange={handleChange} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Cartão SUS</Label>
              <Input name="sus_card" value={formData.sus_card || ''} onChange={handleChange} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Plano e sangue</h2>
            <div>
              <Label>Plano de saúde</Label>
              <Input name="health_plan_name" value={formData.health_plan_name || ''} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo Sanguíneo</Label>
                <Input name="blood_type" value={formData.blood_type || ''} onChange={handleChange} placeholder="Ex: O" />
              </div>
              <div>
                <Label>Fator RH</Label>
                <Input name="rh_factor" value={formData.rh_factor || ''} onChange={handleChange} placeholder="Ex: +" />
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
                <Checkbox id="heart" name="has_heart_condition" checked={formData.has_heart_condition || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_heart_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="heart">Problemas cardíacos</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="diabetes" name="has_diabetes" checked={formData.has_diabetes || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_diabetes', type: 'checkbox', checked: c }})} />
                <Label htmlFor="diabetes">Diabetes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="kidney" name="has_kidney_condition" checked={formData.has_kidney_condition || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_kidney_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="kidney">Problemas renais</Label>
              </div>
              {formData.has_kidney_condition && <Input name="kidney_condition" value={formData.kidney_condition || ''} onChange={handleChange} placeholder="Detalhes do problema renal" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="psycho" name="has_psychological_condition" checked={formData.has_psychological_condition || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_psychological_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="psycho">Problemas psicológicos</Label>
              </div>
              {formData.has_psychological_condition && <Input name="psychological_condition" value={formData.psychological_condition || ''} onChange={handleChange} placeholder="Detalhes" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="other_cond" name="has_other_condition" checked={formData.has_other_condition || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_other_condition', type: 'checkbox', checked: c }})} />
                <Label htmlFor="other_cond">Outros problemas de saúde</Label>
              </div>
              {formData.has_other_condition && <Input name="other_conditions" value={formData.other_conditions || ''} onChange={handleChange} placeholder="Quais?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="meds" name="has_current_medication" checked={formData.has_current_medication || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_current_medication', type: 'checkbox', checked: c }})} />
                <Label htmlFor="meds">Faz uso de algum medicamento?</Label>
              </div>
              {formData.has_current_medication && <Input name="current_medications" value={formData.current_medications || ''} onChange={handleChange} placeholder="Quais medicamentos?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="allergy" name="has_allergy" checked={formData.has_allergy || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_allergy', type: 'checkbox', checked: c }})} />
                <Label htmlFor="allergy">Tem alergias?</Label>
              </div>
              {formData.has_allergy && <Input name="allergies" value={formData.allergies || ''} onChange={handleChange} placeholder="Quais alergias?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="allergy_meds" name="has_allergy_medication" checked={formData.has_allergy_medication || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_allergy_medication', type: 'checkbox', checked: c }})} />
                <Label htmlFor="allergy_meds">Usa remédio para alergia?</Label>
              </div>
              {formData.has_allergy_medication && <Input name="allergy_medications" value={formData.allergy_medications || ''} onChange={handleChange} placeholder="Quais remédios?" className="ml-6" />}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Histórico recente</h2>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="injury" name="has_recent_injury" checked={formData.has_recent_injury || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_recent_injury', type: 'checkbox', checked: c }})} />
                <Label htmlFor="injury">Ferimento recente?</Label>
              </div>
              {formData.has_recent_injury && <Input name="recent_injury" value={formData.recent_injury || ''} onChange={handleChange} placeholder="Detalhes do ferimento" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="fracture" name="has_recent_fracture" checked={formData.has_recent_fracture || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_recent_fracture', type: 'checkbox', checked: c }})} />
                <Label htmlFor="fracture">Fratura recente?</Label>
              </div>
              {formData.has_recent_fracture && (
                <div className="ml-6 space-y-2 mt-2">
                  <Input name="recent_fracture" value={formData.recent_fracture || ''} onChange={handleChange} placeholder="Local da fratura" />
                  <Input name="immobilization_time" value={formData.immobilization_time || ''} onChange={handleChange} placeholder="Tempo imobilizado" />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox id="surgery" name="has_surgery_history" checked={formData.has_surgery_history || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_surgery_history', type: 'checkbox', checked: c }})} />
                <Label htmlFor="surgery">Passou por cirurgias?</Label>
              </div>
              {formData.has_surgery_history && <Input name="surgeries" value={formData.surgeries || ''} onChange={handleChange} placeholder="Quais e quando?" className="ml-6" />}

              <div className="flex items-center space-x-2">
                <Checkbox id="hosp" name="has_recent_hospitalization" checked={formData.has_recent_hospitalization || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_recent_hospitalization', type: 'checkbox', checked: c }})} />
                <Label htmlFor="hosp">Internação nos últimos 5 anos?</Label>
              </div>
              {formData.has_recent_hospitalization && <Input name="recent_hospitalization" value={formData.recent_hospitalization || ''} onChange={handleChange} placeholder="Motivo da internação" className="ml-6" />}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Deficiência ou condição específica</h2>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="disability" name="has_disability_or_specific_condition" checked={formData.has_disability_or_specific_condition || false} onCheckedChange={(c) => handleChange({ target: { name: 'has_disability_or_specific_condition', type: 'checkbox', checked: c }})} />
              <Label htmlFor="disability">Possui alguma deficiência ou condição?</Label>
            </div>
            {formData.has_disability_or_specific_condition && <Input name="disability_or_specific_condition" value={formData.disability_or_specific_condition || ''} onChange={handleChange} placeholder="Especifique" className="ml-6" />}

            <div className="mt-4">
              <Label>Observação Médica Geral</Label>
              <Input name="general_observation" value={formData.general_observation || ''} onChange={handleChange} placeholder="Algo mais que o profissional deva saber?" />
            </div>
          </section>

          {showGuardianSection && (
            <section className="space-y-4 bg-orange-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold border-b pb-2">Responsável e consentimento</h2>
              <div>
                <Label>Nome do responsável</Label>
                <Input name="guardian_name" value={formData.guardian_name || ''} onChange={handleChange} required />
              </div>
              <div>
                <Label>CPF do responsável</Label>
                <Input name="guardian_cpf" value={formData.guardian_cpf || ''} onChange={handleChange} required />
              </div>
              <div className="flex items-start space-x-2 mt-4">
                <Checkbox id="consent" name="consent_accepted" checked={formData.consent_accepted || false} required onCheckedChange={(c) => handleChange({ target: { name: 'consent_accepted', type: 'checkbox', checked: c }})} />
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
