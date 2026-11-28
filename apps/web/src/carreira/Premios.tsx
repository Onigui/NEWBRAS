/**
 * Prêmios e rankings (etapa 15c): ranking mundial e por país de técnicos e clubes, os prêmios de
 * cada liga (Bola de Ouro, Bola de Prata, artilheiro, revelação e técnico da temporada) e o melhor
 * do mundo de cada ano.
 */
import { useMemo, useState } from "react";
import type { Posicao } from "@newbras/data";
import {
  faixaDaReputacao,
  nomearTecnicos,
  rankingDeClubes,
  rankingDeTecnicos,
  type Carreira,
  type FaixaDeReputacao,
  type Premiado,
  type PremiosDaLiga,
} from "@newbras/engine";
import { t } from "@newbras/textos";
import { Escudo } from "../components/Escudo";
import { Campo, estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";

const MOSTRAR = 30;

const NOME_DA_FAIXA: Record<FaixaDeReputacao, string> = {
  municipal: t("municipal"),
  estadual: t("estadual"),
  nacional: t("nacional"),
  continental: t("continental"),
  mundial: t("mundial"),
  lenda: t("lenda"),
};

const NOME_POSICAO: Record<Posicao, string> = {
  G: t("Goleiro"),
  L: t("Lateral"),
  Z: t("Zagueiro"),
  M: t("Meio-campo"),
  A: t("Atacante"),
};

const aba = (ativa: boolean) =>
  `rounded px-2 py-0.5 text-xs ${ativa ? "bg-canarinho font-bold text-black" : "border border-placar-borda hover:border-canarinho"}`;

export function Premios({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  return (
    <div className="flex flex-col gap-5">
      <Rankings c={c} montado={montado} />
      <PremiosDasLigas c={c} montado={montado} />
      <MelhoresDoMundo c={c} montado={montado} />
    </div>
  );
}

function Rankings({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo } = montado;
  const [tipo, setTipo] = useState<"tecnicos" | "clubes">("tecnicos");
  const paisDoClube = mundo.clube(c.clube)?.pais ?? "";
  const [pais, setPais] = useState<string>("");
  const todos = montado.banco.clubes;
  const tecnicos = useMemo(() => rankingDeTecnicos(c, mundo, todos, c.data), [c, mundo, todos]);
  const clubes = useMemo(() => rankingDeClubes(c, mundo, todos, c.data), [c, mundo, todos]);
  const paises = useMemo(
    () =>
      [...new Set(todos.map((x) => x.pais))]
        .map((p) => ({ p, nome: mundo.pais(p)?.nome ?? p }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [todos, mundo],
  );
  const doPais = (id: string) => !pais || mundo.clube(id)?.pais === pais;
  const listaTec = tecnicos.filter((x) => doPais(x.clube));
  const listaClu = clubes.filter((x) => doPais(x.id));
  const posTec = listaTec.findIndex((x) => x.humano);
  const posClu = listaClu.findIndex((x) => x.id === c.clube);
  const comPosicao = <T,>(lista: readonly T[], minha: number) => [
    ...lista.slice(0, MOSTRAR).map((x, i) => ({ x, pos: i + 1 })),
    ...(minha >= MOSTRAR ? [{ x: lista[minha]!, pos: minha + 1 }] : []),
  ];
  const linhasTec = comPosicao(listaTec, posTec);
  const nomes = nomearTecnicos(
    linhasTec.map((l) => l.x),
    mundo,
    c.semente,
  );
  const visiveisTec = linhasTec.map((l, i) => ({ ...nomes[i]!, pos: l.pos }));
  const visiveisClu = comPosicao(listaClu, posClu).map((l) => ({ ...l.x, pos: l.pos }));
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-bold">{t("Rankings")}</h2>
        <button
          type="button"
          className={aba(tipo === "tecnicos")}
          onClick={() => setTipo("tecnicos")}
        >
          {t("Técnicos")}
        </button>
        <button type="button" className={aba(tipo === "clubes")} onClick={() => setTipo("clubes")}>
          {t("Clubes")}
        </button>
        <Campo rotulo={t("Onde")}>
          <select className={estiloCampo} value={pais} onChange={(e) => setPais(e.target.value)}>
            <option value="">{t("Mundo")}</option>
            {paisDoClube && (
              <option value={paisDoClube}>{mundo.pais(paisDoClube)?.nome ?? paisDoClube}</option>
            )}
            {paises
              .filter((x) => x.p !== paisDoClube)
              .map((x) => (
                <option key={x.p} value={x.p}>
                  {x.nome}
                </option>
              ))}
          </select>
        </Campo>
      </div>
      <p className="text-xs text-suave">
        {tipo === "tecnicos"
          ? t(
              "Pela reputação: o tamanho do clube, os títulos e as campanhas. Você está em {n}º lugar.",
              { n: posTec + 1 },
            )
          : t(
              "Pontos das últimas 5 temporadas: liga (pela força dela), copas, continentais e mundiais. Antes da carreira, vale o tamanho do clube. O seu está em {n}º lugar.",
              { n: posClu + 1 },
            )}
      </p>
      <table className="w-full max-w-2xl text-sm">
        <thead className="text-left text-xs text-suave">
          <tr>
            <th className="w-10">#</th>
            <th>{tipo === "tecnicos" ? t("Técnico") : t("Clube")}</th>
            {tipo === "tecnicos" && <th>{t("Clube")}</th>}
            <th className="text-right">{tipo === "tecnicos" ? t("Reputação") : t("Pontos")}</th>
          </tr>
        </thead>
        <tbody>
          {tipo === "tecnicos"
            ? visiveisTec.map((x) => {
                const clube = mundo.clube(x.clube);
                return (
                  <tr
                    key={`${x.clube}:${x.humano}`}
                    className={x.humano ? "bg-canarinho/10 font-bold text-canarinho" : ""}
                  >
                    <td>{x.pos}º</td>
                    <td>{x.humano ? t("{nome} (você)", { nome: x.nome }) : x.nome}</td>
                    <td>
                      <span className="flex items-center gap-1.5">
                        {clube && <Escudo clube={clube} tamanho={16} />}
                        {clube?.nomeCurto ?? x.clube}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      {x.reputacao.toFixed(0)}{" "}
                      <span className="text-xs font-normal text-suave">
                        {NOME_DA_FAIXA[faixaDaReputacao(x.reputacao)]}
                      </span>
                    </td>
                  </tr>
                );
              })
            : visiveisClu.map((x) => {
                const clube = mundo.clube(x.id);
                return (
                  <tr
                    key={x.id}
                    className={x.id === c.clube ? "bg-canarinho/10 font-bold text-canarinho" : ""}
                  >
                    <td>{x.pos}º</td>
                    <td>
                      <span className="flex items-center gap-1.5">
                        {clube && <Escudo clube={clube} tamanho={16} />}
                        {clube?.nome ?? x.id}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{x.pontos.toFixed(1)}</td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </section>
  );
}

function PremiosDasLigas({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo } = montado;
  const ligas = c.premios?.ligas ?? [];
  const minhaLiga = ligas.find((p) =>
    c.competicoes.competicoes[p.competicao]?.participantes.includes(c.clube),
  )?.competicao;
  const opcoes = [...new Set(ligas.map((p) => p.competicao))]
    .map((id) => {
      const comp = mundo.competicao(id);
      const pais = comp?.escopo.tipo === "pais" ? mundo.pais(comp.escopo.pais)?.nome : "";
      return { id, nome: `${pais ? `${pais}: ` : ""}${comp?.nome ?? id}` };
    })
    .sort(
      (a, b) =>
        Number(b.id === minhaLiga) - Number(a.id === minhaLiga) || a.nome.localeCompare(b.nome),
    );
  const [escolha, setEscolha] = useState("");
  // Sem prêmio ainda na liga do técnico, abre na liga mais forte.
  const maisForte = [...ligas].sort((a, b) => b.forcaDaLiga - a.forcaDaLiga)[0]?.competicao;
  const liga = escolha || minhaLiga || maisForte || "";
  const temporadas = ligas.filter((p) => p.competicao === liga);
  const [indice, setIndice] = useState(0);
  const p = temporadas[Math.min(indice, temporadas.length - 1)];
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-bold">{t("Prêmios da temporada")}</h2>
        {opcoes.length > 0 && (
          <>
            <Campo rotulo={t("Liga")}>
              <select
                className={estiloCampo}
                value={liga}
                onChange={(e) => {
                  setEscolha(e.target.value);
                  setIndice(0);
                }}
              >
                {opcoes.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nome}
                  </option>
                ))}
              </select>
            </Campo>
            {temporadas.length > 1 && (
              <Campo rotulo={t("Temporada")}>
                <select
                  className={estiloCampo}
                  value={indice}
                  onChange={(e) => setIndice(Number(e.target.value))}
                >
                  {temporadas.map((x, i) => (
                    <option key={x.temporada} value={i}>
                      {x.temporada}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
          </>
        )}
      </div>
      {!p ? (
        <p className="text-sm text-suave">
          {t(
            "Os prêmios saem quando a temporada de cada liga termina: Bola de Ouro, Bola de Prata, artilheiro, revelação e técnico da temporada.",
          )}
        </p>
      ) : (
        <PremiosDeUmaLiga c={c} montado={montado} p={p} />
      )}
    </section>
  );
}

function Nome({ c, montado, x }: { c: Carreira; montado: MundoMontado; x: Premiado }) {
  const clube = montado.mundo.clube(x.clube);
  return (
    <span className={`flex items-center gap-1.5 ${x.clube === c.clube ? "text-canarinho" : ""}`}>
      {clube && <Escudo clube={clube} tamanho={16} />}
      <span className="font-bold">{x.nome}</span>
      <span className="text-xs text-suave">{clube?.nomeCurto ?? x.clube}</span>
    </span>
  );
}

function PremiosDeUmaLiga({
  c,
  montado,
  p,
}: {
  c: Carreira;
  montado: MundoMontado;
  p: PremiosDaLiga;
}) {
  const linhas: Posicao[] = ["A", "M", "Z", "L", "G"];
  const tecnico = p.tecnico ? montado.mundo.clube(p.tecnico.clube) : undefined;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <dl className="flex flex-col gap-2 rounded border border-placar-borda p-3 text-sm">
        {p.craque && (
          <div>
            <dt className="text-xs text-canarinho">{t("Bola de Ouro")}</dt>
            <dd>
              <Nome c={c} montado={montado} x={p.craque} />
            </dd>
          </div>
        )}
        {p.artilheiro && (
          <div>
            <dt className="text-xs text-suave">{t("Artilheiro")}</dt>
            <dd className="flex items-center gap-2">
              <Nome c={c} montado={montado} x={p.artilheiro} />
              <span className="tabular-nums">{t("{n} gols", { n: p.artilheiro.gols ?? 0 })}</span>
            </dd>
          </div>
        )}
        {p.revelacao && (
          <div>
            <dt className="text-xs text-suave">{t("Revelação (até 21 anos)")}</dt>
            <dd>
              <Nome c={c} montado={montado} x={p.revelacao} />
            </dd>
          </div>
        )}
        {p.tecnico && (
          <div>
            <dt className="text-xs text-suave">{t("Técnico da temporada")}</dt>
            <dd className={`flex items-center gap-1.5 ${p.tecnico.humano ? "text-canarinho" : ""}`}>
              {tecnico && <Escudo clube={tecnico} tamanho={16} />}
              <span className="font-bold">
                {p.tecnico.humano ? t("{nome} (você)", { nome: p.tecnico.nome }) : p.tecnico.nome}
              </span>
              <span className="text-xs text-suave">{tecnico?.nomeCurto ?? p.tecnico.clube}</span>
            </dd>
          </div>
        )}
      </dl>
      <div className="rounded border border-placar-borda p-3 text-sm">
        <p className="mb-2 text-xs text-suave">{t("Bola de Prata: a seleção da temporada")}</p>
        <div className="flex flex-col gap-2">
          {linhas.map((pos) => {
            const daLinha = p.selecao.filter((x) => x.posicao === pos);
            if (!daLinha.length) return null;
            return (
              <div key={pos} className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-2">
                <span className="pt-0.5 text-xs text-suave">{NOME_POSICAO[pos]}</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {daLinha.map((x) => (
                    <Nome key={x.jogador} c={c} montado={montado} x={x} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MelhoresDoMundo({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const anos = c.premios?.mundo ?? [];
  const [indice, setIndice] = useState(0);
  const ano = anos[Math.min(indice, anos.length - 1)];
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-bold">{t("Melhor do mundo")}</h2>
        {anos.length > 1 && (
          <Campo rotulo={t("Ano")}>
            <select
              className={estiloCampo}
              value={indice}
              onChange={(e) => setIndice(Number(e.target.value))}
            >
              {anos.map((x, i) => (
                <option key={x.ano} value={i}>
                  {x.ano}
                </option>
              ))}
            </select>
          </Campo>
        )}
      </div>
      {!ano ? (
        <p className="text-sm text-suave">
          {t(
            "Todo 1º de janeiro sai o melhor do mundo do ano que acabou, entre os premiados das ligas, pela força da liga e pelos títulos do clube e da seleção.",
          )}
        </p>
      ) : (
        <ol className="flex max-w-xl flex-col gap-1 text-sm">
          {ano.ranking.map((x, i) => (
            <li key={x.jogador} className="flex items-center gap-2">
              <span className={`w-8 tabular-nums ${i === 0 ? "font-bold text-canarinho" : ""}`}>
                {i + 1}º
              </span>
              <Nome c={c} montado={montado} x={x} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
