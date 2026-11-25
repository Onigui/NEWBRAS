import { useMemo, useState } from "react";
import type { Banco, Clube, Jogador } from "@newbras/data";
import { NOME_POSICAO } from "@newbras/data";
import {
  escalacaoAutomatica,
  NOMES_FORMACOES,
  rotuloMinuto,
  simularPartida,
  textoDoEvento,
  type Estilo,
  type Evento,
  type Formacao,
  type JogadorPartida,
  type LadoCampo,
  type ResultadoPartida,
  type TimePartida,
} from "@newbras/engine";
import { Escudo } from "../components/Escudo";
import { procurar, type Indices } from "../editor/indices";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { useEditor } from "../editor/useEditor";

/** Lances que aparecem no modo clássico; "todos os lances" mostra o resto. */
const PRINCIPAIS = new Set<Evento["tipo"]>([
  "inicio",
  "intervalo",
  "reinicio",
  "fim-tempo-normal",
  "inicio-prorrogacao",
  "fim",
  "gol",
  "gol-contra",
  "chute-trave",
  "cartao-amarelo",
  "cartao-vermelho",
  "penalti",
  "penalti-perdido",
  "lesao",
  "substituicao",
  "disputa-penaltis",
]);

const NOME_ESTILO: Record<Estilo, string> = {
  equilibrado: "Equilibrado",
  ataque: "Ataque total",
  "contra-ataque": "Contra-ataque",
};

interface Escolha {
  clubeId: string;
  formacao: Formacao;
  estilo: Estilo;
}

const paraPartida = (j: Jogador): JogadorPartida => ({
  id: j.id,
  nome: j.nome,
  posicao: j.posicao,
  lado: j.lado,
  forca: j.forca,
  atributos: j.atributos,
  ...(j.numero !== undefined ? { numero: j.numero } : {}),
});

function montarTime(indices: Indices, escolha: Escolha): TimePartida | null {
  const clube = indices.clubePorId.get(escolha.clubeId);
  if (!clube) return null;
  // A base não joga: só o elenco profissional.
  const jogadores = (indices.jogadoresDoClube.get(clube.id) ?? [])
    .filter((j) => !j.base)
    .map(paraPartida);
  if (jogadores.length < 11) return null;
  return {
    id: clube.id,
    nome: clube.nomeCurto,
    jogadores,
    escalacao: escalacaoAutomatica(jogadores, escolha.formacao),
    tatica: { estilo: escolha.estilo, marcacao: "leve", concentracao: "equilibrada" },
    cpu: true,
  };
}

export function Amistoso({ onBack }: { onBack: () => void }) {
  const ed = useEditor();
  const [casa, setCasa] = useState<Escolha>({
    clubeId: "bra-flamengo",
    formacao: "4-4-2",
    estilo: "equilibrado",
  });
  const [fora, setFora] = useState<Escolha>({
    clubeId: "bra-palmeiras",
    formacao: "4-3-3",
    estilo: "equilibrado",
  });
  const [rodada, setRodada] = useState(1);
  const [resultado, setResultado] = useState<{
    r: ResultadoPartida;
    casa: TimePartida;
    fora: TimePartida;
  } | null>(null);
  const [todos, setTodos] = useState(false);
  const [erro, setErro] = useState("");

  if (ed.carga.status !== "pronto" || !ed.banco || !ed.indices) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md rounded-md border-2 border-placar-borda bg-placar p-8 text-center">
          <h1 className="font-placar text-5xl font-extrabold">Amistoso</h1>
          <p className="mt-4 text-suave" role="status">
            {ed.carga.status === "erro"
              ? `Não foi possível montar o banco: ${ed.carga.mensagem}`
              : "Montando o banco mundial: 3.711 times e 95 mil jogadores…"}
          </p>
          {ed.carga.status === "erro" && (
            <Botao variante="primario" className="mt-6" onClick={onBack}>
              Voltar ao menu
            </Botao>
          )}
        </div>
      </div>
    );
  }
  const banco = ed.banco;
  const indices = ed.indices;

  const jogar = () => {
    const tCasa = montarTime(indices, casa);
    const tFora = montarTime(indices, fora);
    if (!tCasa || !tFora) {
      setErro("Escolha dois times com pelo menos 11 jogadores profissionais.");
      return;
    }
    if (tCasa.id === tFora.id) {
      setErro("Escolha dois times diferentes.");
      return;
    }
    setErro("");
    const r = simularPartida({
      semente: `amistoso:${tCasa.id}:${tFora.id}:${rodada}`,
      casa: tCasa,
      fora: tFora,
    });
    setResultado({ r, casa: tCasa, fora: tFora });
    setRodada((n) => n + 1);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-placar-borda bg-placar px-5 py-3">
        <div>
          <h1 className="font-placar text-4xl font-extrabold">Amistoso</h1>
          <p className="text-sm text-suave">
            Prévia do motor de partida: o jogo inteiro é simulado com os 22 em campo. O mini-campo
            chega na Fase 7.
          </p>
        </div>
        <Botao variante="primario" onClick={onBack}>
          Voltar ao menu
        </Botao>
      </header>

      <section className="grid gap-4 rounded-md border-2 border-placar-borda bg-placar p-4 md:grid-cols-[1fr_auto_1fr]">
        <EscolhaTime
          titulo="Mandante"
          escolha={casa}
          onMudar={setCasa}
          banco={banco}
          indices={indices}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <Botao variante="primario" onClick={jogar}>
            {resultado ? "Jogar de novo" : "Jogar"}
          </Botao>
          {erro && <p className="max-w-48 text-center text-sm text-[#ff8a7e]">{erro}</p>}
        </div>
        <EscolhaTime
          titulo="Visitante"
          escolha={fora}
          onMudar={setFora}
          banco={banco}
          indices={indices}
        />
      </section>

      {resultado && (
        <Placar
          resultado={resultado}
          indices={indices}
          todos={todos}
          onTodos={() => setTodos((t) => !t)}
        />
      )}
    </div>
  );
}

