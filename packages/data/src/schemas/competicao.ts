import { z } from "zod";
import { CodigoPais, DiaDoAno, Id, NomeTexto, Periodo } from "./comum";
import { Confederacao } from "./mundo";

/**
 * Competições são descritas como dados: quem participa, em que fases e com que regras.
 * Isso permite representar desde pontos corridos até a fase de liga da Champions,
 * e o editor pode criar campeonatos novos sem mudar o código.
 */

export const TIPOS_COMPETICAO = [
  "liga",
  "copa",
  "supercopa",
  "estadual",
  "regional",
  "continental",
  "intercontinental",
  "selecoes",
  "eliminatorias",
] as const;

export const CRITERIOS_DESEMPATE = [
  "pontos",
  "vitorias",
  "saldo",
  "gols-pro",
  "confronto-direto",
  "saldo-confronto-direto",
  "gols-fora",
  "menos-derrotas",
  "cartoes",
  "sorteio",
] as const;
export const CriterioDesempate = z.enum(CRITERIOS_DESEMPATE);

export const Escopo = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("pais"), pais: CodigoPais }),
  z.object({
    tipo: z.literal("estado"),
    pais: CodigoPais,
    estado: z.string().regex(/^[A-Z]{2,3}$/),
  }),
  z.object({ tipo: z.literal("confederacao"), confederacao: Confederacao }),
  z.object({ tipo: z.literal("mundial") }),
]);
export type Escopo = z.infer<typeof Escopo>;

/** Um participante: id de clube ou, nas competições de seleções, o código do país. */
const Participante = z.union([Id, CodigoPais]);

/** De onde vem uma vaga: a colocação ou o título em outra competição. */
export const Vaga = z.object({
  de: Id,
  /**
   * campeao e vice: da última edição da competição de origem; posicoes: colocações na tabela;
   * eliminados: quem caiu numa fase da origem na mesma temporada (a 3ª fase da Libertadores manda os
   * eliminados para a Sul-Americana). campeoes: os campeões das últimas `edicoes` edições (Mundial
   * de Clubes; campeão repetido dá a vaga ao próximo do ranking); ranking: os melhores pelas
   * campanhas nas últimas `edicoes` edições da origem. classificados: quem a origem (eliminatórias)
   * classificou, pelas regras de `classificados` dela, quando ela termina.
   */
  criterio: z.enum([
    "campeao",
    "vice",
    "posicoes",
    "eliminados",
    "campeoes",
    "ranking",
    "classificados",
  ]),
  /** Colocações que dão a vaga, quando o critério é "posicoes" (1 = primeiro). */
  posicoes: z.array(z.int().min(1)).optional(),
  /**
   * Fase da origem, na mesma temporada (ex.: os 3º colocados dos grupos da Libertadores). Sem ela,
   * "posicoes" é a classificação final da temporada anterior.
   */
  fase: Id.optional(),
  /** As posições valem em cada grupo da fase (os 3º de cada um dos 8 grupos). */
  porGrupo: z.boolean().default(false),
  /** Quantos clubes a vaga traz, quando não dá para contar pelas posições (para o calendário). */
  quantidade: z.int().min(1).optional(),
  /** Entra depois dos que vêm da fase anterior, no pote mais baixo (eliminados da Libertadores). */
  depois: z.boolean().default(false),
  /**
   * Caminho em que o clube entra (UEFA: "campeoes" ou "liga"): nas eliminatórias com chaveamento
   * "caminhos", cada caminho só cruza consigo mesmo.
   */
  caminho: z.string().min(1).max(20).optional(),
  /** Só os eliminados deste caminho na origem (os campeões que caem vão para outro lugar). */
  doCaminho: z.string().min(1).max(20).optional(),
  /**
   * Para vaga de campeão (UEFA): se o campeão já tiver vaga, ela vai para o mais forte destes
   * (o campeão ucraniano, quando o campeão da Champions já se classificou pela liga).
   */
  alternativas: z.array(z.object({ de: Id, posicoes: z.array(z.int().min(1)).min(1) })).default([]),
  /** Se o dono da vaga já estiver classificado, ela passa para o próximo da tabela de origem. */
  repassa: z.boolean().default(true),
  /** Quantas edições da origem contam, nos critérios "campeoes" e "ranking" (Mundial: 4). */
  edicoes: z.int().min(1).max(8).optional(),
  /** No critério "ranking", no máximo tantos clubes do mesmo país (sem contar os campeões). */
  maximoPorPais: z.int().min(1).optional(),
  /**
   * Na fase da própria competição: deixa de fora quem já se classificou pelas regras de
   * `classificados` das fases anteriores (os 2º colocados que não foram direto para a Euro).
   */
  foraDosClassificados: z.boolean().optional(),
});
export type Vaga = z.infer<typeof Vaga>;

