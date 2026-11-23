import { z } from "zod";
import { CodigoPais, Cor, Id, NomeTexto } from "./comum";

export const CAMPOS_A_CONFERIR = ["nome", "cidade", "estadio", "capacidade", "cores"] as const;

export const Clube = z.object({
  id: Id,
  nome: NomeTexto,
  /** Nome curto mostrado em tabelas e placares (ex.: "Flamengo"). */
  nomeCurto: z.string().trim().min(1).max(20),
  /** Abreviação de 3 letras (ex.: "FLA"). */
  abreviacao: z.string().regex(/^[A-Z0-9]{3}$/, "3 letras ou números maiúsculos"),
  pais: CodigoPais,
  estado: z
    .string()
    .regex(/^[A-Z]{2,3}$/)
    .optional(),
  cidade: NomeTexto,
  estadio: z.object({
    nome: NomeTexto,
    capacidade: z.int().min(500).max(200_000),
  }),
  cores: z.object({
    primaria: Cor,
    secundaria: Cor,
    terciaria: Cor.optional(),
  }),
  /** Reputação de 1 (municipal) a 5 (mundial), como no Brasfoot. */
  reputacao: z.int().min(1).max(5),
  /** Nível técnico de referência (1 a 100), usado para gerar jogadores. */
  nivel: z.int().min(1).max(100),
  /** Clássicos: ids dos rivais. */
  rivais: z.array(Id).default([]),
  /** Equipe B ou sub-23 de outro clube. Não pode jogar a mesma divisão do clube principal. */
  filialDe: Id.optional(),
  tecnico: NomeTexto.optional(),
  fundacao: z.int().min(1850).max(2100).optional(),
  /** Campos ainda não confirmados em fonte; o editor destaca para correção. */
  aConferir: z.array(z.enum(CAMPOS_A_CONFERIR)).default([]),
});
export type Clube = z.infer<typeof Clube>;
export type ClubeEntrada = z.input<typeof Clube>;
