/**
 * Atributos dos jogadores. A força (o número que o Brasfoot mostra) é a média ponderada dos
 * atributos, com pesos que dependem da posição; as características são os 2 atributos mais altos.
 * O motor de partida usa os atributos: velocidade decide quem chega antes, chute de longe decide
 * quem arrisca de fora da área, resistência decide quem cansa, e assim por diante.
 */
import {
  CARACTERISTICAS_GOLEIRO,
  CARACTERISTICAS_LINHA,
  type Caracteristica,
  type Posicao,
} from "./football";
import { hashTexto } from "./visual";

export type Atributo = Caracteristica;
export type Atributos = Partial<Record<Atributo, number>>;

/** Atributos de cada posição: goleiro tem os seus; os outros, os de linha. */
export function atributosDaPosicao(posicao: Posicao): readonly Atributo[] {
  return posicao === "G" ? CARACTERISTICAS_GOLEIRO : CARACTERISTICAS_LINHA;
}

/** Quanto cada atributo pesa na força, por posição. Atributo fora da lista não conta na força. */
export const PESOS: Readonly<Record<Posicao, Atributos>> = {
  G: { reflexo: 3, colocacao: 3, saida: 2, reposicao: 1, penalti: 1 },
  L: {
    velocidade: 2.5,
    cruzamento: 2,
    desarme: 2,
    marcacao: 2,
    resistencia: 2,
    passe: 1,
    drible: 1,
  },
  Z: {
    marcacao: 3,
    desarme: 3,
    cabeceio: 2,
    forcaFisica: 2,
    velocidade: 1,
    passe: 1,
    resistencia: 1,
  },
  M: {
    passe: 3,
    armacao: 3,
    resistencia: 1.5,
    desarme: 1.5,
    drible: 1.5,
    chuteLonge: 1,
    velocidade: 1,
    marcacao: 1,
  },
  A: {
    finalizacao: 3,
    velocidade: 2,
    drible: 2,
    cabeceio: 1,
    chuteLonge: 1,
    passe: 1,
    forcaFisica: 0.5,
  },
};

/**
 * Atributos que não entram na força da posição, mas que o jogador costuma ter bem acima dos
 * outros: o meia que finaliza e cruza, o atacante que arma, o lateral que chuta de longe.
 * Sem isso, só os atacantes sabem fazer gol.
 */
export const SECUNDARIOS: Readonly<Record<Posicao, readonly Atributo[]>> = {
  G: [],
  L: ["chuteLonge", "finalizacao"],
  Z: ["passe", "chuteLonge"],
  M: ["finalizacao", "cruzamento"],
  A: ["armacao", "cruzamento"],
};

const limitar = (v: number) => Math.max(1, Math.min(100, Math.round(v)));

/** Força pela média ponderada dos atributos da posição. */
export function forcaDosAtributos(posicao: Posicao, atributos: Atributos): number {
  let soma = 0;
  let pesos = 0;
  for (const [a, p] of Object.entries(PESOS[posicao]) as [Atributo, number][]) {
    soma += (atributos[a] ?? 0) * p;
    pesos += p;
  }
  return limitar(soma / pesos);
}

/** Ordem dos atributos do mais alto para o mais baixo (empate: o que pesa mais na posição). */
function ordenados(posicao: Posicao, atributos: Atributos): Atributo[] {
  const lista = atributosDaPosicao(posicao);
  return [...lista].sort(
    (a, b) =>
      (atributos[b] ?? 0) - (atributos[a] ?? 0) ||
      (PESOS[posicao][b] ?? 0) - (PESOS[posicao][a] ?? 0) ||
      lista.indexOf(a) - lista.indexOf(b),
  );
}

/** Distância máxima entre o melhor e o segundo atributo para os dois virarem características. */
export const DISTANCIA_SEGUNDA_CARACTERISTICA = 8;

/**
 * Características: o atributo mais alto e, se estiver perto dele, o segundo.
 * Só uma característica = jogador limitado, como no Brasfoot.
 */
export function caracteristicasDosAtributos(
  posicao: Posicao,
  atributos: Atributos,
): [Atributo] | [Atributo, Atributo] {
  const [primeiro, segundo] = ordenados(posicao, atributos) as [Atributo, Atributo];
  return (atributos[segundo] ?? 0) >= (atributos[primeiro] ?? 0) - DISTANCIA_SEGUNDA_CARACTERISTICA
    ? [primeiro, segundo]
    : [primeiro];
}

/** Gerador pequeno e determinístico (mulberry32), para os atributos saírem sempre iguais. */
function sorteador(semente: string) {
  let s = hashTexto(semente);
  const proximo = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { entre: (min: number, max: number) => min + proximo() * (max - min) };
}

/**
 * Mexe nos atributos que pesam na força, um ponto por vez, até a força bater com o alvo.
 * Os atributos em `fixos` não mudam; nenhum atributo ajustado passa de `teto`.
 */
