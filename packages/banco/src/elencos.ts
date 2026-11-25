/**
 * Ajuste dos elencos ao limite profissional. Algumas fontes listam 50 ou mais jogadores por clube
 * (sub-20, sub-23, emprestados). Cada clube fica com os melhores, garantindo as posições; os jovens
 * que sobram vão para a base; os outros vão para clubes do mesmo país que têm vaga, do nível mais
 * parecido com a força deles. Assim ninguém é inventado e o clube que cede não perde força.
 */
import {
  BASE_MAXIMA,
  ELENCO_MAXIMO,
  IDADE_MAXIMA_BASE,
  type ClubeEntrada,
  type JogadorEntrada,
  type Posicao,
} from "@newbras/data";
import { idadeEm } from "@newbras/engine";

/** Quantos jogadores de cada posição o clube guarda antes de completar pelos mais fortes. */
const MINIMO_POR_POSICAO: Readonly<Record<Posicao, number>> = { G: 3, L: 4, Z: 5, M: 6, A: 4 };
/** Clubes que recebem jogadores param de receber quando chegam a este tamanho. */
const TAMANHO_PARA_RECEBER = 28;

const pelaForca = (a: JogadorEntrada, b: JogadorEntrada) =>
  b.forca - a.forca || b.potencial - a.potencial || a.id.localeCompare(b.id);

export interface ResultadoEquilibrio {
  jogadores: JogadorEntrada[];
  paraBase: number;
  transferidos: number;
}

export function equilibrarElencos(
  jogadores: readonly JogadorEntrada[],
  clubes: readonly ClubeEntrada[],
  hoje: string,
): ResultadoEquilibrio {
  const resultado = jogadores.map((j) => ({ ...j }));
  const porClube = new Map<string, JogadorEntrada[]>();
  for (const j of resultado)
    if (j.clube) porClube.set(j.clube, [...(porClube.get(j.clube) ?? []), j]);
  const profissionais = (id: string) => (porClube.get(id) ?? []).filter((j) => !j.base);
  const naBase = (id: string) => (porClube.get(id) ?? []).filter((j) => j.base).length;

  let paraBase = 0;
  const sobras: Array<{ jogador: JogadorEntrada; origem: ClubeEntrada }> = [];

  for (const clube of [...clubes].sort((a, b) => a.id.localeCompare(b.id))) {
    const elenco = profissionais(clube.id);
    if (elenco.length <= ELENCO_MAXIMO) continue;
    const ficam = new Set<JogadorEntrada>();
    const ordenado = [...elenco].sort(pelaForca);
    for (const [posicao, minimo] of Object.entries(MINIMO_POR_POSICAO) as [Posicao, number][])
      for (const j of ordenado.filter((x) => x.posicao === posicao).slice(0, minimo)) ficam.add(j);
    for (const j of ordenado) if (ficam.size < ELENCO_MAXIMO) ficam.add(j);

    for (const j of ordenado) {
      if (ficam.has(j)) continue;
      if (idadeEm(j.nascimento, hoje) <= IDADE_MAXIMA_BASE && naBase(clube.id) < BASE_MAXIMA) {
        j.base = true;
        paraBase++;
      } else sobras.push({ jogador: j, origem: clube });
    }
  }

  // Os que saem vão para o clube do mesmo país com vaga e nível mais perto da força deles.
  const tamanho = new Map(clubes.map((c) => [c.id, profissionais(c.id).length]));
  const numeros = new Map(
    clubes.map((c) => [
      c.id,
      new Set((porClube.get(c.id) ?? []).flatMap((j) => (j.numero ? [j.numero] : []))),
    ]),
  );
  let transferidos = 0;
  for (const { jogador, origem } of sobras.sort((a, b) => pelaForca(a.jogador, b.jogador))) {
    const destino = clubes
      .filter(
        (c) =>
          c.pais === origem.pais &&
          c.id !== origem.id &&
          !c.filialDe &&
          (tamanho.get(c.id) ?? 0) < TAMANHO_PARA_RECEBER,
      )
      .sort(
        (a, b) =>
          Math.abs(a.nivel - jogador.forca) - Math.abs(b.nivel - jogador.forca) ||
          (tamanho.get(a.id) ?? 0) - (tamanho.get(b.id) ?? 0) ||
          a.id.localeCompare(b.id),
      )[0];
    if (!destino) continue; // Sem vaga no país: fica, e a validação avisa.
    numeros.get(origem.id)?.delete(jogador.numero ?? -1);
    jogador.clube = destino.id;
    if (jogador.numero !== undefined) {
      const ocupados = numeros.get(destino.id);
      if (ocupados?.has(jogador.numero)) delete jogador.numero;
      else ocupados?.add(jogador.numero);
    }
    tamanho.set(destino.id, (tamanho.get(destino.id) ?? 0) + 1);
    tamanho.set(origem.id, (tamanho.get(origem.id) ?? 0) - 1);
    transferidos++;
  }
  return { jogadores: resultado, paraBase, transferidos };
}
