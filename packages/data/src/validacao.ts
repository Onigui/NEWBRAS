import type { z } from "zod";
import { Banco, type Banco as BancoT, Patch, type Patch as PatchT } from "./schemas/banco";
import type { Jogador } from "./schemas/jogador";
import { ELENCO_MAXIMO } from "./football";

export interface Problema {
  nivel: "erro" | "aviso";
  /** Onde está o problema, legível (ex.: "clubes > bra-santos > estado"). */
  onde: string;
  mensagem: string;
}

export type Resultado<T> =
  { ok: true; valor: T; problemas: Problema[] } | { ok: false; problemas: Problema[] };

function caminho(path: ReadonlyArray<PropertyKey>, raiz: unknown): string {
  const partes: string[] = [];
  let atual: unknown = raiz;
  for (const p of path) {
    const proximo: unknown =
      atual !== null && typeof atual === "object"
        ? (atual as Record<PropertyKey, unknown>)[p]
        : undefined;
    // Troca índices de lista pelo id do item, quando houver: "clubes > bra-santos".
    if (typeof p === "number" && proximo && typeof proximo === "object") {
      const item = proximo as { id?: unknown; codigo?: unknown; pais?: unknown };
      const rotulo = item.id ?? item.codigo ?? item.pais;
      partes.push(typeof rotulo === "string" ? rotulo : `#${p + 1}`);
    } else {
      partes.push(typeof p === "number" ? `#${p + 1}` : String(p));
    }
    atual = proximo;
  }
  return partes.join(" > ") || "(raiz)";
}

export function problemasDoZod(erro: z.ZodError, raiz: unknown): Problema[] {
  return erro.issues.map((i) => ({
    nivel: "erro" as const,
    onde: caminho(i.path, raiz),
    mensagem: i.message,
  }));
}

/** Regra do Brasfoot: o time só é válido com pelo menos 1 goleiro e 11 jogadores de linha. */
export function elencoValido(jogadores: readonly Pick<Jogador, "posicao">[]): boolean {
  const goleiros = jogadores.filter((j) => j.posicao === "G").length;
  return goleiros >= 1 && jogadores.length - goleiros >= 11;
}

function repetidos(valores: readonly string[]): string[] {
  const vistos = new Set<string>();
  const dup = new Set<string>();
  for (const v of valores) (vistos.has(v) ? dup : vistos).add(v);
  return [...dup];
}

