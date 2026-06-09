# FisioAgenda Pro — PRD

## Original Problem Statement
Reconstruir o **FisioAgenda Pro** (sistema de gestão clínica para fisioterapia) usando a stack **Vite + TypeScript + TanStack Router + Supabase**, mantendo toda a lógica RLS, triggers e schema já validados em produção.

- Profissional: **Lenilson Gouveia de Jesus** — CREFITO-9
- Clínica: **Centro Especializado Equilíbrio e Movimento** (Caldas Novas/GO)
- Banco em produção (Supabase): `hfagboocaevlngylsesp.supabase.co`

## Stack / Architecture
- **Frontend**: React 19 + Vite 7 + TanStack Start (SSR) + TanStack Router (file-based) + TanStack Query v5 + Tailwind CSS v4 + Radix UI / shadcn + Sonner + jsPDF + Recharts + date-fns (pt-BR).
- **Backend**: 100% Supabase (Auth + Postgres com RLS + Storage + Edge Functions).
- **Auth**: Supabase email/senha + RLS por `therapist_id = auth.uid()` (super_admin bypassa via `is_super_admin`).
- **Roles**: `super_admin` (Kaio — Suporte Técnico), `admin` (Lenilson), `paciente`.

## What's been implemented

### 2026-06-08 — MVP inicial
✅ Login + Dashboard + Pacientes + Agenda + Prontuário + 13 abas clínicas + Portal do Paciente.
✅ Conexão com Supabase produção via VITE_* env vars.
✅ Logo + foto reais integrados.
✅ Detalhe do paciente com navegação por clique na linha (TanStack onClick navigate).
✅ Rota `pacientes_.$id.tsx` (TanStack non-nested syntax).

### 2026-06-09 — Iteração completa P0/P1/P2 (100% nos testes)

**🔴 P0 — Edge Function + PDFs**
✅ Edge Function `create-patient-portal/index.ts` criada em `/app/frontend/supabase/functions/`. Pendente **deploy via CLI**: `supabase functions deploy create-patient-portal`.
✅ Frontend `patient-portal.functions.ts` chamando a Edge Function via `supabase.functions.invoke`.
✅ Todos os 7 PDFs reescritos:
   - Cabeçalho com gradiente azul→verde (28 mm) padronizado.
   - Rodapé padrão: `FisioAgenda Pro · Lenilson Gouveia de Jesus · CREFITO-9 · Gerado em DD/MM/AAAA às HH:MM`.
   - Paginação `Página X de Y` em TODAS as páginas (função `paginate()`).
   - **Sem bloco de assinatura do profissional** (removido de Prontuário e Comprovante).
   - PDF Anamnese é o único com assinatura — **do paciente**.
   - CPF mascarado: `***.***.NNN-NN`.
   - Moeda: `R$ X.XXX,XX` via `Intl.NumberFormat`.
   - Datas: `DD/MM/AAAA` via date-fns + `ptBR`.

**🟠 P1 — AlertDialog + Acessibilidade + Upload**
✅ Componente `ConfirmDialog` (Radix AlertDialog) criado em `/app/frontend/src/components/ConfirmDialog.tsx`.
✅ Todos os 7 `confirm()` substituídos por ConfirmDialog em:
   - `pacientes_.$id.tsx` (Records, Sessions, Vitals, Goals)
   - `agenda.tsx` (agendamentos)
   - `AttachmentsTab.tsx` (anexos)
   - `FunctionalTab.tsx` (avaliações funcionais)
✅ `DialogDescription` (com `className="sr-only"` quando apropriado) adicionado em 11 arquivos.
✅ Upload de **logo da clínica** + **foto do profissional** em `/configuracoes` (aba Clínica):
   - Limite: 2 MB logo / 4 MB foto.
   - Path: `branding/logo-{ts}.{ext}` / `branding/lenilson-{ts}.{ext}` no bucket `clinic-assets`.
   - Signed URL de **10 anos**.
   - Persistência em `clinic_settings.logo_url` / `clinic_settings.professional_photo_url`.