function EscolhaTime({
  titulo,
  escolha,
  onMudar,
  banco,
  indices,
}: {
  titulo: string;
  escolha: Escolha;
  onMudar: (e: Escolha) => void;
  banco: Banco;
  indices: Indices;
}) {
  const [busca, setBusca] = useState("");
  const clube = indices.clubePorId.get(escolha.clubeId);
  const achados = useMemo(() => procurar(banco, busca, 8).clubes, [banco, busca]);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-bold text-suave">{titulo}</p>
      <div className="flex items-center gap-3">
        {clube && <Escudo clube={clube} tamanho={40} />}
        <p className="truncate font-placar text-2xl font-bold">
          {clube?.nome ?? "Escolha um time"}
        </p>
      </div>
      <Campo rotulo="Trocar de time">
        <input
          className={estiloCampo}
          value={busca}
          placeholder="Ex.: Corinthians, Real Madrid"
          onChange={(e) => setBusca(e.target.value)}
        />
      </Campo>
      {achados.length > 0 && (
        <ul className="flex flex-col rounded border border-placar-borda">
          {achados.map((c: Clube) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-white/5"
                onClick={() => {
                  onMudar({ ...escolha, clubeId: c.id });
                  setBusca("");
                }}
              >
                <Escudo clube={c} tamanho={20} />
                <span className="truncate">{c.nome}</span>
                <span className="ml-auto text-xs text-suave">{c.pais}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Formação">
          <select
            className={estiloCampo}
            value={escolha.formacao}
            onChange={(e) => onMudar({ ...escolha, formacao: e.target.value as Formacao })}
          >
            {NOMES_FORMACOES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Estilo">
          <select
            className={estiloCampo}
            value={escolha.estilo}
            onChange={(e) => onMudar({ ...escolha, estilo: e.target.value as Estilo })}
          >
            {(Object.keys(NOME_ESTILO) as Estilo[]).map((s) => (
              <option key={s} value={s}>
                {NOME_ESTILO[s]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
    </div>
  );
}

function Placar({
  resultado,
  indices,
  todos,
  onTodos,
}: {
  resultado: { r: ResultadoPartida; casa: TimePartida; fora: TimePartida };
  indices: Indices;
  todos: boolean;
  onTodos: () => void;
}) {
  const { r, casa, fora } = resultado;
  const nomes = new Map([...casa.jogadores, ...fora.jogadores].map((j) => [j.id, j.nome]));
  const contexto = { nomes, times: { casa: casa.nome, fora: fora.nome } };
  const clubeCasa = indices.clubePorId.get(casa.id);
  const clubeFora = indices.clubePorId.get(fora.id);
  const eventos = r.eventos.filter((e) => todos || PRINCIPAIS.has(e.tipo));
  const e = r.estatisticas;
  const linhas: Array<[string, string | number, string | number]> = [
    ["Posse de bola", `${e.casa.posse}%`, `${e.fora.posse}%`],
    ["Chutes", e.casa.chutes, e.fora.chutes],
    ["Chutes no gol", e.casa.chutesNoGol, e.fora.chutesNoGol],
    ["Gols esperados (xG)", e.casa.xg.toFixed(2), e.fora.xg.toFixed(2)],
    [
      "Passes certos",
      `${e.casa.passesCertos}/${e.casa.passes}`,
      `${e.fora.passesCertos}/${e.fora.passes}`,
    ],
    ["Desarmes", e.casa.desarmes, e.fora.desarmes],
    ["Escanteios", e.casa.escanteios, e.fora.escanteios],
    ["Faltas", e.casa.faltas, e.fora.faltas],
    ["Impedimentos", e.casa.impedimentos, e.fora.impedimentos],
    ["Cartões amarelos", e.casa.amarelos, e.fora.amarelos],
    ["Cartões vermelhos", e.casa.vermelhos, e.fora.vermelhos],
    ["Defesas do goleiro", e.casa.defesas, e.fora.defesas],
  ];

  return (
    <>
      <section className="flex items-center justify-center gap-6 rounded-md border-2 border-placar-borda bg-placar px-4 py-5">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <span className="truncate text-right font-placar text-3xl font-bold">{casa.nome}</span>
          {clubeCasa && <Escudo clube={clubeCasa} tamanho={52} />}
        </div>
        <p
          className="font-placar text-6xl font-black tabular-nums text-canarinho"
          aria-label="Placar"
        >
          {r.placar[0]} x {r.placar[1]}
        </p>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {clubeFora && <Escudo clube={clubeFora} tamanho={52} />}
          <span className="truncate font-placar text-3xl font-bold">{fora.nome}</span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="min-w-0 rounded-md border-2 border-placar-borda bg-placar p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-placar text-2xl font-bold">Lance a lance</h2>
            <label className="flex items-center gap-2 text-sm text-suave">
              <input type="checkbox" checked={todos} onChange={onTodos} />
              Todos os lances
            </label>
          </div>
          <ol className="max-h-[32rem] overflow-y-auto text-sm">
            {eventos.map((ev, i) => (
              <li
                key={i}
                className={`flex gap-3 border-b border-placar-borda/50 py-1.5 ${ev.tipo === "gol" ? "font-bold text-canarinho" : ""}`}
              >
                <span className="w-14 shrink-0 text-right tabular-nums text-suave">
                  {rotuloMinuto(ev)}
                </span>
                <span>{textoDoEvento(ev, contexto)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-md border-2 border-placar-borda bg-placar p-4">
          <h2 className="mb-2 font-placar text-2xl font-bold">Estatísticas</h2>
          <table className="w-full text-sm">
            <tbody>
              {linhas.map(([nome, a, b]) => (
                <tr key={nome} className="border-b border-placar-borda/50">
                  <td className="py-1.5 text-left font-bold tabular-nums">{a}</td>
                  <td className="py-1.5 text-center text-suave">{nome}</td>
                  <td className="py-1.5 text-right font-bold tabular-nums">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(["casa", "fora"] as LadoCampo[]).map((lado) => (
          <Notas key={lado} resultado={r} time={lado === "casa" ? casa : fora} lado={lado} />
        ))}
      </div>
    </>
  );
}

function Notas({
  resultado,
  time,
  lado,
}: {
  resultado: ResultadoPartida;
  time: TimePartida;
  lado: LadoCampo;
}) {
  const porId = new Map(time.jogadores.map((j) => [j.id, j]));
  const jogadores = resultado.jogadores.filter((j) => j.time === lado);
  return (
    <section className="rounded-md border-2 border-placar-borda bg-placar p-4">
      <h2 className="mb-2 font-placar text-2xl font-bold">Notas: {time.nome}</h2>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-suave">
          <tr>
            <th className="py-1">Jogador</th>
            <th className="py-1">Posição</th>
            <th className="py-1 text-right">Min.</th>
            <th className="py-1 text-right">Gols</th>
            <th className="py-1 text-right">Fôlego</th>
            <th className="py-1 text-right">Nota</th>
          </tr>
        </thead>
        <tbody>
          {jogadores.map((j) => {
            const dados = porId.get(j.id);
            return (
              <tr key={j.id} className="border-b border-placar-borda/50">
                <td className="py-1.5">
                  {dados?.nome}
                  {!j.titular && <span className="ml-1 text-xs text-suave">entrou</span>}
                  {j.amarelos > 0 && <span className="ml-1 text-xs text-[#f5d020]">▮</span>}
                  {j.vermelho && <span className="ml-1 text-xs text-[#ff5b4a]">▮</span>}
                </td>
                <td className="py-1.5 text-suave">{dados ? NOME_POSICAO[dados.posicao] : ""}</td>
                <td className="py-1.5 text-right tabular-nums">{j.minutos}</td>
                <td className="py-1.5 text-right tabular-nums">{j.gols || ""}</td>
                <td className="py-1.5 text-right tabular-nums">{j.condicaoFinal}%</td>
                <td className="py-1.5 text-right font-bold tabular-nums">{j.nota.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
