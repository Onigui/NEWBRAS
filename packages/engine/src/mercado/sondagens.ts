/**
 * Sondagem antes do pré-contrato (pedido do dono, 27/11): ninguém leva um jogador do técnico de
 * surpresa. No último ano de contrato, um clube interessado primeiro sonda; a diretoria avisa; uma
 * semana depois o jogador vem conversar e dá um prazo para a renovação (com aviso 7 dias antes de
 * acabar). Só sem renovação até o prazo, e já nos 6 meses finais, ele assina o pré-contrato.
 */
import type { Clube } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { diasEntre, somarDias } from "../carreira/datas";
import { contratoDe, moralDe } from "../elenco/vida";
import { salarioBase } from "../gerador/jogador";
import type { Rng } from "../rng";
import {
  DIAS_DA_PROPOSTA,
  emprestadoAoClube,
  noticia,
  type PreContrato,
  type PropostaRecebida,
  type Sondagem,
} from "./comum";
import { importanciaNoElenco } from "./situacao";
import { janelaAberta, salarioPedido, valorDeMercado } from "./valor";

/** A sondagem começa no último ano de contrato (9 meses ou menos). */
export const DIAS_DA_SONDAGEM = 270;
/** Pré-contrato só nos últimos 6 meses. */
const DIAS_DO_PRE = 183;
/** O jogador vem conversar uma semana depois do aviso da diretoria. */
const DIAS_ATE_A_CONVERSA = 7;
/** E espera pelo menos 3 semanas pela renovação. */
const DIAS_DE_ESPERA = 21;

const arredondar = (v: number) => Math.round(v / 100_000) * 100_000;

export const sondagemDe = (c: Pick<Carreira, "sondagens">, id: string): Sondagem | undefined =>
  (c.sondagens ?? []).find((x) => x.jogador === id);

/** Sondagens em que o jogador já falou com o técnico e espera resposta. */
export const sondagensPendentes = (c: Carreira): Sondagem[] =>
  (c.sondagens ?? []).filter((x) => x.conversa <= c.data && !x.liberado);

/** O técnico libera o jogador para negociar: ele assina assim que puder (nos 6 meses finais). */
export function liberarJogador(c: Carreira, mundo: Mundo, id: string): Carreira {
  const s = sondagemDe(c, id);
  const contrato = contratoDe(c, mundo, id);
  if (!s || !contrato) return c;
  const prazo = [c.data, somarDias(contrato.fim, -DIAS_DO_PRE)].sort().at(-1) as string;
  const e = estadoDe(c, id);
  return {
    ...c,
    sondagens: (c.sondagens ?? []).map((x) => (x === s ? { ...x, prazo, liberado: true } : x)),
    jogadores: { ...c.jogadores, [id]: { ...e, moral: Math.min(100, moralDe(e) + 5) } },
    noticias: [
      noticia(
        c.data,
        marcar("Você liberou {jogador} para acertar com o {clube}.", {
          jogador: mundo.jogador(id)?.nome ?? id,
          clube: mundo.clube(s.clube)?.nomeCurto ?? s.clube,
        }),
      ),
      ...c.noticias,
    ].slice(0, 200),
  };
}

/**
 * O dia das sondagens: novos clubes interessados (com aviso da diretoria e, na janela, uma
 * proposta para levar agora), a conversa do jogador, o lembrete e o pré-contrato no prazo.
 */
