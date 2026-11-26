/**
 * Notas e números de cada jogador durante a partida, em formato compacto: dá para ver quem está
 * mal (nota baixa, fôlego no fim) e decidir a troca sem tirar os olhos do jogo.
 */
import type { EstatisticasJogador, LadoCampo, TimePartida } from "@newbras/engine";
import { IconeHumor } from "./Resumo";
import { t } from "@newbras/textos";

const SIGLA = { G: "GOL", L: "LAT", Z: "ZAG", M: "MEI", A: "ATA" } as const;

/** Cor da nota: verde acima de 7, amarela entre 6 e 7, vermelha abaixo de 6. */
export function corDaNota(nota: number): string {
  if (nota >= 7) return "bg-[#3fa34d] text-white";
  if (nota >= 6) return "bg-[#d9b23a] text-[#1b1b1b]";
  return "bg-[#c8463c] text-white";
}

export function NotasAoVivo({
  jogadores,
  times,
  emCampo,
  destacar,
}: {
  jogadores: readonly EstatisticasJogador[];
  times: Record<LadoCampo, TimePartida>;
  emCampo: Record<LadoCampo, readonly (string | null)[]>;
  /** Lado do técnico humano, que aparece primeiro. */
  destacar: LadoCampo | null;
}) {
  const lados: LadoCampo[] = destacar === "fora" ? ["fora", "casa"] : ["casa", "fora"];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {lados.map((lado) => {
        const porId = new Map(times[lado].jogadores.map((j) => [j.id, j]));
        const doTime = jogadores.filter((j) => j.time === lado);
        const ordem = emCampo[lado];
        // Quem está em campo, na ordem das vagas; quem já saiu vai para o fim, apagado.
        const lista = [
          ...ordem.flatMap((id) => doTime.filter((j) => j.id === id)),
          ...doTime.filter((j) => !ordem.includes(j.id)),
        ];
        return (
          <div key={lado} className="min-w-0">
            <h3 className="mb-1 truncate font-placar text-lg font-bold">{times[lado].nome}</h3>
            <table className="w-full text-xs">
              <thead className="text-left text-suave">
                <tr>
                  <th className="py-0.5 font-normal">{t("Jogador")}</th>
                  <th className="py-0.5 text-right font-normal" title={t("Minutos em campo")}>
                    {t("Min")}
                  </th>
                  <th className="py-0.5 text-right font-normal" title={t("Gols / assistências")}>
                    G/A
                  </th>
                  <th
                    className="py-0.5 text-right font-normal"
                    title={t("Passes certos / tentados")}
                  >
                    {t("Passes")}
                  </th>
                  <th className="py-0.5 text-right font-normal" title={t("Fôlego")}>
                    {t("Fôlego")}
                  </th>
                  <th className="py-0.5 text-right font-normal">{t("Nota")}</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((j) => {
                  const dados = porId.get(j.id);
                  const saiu = !ordem.includes(j.id);
                  return (
                    <tr
                      key={j.id}
                      className={`border-b border-placar-borda/40 ${saiu ? "opacity-45" : ""}`}
                    >
                      <td className="max-w-0 truncate py-1">
                        <IconeHumor humor={j.humor} />
                        <span className="mr-1 text-suave">{dados ? SIGLA[dados.posicao] : ""}</span>
                        {dados?.nome.split(" ").slice(-2).join(" ")}
                        {j.amarelos > 0 && (
                          <span className="ml-1 text-[#f5d020]" title={t("Amarelo")}>
                            ▮
                          </span>
                        )}
                        {j.vermelho && (
                          <span className="ml-1 text-[#ff5b4a]" title={t("Expulso")}>
                            ▮
                          </span>
                        )}
                        {j.lesionado && (
                          <span className="ml-1" title={t("Lesionado")}>
                            ✚
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-right tabular-nums">{j.minutos}</td>
                      <td className="py-1 text-right tabular-nums">
                        {j.gols}/{j.assistencias}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {j.passesCertos}/{j.passes}
                      </td>
                      <td
                        className={`py-1 text-right tabular-nums ${j.condicaoFinal < 60 ? "text-[#ff8a7e]" : ""}`}
                      >
                        {j.condicaoFinal}%
                      </td>
                      <td className="py-1 text-right">
                        <span
                          className={`inline-block min-w-8 rounded px-1 text-center font-bold tabular-nums ${corDaNota(j.nota)}`}
                        >
                          {j.nota.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
