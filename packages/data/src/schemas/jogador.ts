import { z } from "zod";
import {
  CARACTERISTICAS_GOLEIRO,
  CARACTERISTICAS_LINHA,
  FORCA_MAX,
  FORCA_MIN,
  LADOS,
  POSICOES,
} from "../football";
import { CodigoPais, Data, Id, NomeTexto } from "./comum";

const Forca = z.int().min(FORCA_MIN).max(FORCA_MAX);

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
    forca: Forca,
    /** Força máxima que o jogador pode atingir. */
    potencial: Forca,
    /** As características principais (1 ou 2), como no Brasfoot. */
    caracteristicas: z
      .array(z.enum([...CARACTERISTICAS_GOLEIRO, ...CARACTERISTICAS_LINHA]))
      .min(1)
      .max(2),
    /** Craque. Estrelas ficam fora dos leilões automáticos e podem renascer como lenda. */
    estrela: z.boolean().default(false),
    /** Clube atual; ausente = jogador livre. */
    clube: Id.optional(),
    contrato: Contrato.optional(),
    numero: z.int().min(1).max(99).optional(),
    /** Maior força já atingida; guia o potencial quando a lenda renasce. */
    forcaAuge: Forca.optional(),
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
    for (const c of j.caracteristicas) {
      if (!validas.includes(c)) {
        ctx.addIssue({
          code: "custom",
          path: ["caracteristicas"],
          message: `"${c}" não é característica de ${goleiro ? "goleiro" : "jogador de linha"}`,
        });
      }
    }
    if (new Set(j.caracteristicas).size !== j.caracteristicas.length) {
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
  });
export type Jogador = z.infer<typeof Jogador>;
export type JogadorEntrada = z.input<typeof Jogador>;
