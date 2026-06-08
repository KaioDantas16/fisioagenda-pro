# FisioAgenda Pro — PRD

## Original Problem Statement
Reconstruir o **FisioAgenda Pro** (sistema de gestão clínica para fisioterapia) usando a stack **Vite + TypeScript + TanStack Router + Supabase**, mantendo toda a lógica RLS, triggers e schema já validados em produção.

- Profissional: **Lenilson Gouveia de Jesus** — CREFITO-9
- Clínica: **Centro Especializado Equilíbrio e Movimento** (Caldas Novas/GO)
- Banco em produção (Supabase): `hfagboocaevlngylsesp.supabase.co`

## Stack / Architecture
- **Frontend**: React 19 + Vite 7 + TanStack Start (SSR) + TanStack Router (file-based) + TanStack Query v5 + Tailwind CSS v4 + Radix UI / shadcn + Sonner + jsPDF + Recharts + date-fns (pt-BR).
- **Backend**: 100% Supabase em produção (Auth + Postgres com RLS + Storage). Sem FastAPI customizado.
- **Auth**: Supabase email/senha + RLS por `therapist_id = auth.uid()` (super_admin bypassa via `is_super_admin`).
- **Roles**: `super_admin` (Kaio — Suporte Técnico), `admin` (Lenilson), `paciente`.

## User Personas
1. **Super Admin (Kaio)** — Suporte técnico, vê tudo do Lenilson, acessa `/configuracoes`.
2. **Admin (Lenilson)** — Gerencia pacientes, agenda, prontuários, financeiro, PDFs.
3. **Paciente** — Portal limitado em `/portal-paciente` com seus próprios dados.

## Core Requirements
- Dashboard com 4 stat cards + próximas sessões + hero card de boas-vindas
- Agenda semanal com navegação prev/today/next + criação rápida de agendamento
- CRUD completo de pacientes com classificação (urgente/atenção/estável/alta)
- Perfil do paciente com 10+ abas clínicas (Resumo, Anamnese, Avaliação, Prontuários, Sessões, Sinais Vitais, Evolução, Financeiro, Anexos, Dados)
- Prontuário SOAP + EVA + Sinais Vitais + Técnicas + ADM + Testes especiais + Neurológico + Mapa de Dor + Perimetria
- Geração de 7 tipos de PDF (Prontuário, Mensal, Comprovante, Frequência, Anamnese, Financeiro, Evolução)
- Portal do paciente (visão limitada)
- Configurações com 5 abas (Clínica, Usuários, Aparência/Temas, Logs, Relatórios) — super_admin only
- Componente MessageModal (WhatsApp + Email)
- CPF com máscara automática
- Temas alternáveis (6 paletas)

## What's been implemented (2026-06-08)
✅ **Replica completa do Lovable copiada para `/app/frontend` (Vite + TanStack Start)**
✅ **Conexão com Supabase em produção** (URL + anon key configurados em `.env`)
✅ **Login funcional** — testado com `kaiohhenrique21@gmail.com` → redirecionou para `/dashboard`
✅ **Dashboard real** — exibindo 4 pacientes ativos do banco + badge "Suporte Técnico" para super_admin
✅ **Lista de pacientes** — exibindo os 4 pacientes reais com classificações coloridas
✅ **Agenda semanal** — navegação por semana funcionando
✅ **Prontuário novo** — formulário SOAP + EVA + busca de paciente renderizando
✅ **Logo e foto reais** do Lenilson e da clínica integrados (`/public/`)
✅ **Temas, CSS variables, gradient-brand** funcionando
✅ **Removidas dependências do runtime Lovable** (server functions convertidas para Supabase client direto, lovable error reporting é safe no-op)
✅ **Vite configurado** para rodar em `0.0.0.0:3000` com `allowedHosts: true` e HMR via WSS
✅ **Node 22** instalado (requisito do `@tanstack/react-start`)

## Decisões técnicas tomadas
- `login_attempts` agora é inserido via client (best-effort, RLS controla quem pode)
- `createPatientPortalAccess` precisa de uma Edge Function (Deno) no Supabase para criar usuários com `auth.admin.createUser`. Sem isso usa `signUp` direto (paciente recebe email de confirmação, mas o vínculo `patient_user_id` precisa ser feito por uma function server-side). **MOCKED** parcialmente: o código tenta `supabase.functions.invoke("create-patient-portal")` e cai em fallback.
- O backend FastAPI continua rodando no supervisor mas **não é utilizado** pelo frontend.

## Prioritized Backlog (P0/P1/P2)

### P0 — Próximas ações imediatas
- [ ] Criar **Edge Function `create-patient-portal`** no Supabase Deno para completar criação de acesso de paciente (precisa do service_role key)
- [ ] Testar fluxo completo: criar paciente → criar agendamento → realizar sessão → gerar prontuário SOAP → baixar PDF
- [ ] Validar geração dos 7 PDFs com dados reais

### P1 — Curto prazo
- [ ] Upload de assets (logo, foto) via Supabase Storage bucket `clinic-assets` (configurações)
- [ ] Validar todas as abas clínicas (Anamnese, Mapa de Dor, ADM, Testes, Neuro, Perimetria) com dados reais
- [ ] Portal do paciente — validar acesso restrito por role
- [ ] Logs de auditoria (`login_attempts`) — confirmar RLS para super_admin ler

### P2 — Médio prazo (melhorias)
- [ ] Card "Pacientes que precisam de atenção" no dashboard (urgente/atenção)
- [ ] Card "Aniversariantes do mês"
- [ ] Gráfico de barras: sessões por dia da semana
- [ ] Lembrete automático via WhatsApp/Email 1 dia antes da sessão
- [ ] Sistema de pacote de sessões (10x com desconto)

### Backlog técnico
- [ ] Considerar migrar SSR (TanStack Start) para SPA puro se houver problemas de deployment
- [ ] Remover diretório `/app/backend` quando confirmado que não é necessário
- [ ] Pre-build de produção: `vite build` + servir `dist/`
