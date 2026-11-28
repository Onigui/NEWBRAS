/**
 * A carreira do técnico (etapa 15a): reputação, demissão e convites de outros clubes, com a troca
 * de clube no meio da carreira.
 *
 * Reputação de 0 a 100, em faixas (municipal, estadual, nacional, continental, mundial, lenda):
 * começa pelo tamanho do clube que o técnico assume; sobe com títulos (estadual 2, copa 5, liga 8,
 * continental 12, mundial 15), metas cumpridas (4) e vitórias, e cai com metas perdidas (3),
 * derrotas, demissão (6) e o esquecimento (1 por ano acima de 30).
 *
 * Demissão: confiança da diretoria abaixo de 10, ou 6 meses de salários atrasados. O técnico
 * recebe na hora de 2 a 4 convites de clubes menores e escolhe um (o jogo espera a escolha).
 *
 * Convites de quem vai bem: com a confiança em 70 ou mais, de vez em quando (mais depois de um
 * título ou meta cumprida) um clube maior chama, até o nível que a reputação alcança (45 + metade
 * da reputação). Aceitar troca de clube na hora; recusar não custa nada.
 */
import type { Clube } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "./carreira";
import { diasEntre, somarDias } from "./datas";
import { caixaDaCpu } from "../financas/financas";
import { evolucaoDe } from "../elenco/mundo";
import { Rng } from "../rng";
import { assumirSelecao } from "./selecaoDoTecnico";
import type { Transferencia } from "../mercado/comum";

export interface PassagemDoTecnico {
  clube: string;
  inicio: string;
  fim?: string;
  motivo?: "demitido" | "convite";
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  titulos: string[];
}

export interface ConviteDeEmprego {
  id: string;
  clube: string;
  data: string;
  ate: string;
  motivo: "reputacao" | "demissao";
  /** Convite de uma seleção (o país em `clube`): o técnico assume sem deixar o clube. */
  tipo?: "selecao";
}

export interface PerfilDoTecnico {
  reputacao: number;
  passagens: PassagemDoTecnico[];
  convites?: ConviteDeEmprego[];
  /** Demitido e ainda escolhendo o próximo clube. */
  demitido?: { data: string; clube: string };
  /** Último ano em que o esquecimento foi aplicado. */
  anoDoEsquecimento?: string;
  /** Data do último título ou meta cumprida (aumenta os convites). */
  emAlta?: string;
}

export type FaixaDeReputacao =
  "municipal" | "estadual" | "nacional" | "continental" | "mundial" | "lenda";

const limitar = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

export function faixaDaReputacao(v: number): FaixaDeReputacao {
  if (v >= 95) return "lenda";
  if (v >= 80) return "mundial";
  if (v >= 60) return "continental";
  if (v >= 40) return "nacional";
  if (v >= 20) return "estadual";
  return "municipal";
}

/** Maior nível de clube que a reputação alcança nos convites. */
export const nivelAlcancado = (reputacao: number) => Math.round(45 + reputacao / 2);

/** O perfil do técnico (o inicial vem do tamanho do clube que ele assumiu). */
export function perfilDe(c: Carreira, mundo: Mundo): PerfilDoTecnico {
  if (c.perfil) return c.perfil;
  const nivel = mundo.clube(c.clube)?.nivel ?? 50;
  return {
    reputacao: Math.max(10, Math.min(75, nivel - 25)),
    passagens: [
      {
        clube: c.clube,
        inicio: c.inicio,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        titulos: [],
      },
    ],
  };
}

export function mexerNaReputacao(
  c: Carreira,
  mundo: Mundo,
  delta: number,
  emAlta?: string,
): Carreira {
  const p = perfilDe(c, mundo);
  return {
    ...c,
    perfil: { ...p, reputacao: limitar(p.reputacao + delta), ...(emAlta ? { emAlta } : {}) },
  };
}

