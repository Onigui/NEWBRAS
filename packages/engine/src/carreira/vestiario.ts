/**
 * Vestiário e imprensa (etapa 15d): as conversas ampliadas e as entrevistas.
 *
 * - **Pedido de aumento:** o titular que ganha bem abaixo do mercado pede aumento.
 * - **Reclamação da posição:** quem joga 3 jogos oficiais seguidos fora das posições dele reclama.
 * - **Capitão:** o líder do elenco que tem mais liderança que o capitão pede a braçadeira. O capitão
 *   segura a moral do time nas derrotas e evita brigas no vestiário.
 * - **Briga no vestiário:** com o time de moral baixa ou depois de uma goleada sofrida, dois
 *   jogadores brigam e o técnico decide quem punir.
 * - **Imprensa:** entrevista antes dos jogos grandes (clássico, mata-mata, adversário forte) e depois
 *   dos resultados que chamam atenção. As respostas mexem na moral, na torcida e na diretoria.
 *
 * A liderança sai da idade, da força, de ser estrela e de um traço de personalidade de cada jogador
 * (o mesmo durante toda a carreira). A torcida (0 a 100, começa em 60) sobe com as vitórias, cai com
 * as derrotas e as respostas na imprensa, e dá moral a mais (ou a menos) nos jogos em casa.
 */
import { posicaoDaVaga, posicoesNaturais, type Jogador, type PosicaoCampo } from "@newbras/data";
import { marcar } from "@newbras/textos";
import { lesionado } from "../elenco/lesoes";
import { contratoDe, moralDe } from "../elenco/vida";
import { idadeEm } from "../evolucao";
import { salarioBase } from "../gerador/jogador";
import type { ResultadoPartida } from "../partida/tipos";
import { Rng } from "../rng";
import type { Carreira, Compromisso, Mundo, Noticia } from "./carreira";
import { estadoDe } from "./carreira";
import { diasEntre, somarDias } from "./datas";

export const TORCIDA_INICIAL = 60;

const limitar = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

/** Apoio da torcida, de 0 a 100. */
export const torcidaDe = (c: Pick<Carreira, "torcida">): number => c.torcida ?? TORCIDA_INICIAL;

export function mexerNaTorcida(c: Carreira, delta: number): Carreira {
  return delta ? { ...c, torcida: limitar(torcidaDe(c) + delta) } : c;
}

/** Faixa do apoio da torcida, para o texto. */
export function faixaDaTorcida(v: number): "empolgada" | "apoia" | "desconfiada" | "revoltada" {
  if (v >= 75) return "empolgada";
  if (v >= 45) return "apoia";
  if (v >= 25) return "desconfiada";
  return "revoltada";
}

/** Moral a mais do time em casa pela torcida: de −8 (revoltada) a +8 (empolgada). */
export const moralDaTorcida = (c: Pick<Carreira, "torcida">): number =>
  Math.round(((torcidaDe(c) - 50) / 50) * 8 * 10) / 10;

// ------------------------------------------------------------------------------ Liderança

/**
 * Liderança do jogador (10 a 99): experiência (idade), força, estrela e um traço de personalidade
 * sorteado pelo id, o mesmo em todas as carreiras.
 */
export function lideranca(j: Jogador, data: string): number {
  const idade = idadeEm(j.nascimento, data);
  const traco = new Rng(`lideranca:${j.id}`).float(-14, 14);
  const v =
    30 +
    Math.min(16, Math.max(0, idade - 18)) * 2.4 +
    (j.forca - 65) * 0.5 +
    (j.estrela ? 8 : 0) +
    traco;
  return Math.max(10, Math.min(99, Math.round(v)));
}

/** O capitão: o escolhido pelo técnico, se ainda está no elenco; senão, o de mais liderança. */
export function capitaoDe(c: Carreira, mundo: Mundo): string | undefined {
  const elenco = mundo.elenco(c.clube);
  if (c.capitao && elenco.some((j) => j.id === c.capitao)) return c.capitao;
  return [...elenco]
    .filter((j) => !lesionado(c.jogadores[j.id], c.data))
    .sort((a, b) => lideranca(b, c.data) - lideranca(a, c.data) || a.id.localeCompare(b.id))[0]?.id;
}

