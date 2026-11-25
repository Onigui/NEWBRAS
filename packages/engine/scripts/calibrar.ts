/**
 * Roda a calibração completa (10.000 jogos por padrão) e grava docs/CALIBRACAO.md.
 * Uso: pnpm calibrar [quantidade]
 */
import { writeFileSync } from "node:fs";
import { ENGINE_VERSION } from "../src/index";
import { METAS, foraDasMetas, medirCalibracao } from "../src/partida/calibracao";

const n = Number(process.argv[2] ?? 10_000);
const inicio = performance.now();
const m = medirCalibracao(n);
const segundos = (performance.now() - inicio) / 1000;
const porcento = (v: number) => `${(v * 100).toFixed(1)}%`;
const linhas = (Object.keys(METAS) as (keyof typeof METAS)[]).map((k) => {
  const meta = METAS[k];
  const ehPorcento = meta.unidade === "%";
  const valor = ehPorcento ? porcento(m[k]) : m[k].toFixed(2);
  const faixa = ehPorcento
    ? `${porcento(meta.min)} a ${porcento(meta.max)}`
    : `${meta.min} a ${meta.max}`;
  const ok = m[k] >= meta.min && m[k] <= meta.max ? "dentro" : "**fora**";
  return `| ${meta.nome} | ${valor} | ${faixa} | ${ok} |`;
});
const fora = foraDasMetas(m);
const texto = `# Calibração do motor de partida

Gerado por \`pnpm calibrar\` (motor ${ENGINE_VERSION}, ${n.toLocaleString("pt-BR")} jogos, ${segundos.toFixed(0)} s). Metade dos jogos é entre times de força igual (sorteada de 55 a 82); a outra metade tem um favorito com 10 de força a mais, metade das vezes em casa. Os times usam atributos gerados pela força, como os do banco.

| Medida | Motor | Meta | Situação |
| ------ | ----- | ---- | -------- |
${linhas.join("\n")}

${fora.length ? `Fora das metas: ${fora.join("; ")}.` : "Todas as medidas dentro das metas."}

As metas vêm de médias de primeiras divisões (Brasileirão e grandes ligas europeias) e ficam em \`packages/engine/src/partida/calibracao.ts\`.
`;
writeFileSync(new URL("../../../docs/CALIBRACAO.md", import.meta.url), texto);
console.log(texto);
if (fora.length) process.exitCode = 1;
