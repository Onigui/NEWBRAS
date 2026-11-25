/**
 * Edições do Editor de Equipes. Toda mudança vira um patch sobre o banco oficial:
 * o banco não muda, o patch guarda só o que o usuário alterou e pode ser exportado e compartilhado.
 */
import type { Banco, Patch } from "./schemas/banco";
import type { Clube } from "./schemas/clube";
import type { Jogador } from "./schemas/jogador";

export const ID_PATCH_USUARIO = "usuario/minhas-edicoes";

/** Patch vazio que estende o banco informado. */
export function patchVazio(base: Pick<Banco, "meta">, hoje: string): Patch {
  return {
    formato: 1,
    meta: {
      id: ID_PATCH_USUARIO,
      nome: "Minhas edições",
      versao: "1.0.0",
      atualizadoEm: hoje,
      estende: base.meta.id,
    },
    remover: { clubes: [], jogadores: [], competicoes: [], tecnicos: [] },
    paises: [],
    estados: [],
    datasFifa: [],
    clubes: [],
    jogadores: [],
    competicoes: [],
    selecoes: [],
    tecnicos: [],
  };
}

function trocar<T extends { id: string }>(lista: readonly T[], item: T): T[] {
  const i = lista.findIndex((x) => x.id === item.id);
  if (i < 0) return [...lista, item];
  const nova = [...lista];
  nova[i] = item;
  return nova;
}

function semId(lista: readonly string[], id: string): string[] {
  return lista.filter((x) => x !== id);
}

/** Grava um clube novo ou editado. */
export function salvarClube(patch: Patch, clube: Clube): Patch {
  return {
    ...patch,
    clubes: trocar(patch.clubes, clube),
    remover: { ...patch.remover, clubes: semId(patch.remover.clubes, clube.id) },
  };
}

/** Grava um jogador novo ou editado. */
export function salvarJogador(patch: Patch, jogador: Jogador): Patch {
  return {
    ...patch,
    jogadores: trocar(patch.jogadores, jogador),
    remover: { ...patch.remover, jogadores: semId(patch.remover.jogadores, jogador.id) },
  };
}

/**
 * Deleta um clube. Se ele vem do banco oficial, o patch passa a removê-lo;
 * se foi criado no patch, some do patch. Os jogadores dele ficam livres (ver aplicarPatch).
 */
export function removerClube(patch: Patch, id: string, existeNaBase: boolean): Patch {
  const remover = existeNaBase
    ? [...semId(patch.remover.clubes, id), id]
    : semId(patch.remover.clubes, id);
  return {
    ...patch,
    clubes: patch.clubes
      .filter((c) => c.id !== id)
      .map((c) => (c.rivais.includes(id) ? { ...c, rivais: semId(c.rivais, id) } : c)),
    jogadores: patch.jogadores.map((j) => {
      if (j.clube !== id) return j;
      const { clube: _clube, contrato: _contrato, ...livre } = j;
      return livre;
    }),
    remover: { ...patch.remover, clubes: remover },
  };
}

/** Deleta um jogador. */
export function removerJogador(patch: Patch, id: string, existeNaBase: boolean): Patch {
  const remover = existeNaBase
    ? [...semId(patch.remover.jogadores, id), id]
    : semId(patch.remover.jogadores, id);
  return {
    ...patch,
    jogadores: patch.jogadores.filter((j) => j.id !== id),
    remover: { ...patch.remover, jogadores: remover },
  };
}

/**
 * Transfere o jogador para outro clube, ou o deixa livre (destino ausente).
 * O número de camisa sai se já estiver ocupado no destino; jogador livre fica sem contrato.
 */
export function transferirJogador(
  patch: Patch,
  jogador: Jogador,
  destino: string | undefined,
  numerosOcupados: ReadonlySet<number> = new Set(),
): Patch {
  const { clube: _clube, contrato, numero, ...resto } = jogador;
  const movido: Jogador = {
    ...resto,
    ...(destino ? { clube: destino } : {}),
    ...(destino && contrato ? { contrato } : {}),
    ...(destino && numero !== undefined && !numerosOcupados.has(numero) ? { numero } : {}),
  };
  return salvarJogador(patch, movido);
}

/** Junta clubes e jogadores vindos de planilha: mesmo id substitui, id novo acrescenta. */
export function importarNoPatch(
  patch: Patch,
  itens: { clubes?: readonly Clube[]; jogadores?: readonly Jogador[] },
): Patch {
  let p = patch;
  for (const c of itens.clubes ?? []) p = salvarClube(p, c);
  for (const j of itens.jogadores ?? []) p = salvarJogador(p, j);
  return p;
}

/** Aplica um patch de terceiros por cima das edições atuais (o que vem depois vale). */
export function juntarPatches(atual: Patch, novo: Patch): Patch {
  let p = importarNoPatch(atual, { clubes: novo.clubes, jogadores: novo.jogadores });
  for (const id of novo.remover.clubes) p = removerClube(p, id, true);
  for (const id of novo.remover.jogadores) p = removerJogador(p, id, true);
  return p;
}

/** Quantas mudanças o patch guarda. */
export function totalDeEdicoes(patch: Patch): number {
  return (
    patch.clubes.length +
    patch.jogadores.length +
    patch.remover.clubes.length +
    patch.remover.jogadores.length
  );
}

/** Texto em id: "São Paulo FC" → "sao-paulo-fc". */
export function slugId(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "novo"
  );
}

/** Id livre a partir de um prefixo e de um nome: "bra" + "Novo Clube" → "bra-novo-clube" (ou -2, -3...). */
export function novoId(prefixo: string, nome: string, existe: (id: string) => boolean): string {
  const base = `${slugId(prefixo)}-${slugId(nome)}`;
  if (!existe(base)) return base;
  for (let k = 2; ; k++) if (!existe(`${base}-${k}`)) return `${base}-${k}`;
}

/** Grava uma competição editada no patch. */
function salvarCompeticao(patch: Patch, competicao: Patch["competicoes"][number]): Patch {
  return { ...patch, competicoes: trocar(patch.competicoes, competicao) };
}

/**
 * Muda o clube de liga: sai das ligas em que está na lista fixa (entre as informadas) e entra na nova.
 * `ligas` são as competições do banco atual (já com o patch aplicado) onde o clube pode jogar.
 */
export function moverDeLiga(
  patch: Patch,
  ligas: readonly Patch["competicoes"][number][],
  clubeId: string,
  novaLiga: string | undefined,
): Patch {
  let p = patch;
  for (const liga of ligas) {
    const esta = liga.participantes.fixos.includes(clubeId);
    const deveEstar = liga.id === novaLiga;
    if (esta === deveEstar) continue;
    const fixos = deveEstar
      ? [...liga.participantes.fixos, clubeId]
      : liga.participantes.fixos.filter((f) => f !== clubeId);
    p = salvarCompeticao(p, { ...liga, participantes: { ...liga.participantes, fixos } });
  }
  return p;
}