export function diaDasSondagens(
  c: Carreira,
  mundo: Mundo,
  data: string,
  rng: Rng,
): {
  sondagens: Sondagem[];
  preContratos: PreContrato[];
  propostas: PropostaRecebida[];
  noticias: Noticia[];
  decisao: boolean;
} {
  const nomeJ = (id: string) => mundo.jogador(id)?.nome ?? id;
  const nomeC = (id: string) => mundo.clube(id)?.nomeCurto ?? id;
  const noticias: Noticia[] = [];
  const preContratos: PreContrato[] = [];
  const propostas: PropostaRecebida[] = [];
  let decisao = false;
  const elenco = mundo.elenco(c.clube);
  const noElenco = new Set(elenco.map((j) => j.id));
  const sondagens: Sondagem[] = [];

  for (const s of c.sondagens ?? []) {
    const j = mundo.jogador(s.jogador);
    const contrato = contratoDe(c, mundo, s.jogador);
    if (!j || !contrato || !noElenco.has(s.jogador)) continue;
    if (s.conversa === data && !s.liberado) {
      decisao = true;
      noticias.push(
        noticia(
          data,
          marcar(
            "{jogador} veio conversar: tem proposta do {clube} e quer saber se o clube conta com ele. Espera a renovação até {prazo}; depois disso, assina o pré-contrato.",
            { jogador: j.nome, clube: nomeC(s.clube), prazo: s.prazo },
          ),
        ),
      );
    }
    if (!s.liberado && s.conversa < data && somarDias(s.prazo, -7) === data) {
      decisao = true;
      noticias.push(
        noticia(
          data,
          marcar(
            "Faltam 7 dias: {jogador} ainda espera a renovação antes de fechar com o {clube}.",
            {
              jogador: j.nome,
              clube: nomeC(s.clube),
            },
          ),
        ),
      );
    }
    if (s.prazo < data && diasEntre(data, contrato.fim) <= DIAS_DO_PRE) {
      preContratos.push({
        jogador: s.jogador,
        de: c.clube,
        para: s.clube,
        assinatura: data,
        chegada: somarDias(contrato.fim, 1),
        salario: salarioPedido(j, contrato, salarioBase),
      });
      noticias.push(
        noticia(
          data,
          marcar(
            "{jogador} assinou pré-contrato com o {clube} e sai quando o contrato acabar, em {data}.",
            { jogador: j.nome, clube: nomeC(s.clube), data: somarDias(contrato.fim, 1) },
          ),
        ),
      );
      continue;
    }
    sondagens.push(s);
  }

  // Novos interessados no último ano de contrato.
  const ja = new Set([
    ...sondagens.map((s) => s.jogador),
    ...preContratos.map((p) => p.jogador),
    ...(c.preContratos ?? []).map((p) => p.jogador),
  ]);
  const nivel = mundo.clube(c.clube)?.nivel ?? 0;
  for (const j of elenco) {
    if (ja.has(j.id) || j.forca < 55 || emprestadoAoClube(c, j.id)) continue;
    const contrato = contratoDe(c, mundo, j.id);
    if (!contrato) continue;
    const faltam = diasEntre(data, contrato.fim);
    if (faltam < 45 || faltam > DIAS_DA_SONDAGEM) continue;
    const peso = importanciaNoElenco(elenco, j.id);
    const chance = 0.004 * (peso === "craque" ? 1.5 : peso === "titular" ? 1 : 0.5);
    if (!rng.chance(chance)) continue;
    // Contente no clube, só se interessa por um clube do mesmo tamanho ou maior.
    const contente = moralDe(estadoDe(c, j.id)) >= 45;
    const candidatos = (mundo.clubes ?? []).filter(
      (x) =>
        x.id !== c.clube &&
        !x.filialDe &&
        x.nivel >= j.forca - 10 &&
        x.nivel <= j.forca + 5 &&
        (!contente || x.nivel >= nivel - 3),
    );
    if (!candidatos.length) continue;
    const clube = candidatos[rng.int(0, candidatos.length - 1)] as Clube;
    const conversa = somarDias(data, DIAS_ATE_A_CONVERSA);
    const prazo = [somarDias(conversa, DIAS_DE_ESPERA), somarDias(contrato.fim, -DIAS_DO_PRE)]
      .sort()
      .at(-1) as string;
    sondagens.push({ jogador: j.id, clube: clube.id, inicio: data, conversa, prazo });
    noticias.push(
      noticia(
        data,
        marcar(
          "A diretoria avisa: o {clube} está sondando {jogador}, que tem contrato até {fim}. Renove para segurá-lo.",
          { clube: clube.nomeCurto, jogador: nomeJ(j.id), fim: contrato.fim },
        ),
      ),
    );
    // Na janela, o clube também tenta levar agora, pagando menos por causa do fim do contrato.
    if (janelaAberta(mundo.pais(clube.pais), data)) {
      const valor = arredondar(valorDeMercado(j, data, contrato) * 0.85);
      if (valor > 0)
        propostas.push({
          id: `${j.id}:sondagem:${data}`,
          jogador: j.id,
          clube: clube.id,
          valor,
          ate: somarDias(data, DIAS_DA_PROPOSTA),
        });
    }
  }
  return { sondagens, preContratos, propostas, noticias, decisao };
}
