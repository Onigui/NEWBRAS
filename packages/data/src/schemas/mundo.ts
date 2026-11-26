import { z } from "zod";
import { CodigoPais, Cor, NomeTexto, Periodo } from "./comum";

export const CONFEDERACOES = ["CONMEBOL", "UEFA", "CONCACAF", "AFC", "CAF", "OFC"] as const;
export const Confederacao = z.enum(CONFEDERACOES);
export type Confederacao = z.infer<typeof Confederacao>;

/**
 * Profundidade do país no banco:
 * 1 = várias divisões e todas as copas; 2 = 1ª e 2ª divisão e copa nacional;
 * 3 = só a 1ª divisão; 0 = só a seleção.
 */
export const NivelPais = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

export const Pais = z.object({
  codigo: CodigoPais,
  nome: NomeTexto,
  confederacao: Confederacao,
  nivel: NivelPais,
  /** Grupo de nomes usado pelo gerador de jogadores (ex.: "pt-br", "es", "en"). */
  grupoNomes: z.string().min(2),
  /** Temporada do futebol de clubes no país. */
  temporada: Periodo,
  /** Janelas de transferência reais do país. */
  janelas: z.array(Periodo).min(1),
  /** Cores da seleção. */
  cores: z.object({ primaria: Cor, secundaria: Cor }),
});
export type Pais = z.infer<typeof Pais>;

/** Estado (ou província) com campeonato próprio, como os estaduais no Brasil. */
export const Estado = z.object({
  sigla: z.string().regex(/^[A-Z]{2,3}$/, "sigla de 2 ou 3 letras maiúsculas"),
  nome: NomeTexto,
  pais: CodigoPais,
});
export type Estado = z.infer<typeof Estado>;

/** Datas FIFA: períodos em que as ligas param para jogos de seleções. */
export const DataFifa = z.object({
  nome: NomeTexto,
  periodo: Periodo,
  /** Só nesses anos (a pausa da Copa do Mundo de 2026); sem ela, todo ano. */
  anos: z.array(z.int().min(1900)).optional(),
});
export type DataFifa = z.infer<typeof DataFifa>;
