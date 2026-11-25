/**
 * Posições de campo e funções. O cadastro do jogador continua com as 5 posições do Brasfoot
 * (goleiro, lateral, zagueiro, meia, atacante); em campo, o lugar da vaga vira uma das 13
 * posições abaixo e cada posição tem funções (centroavante, pivô, falso 9...). Cada função pesa
 * os atributos do seu jeito: é por isso que um atacante 90 vale menos jogando de meia-armador.
 */
import type { Lado, Posicao } from "./football";
import type { Atributo, Atributos } from "./atributos";

export const POSICOES_CAMPO = [
  "GOL",
  "ZAG",
  "LD",
  "LE",
  "VOL",
  "MC",
  "MD",
  "ME",
  "MEI",
  "PD",
  "PE",
  "SA",
  "CA",
] as const;
export type PosicaoCampo = (typeof POSICOES_CAMPO)[number];

export const NOME_POSICAO_CAMPO: Record<PosicaoCampo, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LD: "Lateral-direito",
  LE: "Lateral-esquerdo",
  VOL: "Volante",
  MC: "Meio-campista",
  MD: "Meia-direita",
  ME: "Meia-esquerda",
  MEI: "Meia-atacante",
  PD: "Ponta-direita",
  PE: "Ponta-esquerda",
  SA: "Segundo atacante",
  CA: "Centroavante",
};

/** A qual das 5 posições do cadastro cada posição de campo pertence. */
export const FAMILIA_POSICAO: Record<PosicaoCampo, Posicao> = {
  GOL: "G",
  ZAG: "Z",
  LD: "L",
  LE: "L",
  VOL: "M",
  MC: "M",
  MD: "M",
  ME: "M",
  MEI: "M",
  PD: "A",
  PE: "A",
  SA: "A",
  CA: "A",
};

/** Lado do campo da posição (para o lateral do lado trocado). */
const LADO_POSICAO: Partial<Record<PosicaoCampo, Lado>> = {
  LD: "D",
  LE: "E",
  MD: "D",
  ME: "E",
  PD: "D",
  PE: "E",
};

export const FUNCOES = [
  "goleiro",
  "goleiro-libero",
  "zagueiro",
  "zagueiro-construtor",
  "libero",
  "lateral",
  "lateral-defensivo",
  "ala",
  "volante",
  "volante-construtor",
  "meio-campista",
  "box-to-box",
  "armador",
  "meia-aberto",
  "meia-por-dentro",
  "meia-armador",
  "meia-atacante",
  "ponta",
  "ponta-invertido",
  "segundo-atacante",
  "centroavante",
  "pivo",
  "falso-9",
  "atacante-velocidade",
] as const;
export type Funcao = (typeof FUNCOES)[number];

export interface DadosFuncao {
  nome: string;
  /** O que o jogador faz em campo, em uma frase. */
  descricao: string;
  /** Família da função: goleiro, defesa, meio ou ataque (decide a familiaridade). */
  familia: Posicao;
  /** Quanto cada atributo pesa na nota do jogador nessa função. */
  pesos: Atributos;
}

