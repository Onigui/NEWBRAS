/**
 * Geometria do campo. Medidas em metros: 105 de comprimento (x) e 68 de largura (y).
 *
 * O motor trabalha muito no "quadro de ataque" de cada time: o próprio gol em x = 0 e o gol
 * adversário em x = 105, com a esquerda do time em y > 34. Para o time que ataca para o lado
 * de x = 0, o quadro é o campo girado 180 graus.
 */
export const COMPRIMENTO = 105;
export const LARGURA = 68;
export const MEIO_X = COMPRIMENTO / 2;
export const MEIO_Y = LARGURA / 2;
/** Limite da grande área, medido a partir da linha de fundo. */
export const AREA_X = 16.5;
/** Meia-largura da grande área. */
export const AREA_MEIA_LARGURA = 20.16;

export interface Ponto {
  x: number;
  y: number;
}

export const limitar = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Distância entre dois pontos (sqrt direto: Math.hypot é bem mais lento e isto roda milhões de vezes). */
export const distancia = (a: Ponto, b: Ponto) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/** Converte entre o campo e o quadro de ataque (a conversão é a mesma nos dois sentidos). */
export function noQuadro(p: Ponto, atacaParaDireita: boolean): Ponto {
  return atacaParaDireita ? { x: p.x, y: p.y } : { x: COMPRIMENTO - p.x, y: LARGURA - p.y };
}

/** Distância até o centro do gol adversário, num ponto já no quadro de ataque. */
export const distanciaAoGol = (p: Ponto) => {
  const dx = COMPRIMENTO - p.x;
  const dy = MEIO_Y - p.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/** Dentro da grande área adversária (ponto no quadro de ataque). */
export const naArea = (p: Ponto) =>
  p.x >= COMPRIMENTO - AREA_X && Math.abs(p.y - MEIO_Y) <= AREA_MEIA_LARGURA;

/** Distância do ponto p ao segmento a-b (para saber quem corta uma linha de passe). */
export function distanciaAoSegmento(p: Ponto, a: Ponto, b: Ponto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimento2 = dx * dx + dy * dy;
  if (comprimento2 === 0) return distancia(p, a);
  const t = limitar(((p.x - a.x) * dx + (p.y - a.y) * dy) / comprimento2, 0, 1);
  const ex = p.x - (a.x + t * dx);
  const ey = p.y - (a.y + t * dy);
  return Math.sqrt(ex * ex + ey * ey);
}
