/**
 * Mercado (etapa 13a): caixa e janela, propostas recebidas, busca de jogadores no mundo inteiro
 * (com proposta de compra ou contratação de livre), jogadores à venda e transferências do clube.
 */
import { useState } from "react";
import { NOME_POSICAO, type Jogador, type Posicao } from "@newbras/data";
import {
  aceitarProposta,
  caixaDe,
  contratarLivre,
  dataCurta,
  idadeEm,
  janelaAberta,
  livresDe,
  pedidoDoClube,
  porAVenda,
  proporCompra,
  proximaJanela,
  recusarProposta,
  valorDeMercado,
  type Carreira,
  type ResultadoProposta,
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
      return r.motivo === "janela-fechada"
        ? t("A janela de transferências está fechada: fora dela, só jogadores livres.")
        : r.motivo === "caixa"
          ? t("Não há dinheiro em caixa para essa oferta.")
          : r.motivo === "elenco-cheio"
            ? t("O elenco já tem 30 profissionais.")
            : t("Não dá para negociar esse jogador.");
  }
}

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
  });
  const [lista, setLista] = useState<Jogador[] | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [oferta, setOferta] = useState(0);
  const [resposta, setResposta] = useState<Record<string, string>>({});

  const buscar = () => {
    const nome = filtro.nome.trim().toLowerCase();
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
        (!nome || j.nome.toLowerCase().includes(nome)) &&
        (!filtro.valorMax || valorDeMercado(j, c.data) <= filtro.valorMax),
    );
    achados.sort((a, b) => b.forca - a.forca);
    setLista(achados.slice(0, LIMITE));
  };

  const propostas = (c.propostas ?? []).filter((p) => p.ate >= c.data);
  const aVenda = c.aVenda ?? [];
  const historico = (c.transferencias ?? [])
    .filter((x) => x.de === c.clube || x.para === c.clube)
    .slice(-20)
    .reverse();

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
                  {t("{clube} oferece {valor} por {jogador} (até {data}).", {
                    clube: mundo.clube(p.clube)?.nomeCurto ?? p.clube,
                    valor: dinheiro(p.valor),
                    jogador: mundo.jogador(p.jogador)?.nome ?? p.jogador,
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
              className={`${estiloCampo} w-20`}
              value={filtro.forcaMin}
              onChange={(e) => setFiltro({ ...filtro, forcaMin: Number(e.target.value) })}
            />
          </Campo>
          <Campo rotulo={t("Idade máxima")}>
            <input
              type="number"
              className={`${estiloCampo} w-20`}
              value={filtro.idadeMax}
              onChange={(e) => setFiltro({ ...filtro, idadeMax: Number(e.target.value) })}
            />
          </Campo>
          <Campo rotulo={t("Valor máximo (0 = qualquer)")}>
            <input
              type="number"
              className={`${estiloCampo} w-36`}
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
                return (
                  <tr key={j.id} className="border-b border-white/5 align-top">
                    <td className="py-1 pr-2 text-xs font-bold text-suave">
                      {NOME_POSICAO[j.posicao]}
                    </td>
                    <td className="py-1 pr-2">
                      {j.nome}
                      {j.estrela && <span className="ml-1 text-canarinho">★</span>}
                      {resposta[j.id] && <p className="text-xs text-[#ffc38a]">{resposta[j.id]}</p>}
                    </td>
                    <td className="py-1 pr-2 text-right">{idadeEm(j.nascimento, c.data)}</td>
                    <td className="py-1 pr-2 text-right font-bold">{j.forca}</td>
                    <td className="py-1 pr-2 text-right text-suave">{j.potencial}</td>
                    <td className="py-1 pr-2 text-suave">
                      {j.clube ? (mundo.clube(j.clube)?.nomeCurto ?? j.clube) : t("livre")}
                    </td>
                    <td className="py-1 pr-2 text-right">{j.clube ? dinheiro(valor) : "—"}</td>
                    <td className="py-1">
                      {!j.clube ? (
                        <button
                          type="button"
                          className={botao}
                          onClick={() => {
                            const r = contratarLivre(c, mundo, j.id);
                            setResposta({ ...resposta, [j.id]: textoDoResultado(r.resultado) });
                            mudar(() => r.carreira);
                          }}
                        >
                          {t("Contratar")}
                        </button>
                      ) : aberto === j.id ? (
                        <span className="flex flex-wrap items-center gap-1">
                          <input
                            type="number"
                            className={`${estiloCampo} w-32`}
                            value={oferta}
                            onChange={(e) => setOferta(Number(e.target.value))}
                          />
                          <button
                            type="button"
                            className={botao}
                            onClick={() => {
                              const r = proporCompra(c, mundo, j.id, oferta);
                              setResposta({ ...resposta, [j.id]: textoDoResultado(r.resultado) });
                              if (r.resultado.tipo === "aceita") setAberto(null);
                              mudar(() => r.carreira);
                            }}
                          >
                            {t("Enviar")}
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={botao}
                          onClick={() => {
                            setAberto(j.id);
                            setOferta(valor);
                          }}
                          title={t("O clube pede uns {pedido}", {
                            pedido: dinheiro(pedidoDoClube(c, mundo, j)),
                          })}
                        >
                          {t("Fazer proposta")}
                        </button>
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
                  <span>{mundo.jogador(id)?.nome ?? id}</span>
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
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Transferências do clube")}</h2>
          {historico.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {historico.map((x, i) => (
                <li key={`${x.jogador}-${x.data}-${i}`} className="text-suave">
                  {dataCurta(x.data)}: {mundo.jogador(x.jogador)?.nome ?? x.jogador}{" "}
                  {x.para === c.clube
                    ? t("chegou ({tipo})", {
                        tipo: x.valor ? dinheiro(x.valor) : t("livre"),
                      })
                    : x.para
                      ? t("foi para o {clube} ({valor})", {
                          clube: mundo.clube(x.para)?.nomeCurto ?? x.para,
                          valor: dinheiro(x.valor),
                        })
                      : x.tipo === "dispensa"
                        ? t("dispensado")
                        : t("saiu no fim do contrato")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-suave">{t("Nenhuma transferência ainda.")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
