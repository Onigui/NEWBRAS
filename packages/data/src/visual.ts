/**
 * Escudo e camisas que o jogo desenha quando o clube não definiu os seus.
 * Tudo sai do id e das cores, então o mesmo clube sempre tem o mesmo visual.
 */
import {
  FORMAS_ESCUDO,
  PADROES_CAMISA,
  PADROES_ESCUDO,
  type Camisa,
  type Clube,
  type Escudo,
} from "./schemas/clube";

/** Hash pequeno e estável (FNV-1a de 32 bits). */
export function hashTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Luminância relativa (0 a 1) de uma cor #RRGGBB. */
export function luminancia(cor: string): number {
  const canal = (i: number) => {
    const v = parseInt(cor.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
}

/** Preto ou branco, o que tiver mais contraste com o fundo. */
export function corDeTexto(fundo: string): "#111111" | "#FFFFFF" {
  return luminancia(fundo) > 0.4 ? "#111111" : "#FFFFFF";
}

type ClubeVisual = Pick<Clube, "id" | "cores" | "escudo" | "camisas">;

export function escudoDoClube(clube: ClubeVisual): Escudo {
  if (clube.escudo) return clube.escudo;
  const h = hashTexto(clube.id);
  return {
    forma: FORMAS_ESCUDO[h % FORMAS_ESCUDO.length]!,
    padrao: PADROES_ESCUDO[(h >>> 8) % PADROES_ESCUDO.length]!,
  };
}

/** As camisas do clube: as definidas, ou titular nas cores principais e reserva invertida. */
export function camisasDoClube(clube: ClubeVisual): Camisa[] {
  if (clube.camisas?.length) return clube.camisas;
  const h = hashTexto(`${clube.id}:camisa`);
  // Metade dos clubes usa camisa lisa; os outros, um dos desenhos.
  const desenhos = PADROES_CAMISA.filter((p) => p !== "lisa");
  const padrao = h % 2 === 0 ? "lisa" : desenhos[(h >>> 4) % desenhos.length]!;
  const { primaria, secundaria } = clube.cores;
  return [
    { padrao, cor1: primaria, cor2: secundaria },
    { padrao: "lisa", cor1: secundaria, cor2: primaria },
  ];
}
