/**
 * Categoria de base do clube do técnico (etapa 12c), no estilo do FC: olheiros com nível mandados
 * a um país, relatórios com faixa de potencial, garotos da peneira a cada temporada, promoção ao
 * profissional a partir dos 16 anos e dispensa de quem chega aos 20 sem subir.
 *
 * Cada jogador da base tem o potencial de verdade escondido; o técnico só vê a faixa do relatório
 * (mais estreita com olheiro melhor) e a força de hoje. Na base e depois de promovido, ele evolui
 * pela mesma curva do resto do mundo.
 */
import { FORCA_TETO, type Jogador, type Posicao } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { somarDias } from "../carreira/datas";
import { fracaoDoPotencial, idadeEm } from "../evolucao";
import { gerarJogador, salarioBase } from "../gerador/jogador";
import { gerarNome } from "../gerador/nomes";
import { Rng } from "../rng";
import { completar, forcaNaIdade, type Geracao } from "./evolucao";

/** Até tantos jogadores na base (fora dos 30 do profissional). */
export const BASE_MAXIMA = 15;
/** Promoção ao profissional a partir dessa idade. */
export const IDADE_MINIMA_PROMOCAO = 16;
/** Quem chega a essa idade na base sem subir é dispensado. */
export const IDADE_DISPENSA = 20;
/** Até tantos olheiros contratados. */
export const OLHEIROS_MAXIMO = 3;
/** Missão de um olheiro: de 1 a 6 meses. */
export const MESES_DE_MISSAO = [1, 2, 3, 6] as const;
/** O relatório some depois desses dias sem resposta. */
const DIAS_DO_RELATORIO = 45;
/** Elenco profissional máximo (o mesmo do banco). */
const ELENCO_MAXIMO = 30;

export interface JogadorDaBase {
  /** O jogador como chegou (força e atributos da chegada). */
  j: Jogador;
  /** Até onde ele chega de verdade (o técnico não vê). */
  potencialReal: number;
  /** Quando entrou na base (ou foi promovido, para os promovidos). */
  entrada: string;
  origem: "banco" | "olheiro" | "peneira" | "renascido";
}

export interface Olheiro {
  id: string;
  nome: string;
  /** De 1 a 5: quanto melhor, mais talento acha e mais estreita a faixa do relatório. */
  nivel: number;
  /** Salário por mês (pesa no caixa na Fase 14). */
  salario: number;
  missao?: { pais: string; ate: string };
}

export interface Relatorio {
  id: string;
  data: string;
  olheiro: string;
  pais: string;
  jogador: Jogador;
  potencialReal: number;
  /** Faixa de potencial que o olheiro viu (o de verdade está dentro). */
  faixa: readonly [number, number];
}

export interface EstadoDaBase {
  jogadores: JogadorDaBase[];
  olheiros: Olheiro[];
  relatorios: Relatorio[];
  /** Jogadores da base do banco que já saíram da base (promovidos ou dispensados). */
  saidosDoBanco?: string[];
}

/** A base do clube: a guardada na carreira ou, na primeira vez, a do banco. */
export function baseDe(c: Carreira, mundo: Mundo): EstadoDaBase {
  if (c.base) return c.base;
  return {
    jogadores: (mundo.base?.(c.clube) ?? []).map((j) => ({
      j,
      potencialReal: j.potencial,
      entrada: c.inicio,
      origem: "banco" as const,
    })),
    olheiros: [],
    relatorios: [],
  };
}

const geracaoDe = (b: JogadorDaBase): Geracao => ({
  j: b.j,
  clube: b.j.clube ?? "",
  inicio: b.entrada,
  idadeInicio: idadeEm(b.j.nascimento, b.entrada),
  potencialReal: b.potencialReal,
  aposentadoria: 99,
  atraso: 0,
});

/** O jogador da base (ou promovido) na data: a força pela curva, desde a chegada. */
export function jogadorDaBaseNaData(b: JogadorDaBase, data: string): Jogador {
  const g = geracaoDe(b);
  const forca = data <= b.entrada ? b.j.forca : forcaNaIdade(g, idadeEm(b.j.nascimento, data));
  if (forca === b.j.forca) return b.j;
  const fator = forca / Math.max(1, b.j.forca);
  return {
    ...b.j,
    forca,
    potencial: Math.max(b.j.potencial, forca),
    atributos: Object.fromEntries(
      Object.entries(b.j.atributos ?? {}).map(([a, v]) => [
        a,
        Math.max(1, Math.min(100, Math.round((v as number) * fator))),
      ]),
    ) as Jogador["atributos"],
  };
}