export function ajustarParaForca(
  posicao: Posicao,
  atributos: Atributos,
  alvo: number,
  fixos: ReadonlySet<Atributo> = new Set(),
  teto = 100,
): Atributos {
  const r: Atributos = { ...atributos };
  const ajustaveis = (Object.keys(PESOS[posicao]) as Atributo[])
    .filter((a) => !fixos.has(a))
    .sort((a, b) => (PESOS[posicao][b] ?? 0) - (PESOS[posicao][a] ?? 0));
  if (!ajustaveis.length) return r;
  // Passa pelos atributos em rodízio (do que mais pesa ao que menos pesa), um ponto por vez,
  // para o ajuste se espalhar e não achatar nem deformar o perfil.
  let indice = 0;
  let semMudar = 0;
  for (let i = 0; i < 4000 && semMudar < ajustaveis.length; i++) {
    const atual = forcaDosAtributos(posicao, r);
    if (atual === alvo) break;
    const passo = atual < alvo ? 1 : -1;
    const a = ajustaveis[indice % ajustaveis.length] as Atributo;
    indice++;
    const v = r[a] ?? 1;
    if (passo > 0 ? v < teto : v > 1) {
      r[a] = v + passo;
      semMudar = 0;
    } else semMudar++;
  }
  return r;
}

/** Força em que o perfil é montado, no máximo (ver `gerarAtributos`). */
export const TETO_DO_PERFIL = 92;

export interface PerfilAtributos {
  /** Semente estável (o id do jogador): o mesmo jogador sempre ganha os mesmos atributos. */
  semente: string;
  posicao: Posicao;
  forca: number;
  /** Características que o jogador deve ter (viram os atributos mais altos). */
  caracteristicas?: readonly Atributo[];
  /** Valores fixos de atributos marcantes, na escala do auge (ex.: velocidade 99 do Bale). */
  destaques?: Atributos;
  /** Força do auge: com ela, o perfil é montado no auge e reduzido para a força de hoje. */
  forcaAuge?: number;
}

/**
 * Monta atributos coerentes com a força, a posição e as características.
 * Os atributos que pesam na posição ficam em volta da força; os que não pesam, abaixo;
 * as características, acima de todos.
 */
export function gerarAtributos(p: PerfilAtributos): Atributos {
  // O perfil é montado numa força de no máximo 92: acima disso não sobra espaço para os
  // destaques ficarem acima do resto. Depois ele é escalado para a força de hoje.
  const base = Math.min(TETO_DO_PERFIL, Math.max(p.forca, p.forcaAuge ?? 0));
  const rng = sorteador(`${p.semente}:atributos`);
  const lista = atributosDaPosicao(p.posicao);
  const caracteristicas = (p.caracteristicas ?? []).filter((c) => lista.includes(c));
  const destaques = p.destaques ?? {};
  const r: Atributos = {};

  for (const a of lista) {
    const peso = PESOS[p.posicao][a] ?? 0;
    r[a] = limitar(
      peso
        ? base + rng.entre(-7, 5)
        : SECUNDARIOS[p.posicao].includes(a)
          ? base - rng.entre(3, 14)
          : base - rng.entre(8, 26),
    );
  }

  // Características acima dos outros atributos; com só uma, a segunda fica longe.
  const c1 = caracteristicas[0];
  const c2 = caracteristicas[1];
  // Com uma característica só, ela se destaca mais: o resto precisa caber 9 pontos abaixo dela.
  const folga = caracteristicas.length === 1 ? rng.entre(12, 16) : rng.entre(6, 12);
  const topo = Math.min(99, Math.round(base + folga));
  if (c1) r[c1] = topo;
  // A segunda fica perto da primeira e sempre acima da força, para caber o resto abaixo dela.
  if (c2) r[c2] = Math.min(topo, Math.max(base + 2, topo - Math.round(rng.entre(0, 6))));
  for (const [a, v] of Object.entries(destaques) as [Atributo, number][])
    if (lista.includes(a)) r[a] = limitar(v);

  const marcados = new Set<Atributo>([
    ...caracteristicas,
    ...(Object.keys(destaques) as Atributo[]),
  ]);
  const menorMarcado = Math.min(...[...marcados].map((a) => r[a] ?? 100), 101);
  let teto = marcados.size
    ? menorMarcado - (caracteristicas.length === 1 ? DISTANCIA_SEGUNDA_CARACTERISTICA + 1 : 1)
    : 100;
  // Força muito alta não cabe abaixo de uma característica só: aí o teto encosta nela.
  if (teto < base + 2) teto = Math.max(teto, menorMarcado - 1);
  if (teto < base) teto = 100;
  for (const a of lista) if (!marcados.has(a)) r[a] = Math.min(r[a] ?? 1, teto);

  const atributos = ajustarParaForca(p.posicao, r, base, marcados, teto);
  return base === p.forca ? atributos : escalarAtributos(p.posicao, atributos, p.forca);
}

/** Muda a força mantendo o perfil: todos os atributos sobem ou descem na mesma proporção. */
export function escalarAtributos(
  posicao: Posicao,
  atributos: Atributos,
  novaForca: number,
): Atributos {
  const atual = forcaDosAtributos(posicao, atributos);
  if (atual === novaForca) return { ...atributos };
  const fator = novaForca / Math.max(1, atual);
  const r: Atributos = {};
  for (const a of atributosDaPosicao(posicao)) r[a] = limitar((atributos[a] ?? 1) * fator);
  // As características ficam paradas no acerto fino, para continuarem no topo.
  const fixos = new Set<Atributo>(caracteristicasDosAtributos(posicao, r));
  const ajustado = ajustarParaForca(posicao, r, novaForca, fixos);
  return forcaDosAtributos(posicao, ajustado) === novaForca
    ? ajustado
    : ajustarParaForca(posicao, ajustado, novaForca);
}
