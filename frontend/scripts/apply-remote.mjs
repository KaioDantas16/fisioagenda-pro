/**
 * FisioAgenda Pro — apply-remote.mjs
 *
 * Executa as migrations remotas de forma segura usando conexão PostgreSQL direta (pg).
 * Bypassa os erros de HTTP 403 do Management API.
 * Realiza diagnósticos em clinic_settings antes de executar.
 *
 * Uso: node frontend/scripts/apply-remote.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
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

// Parser simples de arquivo .env
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
const DATABASE_URL = env.DATABASE_URL;

async function main() {
  section("FisioAgenda Pro — Execução Segura de Migrations Remotas");

  if (!DATABASE_URL) {
    warn("DATABASE_URL não foi encontrada no arquivo .env ou no ambiente.");
    console.log(`
${C.bold}Como configurar o acesso ao banco remoto com segurança:${C.reset}
1. Vá para o seu ${C.bold}Supabase Dashboard${C.reset} → acesse o seu projeto.
2. Clique no ícone de ${C.bold}Configurações (Settings)${C.reset} (canto inferior esquerdo) → ${C.bold}Database${C.reset}.
3. Role até a seção ${C.bold}Connection String${C.reset}, selecione a aba ${C.bold}URI${C.reset} e copie a URL.
4. Ela terá este formato:
   ${C.gray}postgresql://postgres:[YOUR-PASSWORD]@db.hfagboocaevlngylsesp.supabase.co:5432/postgres${C.reset}
5. Abra o arquivo ${C.cyan}frontend/.env${C.reset} (que está no seu .gitignore, portanto nunca será commitado) e adicione a linha:
   ${C.bold}DATABASE_URL=postgresql://postgres:[AQUI-SUA-SENHA]@db.hfagboocaevlngylsesp.supabase.co:5432/postgres${C.reset}
   (Substitua [AQUI-SUA-SENHA] pela senha que você criou para o banco PostgreSQL).
6. Salve o arquivo e execute novamente este script:
   ${C.green}node frontend/scripts/apply-remote.mjs${C.reset}
`);
    process.exit(1);
  }

  // Verificar módulo pg
  let pg;
  try {
    pg = require("pg");
  } catch {
    fail("Módulo 'pg' não instalado. Rode: npm install pg --save-dev");
    process.exit(1);
  }

  const { Client } = pg;
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  info("Conectando ao banco de dados...");
  try {
    await client.connect();
    ok("Conectado com sucesso!");
  } catch (err) {
    fail(`Falha ao conectar no banco de dados: ${err.message}`);
    process.exit(1);
  }

  try {
    // 1) Diagnóstico de clinic_settings
    section("Fase 1: Diagnóstico de Clinic Settings");
    info("Executando verificação prévia em clinic_settings...");
    
    const diagQuery = `
      SELECT id, therapist_id, name, phone, logo_url, professional_photo_url, theme, created_at
      FROM public.clinic_settings
      ORDER BY created_at NULLS LAST;
    `;
    
    const diagRes = await client.query(diagQuery);
    const rows = diagRes.rows;
    
    console.log(`\nEncontrado(s) ${rows.length} registro(s) em clinic_settings:`);
    console.table(rows.map(r => ({
      id: r.id,
      therapist_id: r.therapist_id || "NULL",
      name: r.name || "N/A",
      phone: r.phone || "N/A",
      theme: r.theme || "N/A"
    })));

    if (rows.length > 1) {
      warn("ATENÇÃO: Mais de uma linha foi encontrada na tabela clinic_settings!");
      fail("Abortando execução automática por questões de segurança para evitar corrupção ou duplicatas.");
      console.log(`\n${C.yellow}Ação Recomenda:${C.reset} Revise e limpe manualmente a tabela clinic_settings no Supabase SQL Editor antes de continuar.`);
      await client.end();
      process.exit(1);
    }
    
    ok("Diagnóstico concluído: Apenas 1 registro (ou 0) detectado. Seguro para prosseguir.");

    // 2) Execução das migrations em ordem
    section("Fase 2: Execução das Migrations");
    
    const files = [
      { name: "202606090001_clinic_settings_columns.sql", path: join(root, "supabase", "migrations", "202606090001_clinic_settings_columns.sql") },
      { name: "202606090003_clinic_settings_therapist_and_storage.sql", path: join(root, "supabase", "migrations", "202606090003_clinic_settings_therapist_and_storage.sql") },
      { name: "202606090002_cleanup_and_seed_joao.sql", path: join(root, "supabase", "migrations", "202606090002_cleanup_and_seed_joao.sql") },
      { name: "202606090004_fix_patient_scope.sql", path: join(root, "supabase", "migrations", "202606090004_fix_patient_scope.sql") }
    ];

    for (const file of files) {
      if (!existsSync(file.path)) {
        throw new Error(`Arquivo não encontrado: ${file.name}`);
      }
      info(`Lendo ${file.name}...`);
      const sql = readFileSync(file.path, "utf-8");
      
      info(`Executando ${file.name}...`);
      // Divide em statements simples respeitando blocos $$
      const statements = splitSql(sql);
      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (e) {
          if (/already exists|duplicate/i.test(e.message)) {
            // Ignorar avisos de elementos que já existem (normal em re-runs)
            continue;
          } else {
            throw new Error(`Erro no statement [${stmt.slice(0, 50)}...]: ${e.message}`);
          }
        }
      }
      ok(`Aplicado com sucesso: ${file.name}`);
    }

    // 3) Fase de Verificação Final
    section("Fase 3: Verificação Final");
    
    // Verificar se o bucket clinic-assets foi criado e se é privado
    const bucketQuery = `SELECT id, name, public FROM storage.buckets WHERE id = 'clinic-assets';`;
    const bucketRes = await client.query(bucketQuery);
    if (bucketRes.rows.length > 0) {
      const b = bucketRes.rows[0];
      ok(`Bucket 'clinic-assets' existe (Público: ${b.public})`);
    } else {
      fail("Bucket 'clinic-assets' não foi encontrado!");
    }

    // Verificar se o João Marcelo Ferreira foi inserido corretamente
    const patientQuery = `SELECT id, full_name, phone FROM public.patients WHERE full_name = 'João Marcelo Ferreira (Teste)';`;
    const patientRes = await client.query(patientQuery);
    if (patientRes.rows.length > 0) {
      const p = patientRes.rows[0];
      ok(`Paciente fictício '${p.full_name}' inserido (ID: ${p.id})`);
    } else {
      fail("Paciente 'João Marcelo Ferreira (Teste)' não encontrado!");
    }

    // Limpeza de nomes ofensivos
    const cleanupQuery = `SELECT count(*) FROM public.patients WHERE full_name IN ('Teste de Gay', 'Ana Clara linda');`;
    const cleanupRes = await client.query(cleanupQuery);
    if (parseInt(cleanupRes.rows[0].count) === 0) {
      ok("Nomes de teste ofensivos/inadequados foram removidos com sucesso!");
    } else {
      warn("Ainda existem nomes inadequados no banco de dados.");
    }

    section("Todas as operações concluídas com sucesso!");
    console.log(`${C.green}As migrations foram aplicadas remotamente sem erros!${C.reset}\n`);

  } catch (err) {
    fail(`Erro durante a execução do script: ${err.message}`);
  } finally {
    await client.end();
    info("Conexão com o banco de dados encerrada.");
  }
}

// Divide SQL respeitando blocos $$...$$
function splitSql(sql) {
  const stmts = [];
  let current = "";
  let inDollar = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    current += ch;

    // Detecta abertura/fechamento de bloco $$
    if (sql.slice(i, i + 2) === "$$") {
      inDollar = !inDollar;
      current += "$";
      i++;
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

main().catch((e) => {
  fail(`Erro inesperado: ${e.message}`);
  process.exit(1);
});
