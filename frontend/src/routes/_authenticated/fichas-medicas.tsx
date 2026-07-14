import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_authenticated/fichas-medicas')({
  component: AdminFichasMedicasPage,
});

function AdminFichasMedicasPage() {
  const mockFichas = [
    { id: '1', title: 'Jogos Estudantis 2026', responses: 45, active: true },
    { id: '2', title: 'Escolinha Sub-15', responses: 12, active: false }
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fichas Médicas Digitais</h1>
        <Button>Criar nova ficha</Button>
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
                    <Button variant="outline" size="sm">Copiar link</Button>
                    <Button variant="outline" size="sm">QR Code</Button>
                    <Button variant="secondary" size="sm">WhatsApp</Button>
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