// ------------------------------------------------------------------------------ Olheiros

/** Olheiros disponíveis no mês (os mesmos o mês todo; 3 opções, de níveis variados). */
export function olheirosDisponiveis(c: Carreira, mundo: Mundo): Olheiro[] {
  const mes = c.data.slice(0, 7);
  const rng = new Rng(`${c.semente}:olheiros:${mes}`);
  const grupo = mundo.pais(mundo.clube(c.clube)?.pais ?? "")?.grupoNomes ?? "pt-br";
  return [0, 1, 2].map((i) => {
    const nivel = Math.min(5, Math.max(1, Math.round(rng.normal(2.6, 1.1))));
    return {
      id: `olheiro-${mes}-${i}`,
      nome: gerarNome(rng, grupo).nome,
      nivel,
      salario: Math.round((2000 * nivel * nivel) / 100) * 100,
    };
  });
}

export function contratarOlheiro(c: Carreira, mundo: Mundo, id: string): Carreira {
  const base = baseDe(c, mundo);
  const o = olheirosDisponiveis(c, mundo).find((x) => x.id === id);
  if (!o || base.olheiros.length >= OLHEIROS_MAXIMO || base.olheiros.some((x) => x.id === id))
    return c;
  return { ...c, base: { ...base, olheiros: [...base.olheiros, o] } };
}

export function demitirOlheiro(c: Carreira, mundo: Mundo, id: string): Carreira {
  const base = baseDe(c, mundo);
  return { ...c, base: { ...base, olheiros: base.olheiros.filter((o) => o.id !== id) } };
}

/** Manda o olheiro a um país por alguns meses. */
export function enviarOlheiro(
  c: Carreira,
  mundo: Mundo,
  id: string,
  pais: string,
  meses: number,
): Carreira {
  const base = baseDe(c, mundo);
  if (!mundo.pais(pais)) return c;
  const ate = somarDias(c.data, Math.round(meses * 30.4));
  return {
    ...c,
    base: {
      ...base,
      olheiros: base.olheiros.map((o) => (o.id === id ? { ...o, missao: { pais, ate } } : o)),
    },
  };
}

/** Faixa de potencial: ± (9 − 2 × nível), com o de verdade sorteado dentro dela. */
export function faixaDoOlheiro(rng: Rng, potencial: number, nivel: number): [number, number] {
  const meia = Math.max(1, 9 - 2 * nivel);
  const desvio = rng.int(-meia, meia);
  const centro = potencial + desvio;
  return [
    Math.max(30, Math.min(potencial, centro - meia)),
    Math.min(FORCA_TETO, Math.max(potencial, centro + meia)),
  ];
}

/** Um garoto de 15 a 17 anos achado pelo olheiro no país (melhor olheiro, mais talento). */
function prospecto(
  c: Carreira,
  mundo: Mundo,
  o: Olheiro,
  pais: string,
  data: string,
  i: number,
): Relatorio {
  const p = mundo.pais(pais);
  const id = `base-${c.semente}-${o.id}-${data}-${i}`.replace(/[^a-z0-9-]/gi, "");
  const rng = new Rng(`${c.semente}:prospecto:${id}`);
  // Países de nível 1 (os grandes do futebol) têm mais talento.
  const forte = 4 - Math.min(3, p?.nivel ?? 3);
  const nivel = 50 + 3 * o.nivel + 3 * forte + rng.int(-3, 3);
  const entrada = gerarJogador(rng, {
    id,
    nacionalidade: pais,
    grupoNomes: p?.grupoNomes ?? "pt-br",
    posicao: rng.weighted<Posicao>(["G", "Z", "L", "M", "A"], (x) =>
      x === "G" ? 1 : x === "M" ? 3 : 2,
    ),
    nivel,
    hoje: data,
    idade: rng.int(15, 17),
  });
  const j = completar(entrada);
  const potencialReal = j.potencial;
  return {
    id,
    data,
    olheiro: o.id,
    pais,
    jogador: { ...j, clube: c.clube, base: true },
    potencialReal,
    faixa: faixaDoOlheiro(rng, potencialReal, o.nivel),
  };
}

// ----------------------------------------------------------------------- Ações do técnico

