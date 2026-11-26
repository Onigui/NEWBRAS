/**
 * A vida do elenco do técnico (etapa 12b): lesões (no jogo e no treino), moral de cada jogador,
 * contratos (aviso, renovação e saída quando acabam) e o peso dos minutos jogados na evolução.
 */
import type { Contrato } from "@newbras/data";
import { chave, marcar, t } from "@newbras/textos";
import type { Carreira, Compromisso, EstadoJogador, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { diasEntre, somarDias } from "../carreira/datas";
import { idadeEm } from "../evolucao";
import { salarioBase } from "../gerador/jogador";
import type { LadoCampo, ResultadoPartida } from "../partida/tipos";
import { Rng } from "../rng";

// --------------------------------------------------------------------------------- Lesões

export interface Lesao {
  /** Nome da lesão em português (a chave da tradução). */
  nome: string;
  /** Volta a poder jogar nesta data. */
  ate: string;
  dias: number;
}

/** Tipos de lesão, do mais comum ao mais raro, com a faixa de dias fora. */
export const TIPOS_DE_LESAO: readonly { nome: string; dias: [number, number]; peso: number }[] = [
  { nome: chave("Pancada"), dias: [2, 6], peso: 30 },
  { nome: chave("Estiramento muscular"), dias: [7, 21], peso: 28 },
  { nome: chave("Entorse no tornozelo"), dias: [10, 28], peso: 15 },
  { nome: chave("Lesão muscular na coxa"), dias: [21, 45], peso: 13 },
  { nome: chave("Lesão no joelho"), dias: [40, 100], peso: 7 },
  { nome: chave("Fratura"), dias: [60, 120], peso: 4 },
  { nome: chave("Ruptura do ligamento cruzado"), dias: [180, 270], peso: 3 },
];
/** Chance de se machucar num dia de treino (mais alta com o jogador cansado). */
export const CHANCE_LESAO_TREINO = 0.001;
/** Condição de quem volta de lesão (no máximo). */
const CONDICAO_NA_VOLTA = 85;

export function sortearLesao(rng: Rng, data: string): Lesao {
  const tipo = rng.weighted(TIPOS_DE_LESAO, (x) => x.peso);
  const dias = rng.int(tipo.dias[0], tipo.dias[1]);
  return { nome: tipo.nome, ate: somarDias(data, dias), dias };
}

export function lesionado(e: Pick<EstadoJogador, "lesao"> | undefined, data: string): boolean {
  return !!e?.lesao && e.lesao.ate > data;
}

// ---------------------------------------------------------------------------------- Moral

/** Moral de cada jogador, de 0 a 100; 60 é o normal. */
export const MORAL_NORMAL = 60;
export const moralDe = (e: Pick<EstadoJogador, "moral">) => e.moral ?? MORAL_NORMAL;
const limitar = (v: number) => Math.round(Math.max(0, Math.min(100, v)) * 10) / 10;

/** Faixa da moral para a tela. */
export function faixaDaMoral(moral: number): "insatisfeito" | "abatido" | "normal" | "motivado" {
  if (moral < 30) return "insatisfeito";
  if (moral < 50) return "abatido";
  if (moral < 75) return "normal";
  return "motivado";
}

/** Atacante que passa tantos jogos sem marcar começa a se cobrar. */
const JOGOS_SEM_GOL_ATACANTE = 5;

// ------------------------------------------------------------------------- Depois do jogo

/** Lesões e moral depois de um jogo do técnico. */
export function depoisDoJogo(
  antes: Carreira,
  depois: Carreira,
  mundo: Mundo,
  x: Compromisso,
  r: ResultadoPartida,
): Carreira {
  const nosso: LadoCampo = x.mando === "casa" ? "casa" : "fora";
  const pro = nosso === "casa" ? r.placar[0] : r.placar[1];
  const contra = nosso === "casa" ? r.placar[1] : r.placar[0];
  const rng = new Rng(`${antes.semente}:lesoes:${x.id}`);
  const jogadores = { ...depois.jogadores };
  const noticias: Noticia[] = [];
  const titulares = new Set(r.vagas[nosso]);
  const perdidos = new Map<string, number>();
  for (const ev of r.eventos)
    if (ev.tipo === "penalti-perdido" && ev.time === nosso && ev.jogador)
      perdidos.set(ev.jogador, (perdidos.get(ev.jogador) ?? 0) + 1);
  const jogaram = new Map(r.jogadores.filter((e) => e.time === nosso).map((e) => [e.id, e]));
  // Os mais fortes do elenco sentem mais ficar de fora.
  const elenco = [...mundo.elenco(antes.clube)].sort((a, b) => b.forca - a.forca);
  const principais = new Set(elenco.slice(0, 16).map((j) => j.id));
  const estrelas = new Set(elenco.slice(0, 5).map((j) => j.id));
  for (const j of elenco) {
    const e = jogadores[j.id] ?? estadoDe(depois, j.id);
    const est = jogaram.get(j.id);
    let moral = moralDe(e);
    let jogosSemGol = e.jogosSemGol ?? 0;
    if (est && est.minutos > 0) {
      moral += titulares.has(j.id) ? 2 : 1;
      moral += Math.min(5, est.gols * 2);
      if (pro > contra) moral += 1;
      if (pro < contra) moral -= 1;
      moral -= 4 * (perdidos.get(j.id) ?? 0);
      if (j.posicao === "A") {
        jogosSemGol = est.gols ? 0 : jogosSemGol + 1;
        if (jogosSemGol >= JOGOS_SEM_GOL_ATACANTE) moral -= 1;
      }
    } else if (principais.has(j.id) && !lesionado(e, antes.data)) {
      moral -= estrelas.has(j.id) ? 3 : 2;
    }
    let lesao = e.lesao;
    if (est?.lesionado) {
      lesao = sortearLesao(rng, antes.data);
      noticias.push({
        data: antes.data,
        tipo: "elenco",
        ...marcar("{jogador} se machucou ({lesao}): fora por cerca de {dias} dias.", {
          jogador: j.nome,
          lesao: t(lesao.nome),
          dias: lesao.dias,
        }),
      });
    }
    jogadores[j.id] = {
      ...e,
      moral: limitar(moral),
      ...(j.posicao === "A" ? { jogosSemGol } : {}),
      ...(lesao ? { lesao } : {}),
    };
  }
  return {
    ...depois,
    jogadores,
    noticias: [...noticias, ...depois.noticias].slice(0, 200),
  };
}

// ------------------------------------------------------------------------------ Contratos

export const contratoDe = (c: Carreira, mundo: Mundo, id: string): Contrato | undefined =>
  c.contratos?.[id] ?? mundo.jogador(id)?.contrato;

/** Só dá para renovar com até 2 anos de contrato pela frente. */
export const DIAS_PARA_RENOVAR = 730;
/** Avisos de fim de contrato: 6 meses e 1 mês antes. */
const AVISOS_DE_CONTRATO = [180, 30];

export interface PropostaDeRenovacao {
  /** Salário que o jogador pede por mês. */
  salario: number;
  /** Durações que ele aceita, em meses. */
  meses: number[];
  /** Por que não quer renovar (vazio: aceita). */
  recusa?: "insatisfeito" | "aposentadoria" | "contrato-longo";
}

/** O que o jogador pede para renovar (o técnico escolhe a duração). */
export function propostaDeRenovacao(c: Carreira, mundo: Mundo, id: string): PropostaDeRenovacao {
  const j = mundo.jogador(id);
  const e = estadoDe(c, id);
  if (!j) return { salario: 0, meses: [], recusa: "insatisfeito" };
  const idade = idadeEm(j.nascimento, c.data);
  const atual = contratoDe(c, mundo, id)?.salario ?? 0;
  const moral = moralDe(e);
  // Pede pela força; estrela e jogador insatisfeito pedem mais; nunca menos que 5% de aumento.
  const pedido =
    salarioBase(j.forca) * (j.estrela ? 1.25 : 1) * (moral < 45 ? 1.2 : moral >= 75 ? 0.95 : 1);
  const salario = Math.round(Math.max(pedido, atual * 1.05) / 100) * 100;
  const meses = idade >= 35 ? [6, 12] : idade >= 33 ? [6, 12, 24] : [6, 12, 24, 36];
  // Com mais de 2 anos de contrato pela frente, não há o que conversar.
  const fim = contratoDe(c, mundo, id)?.fim;
  if (fim && diasEntre(c.data, fim) > DIAS_PARA_RENOVAR)
    return { salario, meses: [], recusa: "contrato-longo" };
  if (moral < 25) return { salario, meses: [], recusa: "insatisfeito" };
  if (idade >= 38) return { salario, meses: [], recusa: "aposentadoria" };
  return { salario, meses };
}

/** Soma meses a uma data (31/01 + 1 mês = 28 ou 29/02). */
export function somarMeses(data: string, meses: number): string {
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  const total = a * 12 + (m - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${String(mes).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/** Renova o contrato pelo que o jogador pediu. */
export function renovarContrato(c: Carreira, mundo: Mundo, id: string, meses: number): Carreira {
  const p = propostaDeRenovacao(c, mundo, id);
  if (p.recusa || !p.meses.includes(meses)) return c;
  const atual = contratoDe(c, mundo, id);
  const inicio = atual && atual.fim > c.data ? atual.fim : c.data;
  const contrato: Contrato = { fim: somarMeses(inicio, meses), salario: p.salario };
  const e = estadoDe(c, id);
  const j = mundo.jogador(id);
  return {
    ...c,
    contratos: { ...c.contratos, [id]: contrato },
    jogadores: { ...c.jogadores, [id]: { ...e, moral: limitar(moralDe(e) + 8) } },
    noticias: [
      {
        data: c.data,
        tipo: "elenco" as const,
        ...marcar("{jogador} renovou o contrato até {fim}, com salário de {salario} por mês.", {
          jogador: j?.nome ?? id,
          fim: contrato.fim,
          salario: contrato.salario,
        }),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
}

// --------------------------------------------------------------------------------- O dia

/**
 * O dia do elenco do técnico: lesões no treino, quem volta de lesão, a moral voltando ao normal,
 * avisos de contrato e quem sai porque o contrato acabou.
 */
export function diaDoElenco(
  c: Carreira,
  mundo: Mundo,
  data: string,
  jogadores: Record<string, EstadoJogador>,
): { jogadores: Record<string, EstadoJogador>; noticias: Noticia[]; saidas: string[] } {
  const rng = new Rng(`${c.semente}:treino:${data}`);
  const novos = { ...jogadores };
  const noticias: Noticia[] = [];
  const saidas: string[] = [];
  for (const j of mundo.elenco(c.clube)) {
    let e = novos[j.id] ?? estadoDe(c, j.id);
    // Volta de lesão.
    if (e.lesao && e.lesao.ate <= data) {
      const { lesao: _, ...resto } = e;
      e = { ...resto, condicao: Math.min(e.condicao, CONDICAO_NA_VOLTA) };
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("{jogador} está recuperado e pode jogar.", { jogador: j.nome }),
      });
    }
    // Lesão no treino.
    if (!lesionado(e, data) && rng.chance(CHANCE_LESAO_TREINO * (1 + (100 - e.condicao) / 50))) {
      const lesao = sortearLesao(rng, data);
      e = { ...e, lesao };
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("{jogador} se machucou no treino ({lesao}): fora por cerca de {dias} dias.", {
          jogador: j.nome,
          lesao: t(lesao.nome),
          dias: lesao.dias,
        }),
      });
    }
    // A moral volta aos poucos ao normal; contrato perto do fim sem renovação incomoda.
    const contrato = contratoDe(c, mundo, j.id);
    const faltam = contrato ? diasEntre(data, contrato.fim) : Infinity;
    let moral = moralDe(e);
    moral += (MORAL_NORMAL - moral) * 0.01;
    if (faltam <= 180 && faltam >= 0) moral -= 0.1;
    e = { ...e, moral: limitar(moral) };
    novos[j.id] = e;
    if (!contrato) continue;
    if (AVISOS_DE_CONTRATO.includes(faltam))
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar(
          "O contrato de {jogador} termina em {fim} ({dias} dias). Renove na ficha do jogador, no Plantel.",
          { jogador: j.nome, fim: contrato.fim, dias: faltam },
        ),
      });
    if (contrato.fim < data) {
      saidas.push(j.id);
      delete novos[j.id];
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("{jogador} deixou o clube: o contrato terminou.", { jogador: j.nome }),
      });
    }
  }
  return { jogadores: novos, noticias, saidas };
}

