/** Times de teste para o motor (só usado nos testes). */
import { atributosDaPosicao, gerarAtributos, type Lado, type Posicao } from "@newbras/data";
import { escalacaoAutomatica } from "./escalacao";
import type { Formacao } from "./formacoes";
import type { JogadorPartida, Tatica, TimePartida } from "./tipos";

const ELENCO: ReadonlyArray<[Posicao, Lado]> = [
  ["G", "C"],
  ["G", "C"],
  ["L", "D"],
  ["L", "E"],
  ["L", "D"],
  ["Z", "C"],
  ["Z", "C"],
  ["Z", "C"],
  ["Z", "C"],
  ["M", "C"],
  ["M", "C"],
  ["M", "D"],
  ["M", "E"],
  ["M", "C"],
  ["M", "C"],
  ["A", "C"],
  ["A", "C"],
  ["A", "D"],
  ["A", "E"],
];

export function timeDeTeste(
  id: string,
  forca: number,
  opcoes: {
    formacao?: Formacao;
    tatica?: Tatica;
    cpu?: boolean;
    ajusteAtributos?: (p: Posicao) => Partial<Record<string, number>>;
  } = {},
): TimePartida {
  const jogadores: JogadorPartida[] = ELENCO.map(([posicao, lado], i) => {
    const atributos = gerarAtributos({ semente: `${id}-${i}`, posicao, forca });
    const extra = opcoes.ajusteAtributos?.(posicao) ?? {};
    for (const a of atributosDaPosicao(posicao))
      if (extra[a] !== undefined) atributos[a] = extra[a];
    return { id: `${id}-${i}`, nome: `${id} ${i}`, posicao, lado, forca, atributos };
  });
  const formacao = opcoes.formacao ?? "4-4-2";
  return {
    id,
    nome: id,
    jogadores,
    escalacao: escalacaoAutomatica(jogadores, formacao),
    ...(opcoes.tatica ? { tatica: opcoes.tatica } : {}),
    cpu: opcoes.cpu ?? true,
  };
}