/** Traz para a base o garoto do relatório. */
export function contratarProspecto(c: Carreira, mundo: Mundo, relatorio: string): Carreira {
  const base = baseDe(c, mundo);
  const r = base.relatorios.find((x) => x.id === relatorio);
  if (!r || base.jogadores.length >= BASE_MAXIMA) return c;
  return {
    ...c,
    base: {
      ...base,
      jogadores: [
        ...base.jogadores,
        { j: r.jogador, potencialReal: r.potencialReal, entrada: c.data, origem: "olheiro" },
      ],
      relatorios: base.relatorios.filter((x) => x.id !== relatorio),
    },
  };
}

export function descartarRelatorio(c: Carreira, mundo: Mundo, relatorio: string): Carreira {
  const base = baseDe(c, mundo);
  return { ...c, base: { ...base, relatorios: base.relatorios.filter((x) => x.id !== relatorio) } };
}

/** Pode promover: tem a idade e há vaga no profissional. */
export function podePromover(c: Carreira, mundo: Mundo, id: string): boolean {
  const b = baseDe(c, mundo).jogadores.find((x) => x.j.id === id);
  return (
    !!b &&
    idadeEm(b.j.nascimento, c.data) >= IDADE_MINIMA_PROMOCAO &&
    mundo.elenco(c.clube).length < ELENCO_MAXIMO
  );
}

/** Sobe o garoto ao profissional, com contrato de 3 anos. */
export function promover(c: Carreira, mundo: Mundo, id: string): Carreira {
  if (!podePromover(c, mundo, id)) return c;
  const base = baseDe(c, mundo);
  const b = base.jogadores.find((x) => x.j.id === id)!;
  const agora = jogadorDaBaseNaData(b, c.data);
  const promovido: JogadorDaBase = {
    j: { ...agora, base: false, clube: c.clube },
    potencialReal: Math.max(agora.forca, b.potencialReal),
    entrada: c.data,
    origem: b.origem,
  };
  return {
    ...c,
    base: {
      ...base,
      jogadores: base.jogadores.filter((x) => x.j.id !== id),
      ...(b.origem === "banco" ? { saidosDoBanco: [...(base.saidosDoBanco ?? []), id] } : {}),
    },
    promovidos: [...(c.promovidos ?? []), promovido],
    jogadores: { ...c.jogadores, [id]: estadoDe(c, id) },
    contratos: {
      ...c.contratos,
      [id]: {
        fim: `${Number(c.data.slice(0, 4)) + 3}-${c.data.slice(5)}`,
        salario: salarioBase(agora.forca),
      },
    },
    noticias: [
      {
        data: c.data,
        tipo: "elenco" as const,
        ...marcar("{jogador}, {idade} anos, sobe da base para o time profissional.", {
          jogador: agora.nome,
          idade: idadeEm(agora.nascimento, c.data),
        }),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
}

export function dispensarDaBase(c: Carreira, mundo: Mundo, id: string): Carreira {
  const base = baseDe(c, mundo);
  const b = base.jogadores.find((x) => x.j.id === id);
  if (!b) return c;
  return {
    ...c,
    base: {
      ...base,
      jogadores: base.jogadores.filter((x) => x.j.id !== id),
      ...(b.origem === "banco" ? { saidosDoBanco: [...(base.saidosDoBanco ?? []), id] } : {}),
    },
  };
}

// --------------------------------------------------------------------------------- O dia

/** Garotos da peneira de cada temporada: 2 a 4 do país do clube, pelo nível do clube. */
function peneira(c: Carreira, mundo: Mundo, data: string): JogadorDaBase[] {
  const clube = mundo.clube(c.clube);
  const pais = mundo.pais(clube?.pais ?? "");
  const rng = new Rng(`${c.semente}:peneira:${data}`);
  const n = rng.int(2, 4);
  return Array.from({ length: n }, (_, i) => {
    const id = `peneira-${c.clube}-${data}-${i}`;
    const j = completar(
      gerarJogador(new Rng(`${c.semente}:${id}`), {
        id,
        nacionalidade: pais?.codigo ?? "BRA",
        grupoNomes: pais?.grupoNomes ?? "pt-br",
        posicao: rng.weighted<Posicao>(["G", "Z", "L", "M", "A"], (x) =>
          x === "G" ? 1 : x === "M" ? 3 : 2,
        ),
        nivel: Math.max(35, (clube?.nivel ?? 60) - 6),
        hoje: data,
        idade: rng.int(15, 16),
      }),
    );
    return {
      j: { ...j, clube: c.clube, base: true },
      potencialReal: j.potencial,
      entrada: data,
      origem: "peneira" as const,
    };
  });
}

/**
 * O dia da base: relatórios dos olheiros (um a cada 10 dias de missão), fim das missões, relatórios
 * velhos que somem, a peneira na virada da temporada e a dispensa de quem chegou aos 20.
 */
export function diaDaBase(
  c: Carreira,
  mundo: Mundo,
  data: string,
  virouTemporada: boolean,
): { base: EstadoDaBase | undefined; noticias: Noticia[] } {
  if (!c.base && !virouTemporada && !mundo.base?.(c.clube).length)
    return { base: c.base, noticias: [] };
  let base = baseDe(c, mundo);
  const noticias: Noticia[] = [];
  const relatorios = base.relatorios.filter((r) => somarDias(r.data, DIAS_DO_RELATORIO) > data);
  const olheiros = base.olheiros.map((o) => {
    if (!o.missao) return o;
    if (o.missao.ate <= data) {
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("O olheiro {olheiro} voltou de {pais}.", {
          olheiro: o.nome,
          pais: mundo.pais(o.missao.pais)?.nome ?? o.missao.pais,
        }),
      });
      const { missao: _, ...resto } = o;
      return resto;
    }
    const dia = Number(data.slice(8, 10));
    if (dia % 10 === 0) {
      const rng = new Rng(`${c.semente}:missao:${o.id}:${data}`);
      // Olheiro melhor manda mais nomes; às vezes a viagem não rende.
      const n = rng.chance(0.25) ? 0 : 1 + (o.nivel >= 4 && rng.chance(0.5) ? 1 : 0);
      for (let i = 0; i < n; i++) relatorios.push(prospecto(c, mundo, o, o.missao.pais, data, i));
      if (n)
        noticias.push({
          data,
          tipo: "elenco",
          ...marcar("O olheiro {olheiro} mandou {n} relatório(s) de {pais}. Veja na aba Base.", {
            olheiro: o.nome,
            n,
            pais: mundo.pais(o.missao.pais)?.nome ?? o.missao.pais,
          }),
        });
    }
    return o;
  });
  let jogadores = base.jogadores;
  // Quem chegou aos 20 sem subir é dispensado.
  const velhos = jogadores.filter((b) => idadeEm(b.j.nascimento, data) >= IDADE_DISPENSA);
  if (velhos.length) {
    jogadores = jogadores.filter((b) => !velhos.includes(b));
    noticias.push({
      data,
      tipo: "elenco",
      ...marcar("Dispensados da base por idade: {jogadores}.", {
        jogadores: velhos.map((b) => b.j.nome).join(", "),
      }),
    });
  }
  // A peneira da temporada nova.
  if (virouTemporada) {
    const vagas = BASE_MAXIMA - jogadores.length;
    const novos = peneira(c, mundo, data).slice(0, Math.max(0, vagas));
    if (novos.length) {
      jogadores = [...jogadores, ...novos];
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("Peneira da temporada: {jogadores} chegam à base.", {
          jogadores: novos.map((b) => `${b.j.nome} (${b.j.posicao})`).join(", "),
        }),
      });
    }
  }
  base = {
    ...base,
    jogadores,
    olheiros,
    relatorios,
    ...(velhos.some((b) => b.origem === "banco")
      ? {
          saidosDoBanco: [
            ...(base.saidosDoBanco ?? []),
            ...velhos.filter((b) => b.origem === "banco").map((b) => b.j.id),
          ],
        }
      : {}),
  };
  return { base, noticias };
}