// ------------------------------------------------------------------- Minutos e evolução

/** Ajuste máximo (para cima ou para baixo) que os minutos dão à força de um jogador. */
export const AJUSTE_MAXIMO = 4;

/**
 * Na virada da temporada do clube: jovem que jogou muito ganha força, jovem esquecido no banco
 * perde, e a moral alta ajuda o jovem a crescer.
 */
export function minutosNaVirada(
  mundo: Mundo,
  clube: string,
  data: string,
  jogadores: Record<string, EstadoJogador>,
): Record<string, EstadoJogador> {
  const elenco = mundo.elenco(clube);
  const minutos = (id: string) =>
    (jogadores[id]?.minutos ?? 0) - (jogadores[id]?.minutosNaVirada ?? 0);
  const maximo = Math.max(1, ...elenco.map((j) => minutos(j.id)));
  const novos = { ...jogadores };
  for (const j of elenco) {
    const e = novos[j.id];
    if (!e) continue;
    const idade = idadeEm(j.nascimento, data);
    const parte = minutos(j.id) / maximo;
    let delta = 0;
    if (idade <= 23 && parte >= 0.6) delta = 1;
    else if (idade <= 23 && parte < 0.1) delta = -1;
    if (idade <= 23 && parte >= 0.4 && moralDe(e) >= 75) delta += 1;
    const ajuste = Math.max(-AJUSTE_MAXIMO, Math.min(AJUSTE_MAXIMO, (e.ajuste ?? 0) + delta));
    novos[j.id] = { ...e, ajuste, minutosNaVirada: e.minutos };
  }
  return novos;
}