export const DADOS_FUNCAO: Record<Funcao, DadosFuncao> = {
  goleiro: {
    nome: "Goleiro",
    descricao: "Fica no gol e defende.",
    familia: "G",
    pesos: { reflexo: 3, colocacao: 3, saida: 2, reposicao: 1, penalti: 1 },
  },
  "goleiro-libero": {
    nome: "Goleiro-líbero",
    descricao: "Joga adiantado, sai da área para cortar lançamentos e começa a jogada com os pés.",
    familia: "G",
    pesos: { saida: 3, reflexo: 2.5, colocacao: 2, reposicao: 2.5 },
  },
  zagueiro: {
    nome: "Zagueiro",
    descricao: "Marca, desarma e ganha no alto. Joga simples.",
    familia: "Z",
    pesos: {
      marcacao: 3,
      desarme: 3,
      cabeceio: 2,
      forcaFisica: 2,
      velocidade: 1,
      passe: 1,
      resistencia: 1,
    },
  },
  "zagueiro-construtor": {
    nome: "Zagueiro construtor",
    descricao: "Sai jogando: passes verticais e lançamentos desde a defesa.",
    familia: "Z",
    pesos: {
      marcacao: 2.5,
      desarme: 2.5,
      passe: 2.5,
      armacao: 1,
      cabeceio: 1,
      forcaFisica: 1,
      velocidade: 1,
    },
  },
  libero: {
    nome: "Líbero",
    descricao: "Zagueiro que avança com a bola dominada até o meio-campo.",
    familia: "Z",
    pesos: {
      desarme: 2.5,
      marcacao: 2,
      passe: 2,
      drible: 1.5,
      velocidade: 1.5,
      armacao: 1,
      resistencia: 1,
    },
  },
  lateral: {
    nome: "Lateral",
    descricao: "Defende e apoia o ataque pelo lado.",
    familia: "L",
    pesos: {
      velocidade: 2.5,
      cruzamento: 2,
      desarme: 2,
      marcacao: 2,
      resistencia: 2,
      passe: 1,
      drible: 1,
    },
  },
  "lateral-defensivo": {
    nome: "Lateral defensivo",
    descricao: "Quase não passa do meio: fecha o lado e marca o ponta.",
    familia: "L",
    pesos: {
      marcacao: 3,
      desarme: 3,
      velocidade: 2,
      resistencia: 1.5,
      forcaFisica: 1,
      cabeceio: 1,
      passe: 1,
    },
  },
  ala: {
    nome: "Ala",
    descricao: "Vive no campo de ataque, abre o jogo e cruza; cansa mais.",
    familia: "L",
    pesos: {
      velocidade: 2.5,
      cruzamento: 2.5,
      resistencia: 2.5,
      drible: 1.5,
      passe: 1,
      desarme: 1,
      marcacao: 1,
    },
  },
  volante: {
    nome: "Volante",
    descricao: "Protege a defesa: marca, desarma e entrega a bola curta.",
    familia: "M",
    pesos: {
      desarme: 3,
      marcacao: 3,
      resistencia: 2,
      forcaFisica: 1.5,
      passe: 1.5,
      cabeceio: 0.5,
      velocidade: 0.5,
    },
  },
  "volante-construtor": {
    nome: "Volante construtor",
    descricao: "Organiza o jogo lá de trás com passes longos e verticais.",
    familia: "M",
    pesos: {
      passe: 3,
      armacao: 2,
      desarme: 2,
      marcacao: 1.5,
      chuteLonge: 1,
      resistencia: 1,
    },
  },
  "meio-campista": {
    nome: "Meio-campista",
    descricao: "Faz um pouco de tudo: passa, marca e chega na área de vez em quando.",
    familia: "M",
    pesos: {
      passe: 3,
      armacao: 3,
      resistencia: 1.5,
      desarme: 1.5,
      drible: 1.5,
      chuteLonge: 1,
      velocidade: 1,
      marcacao: 1,
    },
  },
  "box-to-box": {
    nome: "Box-to-box",
    descricao: "Corre de área a área: desarma atrás e finaliza na frente; cansa mais.",
    familia: "M",
    pesos: {
      resistencia: 3,
      passe: 2,
      desarme: 2,
      finalizacao: 1.5,
      chuteLonge: 1.5,
      velocidade: 1,
      forcaFisica: 1,
      armacao: 1,
    },
  },
  armador: {
    nome: "Armador recuado",
    descricao: "Fica atrás da linha da bola e distribui o jogo, com lançamentos.",
    familia: "M",
    pesos: { passe: 3.5, armacao: 3, chuteLonge: 1.5, drible: 1, resistencia: 1 },
  },
  "meia-aberto": {
    nome: "Meia aberto",
    descricao: "Joga colado na linha lateral e cruza.",
    familia: "M",
    pesos: {
      cruzamento: 2.5,
      velocidade: 2,
      passe: 2,
      resistencia: 2,
      drible: 1.5,
      armacao: 1,
      desarme: 1,
    },
  },
  "meia-por-dentro": {
    nome: "Meia por dentro",
    descricao: "Sai do lado para o meio e ajuda a armar, deixando o corredor para o lateral.",
    familia: "M",
    pesos: {
      passe: 2.5,
      armacao: 2.5,
      drible: 2,
      resistencia: 1.5,
      chuteLonge: 1,
      velocidade: 1,
    },
  },
  "meia-armador": {
    nome: "Meia-armador",
    descricao: "O camisa 10: recebe entre as linhas e dá o último passe.",
    familia: "M",
    pesos: {
      armacao: 3.5,
      passe: 3,
      drible: 2,
      chuteLonge: 1,
      finalizacao: 1,
      velocidade: 0.5,
    },
  },
  "meia-atacante": {
    nome: "Meia-atacante",
    descricao: "Meia que chega na área para finalizar.",
    familia: "M",
    pesos: {
      finalizacao: 2.5,
      drible: 2,
      armacao: 2,
      chuteLonge: 1.5,
      passe: 1.5,
      velocidade: 1,
    },
  },
  ponta: {
    nome: "Ponta",
    descricao: "Bem aberto, parte para cima do lateral e cruza.",
    familia: "A",
    pesos: {
      velocidade: 3,
      drible: 2.5,
      cruzamento: 2,
      finalizacao: 1,
      passe: 1,
      resistencia: 0.5,
    },
  },
  "ponta-invertido": {
    nome: "Ponta invertido",
    descricao: "Corta da ponta para o meio e finaliza.",
    familia: "A",
    pesos: {
      drible: 3,
      finalizacao: 2.5,
      velocidade: 2,
      chuteLonge: 1.5,
      passe: 1,
      armacao: 0.5,
    },
  },
  "segundo-atacante": {
    nome: "Segundo atacante",
    descricao: "Joga em volta do centroavante, tabela e aparece na área.",
    familia: "A",
    pesos: {
      finalizacao: 2.5,
      drible: 2,
      armacao: 1.5,
      velocidade: 1.5,
      passe: 1.5,
      chuteLonge: 1,
    },
  },
  centroavante: {
    nome: "Centroavante",
    descricao: "Homem de área: fica entre os zagueiros esperando a bola para finalizar.",
    familia: "A",
    pesos: {
      finalizacao: 3.5,
      cabeceio: 2,
      forcaFisica: 1.5,
      velocidade: 1,
      drible: 1,
      chuteLonge: 0.5,
    },
  },
  pivo: {
    nome: "Pivô",
    descricao: "Segura a bola de costas para o gol, ganha no alto e serve quem chega.",
    familia: "A",
    pesos: { forcaFisica: 3, cabeceio: 2.5, passe: 2, finalizacao: 2, armacao: 0.5 },
  },
  "falso-9": {
    nome: "Falso 9",
    descricao: "Sai da área para o meio, puxa um zagueiro e abre espaço para quem chega.",
    familia: "A",
    pesos: { armacao: 2.5, passe: 2.5, drible: 2, finalizacao: 2, chuteLonge: 1 },
  },
  "atacante-velocidade": {
    nome: "Atacante de velocidade",
    descricao: "Joga no limite do impedimento esperando o lançamento nas costas da zaga.",
    familia: "A",
    pesos: { velocidade: 3, finalizacao: 3, drible: 1.5, chuteLonge: 0.5 },
  },
};

