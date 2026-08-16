import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_authenticated/fichas-medicas')({
  component: AdminFichasMedicasPage,
});

function AdminFichasMedicasPage() {
  const mockFichas = [
    { id: '1', title: 'Jogos Estudantis 2026', responses: 1, active: true, link: '/ficha/demo-token' },
    { id: '2', title: 'Escolinha Sub-15', responses: 12, active: false, link: '/ficha/escolinha' }
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fichas Médicas Digitais</h1>
        <Button>Criar nova ficha</Button>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Como funcionaria (Fluxo de Demonstração)</h2>
        <ol className="list-decimal pl-5 space-y-2 text-blue-900">
          <li>Copie o link ou QR Code do evento "Jogos Estudantis 2026"</li>
          <li>Envie para os responsáveis via WhatsApp ou outro canal</li>
          <li>O responsável preenche a Ficha Médica pelo celular</li>
          <li>O paciente entra no sistema como "Aguardando conferência"</li>
          <li>O profissional revisa os alertas médicos antes de validar a ficha</li>
        </ol>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-xl font-semibold">Criar nova ficha (Mock)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome do evento</Label>
            <Input placeholder="Ex: Jogos Estudantis 2026" />
          </div>
          <div>
            <Label>Limite de respostas</Label>
            <Input type="number" placeholder="Opcional" />
          </div>
        </div>
        <Button variant="secondary">Salvar e Gerar Link</Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Fichas criadas</h2>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">Evento</th>
                <th className="p-4">Respostas</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockFichas.map(f => (
                <tr key={f.id} className="border-b">
                  <td className="p-4">{f.title}</td>
                  <td className="p-4">{f.responses}</td>
                  <td className="p-4">{f.active ? 'Ativo' : 'Inativo'}</td>
                  <td className="p-4 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(f.link, '_blank')}>Abrir link (Mock)</Button>
                    <Button variant="outline" size="sm">QR Code (Mock)</Button>
                    <Button variant="secondary" size="sm">WhatsApp (Mock)</Button>
                    {f.active && <Button variant="destructive" size="sm">Desativar</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