✅ Hook `useClinicAssets` lê valores salvos e usa fallback estático.
✅ Migration `202606080002_clinic_settings_logo_url.sql` adiciona coluna `logo_url`.

**🟡 P2 — Dashboard + Pacotes**
✅ Dashboard com 3 novas seções:
   - **Precisam de atenção**: lista pacientes urgente/atenção, ordenados (urgente primeiro), com link "Ver perfil".
   - **Sessões por dia (semana atual)**: Recharts BarChart Dom-Sáb com cor `var(--primary)`.
   - **Aniversariantes do mês**: cards clicáveis (oculto quando vazio).
✅ Sistema de **Pacotes de Sessões**:
   - Migration `202606080001_session_packages.sql` (cria tabela + RLS + triggers).
   - Aba "Pacotes" entre "Metas" e "Anexos".
   - Templates rápidos: 5×/10×/20× com descontos progressivos (5%/10%/15%).
   - Form com cálculo automático (subtotal → desconto → total).
   - Status visual: ativo / concluído / vencido / aguarda pagamento.
   - Ações: Usar 1 sessão (incrementa `used_sessions`), Marcar como pago, Excluir.
   - Graceful fallback se a migration não foi aplicada (mostra empty state).

**✅ Qualidade global**
✅ CPF com máscara `000.000.000-00` em tempo real (já presente).
✅ CPF mascarado em PDFs: `***.***.NNN-NN`.
✅ Persistência de tema em `localStorage['fisio-theme']` + sync com `clinic_settings.theme` (sem flash no boot).
✅ DeletePatientButton agora usa `navigate()` em vez de `window.location.href`.
✅ Toasts de feedback padronizados em todas as operações.
✅ Empty states em todas as listas.

## ⚠️ Ações manuais pendentes (lado do usuário no Supabase)

1. **Aplicar migrations** via Supabase Dashboard ou CLI:
   - `/app/frontend/supabase/migrations/202606080001_session_packages.sql` — destrava aba Pacotes
   - `/app/frontend/supabase/migrations/202606080002_clinic_settings_logo_url.sql` — destrava upload do logo

2. **Deploy da Edge Function**:
   ```bash
   supabase functions deploy create-patient-portal
   ```
   Necessária para "Criar acesso ao portal" funcionar end-to-end (precisa do `SUPABASE_SERVICE_ROLE_KEY` configurado no ambiente da function).

## Test Results
- **iteration_1.json**: 85% (3 bugs reportados)
- **iteration_2.json**: 100% (todos os 3 bugs do iter_1 corrigidos)
- **iteration_3.json**: 100% (10/10 features P0/P1/P2 verificadas) + 1 hardening aplicado depois (PackagesTab graceful fallback)

## Prioritized Backlog

### Curto prazo
- [ ] Aplicar as 2 migrations e deployar a Edge Function (ações do usuário)
- [ ] Após deploy, validar fluxo end-to-end: criar paciente → criar acesso ao portal → paciente faz login → vê dados próprios
- [ ] Validar visualmente os 7 PDFs com dados reais (gerar e abrir cada um)

### Backlog técnico
- [ ] Regenerar tipos do Supabase após aplicar migrations (`supabase gen types typescript`) e remover `as any` em PackagesTab
- [ ] Considerar extrair as 3 novas seções do dashboard para `/components/dashboard/*` se mais sections forem adicionadas
- [ ] Substituir `confirm()` remanescentes em `ThemeTab` (se houver futuros) por ConfirmDialog
- [ ] Remover diretório `/app/backend` (FastAPI não utilizado)

### Backlog de produto
- [ ] Lembrete automático via WhatsApp/Email 1 dia antes da sessão
- [ ] Integração com gateway de pagamento (Pix dinâmico) para cobrar pacotes
- [ ] Notificações push quando paciente confirma/cancela
- [ ] Métricas de retenção: % de pacientes ativos há > 3 meses
