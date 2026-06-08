
# Bloco 2 + Bloco 3 — Plano de entrega

O escopo é grande. Vou entregar em 3 migrações + camadas de UI/PDF, em sequência, sem quebrar o que já funciona.

## Bloco 2 — Avaliação clínica completa

### 2.1 Banco de dados (1 migração)
Novas tabelas (todas com `therapist_id`, RLS escopada igual às existentes, paciente lê as próprias):
- `anamnese` — 1 por paciente (queixa principal, HMA, HMP, cirurgias, medicações, alergias, hábitos, antecedentes familiares, ocupação, prática de atividade física, sono, observações).
- `functional_assessment` — avaliação funcional (postura, marcha, equilíbrio, força global, coordenação, AVD, escala funcional livre).
- `pain_map_entries` — regiões de dor por avaliação (região enum + intensidade 0-10 + lado E/D/bilateral + observação).
- `rom_measurements` — ADM (articulação, movimento, ativo, passivo, lado, data).
- `special_tests` — testes especiais (nome do teste, região, resultado positivo/negativo/inconclusivo, observação).
- `perimetry` — perimetria (segmento, lado, medida cm, data).
- `attachments` — anexos (paciente_id, nome, mime, tamanho, storage_path no bucket `clinic-assets`).
- Expandir `records` com colunas: `cid10`, `evolution_score` (0-10 para gráfico), `pain_location_text`.

### 2.2 UI (novas abas no prontuário do paciente)
- Aba **Anamnese** — formulário único editável.
- Aba **Avaliação funcional** — formulário + lista de avaliações por data.
- Aba **Mapa de dor** — checkboxes por região (cervical, torácica, lombar, ombro E/D, cotovelo E/D, punho E/D, quadril E/D, joelho E/D, tornozelo E/D, etc.) com slider 0-10 por região marcada.
- Aba **ADM** — tabela editável (adicionar/remover linhas) com dropdown de articulação/movimento.
- Aba **Testes especiais** — lista com nome + resultado.
- Aba **Perimetria** — tabela por segmento e lado.
- Aba **Evolução** — gráfico de linha (Recharts) de EVA + evolution_score ao longo do tempo.
- Aba **Anexos** — upload para `clinic-assets` + listagem com download.
- Expandir aba **SOAP** com campo CID-10 e localização da dor.

## Bloco 3 — 7 PDFs

Refatorar `src/lib/pdf.ts` para header/footer padronizado e adicionar:
1. `downloadProntuarioPDF` — já existe, será expandido (anamnese + funcional + mapa de dor + ADM + testes + perimetria + SOAP + sinais vitais + sessões).
2. `downloadMonthlyReportPDF` — já existe, será expandido (gráficos textuais, financeiro).
3. `downloadSessionReceiptPDF` — já existe, ajustar layout.
4. **Novo** `downloadFrequenciaPDF` — frequência do paciente (presenças/faltas no mês).
5. **Novo** `downloadAnamnesePDF` — anamnese isolada para impressão.
6. **Novo** `downloadFinancialPDF` — relatório financeiro (receitas por forma de pagamento, top pacientes).
7. **Novo** `downloadClinicalEvolutionPDF` — evolução clínica (gráfico de EVA + tabela cronológica de SOAP).

Todos com header gradiente azul→verde, rodapé com Lenilson + CREFITO-9 + endereço + telefone + Instagram, data de geração.

## Ordem de execução
1. Migração única do Bloco 2 (todas as tabelas + colunas novas).
2. Após aprovação, atualizar `pacientes.$id.tsx` com as novas abas (componentes separados em `src/components/clinical/`).
3. Refatorar `src/lib/pdf.ts` com helpers compartilhados + 4 novos PDFs.
4. Botões de exportação na aba certa do prontuário e em Configurações → Relatórios.

## Riscos / decisões
- Mapa de dor: usando **checkboxes** como você escolheu (sem SVG).
- Anexos: bucket `clinic-assets` já existe; vou adicionar política para pasta `patients/{id}/`.
- Gráficos: Recharts (já instalado em `src/components/ui/chart.tsx`).
- Sem novos pacotes além do que já existe (`jspdf`, `jspdf-autotable`, `recharts`).

Confirma para eu começar pela migração?
