import { z } from "zod";
import { Clube } from "./clube";
import { Data, Id, NomeTexto } from "./comum";
import { Competicao } from "./competicao";
import { Jogador } from "./jogador";
import { DataFifa, Estado, Pais } from "./mundo";
import { Selecao, Tecnico } from "./pessoas";

export const FORMATO_BANCO = 1;

export const MetaBanco = z.object({
  /** Identificador no formato autor/nome (ex.: "newbras/mundo-2026"). */
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "use o formato autor/nome"),
  nome: NomeTexto,
  versao: z.string().regex(/^\d+\.\d+\.\d+$/, "versão no formato 1.0.0"),
  descricao: z.string().max(500).optional(),
  atualizadoEm: Data,
});

/** Banco de dados completo: tudo que o jogo precisa para começar uma carreira. */
export const Banco = z.object({
  formato: z.literal(FORMATO_BANCO),
  meta: MetaBanco,
  paises: z.array(Pais).default([]),
  estados: z.array(Estado).default([]),
  datasFifa: z.array(DataFifa).default([]),
  clubes: z.array(Clube).default([]),
  jogadores: z.array(Jogador).default([]),
  competicoes: z.array(Competicao).default([]),
  selecoes: z.array(Selecao).default([]),
  tecnicos: z.array(Tecnico).default([]),
});
export type Banco = z.infer<typeof Banco>;
export type BancoEntrada = z.input<typeof Banco>;

/**
 * Patch: muda um banco sem copiá-lo inteiro. Itens com o mesmo id substituem os do banco;
 * itens novos são acrescentados; `remover` tira itens pelo id.
 */
export const Patch = z.object({
  formato: z.literal(FORMATO_BANCO),
  meta: MetaBanco.extend({ estende: z.string() }),
  remover: z
    .object({
      clubes: z.array(Id).default([]),
      jogadores: z.array(Id).default([]),
      competicoes: z.array(Id).default([]),
      tecnicos: z.array(Id).default([]),
    })
    .default({ clubes: [], jogadores: [], competicoes: [], tecnicos: [] }),
  paises: z.array(Pais).default([]),
  estados: z.array(Estado).default([]),
  datasFifa: z.array(DataFifa).default([]),
  clubes: z.array(Clube).default([]),
  jogadores: z.array(Jogador).default([]),
  competicoes: z.array(Competicao).default([]),
  selecoes: z.array(Selecao).default([]),
  tecnicos: z.array(Tecnico).default([]),
});
export type Patch = z.infer<typeof Patch>;
export type PatchEntrada = z.input<typeof Patch>;
