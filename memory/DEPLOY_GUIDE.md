# FisioAgenda Pro — Guia de Deploy (Iteração 4)

Este guia cobre **TODAS** as ações que dependem do seu acesso ao Supabase
(o agente não consegue executar comandos com `service_role` por motivos de
segurança).

---

## 1) Aplicar migrations no banco

1. Acesse https://app.supabase.com/project/hfagboocaevlngylsesp
2. Vá em **SQL Editor → New query**
3. Cole **TODO** o conteúdo de:
   ```
   /app/frontend/supabase/migrations/APPLY_ALL.sql
   ```
4. Clique em **Run**

O arquivo é idempotente (`IF NOT EXISTS` em tudo) — pode rodar várias vezes
sem causar erro. Ele cria:

- `session_packages` (pacotes de sessões com Pix opcional)
- `clinic_settings.logo_url`
- `appointments.reminder_sent` (controle de lembretes WhatsApp)
- `integration_settings` (toggle das integrações)

---

## 2) Configurar Secrets das Edge Functions

No Supabase Dashboard → **Project Settings → Edge Functions → Add new secret**.

| Secret | Onde obter | Usado por |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (não comitar!) | create-patient-portal, send-reminder, check-pix-status |
| `MERCADOPAGO_ACCESS_TOKEN` | mercadopago.com.br → Suas integrações → Credenciais → **Access token produção** | create-pix, check-pix-status |
| `EVOLUTION_API_URL` | URL da sua instância Evolution (ex.: `https://api.minhainstancia.com`) | send-reminder |
| `EVOLUTION_API_KEY` | API key gerada no Evolution | send-reminder |
| `EVOLUTION_INSTANCE` | Nome da instância criada | send-reminder |

> **Alternativas WhatsApp**: se preferir um SaaS pago e mais simples, troque
> Evolution por **Z-API (zapi.io)** ou **WPPConnect**. Basta ajustar a URL
> e o corpo da requisição em `send-reminder/index.ts` (a estrutura é parecida).

---

## 3) Deploy das Edge Functions

```bash
# CLI: https://supabase.com/docs/guides/cli (já tem? pula essa)
npm i -g supabase

# Login (uma vez):
supabase login

# Link com o projeto (uma vez):
cd /app/frontend
supabase link --project-ref hfagboocaevlngylsesp

# Deploy de TODAS as functions:
supabase functions deploy create-patient-portal
supabase functions deploy create-pix
supabase functions deploy check-pix-status
supabase functions deploy send-reminder
```

Verifique no Dashboard → Edge Functions que as 4 functions aparecem com
status **Deployed**.

---

## 4) Agendar o lembrete WhatsApp (pg_cron)

1. Dashboard → **Database → Extensions** → habilite `pg_cron` **e** `pg_net`.
2. SQL Editor → cole e ajuste o `ANON_KEY` (Settings → API):

```sql
SELECT cron.schedule(
  'send-whatsapp-reminders',
  '0 18 * * *',                          -- todo dia às 18:00 (UTC do servidor)
  $$
  SELECT net.http_post(
    url := 'https://hfagboocaevlngylsesp.supabase.co/functions/v1/send-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para verificar:
SELECT * FROM cron.job;

-- Para remover:
-- SELECT cron.unschedule('send-whatsapp-reminders');
```

Antes de rodar o `cron.schedule`, salve sua `anon key`:

```sql
ALTER DATABASE postgres SET app.settings.anon_key = 'eyJ...sua-anon-key...';
```

**Fuso horário**: o servidor do Supabase está em UTC. Para 18h em Brasília
(UTC-3), use `0 21 * * *` (21h UTC = 18h BRT).

---

## 5) Validação dos 7 PDFs

Depois das migrations + functions deployadas:

1. Faça login como `kaiohhenrique21@gmail.com` / `Admin123#`
2. Em `/pacientes/<id>` → botão **PDF** → gera **Prontuário Clínico**
3. Aba **Sessões** → ⋯ → **Comprovante** → gera PDF #2
4. Aba **Anamnese** → **Baixar PDF Anamnese** → PDF #3 (com assinatura do paciente)
5. Aba **Sinais Vitais** → ... (etc.)
6. Em `/configuracoes` → aba **Relatórios** → **Mensal**, **Financeiro**, **Frequência**

Cada PDF deve:
- ✅ Cabeçalho com gradiente azul→verde (28 mm)
- ✅ Rodapé `FisioAgenda Pro · Lenilson Gouveia de Jesus · CREFITO-9 · Gerado em DD/MM/AAAA às HH:MM · Página X de Y`
- ✅ **Nenhuma assinatura do profissional** no corpo (somente Anamnese tem assinatura **do paciente**)
- ✅ CPF mascarado `***.***.NNN-NN`
- ✅ Datas em pt-BR (`DD/MM/AAAA`)
- ✅ Valores em reais (`R$ 1.234,56`)

---

## 6) Tipos TypeScript (após migrations)

```bash
cd /app/frontend
supabase gen types typescript --project-id hfagboocaevlngylsesp \
  > src/integrations/supabase/types.ts
```

Depois disso, é seguro remover os `as any` em `PackagesTab.tsx`,
`AttachmentsTab.tsx` e `FunctionalTab.tsx`. (O agente já preparou
uma extensão de tipos local em `src/integrations/supabase/types.local.ts`
para evitar bloqueios enquanto o `gen types` não roda.)

---

## Resumo das ações manuais

| # | Ação | Tempo estimado |
| - | --- | --- |
| 1 | Rodar `APPLY_ALL.sql` no SQL Editor | 1 min |
| 2 | Adicionar 5 Secrets em Edge Functions | 5 min |
| 3 | `supabase functions deploy` × 4 | 3 min |
| 4 | Habilitar `pg_cron` + agendar lembrete | 5 min |
| 5 | Validar visualmente 7 PDFs | 10 min |
| 6 | Regenerar tipos TS | 1 min |

Total: **~25 minutos** de trabalho manual seu.
