/**
 * FisioAgenda Pro — apply-migrations.mjs
 *
 * Aplica as migrations pendentes no Supabase.
 * Suporta 3 métodos de conexão (tenta em ordem):
 *   1) DATABASE_URL  — conexão PostgreSQL direta (mais confiável)
 *   2) SUPABASE_ACCESS_TOKEN — Management API (token da conta owner)
 *   3) Orientação para npx supabase login
 *
 * Como obter DATABASE_URL:
 *   Supabase Dashboard → Settings → Database → Connection String → URI
 *   Exemplo: postgresql://postgres:[password]@db.hfagboocaevlngylsesp.supabase.co:5432/postgres
 *
 * Uso: node frontend/scripts/apply-migrations.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

// ── Utilitários de terminal ──────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m",
  green: "\x1b[32m", yellow: "\x1b[33m",
  red: "\x1b[31m", cyan: "\x1b[36m", gray: "\x1b[90m",
};
const ok   = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const fail = (m) => console.log(`${C.red}✗${C.reset} ${m}`);
const info = (m) => console.log(`${C.cyan}→${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset} ${m}`);
const section = (m) => console.log(`\n${C.bold}${C.cyan}══ ${m} ══${C.reset}\n`);

// ── Parser de .env ───────────────────────────────────────────────────────────
function parseEnv(filePath) {
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(
    readFileSync(filePath, "utf-8").split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const idx = l.indexOf("=");
        const key = l.slice(0, idx).trim();
        const val = l.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        return [key, val];
      })
  );
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, "..");
const env       = { ...parseEnv(join(root, ".env")), ...process.env };

const SUPABASE_URL   = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const DATABASE_URL   = env.DATABASE_URL;
const ACCESS_TOKEN   = env.SUPABASE_ACCESS_TOKEN;
const SERVICE_ROLE   = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY       = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const PROJECT_REF    = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

// ── Carrega SQL ──────────────────────────────────────────────────────────────
const APPLY_ALL = join(root, "supabase", "migrations", "APPLY_ALL.sql");
const FALLBACKS = [
  join(root, "supabase", "migrations", "202606080001_session_packages.sql"),
  join(root, "supabase", "migrations", "202606080002_clinic_settings_logo_url.sql"),
];

function loadSql() {
  if (existsSync(APPLY_ALL)) {
    info(`SQL: supabase/migrations/APPLY_ALL.sql`);
    return readFileSync(APPLY_ALL, "utf-8");
  }
  const parts = FALLBACKS.filter(existsSync).map((p) => {
    info(`SQL: ${p.split(/[\\/]/).pop()}`);
    return readFileSync(p, "utf-8");
  });
  if (!parts.length) { fail("Nenhum arquivo SQL encontrado."); process.exit(1); }
  return parts.join("\n\n");
}

// ── Método 1: conexão PostgreSQL direta (pg) ─────────────────────────────────
async function runViaPg(sql) {
  const require = createRequire(import.meta.url);
  let pg;
  try {
    pg = require("pg");
  } catch {
    throw new Error("Módulo 'pg' não instalado. Rode: npm install pg --save-dev");
  }

  const { Client } = pg;

  // Tenta construir a connection string a partir do DATABASE_URL
  // ou das partes conhecidas (falta só o password)
  const connStr = DATABASE_URL;
  if (!connStr) throw new Error("DATABASE_URL não definida no .env");

  info(`Conectando via pg: ${connStr.replace(/:([^@]+)@/, ":***@")}`);
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Divide em statements separando blocos $$...$$ corretamente
  const statements = splitSql(sql);
  info(`${statements.length} statements para executar`);

  let executed = 0;
  for (const stmt of statements) {
    const preview = stmt.slice(0, 60).replace(/\s+/g, " ").trim();
    try {
      await client.query(stmt);
      ok(`${preview}…`);
      executed++;
    } catch (e) {
      // IF NOT EXISTS / already exists: não é erro crítico
      if (/already exists|duplicate/i.test(e.message)) {
        warn(`já existe (ok): ${preview}…`);
        executed++;
      } else {
        fail(`${preview}…`);
        fail(`  ${e.message}`);
      }
    }
  }

  await client.end();
  return executed;
}

// ── Método 2: Supabase Management API ────────────────────────────────────────
async function runViaMgmtApi(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  info(`POST ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body?.message || JSON.stringify(body)}`);
  return body;
}

// ── Verificação pós-migration via REST ───────────────────────────────────────
async function verify() {
  const key = SERVICE_ROLE || ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const base = SUPABASE_URL + "/rest/v1";

  const checks = [
    { name: "session_packages (tabela)",       url: `${base}/session_packages?select=id&limit=0` },
    { name: "clinic_settings.logo_url (col.)", url: `${base}/clinic_settings?select=logo_url&limit=0` },
    { name: "integration_settings (tabela)",   url: `${base}/integration_settings?select=id&limit=0` },
  ];

  for (const { name, url } of checks) {
    try {
      const r = await fetch(url, { headers });
      if (r.status === 200 || r.status === 206) {
        ok(name);
      } else if (r.status === 406) {
        ok(`${name} (vazia, mas existe)`);
      } else {
        fail(`${name} — HTTP ${r.status}`);
      }
    } catch (e) {
      warn(`${name} — ${e.message}`);
    }
  }
}

// ── Divide SQL respeitando blocos $$ ─────────────────────────────────────────
function splitSql(sql) {
  const stmts = [];
  let current = "";
  let inDollar = false;
  let dollarTag = "";

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    current += ch;

    // Detecta abertura/fechamento de bloco $$...$$
    if (!inDollar && sql.slice(i).match(/^\$\$/) && !dollarTag) {
      inDollar = true;
      dollarTag = "$$";
      i++; current += sql[i];
      continue;
    }
    if (inDollar && sql.slice(i).match(/^\$\$/) ) {
      inDollar = false;
      dollarTag = "";
      i++; current += sql[i];
      continue;
    }

    if (!inDollar && ch === ";") {
      const stmt = current.trim();
      if (stmt && stmt !== ";") stmts.push(stmt);
      current = "";
    }
  }
  const last = current.trim();
  if (last) stmts.push(last);
  return stmts.filter((s) => s.replace(/--[^\n]*/g, "").trim());
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  section("FisioAgenda Pro — Apply Migrations");

  console.log(`${C.gray}PROJECT_REF:${C.reset}   ${PROJECT_REF || "❌"}`);
  console.log(`${C.gray}DATABASE_URL:${C.reset}  ${DATABASE_URL ? "✓ presente" : "— ausente"}`);
  console.log(`${C.gray}ACCESS_TOKEN:${C.reset}  ${ACCESS_TOKEN ? "✓ presente" : "— ausente"}`);
  console.log(`${C.gray}SERVICE_ROLE:${C.reset}  ${SERVICE_ROLE ? "✓ presente" : "— ausente"}`);
  console.log(`${C.gray}ANON_KEY:${C.reset}      ${ANON_KEY ? "✓ presente" : "— ausente"}\n`);

  const sql = loadSql();
  info(`SQL carregado: ${sql.length} chars\n`);

  // ── Método 1: pg direto ────────────────────────────────────────────────────
  if (DATABASE_URL) {
    section("Executando via PostgreSQL direto");
    try {
      const count = await runViaPg(sql);
      ok(`${count} statements executados`);
      section("Verificação");
      await verify();
      section("Concluído ✓");
      ok("Migrations aplicadas via conexão direta!");
      return;
    } catch (e) {
      fail(`pg falhou: ${e.message}`);
      console.log("");
    }
  }

  // ── Método 2: Management API ───────────────────────────────────────────────
  if (ACCESS_TOKEN && PROJECT_REF) {
    section("Executando via Management API");
    try {
      const result = await runViaMgmtApi(sql);
      ok("SQL executado com sucesso");
      if (Array.isArray(result) && result.length) {
        result.forEach((row) => console.log(" ", JSON.stringify(row)));
      }
      section("Verificação");
      await verify();
      section("Concluído ✓");
      ok("Migrations aplicadas via Management API!");
      return;
    } catch (e) {
      fail(`Management API: ${e.message}`);
      console.log("");
    }
  }

  // ── Nenhum método funcionou ────────────────────────────────────────────────
  section("Ação necessária");

  warn("Nenhum método de conexão disponível funcionou.\n");

  console.log(`${C.bold}OPÇÃO A — DATABASE_URL (mais simples)${C.reset}`);
  console.log("  1. Supabase Dashboard → Settings → Database");
  console.log("  2. Copie a 'Connection String' no modo URI");
  console.log("  3. Adicione no .env:");
  console.log(`     ${C.cyan}DATABASE_URL=postgresql://postgres:[password]@db.${PROJECT_REF}.supabase.co:5432/postgres${C.reset}`);
  console.log("  4. Rode novamente: node frontend/scripts/apply-migrations.mjs\n");

  console.log(`${C.bold}OPÇÃO B — Login no browser (Supabase CLI)${C.reset}`);
  console.log("  1. Abra um terminal novo e rode:");
  console.log(`     ${C.cyan}cd fisioagenda-pro/frontend${C.reset}`);
  console.log(`     ${C.cyan}npx supabase login${C.reset}          ← abre o browser`);
  console.log(`     ${C.cyan}npx supabase link --project-ref ${PROJECT_REF}${C.reset}`);
  console.log(`     ${C.cyan}npx supabase db push${C.reset}\n`);

  console.log(`${C.bold}OPÇÃO C — SQL Editor (manual, 2 min)${C.reset}`);
  console.log(`  → https://app.supabase.com/project/${PROJECT_REF}/sql/new`);
  console.log("  Cole e execute o conteúdo de: supabase/migrations/APPLY_ALL.sql\n");

  // Mostra estado atual mesmo sem aplicar
  section("Estado atual das tabelas");
  await verify();

  process.exit(1);
}

main().catch((e) => {
  fail(`Erro inesperado: ${e.message}`);
  console.error(e);
  process.exit(1);
});
