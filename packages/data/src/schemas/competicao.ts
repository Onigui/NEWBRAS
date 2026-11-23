import { z } from "zod";
import { CodigoPais, Id, NomeTexto, Periodo } from "./comum";
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

/** De onde vem uma vaga: a colocação ou o título em outra competição. */
export const Vaga = z.object({
  de: Id,
  criterio: z.enum(["campeao", "vice", "posicoes"]),
  /** Colocações que dão a vaga, quando o critério é "posicoes" (1 = primeiro). */
  posicoes: z.array(z.int().min(1)).optional(),
  /** Se o dono da vaga já estiver classificado, ela passa para o próximo da tabela de origem. */
  repassa: z.boolean().default(true),
});
export type Vaga = z.infer<typeof Vaga>;

const BaseFase = z.object({
  id: Id,
  nome: NomeTexto,
  /** Times que entram direto nesta fase (ex.: classificados para a Libertadores na Copa do Brasil). */
  entramAqui: z.array(Vaga).default([]),
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
});

/** Fase de liga com tabela única e adversários sorteados por potes (formato suíço da UEFA). */
export const FaseDeLiga = BaseFase.extend({
  tipo: z.literal("fase-de-liga"),
  jogosPorTime: z.int().min(2),
  potes: z.int().min(1),
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
  penaltis: z.boolean().default(true),
  golForaDesempata: z.boolean().default(false),
  /** Como os confrontos são definidos. */
  chaveamento: z.enum(["sorteio", "campanha", "chave-fixa"]).default("sorteio"),
  /** Em jogo único, quem manda: sorteado, melhor campanha ou campo neutro. */
  mando: z.enum(["sorteio", "melhor-campanha", "neutro"]).default("sorteio"),
});

export const Fase = z.discriminatedUnion("tipo", [FaseGrupos, FaseDeLiga, FaseMataMata]);
export type Fase = z.infer<typeof Fase>;

export const MovimentoTabela = z.object({
  tipo: z.enum(["acesso", "rebaixamento", "playoff-acesso", "playoff-rebaixamento"]),
  /** Competição de destino (a divisão de cima ou de baixo). */
  para: Id,
  posicoes: z.array(z.int().min(1)).min(1),
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
    participantes: z.object({
      /** Clubes (ou países, em competições de seleções) fixos. */
      fixos: z.array(z.union([Id, CodigoPais])).default([]),
      vagas: z.array(Vaga).default([]),
      /** Quantidade esperada de participantes, para validar. */
      quantidade: z.int().min(2),
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