/** Funções de cada posição de campo; a primeira é a padrão. */
export const FUNCOES_DA_POSICAO: Record<PosicaoCampo, readonly Funcao[]> = {
  GOL: ["goleiro", "goleiro-libero"],
  ZAG: ["zagueiro", "zagueiro-construtor", "libero"],
  LD: ["lateral", "lateral-defensivo", "ala"],
  LE: ["lateral", "lateral-defensivo", "ala"],
  VOL: ["volante", "volante-construtor"],
  MC: ["meio-campista", "box-to-box", "armador"],
  MD: ["meia-aberto", "meia-por-dentro"],
  ME: ["meia-aberto", "meia-por-dentro"],
  MEI: ["meia-armador", "meia-atacante"],
  PD: ["ponta", "ponta-invertido"],
  PE: ["ponta", "ponta-invertido"],
  SA: ["segundo-atacante"],
  CA: ["centroavante", "pivo", "falso-9", "atacante-velocidade"],
};

/**
 * Posições que o técnico pode pedir a quem está numa vaga, além da própria: o centroavante
 * que joga de segundo atacante, o volante que vira terceiro zagueiro, o ponta que recua.
 */
export const POSICOES_VIZINHAS: Record<PosicaoCampo, readonly PosicaoCampo[]> = {
  GOL: ["GOL"],
  ZAG: ["ZAG", "VOL"],
  LD: ["LD", "MD"],
  LE: ["LE", "ME"],
  VOL: ["VOL", "MC", "ZAG"],
  MC: ["MC", "VOL", "MEI"],
  MD: ["MD", "PD", "LD"],
  ME: ["ME", "PE", "LE"],
  MEI: ["MEI", "MC", "SA"],
  PD: ["PD", "MD"],
  PE: ["PE", "ME"],
  SA: ["SA", "CA", "MEI"],
  CA: ["CA", "SA"],
};

