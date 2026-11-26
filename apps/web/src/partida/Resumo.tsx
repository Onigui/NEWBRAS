/** Peças da tela de partida: lance a lance, estatísticas e notas. */
import { DADOS_FUNCAO, NOME_POSICAO, NOME_POSICAO_CAMPO } from "@newbras/data";
import {
  rotuloMinuto,
  textoDoEvento,
  type ContextoNarracao,
  type EstatisticasTime,
  type Evento,
  type Humor,
  type LadoCampo,
  type ResultadoPartida,
  type TimePartida,
} from "@newbras/engine";
import { t } from "@newbras/textos";

/** Rótulo e símbolo de cada humor (o técnico vê antes e durante o jogo). */
export const HUMOR: Record<Humor, { nome: string; simbolo: string; cor: string }> = {
  otimo: { nome: t("Ótimo"), simbolo: "▲▲", cor: "text-[#5fd36b]" },
  bom: { nome: t("Bom"), simbolo: "▲", cor: "text-[#9bd36b]" },
  normal: { nome: t("Normal"), simbolo: "●", cor: "text-suave" },
  ruim: { nome: t("Ruim"), simbolo: "▼", cor: "text-[#f0a35a]" },
  pessimo: { nome: t("Péssimo"), simbolo: "▼▼", cor: "text-[#ff6b5e]" },
};

export function IconeHumor({ humor }: { humor: Humor }) {
  const h = HUMOR[humor];
  return (
    <span
      className={`mr-1 inline-block w-5 text-[10px] font-black ${h.cor}`}
      title={t("Humor: {nome}", { nome: h.nome })}
      aria-label={t("Humor {nome}", { nome: h.nome })}
    >
      {h.simbolo}
    </span>
  );
}

/** Lances do modo clássico; "todos os lances" mostra também chutes, faltas e escanteios. */
export const PRINCIPAIS = new Set<Evento["tipo"]>([
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
  "acrescimo",
  "mudanca-tatica",
]);

export function LanceALance({
  eventos,
  contexto,
  todos,
  onTodos,
  recentesPrimeiro = false,
  altura = "max-h-[32rem]",
}: {
  eventos: readonly Evento[];
  contexto: ContextoNarracao;
  todos: boolean;
  onTodos: () => void;
  recentesPrimeiro?: boolean;
  altura?: string;
}) {
  const lista = eventos.filter((e) => todos || PRINCIPAIS.has(e.tipo));
  const ordem = recentesPrimeiro ? [...lista].reverse() : lista;
  return (
    <section className="min-w-0 rounded-md border-2 border-placar-borda bg-placar p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-placar text-2xl font-bold">{t("Lance a lance")}</h2>
        <label className="flex items-center gap-2 text-sm text-suave">
          <input type="checkbox" checked={todos} onChange={onTodos} />
          {t("Todos os lances")}
        </label>
      </div>
      <ol className={`${altura} overflow-y-auto text-sm`} aria-live="polite">
        {ordem.map((ev, i) => (
          <li
            key={`${ev.periodo}-${ev.segundo}-${ev.tipo}-${i}`}
            className={`flex gap-3 border-b border-placar-borda/50 py-1.5 ${ev.tipo === "gol" ? "font-bold text-canarinho" : ""}`}
          >
            <span className="w-14 shrink-0 text-right text-suave tabular-nums">
              {rotuloMinuto(ev)}
            </span>
            <span>{textoDoEvento(ev, contexto)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Estatisticas({
  estatisticas,
}: {
  estatisticas: Readonly<Record<LadoCampo, EstatisticasTime>>;
}) {
  const { casa: c, fora: f } = estatisticas;
  const linhas: Array<[string, string | number, string | number]> = [
    [t("Posse de bola"), `${c.posse}%`, `${f.posse}%`],
    [t("Chutes"), c.chutes, f.chutes],
    [t("Chutes no gol"), c.chutesNoGol, f.chutesNoGol],
    [t("Gols esperados (xG)"), c.xg.toFixed(2), f.xg.toFixed(2)],
    [t("Passes certos"), `${c.passesCertos}/${c.passes}`, `${f.passesCertos}/${f.passes}`],
    [t("Desarmes"), c.desarmes, f.desarmes],
    [t("Escanteios"), c.escanteios, f.escanteios],
    [t("Faltas"), c.faltas, f.faltas],
    [t("Impedimentos"), c.impedimentos, f.impedimentos],
    [t("Cartões amarelos"), c.amarelos, f.amarelos],
    [t("Cartões vermelhos"), c.vermelhos, f.vermelhos],
    [t("Defesas do goleiro"), c.defesas, f.defesas],
  ];
  return (
    <section className="rounded-md border-2 border-placar-borda bg-placar p-4">
      <h2 className="mb-2 font-placar text-2xl font-bold">{t("Estatísticas")}</h2>
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
  );
}

export function Notas({
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
      <h2 className="mb-2 font-placar text-2xl font-bold">
        {t("Notas:")} {time.nome}
      </h2>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-suave">
          <tr>
            <th className="py-1">{t("Jogador")}</th>
            <th className="py-1">{t("Posição")}</th>
            <th className="py-1 text-right">{t("Min.")}</th>
            <th className="py-1 text-right">{t("Gols")}</th>
            <th className="py-1 text-right" title={t("Assistências")}>
              {t("Assist.")}
            </th>
            <th className="py-1 text-right">{t("Fôlego")}</th>
            <th className="py-1 text-right">{t("Nota")}</th>
          </tr>
        </thead>
        <tbody>
          {jogadores.map((j) => {
            const dados = porId.get(j.id);
            return (
              <tr key={j.id} className="border-b border-placar-borda/50">
                <td className="py-1.5">
                  <IconeHumor humor={j.humor} />
                  {dados?.nome}
                  {!j.titular && <span className="ml-1 text-xs text-suave">{t("entrou")}</span>}
                  {j.amarelos > 0 && <span className="ml-1 text-xs text-[#f5d020]">▮</span>}
                  {j.vermelho && <span className="ml-1 text-xs text-[#ff5b4a]">▮</span>}
                </td>
                <td
                  className="py-1.5 text-suave"
                  title={j.papel ? DADOS_FUNCAO[j.papel.funcao].nome : undefined}
                >
                  {j.papel
                    ? NOME_POSICAO_CAMPO[j.papel.posicao]
                    : dados
                      ? NOME_POSICAO[dados.posicao]
                      : ""}
                </td>
                <td className="py-1.5 text-right tabular-nums">{j.minutos}</td>
                <td className="py-1.5 text-right tabular-nums">{j.gols || ""}</td>
                <td className="py-1.5 text-right tabular-nums">{j.assistencias || ""}</td>
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
