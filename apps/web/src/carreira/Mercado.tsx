/**
 * Mercado (etapas 13a a 13c): caixa e janela, propostas recebidas (compra e empréstimo), leilões,
 * busca de jogadores no mundo inteiro (compra, empréstimo, troca, pré-contrato ou livre), à venda,
 * oferecidos por empréstimo, emprestados, pré-contratos e transferências do clube.
 */
import { useState } from "react";
import { NOME_POSICAO, type Jogador, type Posicao } from "@newbras/data";
import {
  aceitarProposta,
  avaliarTroca,
  caixaDe,
  condicoesDoEmprestimo,
  contratarLivre,
  darLance,
  dataCurta,
  fimParaPreContrato,
  idadeEm,
  janelaAberta,
  lanceMinimo,
  livresDe,
  maiorLance,
  pedidoDoClube,
  pegarEmprestado,
  porAVenda,
  porParaEmprestimo,
  presosEmNegocio,
  proporCompra,
  proporPreContrato,
  proporTroca,
  proximaJanela,
  recusarProposta,
  salarioDoPreContrato,
  valorDeMercado,
  type Carreira,
  type CondicoesDeEmprestimo,
  type Leilao,
  type ResultadoLance,
  type ResultadoPreContrato,
  type ResultadoProposta,
  type ResultadoTroca,
  type TipoTransferencia,
} from "@newbras/engine";
import { locale, t } from "@newbras/textos";
import { Campo, estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";

const botao =
  "rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho disabled:opacity-40";
const LIMITE = 60;

const dinheiro = (v: number) => v.toLocaleString(locale());

function textoDoResultado(r: ResultadoProposta): string {
  switch (r.tipo) {
    case "aceita":
      return r.valor
        ? t("Negócio fechado por {valor}. Salário de {salario} por mês.", {
            valor: dinheiro(r.valor),
            salario: dinheiro(r.salario),
          })
        : t("Contratado. Salário de {salario} por mês.", { salario: dinheiro(r.salario) });
    case "contraproposta":
      return t("Quase: o clube aceita por {pedido}.", { pedido: dinheiro(r.pedido) });
    case "recusa-clube":
      return r.motivo === "elenco-curto"
        ? t("O clube não vende: o elenco já está curto.")
        : r.motivo === "intransferivel"
          ? t(
              "Intransferível: o clube briga pelo título, não precisa de dinheiro e não abre mão dele por menos de {pedido}.",
              { pedido: dinheiro(r.pedido ?? 0) },
            )
          : t("O clube recusou: a oferta ficou longe do que ele quer (uns {pedido}).", {
              pedido: dinheiro(r.pedido ?? 0),
            });
    case "recusa-jogador":
      return t("O jogador não quer: o clube é de nível bem menor que o dele.");
    case "impossivel":
      return r.motivo === "proibido"
        ? t("Proibido de contratar: regularize os salários atrasados e a dívida (aba Finanças).")
        : r.motivo === "janela-fechada"
          ? t("A janela de transferências está fechada: fora dela, só jogadores livres.")
          : r.motivo === "caixa"
            ? t("Não há dinheiro em caixa para essa oferta.")
            : r.motivo === "elenco-cheio"
              ? t("O elenco já tem 30 profissionais.")
              : r.motivo === "em-negocio"
                ? t(
                    "Ele está emprestado, com pré-contrato ou em leilão: não dá para comprar agora.",
                  )
                : t("Não dá para negociar esse jogador.");
  }
}

function textoDoEmprestimo(r: CondicoesDeEmprestimo | { tipo: "caixa" }): string {
  if (r.tipo === "ok") return t("Empréstimo fechado até {fim}.", { fim: dataCurta(r.fim) });
  if (r.tipo === "caixa") return t("Não há dinheiro em caixa para a taxa.");
  switch (r.motivo) {
    case "titular":
      return t("O clube não empresta: ele conta com o jogador.");
    case "elenco-curto":
      return t("O clube não empresta: o elenco já está curto.");
    case "clube-menor":
      return t("O jogador não quer: o clube é de nível bem menor que o dele.");
    case "proibido":
      return t(
        "Proibido de contratar: regularize os salários atrasados e a dívida (aba Finanças).",
      );
    case "em-negocio":
      return t("Ele já está emprestado, com pré-contrato ou em leilão.");
    case "janela-fechada":
      return t("A janela de transferências está fechada: fora dela, só jogadores livres.");
    case "elenco-cheio":
      return t("O elenco já tem 30 profissionais.");
    default:
      return t("Não dá para negociar esse jogador.");
  }
}

function textoDaTroca(r: ResultadoTroca, nome: (id: string) => string): string {
  switch (r.tipo) {
    case "aceita":
      return t("Troca aceita.");
    case "falta-dinheiro":
      return t("O clube quer mais {valor} em dinheiro para fechar.", { valor: dinheiro(r.falta) });
    case "recusa-clube":
      return r.motivo === "intransferivel"
        ? t("Intransferível: o clube briga pelo título e não precisa de dinheiro.")
        : r.motivo === "sem-dinheiro"
          ? t("O clube não tem esse dinheiro para pagar a diferença.")
          : r.motivo === "elenco-cheio"
            ? t("O clube não tem vaga no elenco para tantos jogadores.")
            : t("O clube não troca: o elenco já está curto.");
    case "recusa-jogador":
      return t("{jogador} não quer ir: o clube é de nível bem menor que o dele.", {
        jogador: nome(r.jogador),
      });
    case "impossivel":
      return r.motivo === "proibido"
        ? t("Proibido de contratar: regularize os salários atrasados e a dívida (aba Finanças).")
        : r.motivo === "janela-fechada"
          ? t("Troca só com as janelas dos dois clubes abertas.")
          : r.motivo === "caixa"
            ? t("Não há dinheiro em caixa para a diferença.")
            : r.motivo === "elenco-cheio"
              ? t("O elenco já tem 30 profissionais.")
              : r.motivo === "em-negocio"
                ? t("Algum dos jogadores está emprestado, com pré-contrato ou em leilão.")
                : t("Escolha de 1 a 3 jogadores do elenco para oferecer.");
  }
}

function textoDoPreContrato(r: ResultadoPreContrato): string {
  switch (r.tipo) {
    case "aceita":
      return t("Pré-contrato assinado: ele chega em {data}.", { data: dataCurta(r.chegada) });
    case "recusa-jogador":
      return r.motivo === "clube-menor"
        ? t("O jogador não quer: o clube é de nível bem menor que o dele.")
        : r.motivo === "quer-ficar"
          ? t("Ele é titular e prefere ficar, a não ser por {pedido} por mês.", {
              pedido: dinheiro(r.pedido ?? 0),
            })
          : t("Ele pede pelo menos {pedido} por mês.", { pedido: dinheiro(r.pedido ?? 0) });
    case "impossivel":
      return r.motivo === "proibido"
        ? t("Proibido de contratar: regularize os salários atrasados e a dívida (aba Finanças).")
        : r.motivo === "contrato-longo"
          ? t("Pré-contrato só nos últimos 6 meses do contrato dele.")
          : r.motivo === "elenco-cheio"
            ? t("O elenco já tem 30 profissionais.")
            : r.motivo === "em-negocio"
              ? t("Ele já está emprestado, com pré-contrato ou em leilão.")
              : t("Não dá para negociar esse jogador.");
  }
}

function textoDoLance(r: ResultadoLance): string {
  if (r.tipo === "ok") return t("Lance dado.");
  switch (r.motivo) {
    case "baixo":
      return t("O lance mínimo agora é {valor}.", { valor: dinheiro(r.minimo ?? 0) });
    case "proibido":
      return t(
        "Proibido de contratar: regularize os salários atrasados e a dívida (aba Finanças).",
      );
    case "caixa":
      return t("Não há dinheiro em caixa para esse lance.");
    case "janela-fechada":
      return t("A janela de transferências está fechada.");
    case "elenco-cheio":
      return t("O elenco já tem 30 profissionais.");
    case "recusa-jogador":
      return t("O jogador não quer: o clube é de nível bem menor que o dele.");
    default:
      return t("O leilão já acabou.");
  }
}

/** Nome do tipo de transferência no histórico. */
function nomeDoTipo(tipo: TipoTransferencia): string {
  switch (tipo) {
    case "troca":
      return t("troca");
    case "emprestimo":
      return t("empréstimo");
    case "volta-de-emprestimo":
      return t("volta de empréstimo");
    case "opcao-de-compra":
      return t("opção de compra");
    case "pre-contrato":
      return t("pré-contrato");
    case "leilao":
      return t("leilão");
    case "livre":
      return t("livre");
    default:
      return "";
  }
}

type Modo = "compra" | "emprestimo" | "troca" | "pre";

export function Mercado({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const clube = mundo.clube(c.clube);
  const pais = mundo.pais(clube?.pais ?? "");
  const janela = janelaAberta(pais, c.data);
  const caixa = caixaDe(c, mundo);
  const [filtro, setFiltro] = useState({
    nome: "",
    posicao: "" as Posicao | "",
    forcaMin: 70,
    idadeMax: 40,
    valorMax: 0,
    livres: false,
    fimDeContrato: false,
  });
  const [lista, setLista] = useState<Jogador[] | null>(null);
  const [aberto, setAberto] = useState<{ id: string; modo: Modo } | null>(null);
  const [oferta, setOferta] = useState(0);
  const [resposta, setResposta] = useState<Record<string, string>>({});
  const [temporadas, setTemporadas] = useState<1 | 2>(1);
  const [comOpcao, setComOpcao] = useState(true);
  const [oferecidos, setOferecidos] = useState<string[]>([]);
  const [diferenca, setDiferenca] = useState(0);
  const [salario, setSalario] = useState(0);
  const [lances, setLances] = useState<Record<string, number>>({});
  const nome = (id: string) => mundo.jogador(id)?.nome ?? id;
  const nomeClube = (id: string) => mundo.clube(id)?.nomeCurto ?? id;
  const responder = (id: string, texto: string) => setResposta((r) => ({ ...r, [id]: texto }));

  const buscar = () => {
    const busca = filtro.nome.trim().toLowerCase();
    const livres = livresDe(c)
      .map((id) => mundo.jogador(id))
      .filter((j): j is Jogador => !!j && !j.clube);
    const todos = filtro.livres
      ? livres
      : [
          ...(mundo.clubes ?? [])
            .filter((x) => x.id !== c.clube)
            .flatMap((x) => mundo.elenco(x.id)),
          ...livres,
        ];
    const achados = todos.filter(
      (j) =>
        j.forca >= filtro.forcaMin &&
        idadeEm(j.nascimento, c.data) <= filtro.idadeMax &&
        (!filtro.posicao || j.posicao === filtro.posicao) &&
        (!busca || j.nome.toLowerCase().includes(busca)) &&
        (!filtro.valorMax || valorDeMercado(j, c.data) <= filtro.valorMax) &&
        (!filtro.fimDeContrato || (!!j.clube && !!fimParaPreContrato(j, c.data))),
    );
    achados.sort((a, b) => b.forca - a.forca);
    setLista(achados.slice(0, LIMITE));
  };

  const abrir = (j: Jogador, modo: Modo) => {
    if (aberto?.id === j.id && aberto.modo === modo) return setAberto(null);
    setAberto({ id: j.id, modo });
    if (modo === "compra") setOferta(valorDeMercado(j, c.data));
    if (modo === "troca") {
      setOferecidos([]);
      setDiferenca(0);
    }
    if (modo === "pre") setSalario(salarioDoPreContrato(mundo, j));
  };

  const propostas = (c.propostas ?? []).filter((p) => p.ate >= c.data);
  const aVenda = c.aVenda ?? [];
  const aEmprestimo = c.aEmprestimo ?? [];
  const leiloes = (c.leiloes ?? []).filter((l) => l.fim >= c.data);
  const emprestados = (c.emprestimos ?? []).filter((e) => e.para === c.clube || e.de === c.clube);
  const preContratos = (c.preContratos ?? []).filter((p) => p.para === c.clube || p.de === c.clube);
  const presos = presosEmNegocio(c);
  const meus = [...mundo.elenco(c.clube)]
    .filter((j) => !presos.has(j.id))
    .sort((a, b) => b.forca - a.forca);
  const historico = (c.transferencias ?? [])
    .filter((x) => x.de === c.clube || x.para === c.clube)
    .slice(-20)
    .reverse();

  const painel = (j: Jogador) => {
    if (!aberto || aberto.id !== j.id) return null;
    if (aberto.modo === "compra")
      return (
        <span className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-suave">
            {t("O clube pede uns {pedido}.", { pedido: dinheiro(pedidoDoClube(c, mundo, j)) })}
          </span>
          <input
            type="number"
            className={`${estiloCampo} w-32!`}
            value={oferta}
            onChange={(e) => setOferta(Number(e.target.value))}
          />
          <button
            type="button"
            className={botao}
            onClick={() => {
              const r = proporCompra(c, mundo, j.id, oferta);
              responder(j.id, textoDoResultado(r.resultado));
              if (r.resultado.tipo === "aceita") setAberto(null);
              mudar(() => r.carreira);
            }}
          >
            {t("Enviar proposta")}
          </button>
        </span>
      );
    if (aberto.modo === "emprestimo") {
      const cond = condicoesDoEmprestimo(c, mundo, j.id, temporadas);
      return (
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input type="radio" checked={temporadas === 1} onChange={() => setTemporadas(1)} />
              {t("Até o fim da temporada")}
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={temporadas === 2} onChange={() => setTemporadas(2)} />
              {t("Até o fim da próxima")}
            </label>
          </span>
          {cond.tipo === "ok" ? (
            <>
              <span className="text-xs">
                {t(
                  "Até {fim}: taxa de {taxa}; o clube paga {parte}% do salário ({salario} por mês).",
                  {
                    fim: dataCurta(cond.fim),
                    taxa: dinheiro(cond.taxa),
                    parte: Math.round(cond.parteDoSalario * 100),
                    salario: dinheiro(cond.salario),
                  },
                )}
              </span>
              {cond.opcao ? (
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={comOpcao}
                    onChange={(e) => setComOpcao(e.target.checked)}
                  />
                  {t("Com opção de compra por {valor}", { valor: dinheiro(cond.opcao) })}
                </label>
              ) : (
                <span className="text-xs text-suave">{t("Sem opção de compra.")}</span>
              )}
              <button
                type="button"
                className={`${botao} self-start`}
                onClick={() => {
                  const r = pegarEmprestado(c, mundo, j.id, temporadas, comOpcao);
                  responder(j.id, textoDoEmprestimo(r.resultado));
                  if (r.resultado.tipo === "ok") setAberto(null);
                  mudar(() => r.carreira);
                }}
              >
                {t("Fechar empréstimo")}
              </button>
            </>
          ) : (
            <span className="text-xs text-[#ffc38a]">{textoDoEmprestimo(cond)}</span>
          )}
        </span>
      );
    }
    if (aberto.modo === "troca") {
      const avaliacao = oferecidos.length
        ? avaliarTroca(c, mundo, j.id, oferecidos, diferenca)
        : undefined;
      return (
        <span className="flex flex-col gap-1">
          <span className="text-xs text-suave">{t("Escolha até 3 jogadores para oferecer:")}</span>
          <span className="flex max-h-32 flex-wrap gap-x-3 gap-y-0.5 overflow-y-auto text-xs">
            {meus.map((x) => (
              <label key={x.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={oferecidos.includes(x.id)}
                  disabled={!oferecidos.includes(x.id) && oferecidos.length >= 3}
                  onChange={(e) =>
                    setOferecidos(
                      e.target.checked
                        ? [...oferecidos, x.id]
                        : oferecidos.filter((y) => y !== x.id),
                    )
                  }
                />
                {NOME_POSICAO[x.posicao]} {x.nome} ({x.forca})
              </label>
            ))}
          </span>
          <span className="flex flex-wrap items-center gap-1 text-xs">
            {t("Diferença em dinheiro (negativo: o clube paga):")}
            <input
              type="number"
              className={`${estiloCampo} w-32!`}
              value={diferenca}
              onChange={(e) => setDiferenca(Number(e.target.value))}
            />
          </span>
          {avaliacao && (
            <span className="text-xs">
              {t("O clube vê {recebido} na oferta; pede {pedido}.", {
                recebido: dinheiro(avaliacao.recebido),
                pedido: dinheiro(avaliacao.pedido),
              })}{" "}
              <span className="text-[#ffc38a]">{textoDaTroca(avaliacao.resultado, nome)}</span>
            </span>
          )}
          <button
            type="button"
            className={`${botao} self-start`}
            disabled={avaliacao?.resultado.tipo !== "aceita"}
            onClick={() => {
              const r = proporTroca(c, mundo, j.id, oferecidos, diferenca);
              responder(j.id, textoDaTroca(r.resultado, nome));
              if (r.resultado.tipo === "aceita") setAberto(null);
              mudar(() => r.carreira);
            }}
          >
            {t("Fechar troca")}
          </button>
        </span>
      );
    }
    return (
      <span className="flex flex-wrap items-center gap-1 text-xs">
        {t("Salário por mês:")}
        <input
          type="number"
          className={`${estiloCampo} w-28!`}
          value={salario}
          onChange={(e) => setSalario(Number(e.target.value))}
        />
        <button
          type="button"
          className={botao}
          onClick={() => {
            const r = proporPreContrato(c, mundo, j.id, salario);
            responder(j.id, textoDoPreContrato(r.resultado));
            if (r.resultado.tipo === "aceita") setAberto(null);
            mudar(() => r.carreira);
          }}
        >
          {t("Assinar pré-contrato")}
        </button>
      </span>
    );
  };

  const linhaDoLeilao = (l: Leilao) => {
    const maior = maiorLance(l);
    const meu = l.vendedor === c.clube;
    const minimo = lanceMinimo(l);
    return (
      <li
        key={l.id}
        className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-1"
      >
        <span>
          {t("{jogador} ({forca}), do {clube}, até {fim}: {lance}.", {
            jogador: nome(l.jogador),
            forca: mundo.jogador(l.jogador)?.forca ?? "?",
            clube: nomeClube(l.vendedor),
            fim: dataCurta(l.fim),
            lance: maior
              ? t("maior lance {valor}, do {clube}", {
                  valor: dinheiro(maior.valor),
                  clube: maior.clube === c.clube ? t("seu clube") : nomeClube(maior.clube),
                })
              : t("sem lances (mínimo {valor})", { valor: dinheiro(l.minimo) }),
          })}
          {resposta[l.id] && <span className="ml-2 text-xs text-[#ffc38a]">{resposta[l.id]}</span>}
        </span>
        {meu ? (
          <span className="text-xs text-suave">{t("Seu leilão")}</span>
        ) : (
          <span className="flex items-center gap-1">
            <input
              type="number"
              className={`${estiloCampo} w-32!`}
              value={lances[l.id] ?? minimo}
              onChange={(e) => setLances({ ...lances, [l.id]: Number(e.target.value) })}
            />
            <button
              type="button"
              className={botao}
              onClick={() => {
                const r = darLance(c, mundo, l.id, lances[l.id] ?? minimo);
                responder(l.id, textoDoLance(r.resultado));
                mudar(() => r.carreira);
              }}
            >
              {t("Dar lance")}
            </button>
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-baseline gap-x-8 gap-y-1">
        <h2 className="font-placar text-2xl font-bold">
          {t("Caixa: {valor}", { valor: dinheiro(caixa) })}
        </h2>
        <p className={janela ? "text-[#7ed37a]" : "text-suave"}>
          {janela
            ? t("Janela aberta até {data}.", { data: dataCurta(janela.fim) })
            : t("Janela fechada: abre em {data}. Até lá, só jogadores livres.", {
                data: dataCurta(proximaJanela(pais, c.data)),
              })}
        </p>
      </section>

      {propostas.length > 0 && (
        <section>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Propostas recebidas")}</h2>
          <ul className="flex max-w-3xl flex-col gap-1 text-sm">
            {propostas.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 border-b border-white/5 py-1"
              >
                <span>
                  {p.emprestimo
                    ? t(
                        "{clube} quer {jogador} emprestado até {fim}: taxa de {valor}, pagando {parte}% do salário{opcao} (até {data}).",
                        {
                          clube: nomeClube(p.clube),
                          jogador: nome(p.jogador),
                          fim: dataCurta(p.emprestimo.fim),
                          valor: dinheiro(p.valor),
                          parte: Math.round(p.emprestimo.parteDoSalario * 100),
                          opcao: p.emprestimo.opcao
                            ? t(", com opção de compra por {valor}", {
                                valor: dinheiro(p.emprestimo.opcao),
                              })
                            : "",
                          data: dataCurta(p.ate),
                        },
                      )
                    : t("{clube} oferece {valor} por {jogador} (até {data}).", {
                        clube: nomeClube(p.clube),
                        valor: dinheiro(p.valor),
                        jogador: nome(p.jogador),
                        data: dataCurta(p.ate),
                      })}
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    className={botao}
                    onClick={() => mudar((x) => aceitarProposta(x, mundo, p.id))}
                  >
                    {t("Aceitar")}
                  </button>
                  <button
                    type="button"
                    className={botao}
                    onClick={() => mudar((x) => recusarProposta(x, p.id))}
                  >
                    {t("Recusar")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {leiloes.length > 0 && (
        <section>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Leilões")}</h2>
          <ul className="flex max-w-4xl flex-col gap-1 text-sm">{leiloes.map(linhaDoLeilao)}</ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-placar text-xl font-bold">{t("Buscar jogadores")}</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
          <Campo rotulo={t("Nome")}>
            <input
              className={estiloCampo}
              value={filtro.nome}
              onChange={(e) => setFiltro({ ...filtro, nome: e.target.value })}
            />
          </Campo>
          <Campo rotulo={t("Posição")}>
            <select
              className={estiloCampo}
              value={filtro.posicao}
              onChange={(e) => setFiltro({ ...filtro, posicao: e.target.value as Posicao | "" })}
            >
              <option value="">{t("Todas")}</option>
              {(["G", "Z", "L", "M", "A"] as const).map((p) => (
                <option key={p} value={p}>
                  {NOME_POSICAO[p]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo={t("Força mínima")}>
            <input
              type="number"
              className={`${estiloCampo} w-20!`}
              value={filtro.forcaMin}
              onChange={(e) => setFiltro({ ...filtro, forcaMin: Number(e.target.value) })}
            />
          </Campo>
          <Campo rotulo={t("Idade máxima")}>
            <input
              type="number"
              className={`${estiloCampo} w-20!`}
              value={filtro.idadeMax}
              onChange={(e) => setFiltro({ ...filtro, idadeMax: Number(e.target.value) })}
            />
          </Campo>
          <Campo rotulo={t("Valor máximo (0 = qualquer)")}>
            <input
              type="number"
              className={`${estiloCampo} w-36!`}
              value={filtro.valorMax}
              onChange={(e) => setFiltro({ ...filtro, valorMax: Number(e.target.value) })}
            />
          </Campo>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={filtro.livres}
              onChange={(e) => setFiltro({ ...filtro, livres: e.target.checked })}
            />
            {t("Só livres")}
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={filtro.fimDeContrato}
              onChange={(e) => setFiltro({ ...filtro, fimDeContrato: e.target.checked })}
            />
            {t("Só em fim de contrato (pré-contrato)")}
          </label>
          <button type="submit" className={botao}>
            {t("Buscar")}
          </button>
        </form>

        {lista && (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-suave">
              <tr>
                <th className="py-1 pr-2">{t("Pos.")}</th>
                <th className="py-1 pr-2">{t("Jogador")}</th>
                <th className="py-1 pr-2 text-right">{t("Idade")}</th>
                <th className="py-1 pr-2 text-right">{t("Força")}</th>
                <th className="py-1 pr-2 text-right">{t("Pot.")}</th>
                <th className="py-1 pr-2">{t("Clube")}</th>
                <th className="py-1 pr-2 text-right">{t("Valor")}</th>
                <th className="py-1 pr-2" />
              </tr>
            </thead>
            <tbody>
              {lista.map((j) => {
                const valor = valorDeMercado(j, c.data);
                const preso = presos.has(j.id);
                const fimDoContrato = j.clube ? fimParaPreContrato(j, c.data) : undefined;
                const modo = aberto?.id === j.id ? aberto.modo : undefined;
                const opcao = (m: Modo, texto: string) => (
                  <button
                    type="button"
                    className={`${botao} ${modo === m ? "border-canarinho text-canarinho" : ""}`}
                    onClick={() => abrir(j, m)}
                  >
                    {texto}
                  </button>
                );
                return (
                  <tr key={j.id} className="border-b border-white/5 align-top">
                    <td className="py-1 pr-2 text-xs font-bold text-suave">
                      {NOME_POSICAO[j.posicao]}
                    </td>
                    <td className="py-1 pr-2">
                      {j.nome}
                      {j.estrela && <span className="ml-1 text-canarinho">★</span>}
                      {fimDoContrato && (
                        <span className="ml-1 text-xs text-suave">
                          {t("(contrato até {data})", { data: dataCurta(fimDoContrato) })}
                        </span>
                      )}
                      {resposta[j.id] && <p className="text-xs text-[#ffc38a]">{resposta[j.id]}</p>}
                      {modo && <div className="mt-1">{painel(j)}</div>}
                    </td>
                    <td className="py-1 pr-2 text-right">{idadeEm(j.nascimento, c.data)}</td>
                    <td className="py-1 pr-2 text-right font-bold">{j.forca}</td>
                    <td className="py-1 pr-2 text-right text-suave">{j.potencial}</td>
                    <td className="py-1 pr-2 text-suave">
                      {j.clube ? nomeClube(j.clube) : t("livre")}
                    </td>
                    <td className="py-1 pr-2 text-right">{j.clube ? dinheiro(valor) : "—"}</td>
                    <td className="py-1">
                      {!j.clube ? (
                        <button
                          type="button"
                          className={botao}
                          onClick={() => {
                            const r = contratarLivre(c, mundo, j.id);
                            responder(j.id, textoDoResultado(r.resultado));
                            mudar(() => r.carreira);
                          }}
                        >
                          {t("Contratar")}
                        </button>
                      ) : preso ? (
                        <span className="text-xs text-suave">{t("Em negociação")}</span>
                      ) : (
                        <span className="flex gap-1 whitespace-nowrap">
                          {opcao("compra", t("Comprar"))}
                          {opcao("emprestimo", t("Emprestar"))}
                          {opcao("troca", t("Trocar"))}
                          {fimDoContrato && opcao("pre", t("Pré-contrato"))}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {lista && !lista.length && (
          <p className="mt-2 text-sm text-suave">{t("Ninguém com esses filtros.")}</p>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("À venda")}</h2>
          {aVenda.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {aVenda.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span>{nome(id)}</span>
                  <button
                    type="button"
                    className={botao}
                    onClick={() => mudar((x) => porAVenda(x, id, false))}
                  >
                    {t("Tirar da venda")}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-suave">
              {t("Ninguém à venda. Ponha um jogador à venda pela ficha dele, no Plantel.")}
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Oferecidos por empréstimo")}</h2>
          {aEmprestimo.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {aEmprestimo.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span>{nome(id)}</span>
                  <button
                    type="button"
                    className={botao}
                    onClick={() => mudar((x) => porParaEmprestimo(x, id, false))}
                  >
                    {t("Tirar do empréstimo")}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-suave">
              {t(
                "Ninguém oferecido. Ofereça um jogador por empréstimo pela ficha dele, no Plantel.",
              )}
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Empréstimos")}</h2>
          {emprestados.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {emprestados.map((e) => (
                <li key={`${e.jogador}-${e.inicio}`} className="text-suave">
                  {e.para === c.clube
                    ? t("{jogador}: veio do {clube} até {fim}{opcao}.", {
                        jogador: nome(e.jogador),
                        clube: nomeClube(e.de),
                        fim: dataCurta(e.fim),
                        opcao: e.opcao
                          ? t(" (opção de compra por {valor})", { valor: dinheiro(e.opcao) })
                          : "",
                      })
                    : t("{jogador}: emprestado ao {clube} até {fim}.", {
                        jogador: nome(e.jogador),
                        clube: nomeClube(e.para),
                        fim: dataCurta(e.fim),
                      })}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-suave">{t("Nenhum empréstimo em andamento.")}</p>
          )}
        </div>
        <div>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Pré-contratos")}</h2>
          {preContratos.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {preContratos.map((p) => (
                <li key={`${p.jogador}-${p.assinatura}`} className="text-suave">
                  {p.para === c.clube
                    ? t("{jogador} chega do {clube} em {data}.", {
                        jogador: nome(p.jogador),
                        clube: nomeClube(p.de),
                        data: dataCurta(p.chegada),
                      })
                    : t("{jogador} vai para o {clube} em {data}.", {
                        jogador: nome(p.jogador),
                        clube: nomeClube(p.para),
                        data: dataCurta(p.chegada),
                      })}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-suave">
              {t("Nenhum. Busque jogadores em fim de contrato para assinar de graça.")}
            </p>
          )}
        </div>
        <div className="lg:col-span-2">
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Transferências do clube")}</h2>
          {historico.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {historico.map((x, i) => {
                const tipo = nomeDoTipo(x.tipo);
                return (
                  <li key={`${x.jogador}-${x.data}-${i}`} className="text-suave">
                    {dataCurta(x.data)}: {nome(x.jogador)}{" "}
                    {x.para === c.clube
                      ? t("chegou ({tipo})", {
                          tipo:
                            [tipo, x.valor ? dinheiro(x.valor) : ""].filter(Boolean).join(", ") ||
                            t("livre"),
                        })
                      : x.para
                        ? t("foi para o {clube} ({valor})", {
                            clube: nomeClube(x.para),
                            valor: [tipo, x.valor ? dinheiro(x.valor) : ""]
                              .filter(Boolean)
                              .join(", "),
                          })
                        : x.tipo === "dispensa"
                          ? t("dispensado")
                          : t("saiu no fim do contrato")}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-suave">{t("Nenhuma transferência ainda.")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
