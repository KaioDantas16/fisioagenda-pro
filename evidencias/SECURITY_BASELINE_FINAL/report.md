# SECURITY BASELINE FINAL REPORT

IMPLEMENTATION_BASELINE_COMMIT=093d8a4271267392dfdb14b657bde99860e562f3
IMPLEMENTATION_CI_RUN=28903006965
IMPLEMENTATION_CI=SUCCESS
PR=1
PR STATE=OPEN
MERGE=NO
MAIN CHANGED=NO
PRODUCTION DEPLOY=NO
REMOTE DATABASE CHANGED=NO

LOCKFILE RESTORED=YES
SUPABASE TEMP IGNORED=YES
RPC PATIENT ROOT=ENFORCED
TYPESCRIPT SUPPRESSION=NONE
NPM AUDIT=2 RESIDUAL VULNERABILITIES

LOCKFILE CHANGE ROOT CAUSE=NOT CONCLUSIVELY IDENTIFIED
UNAUTHORIZED CHANGE=REVERTED

LOCAL SUPABASE STOPPED=YES
LOCAL RUNTIME REMOVED=YES
LOCAL TEST CREDENTIALS INVALIDATED=YES
TRACKED LOCAL SUPABASE KEYS=NO

## O que foi corrigido

O ajuste de papel e o backfill somente são executados quando o usuário histórico existe em auth.users.
Em instalações locais vazias, esses blocos são ignorados sem criar usuários artificiais.

## RPC Authorization Matrix

| Caso | Execução | Patient root | Resultado |
|---|---|---|---|
| Usuário A → Paciente A | Permitida | Presente | PASS |
| Usuário A → Paciente B | Permitida | Null | PASS |
| Usuário B → Paciente A | Permitida | Null | PASS |
| Usuário B → Paciente B | Permitida | Presente | PASS |
| Usuário A → ID inexistente | Permitida | Null | PASS |
| Anônimo → Paciente A | Negada | Nenhum | PASS |

Os testes foram executados exclusivamente em Supabase local descartável com dados sintéticos. O runtime foi posteriormente encerrado e removido.
