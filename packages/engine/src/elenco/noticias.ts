/**
 * Notícias da virada do elenco (etapa 12a): quem do clube se aposentou, quem subiu dos juniores,
 * quem evoluiu e quem caiu na temporada nova, e as lendas do mundo que pararam ou renasceram.
 */
import { marcar, t } from "@newbras/textos";
import type { Carreira, EstadoJogador, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { idadeEm } from "../evolucao";
import { evolucaoDe } from "./mundo";

/** Lenda famosa o bastante para virar notícia no mundo todo. */
const FORCA_DE_MANCHETE = 86;
/** No máximo tantas lendas de fora do clube viram notícia num dia. */
const MANCHETES_POR_DIA = 6;
/** Quantos nomes a notícia da evolução mostra de cada lado. */
const NOMES_NA_EVOLUCAO = 4;

export function noticiasDoElenco(
  c: Carreira,
  hoje: Mundo,
  amanha: Mundo,
  data: string,
  jogadores: Record<string, EstadoJogador>,
): { jogadores: Record<string, EstadoJogador>; noticias: Noticia[] } {
  const noticias: Noticia[] = [];
  const antes = hoje.elenco(c.clube);
  const depois = amanha.elenco(c.clube);
  let novos = jogadores;
  if (antes !== depois) {
    const idsAntes = new Map(antes.map((j) => [j.id, j]));
    const idsDepois = new Set(depois.map((j) => j.id));
    novos = { ...jogadores };
    for (const j of antes) {
      if (idsDepois.has(j.id)) continue;
      delete novos[j.id];
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("{jogador} se aposentou aos {idade} anos.", {
          jogador: j.nome,
          idade: idadeEm(j.nascimento, data),
        }),
      });
    }
    for (const j of depois) {
      if (idsAntes.has(j.id)) continue;
      novos[j.id] = estadoDe(c, j.id);
      const renascido = j.id.endsWith("~r");
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar(
          renascido
            ? "{jogador} sobe ao time profissional aos {idade} anos: a lenda renascida pode chegar a força {potencial}."
            : "{jogador}, {idade} anos, sobe dos juniores (força {forca}, posição {posicao}).",
          {
            jogador: j.nome,
            idade: idadeEm(j.nascimento, data),
            forca: j.forca,
            potencial: j.potencial,
            posicao: j.posicao,
          },
        ),
      });
    }
    // Quem mais subiu e quem mais caiu na temporada nova.
    const mudancas = depois
      .map((j) => ({ j, d: j.forca - (idsAntes.get(j.id)?.forca ?? j.forca) }))
      .filter((x) => x.d !== 0);
    const lista = (l: typeof mudancas) =>
      l
        .slice(0, NOMES_NA_EVOLUCAO)
        .map((x) => `${x.j.nome} ${x.j.forca - x.d}→${x.j.forca}`)
        .join(", ");
    const subiram = mudancas.filter((x) => x.d > 0).sort((a, b) => b.d - a.d);
    const cairam = mudancas.filter((x) => x.d < 0).sort((a, b) => a.d - b.d);
    if (subiram.length || cairam.length)
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("Temporada nova no elenco. Evoluíram: {subiram}. Caíram: {cairam}.", {
          subiram: lista(subiram) || t("ninguém"),
          cairam: lista(cairam) || t("ninguém"),
        }),
      });
  }
  // No mundo: as lendas famosas que pararam hoje (e onde renasceram).
  const evolucao = evolucaoDe(amanha, c);
  if (evolucao?.ativo(data)) {
    const eventos = evolucao.eventos(data);
    const renasceu = new Map(
      eventos.filter((e) => e.tipo === "renascimento").map((e) => [e.de ?? "", e]),
    );
    let manchetes = 0;
    for (const e of eventos) {
      if (e.tipo !== "aposentadoria") continue;
      const j = hoje.jogador(e.id);
      const r = renasceu.get(e.id);
      const nosso = r?.clube === c.clube;
      const famoso = (j?.forcaAuge ?? j?.forca ?? 0) >= FORCA_DE_MANCHETE;
      if (!j || (!nosso && (!famoso || manchetes >= MANCHETES_POR_DIA))) continue;
      if (e.clube === c.clube && !r) continue;
      if (!nosso) manchetes++;
      noticias.push({
        data,
        tipo: nosso ? "elenco" : "carreira",
        ...(r
          ? marcar(
              "{jogador} pendura as chuteiras aos {idade} anos e renasce como lenda: {novaIdade} anos, na base do {clube}.",
              {
                jogador: j.nome,
                idade: e.idade,
                novaIdade: r.idade,
                clube: amanha.clube(r.clube)?.nomeCurto ?? r.clube,
              },
            )
          : marcar("{jogador} pendura as chuteiras aos {idade} anos.", {
              jogador: j.nome,
              idade: e.idade,
            })),
      });
    }
  }
  return { jogadores: novos, noticias };
}
