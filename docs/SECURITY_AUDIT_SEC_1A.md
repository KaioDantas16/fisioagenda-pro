# Auditoria de Segurança (SEC-1A) - FisioAgenda Pro v1.0.1

## O que foi verificado
1. **Vazamento de Secrets**: Busca no repositório inteiro por chaves de serviço, JWT secrets e tokens expostos.
2. **Dependências**: Auditoria através de `npm audit` no ambiente frontend.
3. **Scripts Perigosos**: Verificação da presença de scripts de limpeza de dados de teste (ex: `clear_demo_data.sql`) em arquivos de automação, migrations ou `apply-remote.mjs`.
4. **Proteções de Rota/Interface**: Confirmação se o usuário com permissão `admin` consegue ver apenas abas pertinentes (Clínica, Aparência, Relatórios), e se rotas de logs, integrações e permissões de usuários são de fato restritas a `super_admin`.
5. **Configurações de Headers**: Verificação de `vercel.json` para aplicação de HTTP security headers.
6. **Logs**: Busca por `console.log` que possam expor informações confidenciais do paciente ou de negócio.

## O que foi aprovado
* **Secrets Seguros**: Nenhum token ou secret restrito exposto hardcoded no repositório. O Supabase URL e Anon Key são as únicas chaves presentes.
* **Segurança de Dependências**: O relatório `npm audit` não encontrou nenhuma vulnerabilidade (0 found).
* **Ausência de Automações Perigosas**: O script `clear_demo_data.sql` não está referenciado no `APPLY_ALL.sql` nem está presente na pasta de automação de migrations. A limpeza deverá ser intencional e isolada.
* **Controle de Acesso na UI**: O arquivo `/configuracoes` isola perfeitamente as abas críticas (Usuários, Integrações e Logs) apenas para a permissão `isSuperAdmin`.
* **Sem vazamentos no Frontend**: Nenhum log de console com dados confidenciais ou arrays de pacientes na tela de produção.

## O que foi corrigido
* **Vercel Security Headers**: Foi incluído no `vercel.json` as proteções HTTP:
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: DENY` (anti-clickjacking)
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Strict-Transport-Security` (HSTS) preloading e subdomains.

## Pontos de atenção e Riscos restantes
* As tabelas estão criadas para suportar as políticas de Row Level Security (RLS) associadas a `therapist_id`. O banco em produção na nuvem deverá sempre manter o RLS ativado globalmente.
* **Storage Buckets**: A política de acesso aos anexos e avatares no storage do Supabase deve ser monitorada. Os arquivos de documentos do paciente jamais devem estar num bucket público; no entanto, `clinic-assets` precisa continuar com permissão para visualização externa da logo no PDF.
* As chaves da `EVOLUTION_API_KEY` e do `MERCADOPAGO_ACCESS_TOKEN` nunca devem vir para o repositório — devem continuar estritamente atreladas ao Edge Functions / Vault da infraestrutura de nuvem.

## Recomendação Final
O FisioAgenda Pro v1.0.1 está com hardening validado no que tange ao código e pacote de frontend. A barreira de segurança UI/UX cumpre os requisitos. Está **Aprovado** para homologação sem novos riscos. Recomenda-se prosseguir com a liberação operacional.
