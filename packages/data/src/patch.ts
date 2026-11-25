import type { Banco, Patch } from "./schemas/banco";

function mesclar<T>(
  base: readonly T[],
  novos: readonly T[],
  chave: (item: T) => string,
  remover: ReadonlySet<string>,
): T[] {
  const porChave = new Map<string, T>();
  for (const item of base) if (!remover.has(chave(item))) porChave.set(chave(item), item);
  for (const item of novos) porChave.set(chave(item), item);
  return [...porChave.values()];
}

/**
 * Aplica um patch a um banco e devolve um banco novo (o original não muda).
 * Itens com o mesmo id são substituídos; os novos são acrescentados; `remover` tira pelo id.
 * Jogadores de um clube removido ficam livres, e ele sai das competições.
 */
export function aplicarPatch(banco: Banco, patch: Patch): Banco {
  const r = patch.remover;
  const clubesRemovidos = new Set(r.clubes);
  const vazio = new Set<string>();

  const jogadores = mesclar(
    banco.jogadores,
    patch.jogadores,
    (j) => j.id,
    new Set(r.jogadores),
  ).map((j) => {
    if (!j.clube || !clubesRemovidos.has(j.clube)) return j;
    const { clube: _clube, contrato: _contrato, ...livre } = j;
    return livre;
  });

  return {
    ...banco,
    paises: mesclar(banco.paises, patch.paises, (p) => p.codigo, vazio),
    estados: mesclar(banco.estados, patch.estados, (e) => `${e.pais}/${e.sigla}`, vazio),
    datasFifa: mesclar(banco.datasFifa, patch.datasFifa, (d) => d.nome, vazio),
    clubes: mesclar(banco.clubes, patch.clubes, (c) => c.id, clubesRemovidos).map((c) => ({
      ...c,
      rivais: c.rivais.filter((id) => !clubesRemovidos.has(id)),
    })),
    jogadores,
    // Clube deletado sai das competições em que jogava (a liga fica com um time a menos).
    competicoes: mesclar(
      banco.competicoes,
      patch.competicoes,
      (c) => c.id,
      new Set(r.competicoes),
    ).map((c) =>
      clubesRemovidos.size && c.participantes.fixos.some((f) => clubesRemovidos.has(f))
        ? {
            ...c,
            participantes: {
              ...c.participantes,
              fixos: c.participantes.fixos.filter((f) => !clubesRemovidos.has(f)),
            },
          }
        : c,
    ),
    selecoes: mesclar(banco.selecoes, patch.selecoes, (s) => s.pais, vazio),
    tecnicos: mesclar(banco.tecnicos, patch.tecnicos, (t) => t.id, new Set(r.tecnicos)).map((t) => {
      if (!t.clube || !clubesRemovidos.has(t.clube)) return t;
      const { clube: _clube, ...semClube } = t;
      return semClube;
    }),
  };
}