/** O técnico escolhe o capitão: ele ganha moral; o capitão que perde a braçadeira, perde. */
export function escolherCapitao(c: Carreira, mundo: Mundo, id: string): Carreira {
  if (!mundo.elenco(c.clube).some((j) => j.id === id)) return c;
  const antes = capitaoDe(c, mundo);
  if (antes === id) return { ...c, capitao: id };
  let r: Carreira = { ...c, capitao: id };
  r = mexerMoral(r, id, 10);
  if (antes) r = mexerMoral(r, antes, -8);
  const nome = mundo.jogador(id)?.nome ?? id;
  return {
    ...r,
    noticias: [
      {
        data: c.data,
        tipo: "elenco" as const,
        ...marcar("{jogador} é o novo capitão do time.", { jogador: nome }),
      },
      ...r.noticias,
    ].slice(0, 200),
  };
}

/** Quanto da queda de moral numa derrota o capitão segura (0 a 30%). */
export function freioDoCapitao(c: Carreira, mundo: Mundo): number {
  const id = capitaoDe(c, mundo);
  const j = id ? mundo.jogador(id) : undefined;
  if (!j) return 0;
  return Math.max(0, Math.min(0.3, (lideranca(j, c.data) - 50) / 150));
}

export function mexerMoral(c: Carreira, id: string, moral: number): Carreira {
  const e = estadoDe(c, id);
  return {
    ...c,
    jogadores: {
      ...c.jogadores,
      [id]: { ...e, moral: Math.max(0, Math.min(100, Math.round(moralDe(e) + moral))) },
    },
  };
}

// ------------------------------------------------------------------------- Posição em campo

/** A posição em que cada titular do técnico começou o jogo (os que jogaram 45 minutos ou mais). */
export function posicoesJogadas(
  c: Carreira,
  x: Compromisso,
  r: ResultadoPartida,
): Map<string, PosicaoCampo> {
  const out = new Map<string, PosicaoCampo>();
  const esc = x.selecao ? c.selecao?.escalacao : c.escalacao;
  if (!esc) return out;
  const nosso = x.mando === "casa" ? "casa" : "fora";
  const minutos = new Map(
    r.jogadores.filter((e) => e.time === nosso).map((e) => [e.id, e.minutos]),
  );
  esc.titulares.forEach((id, i) => {
    const vaga = esc.vagas[i];
    if (!id || !vaga || (minutos.get(id) ?? 0) < 45) return;
    out.set(id, esc.papeis[i]?.posicao ?? posicaoDaVaga(vaga));
  });
  return out;
}

/** Jogou numa das posições dele? */
export function naPosicao(j: Jogador, posicao: PosicaoCampo): boolean {
  return (j.posicoesCampo ?? posicoesNaturais(j)).includes(posicao);
}

/** Depois do jogo oficial: conta os jogos seguidos de cada um fora da posição. */
export function contarForaDaPosicao(
  c: Carreira,
  mundo: Mundo,
  jogadas: Map<string, PosicaoCampo>,
): Carreira {
  const fora = { ...c.foraDaPosicao };
  for (const [id, pos] of jogadas) {
    const j = mundo.jogador(id);
    if (!j) continue;
    if (naPosicao(j, pos)) delete fora[id];
    else fora[id] = (fora[id] ?? 0) + 1;
  }
  return { ...c, foraDaPosicao: fora };
}

// ------------------------------------------------------------------------- Pedido de aumento

/** O salário de mercado do jogador (o que ele pede de aumento). */
export const salarioDeMercado = (j: Jogador): number =>
  Math.round((salarioBase(j.forca) * (j.estrela ? 1.25 : 1)) / 100) * 100;

/** Pede aumento? Titular que ganha menos de 70% do mercado, com contrato longo pela frente. */
export function pedeAumento(c: Carreira, mundo: Mundo, j: Jogador, titular: boolean): boolean {
  if (!titular) return false;
  const contrato = contratoDe(c, mundo, j.id);
  if (!contrato || diasEntre(c.data, contrato.fim) < 240) return false;
  const ultimo = c.aumentos?.[j.id];
  if (ultimo && diasEntre(ultimo, c.data) < 300) return false;
  return contrato.salario < salarioDeMercado(j) * 0.7;
}

