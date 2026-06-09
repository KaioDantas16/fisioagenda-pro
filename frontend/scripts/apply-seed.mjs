import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const env = { ...parseEnv(join(root, ".env")), ...process.env };
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const SEED_FILE = join(root, "supabase", "migrations", "202606090002_cleanup_and_seed_joao.sql");

async function main() {
  console.log("→ Carregando seed e limpeza de dados...");
  if (!existsSync(SEED_FILE)) {
    console.error("✗ Arquivo de seed não encontrado:", SEED_FILE);
    process.exit(1);
  }

  const sql = readFileSync(SEED_FILE, "utf-8");
  console.log(`→ SQL carregado (${sql.length} caracteres). Enviando para o Supabase...`);

  if (!ACCESS_TOKEN || !PROJECT_REF) {
    console.error("✗ SUPABASE_ACCESS_TOKEN ou PROJECT_REF ausentes no .env.");
    process.exit(1);
  }

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`✗ Erro ao executar SQL (HTTP ${res.status}):`, body?.message || JSON.stringify(body));
    process.exit(1);
  }

  console.log("✓ Limpeza de dados e seeding do paciente João Marcelo Ferreira (Teste) concluídos com sucesso!");
}

main().catch((e) => {
  console.error("✗ Erro inesperado:", e);
  process.exit(1);
});