const BaseFase = z.object({
  id: Id,
  nome: NomeTexto,
  /** Janela da fase no ano (ex.: 1ª fase da Libertadores em fevereiro); sem ela, a fase se espalha. */
  periodo: Periodo.optional(),
  /** Times que entram direto nesta fase (ex.: classificados para a Libertadores na Copa do Brasil). */
  entramAqui: z.array(Vaga).default([]),
  /**
   * Dias exatos das rodadas (MM-DD, em ordem), quando o calendário é fixo: as rodadas da Nations
   * League nas datas FIFA. Valem quando são tantos quantas as rodadas da fase.
   */
  datas: z.array(DiaDoAno).optional(),
  /** No máximo tantos entram na fase, na ordem das vagas (os playoffs da Euro têm 8). */
  limiteDeEntradas: z.int().min(2).optional(),
});

/** Grupos em pontos corridos. Uma liga comum é 1 grupo com 2 turnos. */
export const FaseGrupos = BaseFase.extend({
  tipo: z.literal("grupos"),
  grupos: z.int().min(1),
  turnos: z.int().min(1).max(4),
  /** Quantos de cada grupo avançam para a próxima fase (0 em ligas de fase única). */
  classificamPorGrupo: z.int().min(0).default(0),
  /** Melhores colocados extras entre os grupos (ex.: melhores terceiros). */
  melhores: z.object({ posicao: z.int().min(1), quantidade: z.int().min(1) }).optional(),
  /** Como os times são divididos nos grupos: sorteio, pela ordem da lista de participantes ou por região. */
  divisaoGrupos: z.enum(["sorteio", "ordem-da-lista", "regional", "potes"]).default("sorteio"),
  /** Faixa da tabela que segue para a próxima fase, quando não começa no 1º (ex.: 3º ao 6º no playoff da Série B). */
  faixaClassificada: z.object({ de: z.int().min(1), ate: z.int().min(1) }).optional(),
  /**
   * Grupos de tamanhos diferentes (eliminatórias da UEFA, com grupos de 4 e de 5): os menores jogam
   * só as últimas rodadas, e os `menoresPara` primeiros da lista de entrada vão para eles.
   */
  menoresNoFim: z.boolean().optional(),
  menoresPara: z.int().min(1).optional(),
  /** Times que não podem cair no mesmo grupo (os anfitriões da Euro 2028). */
  separar: z.array(z.string().min(3)).optional(),
});

/** Fase de liga com tabela única e adversários sorteados por potes (formato suíço da UEFA). */
export const FaseDeLiga = BaseFase.extend({
  tipo: z.literal("fase-de-liga"),
  jogosPorTime: z.int().min(2),
  potes: z.int().min(1),
  /** Ligas separadas por caminho (a Champions da Ásia tem uma no Oeste e outra no Leste). */
  grupos: z.int().min(1).default(1),
  /** Quantos avançam direto (em cada liga, quando há mais de uma). */
  classificamDireto: z.int().min(0),
  /** Colocações que vão para o playoff antes do mata-mata (ex.: 9º ao 24º). */
  playoff: z.object({ de: z.int().min(1), ate: z.int().min(1) }).optional(),
});