/** Resultado oficial na passagem atual e um toque na reputação. */
export function resultadoNaCarreira(
  c: Carreira,
  mundo: Mundo,
  pro: number,
  contra: number,
): Carreira {
  const p = perfilDe(c, mundo);
  const passagens = [...p.passagens];
  const atual = passagens.at(-1);
  if (atual)
    passagens[passagens.length - 1] = {
      ...atual,
      jogos: atual.jogos + 1,
      vitorias: atual.vitorias + (pro > contra ? 1 : 0),
      empates: atual.empates + (pro === contra ? 1 : 0),
      derrotas: atual.derrotas + (pro < contra ? 1 : 0),
    };
  const delta = pro > contra ? 0.15 : pro < contra ? -0.1 : 0;
  return { ...c, perfil: { ...p, passagens, reputacao: limitar(p.reputacao + delta) } };
}

/** Peso do título na reputação. */
function pesoDoTitulo(tipo: string, escopo: string): number {
  if (escopo === "mundial") return 15;
  if (escopo === "confederacao") return 12;
  if (escopo === "estado") return 2;
  return tipo === "liga" ? 8 : 5;
}

/** Títulos do técnico nas competições que acabaram hoje. */
export function titulosNaCarreira(
  c: Carreira,
  mundo: Mundo,
  data: string,
  registros: readonly { competicao: string; campeao?: string }[],
): Carreira {
  let r = c;
  for (const h of registros) {
    if (h.campeao !== c.clube) continue;
    const comp = mundo.competicao(h.competicao);
    if (!comp) continue;
    r = mexerNaReputacao(r, mundo, pesoDoTitulo(comp.tipo, comp.escopo.tipo), data);
    const p = perfilDe(r, mundo);
    const passagens = [...p.passagens];
    const atual = passagens.at(-1);
    if (atual)
      passagens[passagens.length - 1] = { ...atual, titulos: [...atual.titulos, comp.nome] };
    r = { ...r, perfil: { ...p, passagens } };
  }
  return r;
}

/** Clubes que chamariam o técnico, entre os níveis dados. */
function clubesEntre(c: Carreira, mundo: Mundo, min: number, max: number): Clube[] {
  return (mundo.clubes ?? []).filter(
    (x) =>
      x.id !== c.clube &&
      !x.filialDe &&
      x.nivel >= min &&
      x.nivel <= max &&
      mundo.elenco(x.id).length >= 16,
  );
}

function convitesDeDemissao(c: Carreira, mundo: Mundo, data: string, rng: Rng): ConviteDeEmprego[] {
  const p = perfilDe(c, mundo);
  const nosso = mundo.clube(c.clube)?.nivel ?? 60;
  const teto = Math.min(nosso - 2, nivelAlcancado(p.reputacao) - 5);
  let lista = clubesEntre(c, mundo, teto - 15, teto);
  if (lista.length < 2) lista = clubesEntre(c, mundo, 30, nosso);
  const n = Math.min(lista.length, rng.int(2, 4));
  // Metade dos convites, se der, vem do próprio país (o técnico é conhecido lá).
  const pais = mundo.clube(c.clube)?.pais;
  const doPais = lista.filter((x) => x.pais === pais);
  const escolhidos: Clube[] = [];
  for (let i = 0; i < 60 && escolhidos.length < n; i++) {
    const daqui = doPais.length > 0 && (escolhidos.length < Math.ceil(n / 2) || rng.chance(0.3));
    const fonte = daqui ? doPais : lista;
    const x = fonte[rng.int(0, fonte.length - 1)] as Clube;
    if (!escolhidos.includes(x)) escolhidos.push(x);
  }
  return escolhidos.map((x) => ({
    id: `emprego:${data}:${x.id}`,
    clube: x.id,
    data,
    ate: somarDias(data, 3650),
    motivo: "demissao" as const,
  }));
}