/** Dá o aumento: o salário de mercado até o fim do contrato atual. */
export function darAumento(c: Carreira, mundo: Mundo, id: string): Carreira {
  const j = mundo.jogador(id);
  const contrato = contratoDe(c, mundo, id);
  if (!j || !contrato) return c;
  const salario = Math.max(contrato.salario, salarioDeMercado(j));
  return {
    ...c,
    contratos: { ...c.contratos, [id]: { ...contrato, salario } },
    aumentos: { ...c.aumentos, [id]: c.data },
    noticias: [
      {
        data: c.data,
        tipo: "elenco" as const,
        ...marcar("{jogador} ganhou aumento: o salário agora é {salario} por mês.", {
          jogador: j.nome,
          salario,
        }),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
}

// --------------------------------------------------------------------------------- Imprensa

/** Jogo grande: clássico, mata-mata ou adversário bem mais forte (8 pontos de nível acima). */
export function jogoGrande(c: Carreira, mundo: Mundo, x: Compromisso): boolean {
  if (x.tipo !== "oficial" || x.selecao) return false;
  const nosso = mundo.clube(c.clube);
  const adv = mundo.clube(x.adversario);
  if (!nosso || !adv) return false;
  if ((nosso.rivais ?? []).includes(adv.id) || (adv.rivais ?? []).includes(nosso.id)) return true;
  if (adv.nivel >= nosso.nivel + 8) return true;
  const comp = x.competicao ? mundo.competicao(x.competicao) : undefined;
  const e = x.competicao ? c.competicoes.competicoes[x.competicao] : undefined;
  const jogo = e?.jogos[x.indice ?? -1];
  // Mata-mata (ida e volta ou jogo único), das copas, continentais e finais de estadual.
  return !!comp && !!jogo && jogo.confronto !== undefined;
}

/** Notícia do resultado com a entrevista de antes do jogo. */
export function cobrarEntrevista(
  c: Carreira,
  mundo: Mundo,
  x: Compromisso,
  saldo: number,
): { carreira: Carreira; noticias: Noticia[] } {
  const tom = c.entrevista?.jogo === x.id ? c.entrevista.tom : undefined;
  let r: Carreira = c.entrevista ? (({ entrevista: _e, ...resto }) => resto)(c) : c;
  if (!tom) return { carreira: r, noticias: [] };
  const venceu = saldo > 0;
  const perdeu = saldo < 0;
  const noticias: Noticia[] = [];
  const adv = mundo.clube(x.adversario)?.nomeCurto ?? x.adversario;
  if (tom === "confiante") {
    r = mexerNaTorcida(r, venceu ? 3 : perdeu ? -4 : 0);
  } else if (tom === "provocador") {
    r = mexerNaTorcida(r, venceu ? 5 : perdeu ? -6 : -1);
    if (perdeu)
      r = {
        ...r,
        diretoria: {
          ...(r.diretoria ?? { confianca: 60 }),
          confianca: Math.max(0, (r.diretoria?.confianca ?? 60) - 2),
        },
      };
    noticias.push({
      data: x.data,
      tipo: "carreira",
      ...(venceu
        ? marcar("A provocação ao {adversario} deu certo: a torcida está em festa.", {
            adversario: adv,
          })
        : perdeu
          ? marcar("A provocação ao {adversario} saiu cara: a torcida e a diretoria cobram.", {
              adversario: adv,
            })
          : marcar("Depois da provocação, só um empate com o {adversario}.", { adversario: adv })),
    });
  } else {
    r = mexerNaTorcida(r, venceu ? 1 : perdeu ? -1 : 0);
  }
  return { carreira: r, noticias };
}

/** Resultado que chama a imprensa depois do jogo. */
export function resultadoDeImprensa(
  c: Carreira,
  mundo: Mundo,
  x: Compromisso,
  saldo: number,
): "imprensa-vitoria" | "imprensa-derrota" | undefined {
  if (x.tipo !== "oficial" || x.selecao) return undefined;
  const grande = jogoGrande(c, mundo, x);
  if (saldo < 0 && (grande || saldo <= -2 || torcidaDe(c) < 45)) return "imprensa-derrota";
  if (saldo > 0 && (grande || saldo >= 3)) return "imprensa-vitoria";
  return undefined;
}

/** A torcida depois do jogo oficial: vitória +1,5; empate −0,3; derrota −2 (clássico vale 1,5×). */
export function torcidaDepoisDoJogo(
  c: Carreira,
  mundo: Mundo,
  x: Compromisso,
  saldo: number,
): Carreira {
  if (x.tipo !== "oficial" || x.selecao) return c;
  const nosso = mundo.clube(c.clube);
  const classico = !!nosso && (nosso.rivais ?? []).includes(x.adversario);
  const base = saldo > 0 ? 1.5 : saldo < 0 ? -2 : -0.3;
  return mexerNaTorcida(c, base * (classico ? 1.5 : 1) + (saldo >= 3 ? 1 : saldo <= -3 ? -1.5 : 0));
}

/** Prazo da entrevista depois do jogo. */
export const prazoDaImprensa = (data: string) => somarDias(data, 2);
