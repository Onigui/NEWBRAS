/**
 * O dinheiro dos amistosos (etapa 14d). Quem é bem maior cobra cachê para jogar: o técnico recebe
 * quando visita um clube 3 pontos de nível ou mais abaixo e paga quando recebe um clube bem maior
 * em casa (a bilheteria do jogo em casa continua dele). E chegam convites de excursão: amistosos
 * em campo neutro, no exterior, com cachê pago pelo organizador.
 */
import { marcar } from "@newbras/textos";
import type { Carreira, Compromisso, Mundo, Noticia } from "../carreira/carreira";
import { marcarAmistoso, problemasDoAmistoso } from "../carreira/carreira";
import { somarDias } from "../carreira/datas";
import { Rng } from "../rng";
import { lancar, receitaAnual } from "./financas";

export interface ConviteDeAmistoso {
  id: string;
  adversario: string;
  data: string;
  cache: number;
  /** Até quando responder. */
  ate: string;
}

const arredondar = (v: number) => Math.round(v / 10_000) * 10_000;

/** Cachê do amistoso para o técnico: positivo recebe, negativo paga. */
export function cacheDoAmistoso(
  c: Carreira,
  mundo: Mundo,
  pedido: { adversario: string; mando: "casa" | "fora"; neutro?: boolean; cache?: number },
): number {
  if (pedido.cache !== undefined) return pedido.cache;
  if (pedido.neutro) return 0;
  const nosso = mundo.clube(c.clube)?.nivel ?? 0;
  const adv = mundo.clube(pedido.adversario)?.nivel ?? 0;
  const peso = (d: number) => Math.min(3, Math.max(0.5, d / 5));
  if (pedido.mando === "fora" && nosso - adv >= 3)
    return arredondar(receitaAnual(mundo, c.clube) * 0.002 * peso(nosso - adv));
  if (pedido.mando === "casa" && adv - nosso >= 3)
    return -arredondar(receitaAnual(mundo, pedido.adversario) * 0.002 * peso(adv - nosso));
  return 0;
}

/** Lança o cachê do amistoso jogado (chamado ao registrar o jogo). */
export function cacheDoJogo(c: Carreira, mundo: Mundo, x: Compromisso): Carreira {
  if (x.tipo !== "amistoso") return c;
  const v = cacheDoAmistoso(c, mundo, x);
  return v ? lancar(c, mundo, x.data, { amistosos: v }) : c;
}

/** Convites de excursão: de vez em quando, um clube forte de outro país em campo neutro. */
export function convitesDoMes(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { convites: ConviteDeAmistoso[]; noticias: Noticia[] } {
  const atuais = (c.convitesAmistosos ?? []).filter((x) => x.ate >= data);
  const rng = new Rng(`${c.semente}:convite:${data}`);
  if (atuais.length >= 2 || !rng.chance(0.3)) return { convites: atuais, noticias: [] };
  const nosso = mundo.clube(c.clube);
  if (!nosso) return { convites: atuais, noticias: [] };
  const candidatos = (mundo.clubes ?? []).filter(
    (x) => x.pais !== nosso.pais && !x.filialDe && Math.abs(x.nivel - nosso.nivel) <= 6,
  );
  for (let i = 0; i < 8 && candidatos.length; i++) {
    const adv = candidatos[rng.int(0, candidatos.length - 1)];
    if (!adv) continue;
    const quando = somarDias(data, rng.int(15, 40));
    if (problemasDoAmistoso(c, mundo, { data: quando, adversario: adv.id }).length) continue;
    const cache = arredondar(receitaAnual(mundo, c.clube) * rng.float(0.003, 0.008));
    const convite = {
      id: `convite:${data}:${adv.id}`,
      adversario: adv.id,
      data: quando,
      cache,
      ate: somarDias(data, 10),
    };
    return {
      convites: [...atuais, convite],
      noticias: [
        {
          data,
          tipo: "jogo",
          ...marcar(
            "Convite para excursão: amistoso contra o {clube} em campo neutro, cachê de {cache}. Responda na aba Jogos.",
            {
              clube: adv.nomeCurto,
              cache,
            },
          ),
        },
      ],
    };
  }
  return { convites: atuais, noticias: [] };
}

/** Aceita (marca o amistoso em campo neutro, com o cachê) ou recusa o convite. */
export function responderConvite(
  c: Carreira,
  mundo: Mundo,
  id: string,
  aceitar: boolean,
): Carreira {
  const convite = (c.convitesAmistosos ?? []).find((x) => x.id === id);
  if (!convite) return c;
  const sem = { ...c, convitesAmistosos: (c.convitesAmistosos ?? []).filter((x) => x !== convite) };
  if (!aceitar) return sem;
  return marcarAmistoso(sem, mundo, {
    data: convite.data,
    adversario: convite.adversario,
    mando: "fora",
    neutro: true,
    cache: convite.cache,
  });
}
