import { z } from "zod";
import {
  CARACTERISTICAS_GOLEIRO,
  CARACTERISTICAS_LINHA,
  FORCA_MAX,
  FORCA_MIN,
  LADOS,
  POSICOES,
} from "../football";
import {
  atributosDaPosicao,
  caracteristicasDosAtributos,
  forcaDosAtributos,
  gerarAtributos,
  type Atributos,
} from "../atributos";
import { POSICOES_CAMPO } from "../funcoes";
import { CodigoPais, Data, Id, NomeTexto } from "./comum";

const Forca = z.int().min(FORCA_MIN).max(FORCA_MAX);

/** Campos que podem vir marcados para conferência num jogador real. */
export const CAMPOS_A_CONFERIR_JOGADOR = [
  "nascimento",
  "posicao",
  "numero",
  "nacionalidade",
] as const;

export const Contrato = z.object({
  /** Último dia do contrato. */
  fim: Data,
  /** Salário mensal na moeda do jogo. */
  salario: z.int().min(0),
  /** Multa rescisória: quem paga leva o jogador, mesmo contra a vontade do clube. */
  multaRescisoria: z.int().min(0).optional(),
});
export type Contrato = z.infer<typeof Contrato>;

export const Jogador = z
  .object({
    id: Id,
    /** Nome de camisa, como aparece no jogo. */
    nome: NomeTexto,
    nomeCompleto: NomeTexto.optional(),
    nascimento: Data,
    nacionalidade: CodigoPais,
    /** Segunda nacionalidade, que libera a convocação pelas duas seleções até a estreia por uma delas. */
    segundaNacionalidade: CodigoPais.optional(),
    posicao: z.enum(POSICOES),
    lado: z.enum(LADOS),
    /**
     * Posições de campo em que o jogador atua (ponta-direita, centroavante, volante...), da
     * principal para as outras. Vêm dos jogadores reais; sem elas, vale a família da posição.
     */
    posicoesCampo: z.array(z.enum(POSICOES_CAMPO)).min(1).max(5).optional(),
    forca: Forca,
    /** Força máxima que o jogador pode atingir. */
    potencial: Forca,
    /**
     * As características principais (1 ou 2), como no Brasfoot. Saem sempre dos atributos;
     * na entrada só servem para guiar a geração quando os atributos não vêm.
     */
    caracteristicas: z
      .array(z.enum([...CARACTERISTICAS_GOLEIRO, ...CARACTERISTICAS_LINHA]))
      .min(1)
      .max(2)
      .optional(),
    /**
     * Atributos de 1 a 100 (os de goleiro ou os de linha, conforme a posição). Quando vêm,
     * a força passa a ser a média ponderada deles. Sem eles, o jogo gera um perfil coerente
     * com a força e as características, sempre o mesmo para o mesmo id.
     */
    atributos: z
      .partialRecord(z.enum([...CARACTERISTICAS_GOLEIRO, ...CARACTERISTICAS_LINHA]), Forca)
      .optional(),
    /** Craque. Estrelas ficam fora dos leilões automáticos e podem renascer como lenda. */
    estrela: z.boolean().default(false),
    /** Está na categoria de base do clube (ainda não promovido ao elenco profissional). */
    base: z.boolean().default(false),
    /** Clube atual; ausente = jogador livre. */
    clube: Id.optional(),
    contrato: Contrato.optional(),
    numero: z.int().min(1).max(99).optional(),
    /** Maior força já atingida; guia o potencial quando a lenda renasce. */
    forcaAuge: Forca.optional(),
    /** Campos de jogador real que a fonte não trouxe com precisão (o editor destaca). */
    aConferir: z.array(z.enum(CAMPOS_A_CONFERIR_JOGADOR)).default([]),
  })
  .superRefine((j, ctx) => {
    if (j.potencial < j.forca) {
      ctx.addIssue({
        code: "custom",
        path: ["potencial"],
        message: "o potencial não pode ser menor que a força atual",
      });
    }
    const goleiro = j.posicao === "G";
    const validas: readonly string[] = goleiro ? CARACTERISTICAS_GOLEIRO : CARACTERISTICAS_LINHA;
    if (j.atributos) {
      const faltam = atributosDaPosicao(j.posicao).filter((a) => j.atributos?.[a] === undefined);
      if (faltam.length)
        ctx.addIssue({
          code: "custom",
          path: ["atributos"],
          message: `faltam atributos: ${faltam.join(", ")}`,
        });
    }
    for (const c of j.caracteristicas ?? []) {
      if (!validas.includes(c)) {
        ctx.addIssue({
          code: "custom",
          path: ["caracteristicas"],
          message: `"${c}" não é característica de ${goleiro ? "goleiro" : "jogador de linha"}`,
        });
      }
    }
    if (j.caracteristicas && new Set(j.caracteristicas).size !== j.caracteristicas.length) {
      ctx.addIssue({
        code: "custom",
        path: ["caracteristicas"],
        message: "característica repetida",
      });
    }
    if (j.contrato && !j.clube) {
      ctx.addIssue({
        code: "custom",
        path: ["contrato"],
        message: "jogador livre não tem contrato",
      });
    }
  })
  .transform((j) => {
    // Os atributos mandam: a força e as características saem deles.
    const atributos: Atributos = {};
    const dados =
      j.atributos ??
      gerarAtributos({
        semente: j.id,
        posicao: j.posicao,
        forca: j.forca,
        ...(j.caracteristicas ? { caracteristicas: j.caracteristicas } : {}),
        ...(j.forcaAuge !== undefined ? { forcaAuge: j.forcaAuge } : {}),
      });
    for (const a of atributosDaPosicao(j.posicao)) {
      const v = dados[a];
      if (v !== undefined) atributos[a] = v;
    }
    const forca = forcaDosAtributos(j.posicao, atributos);
    return {
      ...j,
      forca,
      potencial: Math.max(j.potencial, forca),
      caracteristicas: caracteristicasDosAtributos(j.posicao, atributos),
      atributos,
    };
  });
export type Jogador = z.infer<typeof Jogador>;
export type JogadorEntrada = z.input<typeof Jogador>;