/** Demite o técnico: ele escolhe um dos convites de clubes menores antes de seguir. */
export function demitir(
  c: Carreira,
  mundo: Mundo,
  data: string,
  motivo: "confianca" | "salarios",
): { carreira: Carreira; noticias: Noticia[] } {
  let r = mexerNaReputacao(c, mundo, -6);
  const p = perfilDe(r, mundo);
  const rng = new Rng(`${c.semente}:demissao:${data}`);
  const convites = convitesDeDemissao(r, mundo, data, rng);
  r = { ...r, perfil: { ...p, demitido: { data, clube: c.clube }, convites } };
  const clube = mundo.clube(c.clube)?.nomeCurto ?? c.clube;
  return {
    carreira: r,
    noticias: [
      {
        data,
        tipo: "carreira",
        ...(motivo === "confianca"
          ? marcar("Demitido: a diretoria do {clube} perdeu a confiança e encerrou o trabalho.", {
              clube,
            })
          : marcar(
              "Demitido: com seis meses de salários atrasados, a diretoria do {clube} trocou o comando.",
              {
                clube,
              },
            )),
      },
      {
        data,
        tipo: "carreira",
        ...marcar(
          "Sem clube, o técnico recebeu {n} convite(s). Escolha o próximo desafio para seguir.",
          {
            n: convites.length,
          },
        ),
      },
    ],
  };
}

/**
 * Convites de quem vai bem (todo dia 1): confiança em 70 ou mais, um clube maior chama de vez em
 * quando, até o nível que a reputação alcança. Até 2 convites abertos, por 14 dias.
 */
export function convitesDeEmprego(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[] } {
  const p = perfilDe(c, mundo);
  if (p.demitido) return { carreira: c, noticias: [] };
  const abertos = (p.convites ?? []).filter((x) => x.ate >= data);
  let r: Carreira =
    abertos.length !== (p.convites ?? []).length
      ? { ...c, perfil: { ...p, convites: abertos } }
      : c;
  const confianca = c.diretoria?.confianca ?? 60;
  const emAlta = !!p.emAlta && diasEntre(p.emAlta, data) <= 60;
  const rng = new Rng(`${c.semente}:convite-emprego:${data}`);
  if (abertos.length >= 2 || confianca < 70 || !rng.chance(emAlta ? 0.3 : 0.12))
    return { carreira: r, noticias: [] };
  const nosso = mundo.clube(c.clube)?.nivel ?? 60;
  const lista = clubesEntre(r, mundo, nosso + 2, nivelAlcancado(p.reputacao));
  if (!lista.length) return { carreira: r, noticias: [] };
  // Metade das vezes, um clube do próprio país (se houver).
  const doPais = lista.filter((y) => y.pais === mundo.clube(c.clube)?.pais);
  const fonte = doPais.length && rng.chance(0.5) ? doPais : lista;
  const x = fonte[rng.int(0, fonte.length - 1)] as Clube;
  const convite: ConviteDeEmprego = {
    id: `emprego:${data}:${x.id}`,
    clube: x.id,
    data,
    ate: somarDias(data, 14),
    motivo: "reputacao",
  };
  r = { ...r, perfil: { ...perfilDe(r, mundo), convites: [...abertos, convite] } };
  return {
    carreira: r,
    noticias: [
      {
        data,
        tipo: "carreira",
        ...marcar(
          "Convite: o {clube} quer você como técnico. Responda até {ate} no topo da carreira.",
          {
            clube: x.nomeCurto,
            ate: convite.ate,
          },
        ),
      },
    ],
  };
}

export function recusarConvite(c: Carreira, mundo: Mundo, id: string): Carreira {
  const p = perfilDe(c, mundo);
  if (p.demitido) return c;
  return { ...c, perfil: { ...p, convites: (p.convites ?? []).filter((x) => x.id !== id) } };
}

/** Aceita um convite: o técnico troca de clube na hora. */
export function aceitarConvite(c: Carreira, mundo: Mundo, id: string): Carreira {
  const p = perfilDe(c, mundo);
  const convite = (p.convites ?? []).find((x) => x.id === id);
  if (!convite || (!p.demitido && convite.ate < c.data)) return c;
  if (convite.tipo === "selecao")
    return p.demitido || c.selecao ? c : assumirSelecao(c, mundo, convite.clube);
  return trocarDeClube(c, mundo, convite.clube, p.demitido ? "demitido" : "convite");
}

/**
 * Troca de clube no meio da carreira. O clube antigo vira da CPU: os garotos que o técnico
 * promoveu ficam lá, o caixa e a dívida no banco passam para o caixa dele, os empréstimos e
 * leilões seguem como da CPU. O técnico começa do zero no novo: caixa do clube, diretoria nova,
 * estádio, finanças, conversas e vendas zerados; os garotos que a CPU já tinha subido no novo
 * clube ficam (herdados).
 */
