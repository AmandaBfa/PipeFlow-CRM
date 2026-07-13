// Verificador de configuração do Supabase (aula 3.1 — "Chaves").
// Lê o .env.local, confere as 3 variáveis e faz um ping de conectividade.
// NUNCA imprime o valor das chaves — só presença, tipo e comprimento mascarado.
//
// Uso: pnpm supabase:check
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(text) {
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

// Mostra só um trecho + comprimento — nunca o segredo inteiro.
const mask = (v) => (v ? `${v.slice(0, 6)}…(${v.length} chars)` : "(vazio)");

// Decodifica um campo do payload do JWT (sem validar assinatura).
function jwtField(v, field) {
  try {
    const payload = JSON.parse(
      Buffer.from(v.split(".")[1], "base64").toString("utf8")
    );
    return payload[field] ?? null;
  } catch {
    return null;
  }
}

const problems = [];
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  problems.push(m);
};

let env;
try {
  env = parseEnv(await readFile(join(root, ".env.local"), "utf8"));
} catch {
  console.error(
    "✗ .env.local não encontrado. Copie de .env.example e preencha as chaves."
  );
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase — variáveis (.env.local):");

// URL
if (!url) bad("NEXT_PUBLIC_SUPABASE_URL ausente");
else if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url))
  bad(`NEXT_PUBLIC_SUPABASE_URL suspeita: ${url}`);
else ok(`NEXT_PUBLIC_SUPABASE_URL = ${url}`);

const projectRef = url ? new URL(url).host.split(".")[0] : null;

// anon key (aceita JWT legado role=anon OU o formato novo sb_publishable_)
if (!anon) bad("NEXT_PUBLIC_SUPABASE_ANON_KEY ausente");
else if (anon.startsWith("eyJ")) {
  const role = jwtField(anon, "role");
  if (role === "anon") ok(`NEXT_PUBLIC_SUPABASE_ANON_KEY — JWT role=anon, ${mask(anon)}`);
  else bad(`NEXT_PUBLIC_SUPABASE_ANON_KEY com role="${role}" (esperado "anon"). Chaves trocadas?`);
  const ref = jwtField(anon, "ref");
  if (projectRef && ref && ref !== projectRef)
    bad(`anon pertence ao projeto "${ref}", mas a URL é "${projectRef}"`);
} else if (anon.startsWith("sb_publishable_")) {
  ok(`NEXT_PUBLIC_SUPABASE_ANON_KEY — formato novo (publishable), ${mask(anon)}`);
} else bad("NEXT_PUBLIC_SUPABASE_ANON_KEY em formato inesperado (nem JWT nem sb_publishable_)");

// service_role key (JWT legado role=service_role OU sb_secret_)
if (!service) bad("SUPABASE_SERVICE_ROLE_KEY ausente");
else if (service.startsWith("eyJ")) {
  const role = jwtField(service, "role");
  if (role === "service_role")
    ok(`SUPABASE_SERVICE_ROLE_KEY — JWT role=service_role, ${mask(service)}`);
  else bad(`SUPABASE_SERVICE_ROLE_KEY com role="${role}" (esperado "service_role"). Chaves trocadas?`);
} else if (service.startsWith("sb_secret_")) {
  ok(`SUPABASE_SERVICE_ROLE_KEY — formato novo (secret), ${mask(service)}`);
} else bad("SUPABASE_SERVICE_ROLE_KEY em formato inesperado (nem JWT nem sb_secret_)");

// a service_role NUNCA pode ser exposta ao browser
if (env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)
  bad("service_role está como NEXT_PUBLIC_* — ela é somente-servidor, remova o prefixo!");

// Conectividade: valida URL + anon key juntos. Usamos /auth/v1/settings, que
// responde 200 com uma anon/publishable válida (o /rest/v1/ raiz exige um JWT
// de usuário e não serve como probe da anon key).
if (url && anon) {
  console.log("\nConectividade:");
  const base = url.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/auth/v1/settings`, {
      headers: { apikey: anon },
    });
    if (res.ok) ok(`GET /auth/v1/settings → ${res.status} (URL + anon key válidas)`);
    else if (res.status === 401)
      bad(`GET /auth/v1/settings → 401 (anon key não aceita por este projeto)`);
    else bad(`GET /auth/v1/settings → ${res.status} (projeto pausado? verifique no dashboard)`);
  } catch (e) {
    bad(`falha de rede ao acessar o Supabase: ${e.message}`);
  }
}

console.log();
if (problems.length) {
  console.log(`✗ ${problems.length} problema(s). Ajuste o .env.local e rode de novo.`);
  process.exit(1);
} else {
  console.log("✓ Tudo certo — chaves válidas e Supabase acessível.");
}
