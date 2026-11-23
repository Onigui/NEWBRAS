import { z } from "zod";
import { CodigoPais, Data, Id, NomeTexto } from "./comum";

export const Selecao = z.object({
  pais: CodigoPais,
  /** Reputação de 1 a 5; define a força de referência e o nível dos convites a técnicos. */
  reputacao: z.int().min(1).max(5),
  /** Posição inicial no ranking mundial. */
  ranking: z.int().min(1).max(250).optional(),
  tecnico: Id.optional(),
});
export type Selecao = z.infer<typeof Selecao>;

export const Tecnico = z
  .object({
    id: Id,
    nome: NomeTexto,
    nacionalidade: CodigoPais,
    nascimento: Data.optional(),
    /** Reputação de 0 a 5: Municipal, Estadual, Regional, Nacional, Continental, Mundial. */
    reputacao: z.int().min(0).max(5),
    clube: Id.optional(),
    /** Seleção que comanda ao mesmo tempo, se houver. */
    selecao: CodigoPais.optional(),
    humano: z.boolean().default(false),
  })
  .refine((t) => t.humano || t.clube !== undefined || t.selecao !== undefined, {
    message: "técnico da CPU precisa de um clube ou de uma seleção",
  });
export type Tecnico = z.infer<typeof Tecnico>;