/** A escolha do técnico para uma vaga: a posição que o jogador faz e a função nela. */
export interface PapelEmCampo {
  posicao: PosicaoCampo;
  funcao: Funcao;
}

/** O que o lugar da vaga precisa ter para virar posição de campo (no quadro de ataque). */
export interface LugarDaVaga {
  posicao: Posicao;
  lado: Lado;
  x: number;
  y: number;
}

/**
 * Posição de campo de uma vaga. A família (defesa, meio, ataque) vem da vaga; o detalhe vem do
 * lugar: o meia central mais recuado é volante, o mais adiantado é meia-atacante; o atacante
 * aberto é ponta e o central que joga mais atrás é segundo atacante.
 */
export function posicaoDaVaga(vaga: LugarDaVaga): PosicaoCampo {
  const dy = vaga.y - 34;
  const direita = vaga.lado === "D" || (vaga.lado === "C" && dy < 0);
  switch (vaga.posicao) {
    case "G":
      return "GOL";
    case "Z":
      return "ZAG";
    case "L":
      return direita ? "LD" : "LE";
    case "M":
      if (Math.abs(dy) > 15) return dy < 0 ? "MD" : "ME";
      return vaga.x < 46 ? "VOL" : vaga.x < 56 ? "MC" : "MEI";
    case "A":
      if (Math.abs(dy) > 15) return dy < 0 ? "PD" : "PE";
      return vaga.x < 66 ? "SA" : "CA";
  }
}

/** Funções que o técnico pode escolher numa vaga, agrupadas pela posição. */
export function papeisPossiveis(posicao: PosicaoCampo): PapelEmCampo[] {
  return POSICOES_VIZINHAS[posicao].flatMap((p) =>
    FUNCOES_DA_POSICAO[p].map((funcao) => ({ posicao: p, funcao })),
  );
}

export function papelValido(vaga: PosicaoCampo, papel: PapelEmCampo): boolean {
  return (
    POSICOES_VIZINHAS[vaga].includes(papel.posicao) &&
    FUNCOES_DA_POSICAO[papel.posicao].includes(papel.funcao)
  );
}

/** O que a nota por função precisa saber do jogador. */
export interface JogadorParaNota {
  posicao: Posicao;
  lado: Lado;
  /** Posições de campo em que ele atua de verdade (jogadores reais). */
  posicoesCampo?: readonly PosicaoCampo[] | undefined;
  forca: number;
  atributos: Atributos;
}

/**
 * Rendimento de um jogador de cada família jogando em outra (fila: cadastro dele; coluna: família
 * da função). Atacante de zagueiro rende 68%; meia de atacante, 90%. Vale para todos os atributos,
 * além do que a própria função já pede.
 */
export const ENCAIXE_FAMILIA: Readonly<Record<Posicao, Readonly<Record<Posicao, number>>>> = {
  G: { G: 1, L: 0.4, Z: 0.45, M: 0.4, A: 0.4 },
  L: { G: 0.3, L: 1, Z: 0.9, M: 0.9, A: 0.8 },
  Z: { G: 0.3, L: 0.88, Z: 1, M: 0.82, A: 0.72 },
  M: { G: 0.3, L: 0.88, Z: 0.82, M: 1, A: 0.9 },
  A: { G: 0.3, L: 0.78, Z: 0.68, M: 0.88, A: 1 },
};
/** Lateral jogando do lado trocado (ou jogador de outra posição numa lateral trocada). */
export const LADO_TROCADO = 0.95;

const ladoTrocado = (a: Lado, b: Lado | undefined) =>
  (a === "D" && b === "E") || (a === "E" && b === "D");

/** Posição da família dele que o jogador real não costuma fazer (o ponta de centroavante). */
export const FORA_DAS_POSICOES = 0.96;

/**
 * Quanto o jogador perde só por estar fora do lugar dele (o fator que o motor aplica em todos os
 * atributos). Numa das posições em que ele atua é 1; fora da família, vale a tabela; dentro da
 * família, mas numa posição que ele não faz, perde um pouco.
 */
