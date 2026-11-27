/**
 * Teste de longa duração: simula N temporadas do mundo (o técnico só escala o automático) e
 * confere a saúde dele: elencos, goleiros, força dos grandes, livres, transferências e o tamanho
 * do salvamento. Uso: npx tsx scripts/simular-temporadas.ts [temporadas] [clube]
 */
import { montarBanco } from "../packages/banco/src/index";
import {
  avancarDia,
  compromissoDoDia,
  livresDe,
  mundoDoBanco,
  contratoDe,
  diasEntre,
  mundoNaData,
  novaCarreira,
  propostaDeRenovacao,
  renovarContrato,
  partidaDoCompromisso,
  registrarJogo,
  simularPartida,
} from "../packages/engine/src/index";

const temporadas = Number(process.argv[2] ?? 10);
const clube = process.argv[3] ?? "eng-arsenal";
const banco = montarBanco();
const base = mundoDoBanco(banco);
let c = novaCarreira(base, {
  id: "teste",
  semente: "longa",
  tecnico: "CPU",
  clube,
  referencia: "2026-07-01",
  versaoBanco: banco.meta.versao,
});
const fim = `${Number(c.data.slice(0, 4)) + temporadas}-${c.data.slice(5)}`;
const inicio = Date.now();
let ano = c.data.slice(0, 4);
const linhas: string[] = [];
const resumo = () => {
  const m = mundoNaData(base, c, c.data);
  const tamanhos = (base.clubes ?? []).filter((x) => !x.filialDe).map((x) => m.elenco(x.id));
  const n = tamanhos.map((e) => e.length);
  const semGoleiro = tamanhos.filter((e) => !e.some((j) => j.posicao === "G")).length;
  const top = tamanhos
    .map((e) => [...e].sort((a, b) => b.forca - a.forca).slice(0, 11))
    .map((e) => e.reduce((s, j) => s + j.forca, 0) / Math.max(1, e.length))
    .sort((a, b) => b - a)
    .slice(0, 20);
  const mediaTop = top.reduce((a, b) => a + b, 0) / top.length;
  const transf = c.transferencias ?? [];
  const doAno = transf.filter((t) => t.data.slice(0, 4) === ano);
  const daTemporada = doAno.length;
  const tipos = ["emprestimo", "leilao", "troca", "pre-contrato"]
    .map((x) => `${x} ${doAno.filter((t) => t.tipo === x).length}`)
    .join(", ");
  linhas.push(
    `${c.data} | elencos ${Math.min(...n)}-${Math.max(...n)} (média ${(n.reduce((a, b) => a + b, 0) / n.length).toFixed(1)}) | sem goleiro ${semGoleiro} | top 20 (11 melhores) ${mediaTop.toFixed(1)} | livres ${livresDe(c).length} | transferências guardadas ${transf.length} (${daTemporada} no ano) | ${tipos} | empréstimos ativos ${c.emprestimos?.length ?? 0} | salvamento ${(JSON.stringify(c).length / 1e6).toFixed(1)} MB | ${((Date.now() - inicio) / 1000).toFixed(0)} s`,
  );
  console.log(linhas.at(-1));
};
resumo();
while (c.data < fim) {
  const x = compromissoDoDia(c);
  if (x) {
    const m = mundoNaData(base, c, c.data);
    c = registrarJogo(c, m, x.id, simularPartida(partidaDoCompromisso(c, m, x)));
  }
  c = avancarDia(c, base).carreira;
  // O técnico automático renova antes dos 6 meses finais (se o jogador aceitar), como pede o aviso.
  const hoje = mundoNaData(base, c, c.data);
  for (const j of hoje.elenco(c.clube)) {
    const contrato = contratoDe(c, hoje, j.id);
    if (!contrato || diasEntre(c.data, contrato.fim) !== 200) continue;
    const p = propostaDeRenovacao(c, hoje, j.id);
    if (!p.recusa && p.meses.length) c = renovarContrato(c, hoje, j.id, p.meses.at(-1)!);
  }
  if (c.data.slice(0, 4) !== ano) {
    resumo();
    ano = c.data.slice(0, 4);
  }
}
resumo();