/** Mata-mata em uma ou mais rodadas eliminatórias. */
export const FaseMataMata = BaseFase.extend({
  tipo: z.literal("mata-mata"),
  /** 1 = jogo único; 2 = ida e volta. */
  jogos: z.union([z.literal(1), z.literal(2)]),
  finalJogoUnico: z.boolean().default(false),
  prorrogacao: z.boolean().default(true),
  /** Prorrogação só na final (CONMEBOL: nas outras eliminatórias o empate vai direto aos pênaltis). */
  prorrogacaoNaFinal: z.boolean().default(false),
  penaltis: z.boolean().default(true),
  golForaDesempata: z.boolean().default(false),
  /**
   * Como os confrontos são definidos. "pais": só entre clubes do mesmo país (1ª fase da
   * Sul-Americana); "potes": a metade de cima sorteada contra a de baixo (oitavas da Libertadores);
   * "caminhos": sorteio dentro de cada caminho (qualificatórias da UEFA); "caminhos-campanha": dentro
   * de cada caminho, pela campanha (1º x 8º do Oeste da Ásia), mantendo as regiões separadas.
   */
  chaveamento: z
    .enum(["sorteio", "campanha", "chave-fixa", "pais", "potes", "caminhos", "caminhos-campanha"])
    .default("sorteio"),
  /**
   * Em jogo único, quem manda: sorteado, melhor campanha, campo neutro ou o clube da divisão mais
   * baixa (Copa del Rey, DFB-Pokal, Coupe de France), conforme `menorDivisao`.
   */
  mando: z.enum(["sorteio", "melhor-campanha", "neutro", "menor-divisao"]).default("sorteio"),
  /**
   * Regra do mando "menor-divisao": o de baixo manda quando está pelo menos `diferenca` divisões
   * abaixo e a partir da divisão `aPartirDe` (DFB-Pokal: só os da 3. Liga para baixo; Coupe de
   * France: dois níveis de diferença). Fora disso, sorteio. Quem não está em liga nenhuma do país
   * conta como a divisão mais baixa.
   */
  menorDivisao: z
    .object({ aPartirDe: z.int().min(1).default(1), diferenca: z.int().min(1).default(1) })
    .optional(),
  /**
   * Lugares da rodada no real (Copa del Rey: 112 na 1ª eliminatória). Os que faltam no banco (os
   * clubes amadores) viram folga para os melhores pela ordem de entrada, e a rodada classifica
   * metade dos lugares; os outros jogam entre si. Só na primeira rodada da fase.
   */
  lugares: z.int().min(2).optional(),
  /**
   * Quantas eliminatórias a última fase tem (sem isso, até sobrar um). Playoff da Série B: 1, e os
   * dois vencedores sobem.
   */
  eliminatorias: z.int().min(1).optional(),
  /** Todos jogam a eliminatória, sem folgas para os melhores (fases da Copa do Brasil). */
  todosJogam: z.boolean().optional(),
  /** No sorteio (potes ou livre), evita quem foi do mesmo grupo na fase anterior (Nations League). */
  evitarMesmoGrupo: z.boolean().optional(),
});

export const Fase = z.discriminatedUnion("tipo", [FaseGrupos, FaseDeLiga, FaseMataMata]);
export type Fase = z.infer<typeof Fase>;

export const MovimentoTabela = z.object({
  tipo: z.enum(["acesso", "rebaixamento", "playoff-acesso", "playoff-rebaixamento"]),
  /** Competição de destino (a divisão de cima ou de baixo). */
  para: Id,
  posicoes: z.array(z.int().min(1)).min(1),
  /** As posições valem dentro de cada grupo da primeira fase (ex.: os 5 últimos de cada grupo caem). */
  porGrupo: z.boolean().default(false),
  /**
   * Barragem (playoff-rebaixamento): contra quem vem da divisão de baixo pelo playoff dela (Ligue 1,
   * K League; padrão) ou entre as próprias posições, e quem perde cai (playout da Serie B).
   */
  barragem: z.enum(["divisao-de-baixo", "entre-si"]).default("divisao-de-baixo"),
  /** Só vale nas temporadas que terminam entre estes anos (mudança de regulamento, como a Série C de 2028). */
  desde: z.int().min(1900).optional(),
  ate: z.int().min(1900).optional(),
});

