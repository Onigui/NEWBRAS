/**
 * Atualiza os catálogos de tradução com os textos do código: chave nova entra vazia (o tradutor
 * preenche), chave que saiu do código sai do catálogo. O português é a própria chave.
 *
 * pnpm --filter @newbras/textos extrair
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chavesDoCodigo } from "./chaves";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../../..");
const pasta = path.resolve(aqui, "../src/catalogos");

const { chaves, problemas } = chavesDoCodigo(raiz);
if (problemas.length) {
  console.error(problemas.join("\n"));
  process.exit(1);
}
const ordenadas = [...chaves].sort((a, b) => a.localeCompare(b, "pt-BR"));
for (const arquivo of fs.readdirSync(pasta).filter((f) => f.endsWith(".json"))) {
  const caminho = path.join(pasta, arquivo);
  const antigo = JSON.parse(fs.readFileSync(caminho, "utf8")) as Record<string, string>;
  const novo = Object.fromEntries(ordenadas.map((c) => [c, antigo[c] ?? ""]));
  fs.writeFileSync(caminho, JSON.stringify(novo, null, 2) + "\n");
  const feitos = Object.values(novo).filter(Boolean).length;
  console.log(`${arquivo}: ${feitos} de ${ordenadas.length} traduzidos`);
}