export function trocarDeClube(
  c: Carreira,
  mundo: Mundo,
  novo: string,
  motivo: "demitido" | "convite",
): Carreira {
  const antigo = c.clube;
  const data = c.data;
  const p = perfilDe(c, mundo);
  const info = mundo.clube(novo);
  if (!info || novo === antigo) return c;
  // Os promovidos ficam no clube antigo (como garotos da CPU).
  const garotos = [
    ...(c.garotosCpu ?? []),
    ...(c.promovidos ?? []).map((b) => ({ ...b, j: { ...b.j, clube: antigo } })),
  ];
  // Quem saiu pelo fim do contrato vira transferência (o mundo não usa mais as saídas do técnico).
  const comTransferencia = new Set((c.transferencias ?? []).map((t) => t.jogador));
  const saidas: Transferencia[] = (c.saidas ?? [])
    .filter((id) => !comTransferencia.has(id))
    .map((id) => ({ jogador: id, de: antigo, data, valor: 0, tipo: "fim-de-contrato" as const }));
  // Garotos que a CPU já tinha subido no clube novo continuam lá.
  const evolucao = evolucaoDe(mundo, c);
  const herdados = mundo
    .elenco(novo)
    .filter((j) => evolucao?.daBase.has(j.id) || evolucao?.renascidos.has(j.id))
    .map((j) => j.id);
  const divida = (c.emprestimosBancarios ?? []).reduce((s, e) => s + e.saldo, 0);
  const caixasCpu: Record<string, number> = {
    ...c.caixasCpu,
    [antigo]: Math.round((c.caixa ?? 0) - divida),
  };
  const caixaNovo = caixaDaCpu(c, mundo, novo);
  delete caixasCpu[novo];
  const passagens = [...p.passagens];
  const atual = passagens.at(-1);
  if (atual) passagens[passagens.length - 1] = { ...atual, fim: data, motivo };
  passagens.push({
    clube: novo,
    inicio: data,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    titulos: [],
  });
  const nomeAntigo = mundo.clube(antigo)?.nomeCurto ?? antigo;
  const {
    contratos: _1,
    base: _2,
    promovidos: _3,
    saidas: _4,
    aVenda: _5,
    propostas: _6,
    aEmprestimo: _7,
    preContratos: _8,
    sondagens: _9,
    financas: _10,
    conversas: _11,
    promessas: _12,
    diretoria: _13,
    crise: _14,
    emprestimosBancarios: _15,
    estadio: _16,
    convitesAmistosos: _17,
    ...resto
  } = c;
  return {
    ...resto,
    clube: novo,
    caixa: caixaNovo,
    caixasCpu,
    garotosCpu: garotos,
    herdados,
    transferencias: [...(c.transferencias ?? []), ...saidas],
    agenda: [],
    escalacao: null,
    moral: 50,
    perfil: { reputacao: p.reputacao, passagens, ...(p.emAlta ? { emAlta: p.emAlta } : {}) },
    noticias: [
      {
        data,
        tipo: "carreira" as const,
        ...(motivo === "demitido"
          ? marcar("Novo desafio: depois da saída do {antigo}, o técnico assume o {clube}.", {
              antigo: nomeAntigo,
              clube: info.nomeCurto,
            })
          : marcar("O técnico deixa o {antigo} e aceita o convite do {clube}.", {
              antigo: nomeAntigo,
              clube: info.nomeCurto,
            })),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
}

/** O esquecimento: todo 1º de janeiro, a reputação acima de 30 cai 1. */
export function esquecimento(c: Carreira, mundo: Mundo, data: string): Carreira {
  if (!data.endsWith("-01-01")) return c;
  const p = perfilDe(c, mundo);
  const ano = data.slice(0, 4);
  if (p.anoDoEsquecimento === ano) return c;
  return {
    ...c,
    perfil: {
      ...p,
      anoDoEsquecimento: ano,
      reputacao: p.reputacao > 30 ? limitar(p.reputacao - 1) : p.reputacao,
    },
  };
}