/** Confere as referências entre as partes do banco (o esquema confere cada item isolado). */
export function validarIntegridade(banco: BancoT): Problema[] {
  const problemas: Problema[] = [];
  const erro = (onde: string, mensagem: string) =>
    problemas.push({ nivel: "erro", onde, mensagem });
  const aviso = (onde: string, mensagem: string) =>
    problemas.push({ nivel: "aviso", onde, mensagem });

  const listas: Array<[string, string[]]> = [
    ["paises", banco.paises.map((p) => p.codigo)],
    ["estados", banco.estados.map((e) => `${e.pais}/${e.sigla}`)],
    ["clubes", banco.clubes.map((c) => c.id)],
    ["jogadores", banco.jogadores.map((j) => j.id)],
    ["competicoes", banco.competicoes.map((c) => c.id)],
    ["selecoes", banco.selecoes.map((s) => s.pais)],
    ["tecnicos", banco.tecnicos.map((t) => t.id)],
  ];
  for (const [nome, ids] of listas) {
    for (const id of repetidos(ids)) erro(`${nome} > ${id}`, "identificador repetido");
  }

  const paises = new Set(banco.paises.map((p) => p.codigo));
  const estados = new Set(banco.estados.map((e) => `${e.pais}/${e.sigla}`));
  const clubes = new Set(banco.clubes.map((c) => c.id));
  const competicoes = new Set(banco.competicoes.map((c) => c.id));

  for (const e of banco.estados) {
    if (!paises.has(e.pais)) erro(`estados > ${e.sigla}`, `país ${e.pais} não existe no banco`);
  }

  for (const c of banco.clubes) {
    const onde = `clubes > ${c.id}`;
    if (!paises.has(c.pais)) erro(onde, `país ${c.pais} não existe no banco`);
    if (c.estado && !estados.has(`${c.pais}/${c.estado}`)) {
      erro(onde, `estado ${c.estado} não existe em ${c.pais}`);
    }
    for (const r of c.rivais) {
      if (r === c.id) erro(onde, "o clube não pode ser rival de si mesmo");
      else if (!clubes.has(r)) aviso(onde, `rival ${r} não existe no banco`);
    }
    if (c.filialDe !== undefined) {
      if (c.filialDe === c.id) erro(onde, "o clube não pode ser filial de si mesmo");
      else if (!clubes.has(c.filialDe))
        erro(onde, `clube principal ${c.filialDe} não existe no banco`);
    }
  }

  const elencos = new Map<string, Jogador[]>();
  for (const j of banco.jogadores) {
    const onde = `jogadores > ${j.id}`;
    if (!paises.has(j.nacionalidade)) {
      aviso(onde, `nacionalidade ${j.nacionalidade} não existe no banco`);
    }
    if (j.segundaNacionalidade === j.nacionalidade) {
      aviso(onde, "segunda nacionalidade igual à primeira");
    }
    if (j.clube) {
      if (!clubes.has(j.clube)) erro(onde, `clube ${j.clube} não existe no banco`);
      else elencos.set(j.clube, [...(elencos.get(j.clube) ?? []), j]);
    }
  }

  for (const c of banco.clubes) {
    const elenco = elencos.get(c.id) ?? [];
    if (!elencoValido(elenco)) {
      aviso(
        `clubes > ${c.id}`,
        `time inválido: precisa de pelo menos 1 goleiro e 11 jogadores de linha (tem ${elenco.length} jogadores)`,
      );
    }
    const profissionais = elenco.filter((j) => !j.base).length;
    if (profissionais > ELENCO_MAXIMO)
      aviso(
        `clubes > ${c.id}`,
        `elenco com ${profissionais} profissionais; o máximo é ${ELENCO_MAXIMO} (a base fica fora da conta)`,
      );
    const numeros = elenco.flatMap((j) => (j.numero ? [String(j.numero)] : []));
    for (const n of repetidos(numeros)) aviso(`clubes > ${c.id}`, `camisa ${n} repetida`);
  }

  for (const comp of banco.competicoes) {
    const onde = `competicoes > ${comp.id}`;
    const e = comp.escopo;
    if ((e.tipo === "pais" || e.tipo === "estado") && !paises.has(e.pais)) {
      erro(onde, `país ${e.pais} não existe no banco`);
    }
    if (e.tipo === "estado" && !estados.has(`${e.pais}/${e.estado}`)) {
      erro(onde, `estado ${e.estado} não existe em ${e.pais}`);
    }
    for (const f of comp.participantes.fixos) {
      const existe = comp.categoria === "clubes" ? clubes.has(f) : paises.has(f);
      if (!existe) erro(onde, `participante ${f} não existe no banco`);
    }
    const todasVagas = [
      ...comp.participantes.vagas,
      ...comp.fases.flatMap((fase) => fase.entramAqui),
    ];
    for (const v of todasVagas) {
      if (!competicoes.has(v.de)) erro(onde, `vaga vem de ${v.de}, que não existe no banco`);
      if (v.criterio === "posicoes" && !v.posicoes?.length) {
        erro(onde, `vaga de ${v.de} precisa informar as posições`);
      }
    }
    for (const m of comp.movimentos) {
      if (!competicoes.has(m.para)) erro(onde, `${m.tipo} vai para ${m.para}, que não existe`);
    }
    for (const cp of comp.classificaPara) {
      if (!competicoes.has(cp.competicao))
        erro(onde, `classifica para ${cp.competicao}, que não existe`);
    }
    if (
      todasVagas.length === 0 &&
      comp.participantes.fixos.length !== comp.participantes.quantidade
    ) {
      aviso(
        onde,
        `espera ${comp.participantes.quantidade} participantes e tem ${comp.participantes.fixos.length}`,
      );
    }
  }

  // Ligas nacionais: cada clube joga uma só divisão, e a equipe B não divide divisão com o principal.
  const filialDe = new Map(banco.clubes.flatMap((c) => (c.filialDe ? [[c.id, c.filialDe]] : [])));
  const ligaDoClube = new Map<string, string>();
  for (const comp of banco.competicoes) {
    if (comp.tipo !== "liga") continue;
    const nesta = new Set(comp.participantes.fixos);
    for (const f of nesta) {
      const outra = ligaDoClube.get(f);
      if (outra) aviso(`competicoes > ${comp.id}`, `${f} também joga ${outra}`);
      ligaDoClube.set(f, comp.id);
      const principal = filialDe.get(f);
      if (principal && nesta.has(principal)) {
        erro(
          `competicoes > ${comp.id}`,
          `${f} é filial de ${principal} e não pode jogar a mesma divisão`,
        );
      }
    }
  }

  for (const s of banco.selecoes) {
    if (!paises.has(s.pais)) erro(`selecoes > ${s.pais}`, "país não existe no banco");
  }

  const tecnicoPorClube = new Map<string, string>();
  for (const t of banco.tecnicos) {
    const onde = `tecnicos > ${t.id}`;
    if (t.clube) {
      if (!clubes.has(t.clube)) erro(onde, `clube ${t.clube} não existe no banco`);
      const outro = tecnicoPorClube.get(t.clube);
      if (outro) aviso(onde, `o clube ${t.clube} já tem o técnico ${outro}`);
      tecnicoPorClube.set(t.clube, t.id);
    }
    if (t.selecao && !paises.has(t.selecao)) erro(onde, `seleção ${t.selecao} não existe no banco`);
  }

  return problemas;
}

/** Lê e valida um banco vindo de JSON. Avisos não impedem o uso; erros impedem. */
export function lerBanco(dados: unknown): Resultado<BancoT> {
  const r = Banco.safeParse(dados);
  if (!r.success) return { ok: false, problemas: problemasDoZod(r.error, dados) };
  const problemas = validarIntegridade(r.data);
  if (problemas.some((p) => p.nivel === "erro")) return { ok: false, problemas };
  return { ok: true, valor: r.data, problemas };
}

export function lerPatch(dados: unknown): Resultado<PatchT> {
  const r = Patch.safeParse(dados);
  if (!r.success) return { ok: false, problemas: problemasDoZod(r.error, dados) };
  return { ok: true, valor: r.data, problemas: [] };
}