export const Competicao = z
  .object({
    id: Id,
    nome: NomeTexto,
    nomeCurto: z.string().trim().min(1).max(24).optional(),
    tipo: z.enum(TIPOS_COMPETICAO),
    categoria: z.enum(["clubes", "selecoes"]),
    escopo: Escopo,
    /** Divisão da liga (1 = principal). */
    divisao: z.int().min(1).max(10).optional(),
    /** De quantos em quantos anos acontece, e um ano de referência (ex.: Copa do Mundo a cada 4 anos desde 2026). */
    periodicidade: z
      .object({ aCadaAnos: z.int().min(1).max(4), anoBase: z.int().min(1900) })
      .default({ aCadaAnos: 1, anoBase: 2026 }),
    /** Quando a competição é disputada dentro do ano. */
    calendario: Periodo,
    /**
     * Quantos anos uma edição dura (eliminatórias da Euro: de março de 2027 a março de 2028). O fim
     * do calendário cai no ano da edição; o começo, tantos anos antes.
     */
    anos: z.int().min(1).max(4).default(1),
    /**
     * Quem a competição classifica para outra (eliminatórias), em ordem: as posições numa fase (em
     * cada grupo, ou só os `melhores` entre os grupos), os vencedores de um playoff e as vagas
     * reservadas (os anfitriões que ainda não se classificaram; sem eles, o próximo da regra
     * `senao`).
     */
    classificados: z
      .array(
        z.object({
          fase: Id,
          posicoes: z.array(z.int().min(1)).optional(),
          porGrupo: z.boolean().default(false),
          melhores: z.int().min(1).optional(),
          vencedores: z.boolean().optional(),
          reservados: z.array(z.string().min(3)).optional(),
          quantidade: z.int().min(1).optional(),
        }),
      )
      .default([]),
    /** Dias da semana dos jogos (0 = domingo), quando fogem do padrão do tipo (Recopa às quintas). */
    diasDeJogo: z.array(z.int().min(0).max(6)).min(1).optional(),
    participantes: z.object({
      /** Clubes (ou países, em competições de seleções) fixos. */
      fixos: z.array(z.union([Id, CodigoPais])).default([]),
      vagas: z.array(Vaga).default([]),
      /**
       * Competições da mesma temporada cujos participantes não entram aqui (a Sul-Americana exclui
       * os da Libertadores): a vaga passa para o próximo da tabela de origem.
       */
      exclui: z.array(Id).default([]),
      /** Quantidade esperada de participantes, para validar. */
      quantidade: z.int().min(2),
      /**
       * Liga aberta (Série D): na virada, ficam os que chegaram à fase `ficam` e os que vieram por
       * acesso ou rebaixamento; os outros saem, e as vagas (dos estaduais) completam até a
       * quantidade, sem repetir clubes das outras ligas do país. A ordem segue a geografia da lista
       * inicial (os estados na ordem em que aparecem nela), para os grupos regionais.
       */
      renovacao: z.object({ ficam: Id, vagas: z.array(Vaga).min(1) }).optional(),
    }),
    fases: z.array(Fase).min(1),
    pontos: z
      .object({ vitoria: z.int().min(0), empate: z.int().min(0) })
      .default({ vitoria: 3, empate: 1 }),
    desempate: z
      .array(CriterioDesempate)
      .min(1)
      .default(["pontos", "vitorias", "saldo", "gols-pro"]),
    movimentos: z.array(MovimentoTabela).default([]),
    /** Último campeão antes do banco (para a supercopa e as vagas de campeão da primeira temporada). */
    campeaoAnterior: z
      .object({
        temporada: z.string().min(4).max(9),
        campeao: Participante,
        vice: Participante.optional(),
      })
      .optional(),
    /** Campeões mais antigos que o anterior (para as vagas que olham várias edições). */
    campeoesAnteriores: z
      .array(
        z.object({
          temporada: z.string().min(4).max(9),
          campeao: Participante,
          vice: Participante.optional(),
        }),
      )
      .default([]),
    /** Vagas que esta competição distribui em outras. */
    classificaPara: z
      .array(z.object({ competicao: Id, posicoes: z.array(z.int().min(1)) }))
      .default([]),
  })
  .superRefine((c, ctx) => {
    const ids = c.fases.map((f) => f.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["fases"], message: "fases com id repetido" });
    }
    if (c.tipo === "liga" && c.divisao === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["divisao"],
        message: "liga precisa informar a divisão",
      });
    }
  });
export type Competicao = z.infer<typeof Competicao>;
export type CompeticaoEntrada = z.input<typeof Competicao>;