export function familiaridade(
  j: Pick<JogadorParaNota, "posicao" | "lado" | "posicoesCampo">,
  papel: PapelEmCampo,
) {
  const familia = DADOS_FUNCAO[papel.funcao].familia;
  if (j.posicoesCampo?.includes(papel.posicao)) return 1;
  let fator = ENCAIXE_FAMILIA[j.posicao][familia];
  if (j.posicoesCampo && familia === j.posicao) fator *= FORA_DAS_POSICOES;
  const lateral = papel.posicao === "LD" || papel.posicao === "LE";
  if ((lateral || j.posicao === "L") && ladoTrocado(j.lado, LADO_POSICAO[papel.posicao]))
    fator *= LADO_TROCADO;
  return fator;
}

/** Média ponderada dos atributos que a função pede. */
function mediaDaFuncao(j: JogadorParaNota, funcao: Funcao): number {
  let soma = 0;
  let pesos = 0;
  for (const [a, p] of Object.entries(DADOS_FUNCAO[funcao].pesos) as [Atributo, number][]) {
    soma += (j.atributos[a] ?? j.forca * 0.35) * p;
    pesos += p;
  }
  return soma / pesos;
}

const ajustes = new WeakMap<object, number>();

/**
 * Quanto somar à média da função para a melhor função do jogador (nas posições em que ele atua
 * ou, sem elas, na família da posição) dar a força dele.
 * Assim a nota conversa com o número do cadastro: o centroavante 90 tira 90 de centroavante.
 */
function ajuste(j: JogadorParaNota): number {
  const guardado = ajustes.get(j.atributos);
  if (guardado !== undefined) return guardado;
  let melhor = -Infinity;
  const naturais = j.posicoesCampo?.flatMap((p) => FUNCOES_DA_POSICAO[p]);
  for (const f of naturais ?? FUNCOES.filter((f) => DADOS_FUNCAO[f].familia === j.posicao))
    melhor = Math.max(melhor, mediaDaFuncao(j, f));
  const valor = j.forca - melhor;
  ajustes.set(j.atributos, valor);
  return valor;
}

/**
 * Nota do jogador numa posição e função (1 a 100, na escala da força). Um centroavante 90 tira
 * 90 na melhor função dele e bem menos de meia-armador, porque armação e passe pesam ali e
 * porque ele está fora da família.
 */
export function notaNoPapel(j: JogadorParaNota, papel: PapelEmCampo): number {
  const fator = familiaridade(j, papel);
  const goleiro = (DADOS_FUNCAO[papel.funcao].familia === "G") !== (j.posicao === "G");
  const base = goleiro ? j.forca : mediaDaFuncao(j, papel.funcao) + ajuste(j);
  return Math.max(1, Math.min(100, Math.round(base * fator)));
}

/** A função padrão da posição só perde para outra que renda mais do que isso a mais. */
export const VANTAGEM_FUNCAO_PADRAO = 2;

/**
 * A melhor função para o jogador numa posição de campo (a que a CPU escolhe). A padrão da
 * posição (zagueiro, lateral, meio-campista, centroavante...) fica, a menos que outra renda
 * claramente mais: o meia passador vira volante construtor, o atacante rápido joga na velocidade.
 */
export function melhorPapel(j: JogadorParaNota, posicao: PosicaoCampo): PapelEmCampo {
  let melhor: PapelEmCampo = { posicao, funcao: FUNCOES_DA_POSICAO[posicao][0] as Funcao };
  let nota = -1;
  for (const [i, funcao] of FUNCOES_DA_POSICAO[posicao].entries()) {
    const n = notaNoPapel(j, { posicao, funcao }) + (i === 0 ? VANTAGEM_FUNCAO_PADRAO : 0);
    if (n > nota) {
      nota = n;
      melhor = { posicao, funcao };
    }
  }
  return melhor;
}

/** Posições de campo em que o jogador rende perto da força (até 2 abaixo), da melhor à pior. */
export function posicoesNaturais(j: JogadorParaNota): PosicaoCampo[] {
  return POSICOES_CAMPO.map((p) => ({ p, n: notaNoPapel(j, melhorPapel(j, p)) }))
    .filter((x) => x.n >= j.forca - 2)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.p);
}