/**
 * Lenda renascida que caiu na base do clube do técnico (sorte grande): entra na base na data, com a
 * idade e a força do renascimento e o potencial do auge. Entra mesmo com a base cheia.
 */
export function receberRenascido(
  c: Carreira,
  mundo: Mundo,
  j: Jogador,
  data: string,
): EstadoDaBase {
  const base = baseDe(c, mundo);
  if (base.jogadores.some((b) => b.j.id === j.id)) return base;
  const pico = Math.max(j.potencial, j.forcaAuge ?? 0);
  const forca = Math.max(
    30,
    Math.round(pico * fracaoDoPotencial(idadeEm(j.nascimento, data), j.posicao)),
  );
  const fator = forca / Math.max(1, j.forca);
  const chegada: Jogador = {
    ...j,
    forca,
    potencial: pico,
    base: true,
    clube: c.clube,
    atributos: Object.fromEntries(
      Object.entries(j.atributos ?? {}).map(([a, v]) => [
        a,
        Math.max(1, Math.min(100, Math.round((v as number) * fator))),
      ]),
    ) as Jogador["atributos"],
  };
  return {
    ...base,
    jogadores: [
      ...base.jogadores,
      { j: chegada, potencialReal: pico, entrada: data, origem: "renascido" },
    ],
  };
}
