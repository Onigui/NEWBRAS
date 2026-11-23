import type { ClubeEntrada, JogadorEntrada, Lado, Posicao } from "@newbras/data";
import type { Rng } from "../rng";
import { gerarJogador } from "./jogador";

interface Vaga {
  posicao: Posicao;
  lado?: Lado;
  /** Titulares ficam perto do nível do clube; reservas, um pouco abaixo. */
  titular: boolean;
  numero: number;
}

/**
 * Elenco padrão de 25 jogadores, dentro das cotas que o Brasfoot usa para os clubes da CPU
 * (3 goleiros, 4 laterais, 5 zagueiros, 8 meias, 5 atacantes), com numeração clássica.
 */
const ELENCO_PADRAO: readonly Vaga[] = [
  { posicao: "G", titular: true, numero: 1 },
  { posicao: "L", lado: "D", titular: true, numero: 2 },
  { posicao: "Z", titular: true, numero: 3 },
  { posicao: "Z", titular: true, numero: 4 },
  { posicao: "M", titular: true, numero: 5 },
  { posicao: "L", lado: "E", titular: true, numero: 6 },
  { posicao: "A", titular: true, numero: 7 },
  { posicao: "M", titular: true, numero: 8 },
  { posicao: "A", titular: true, numero: 9 },
  { posicao: "M", titular: true, numero: 10 },
  { posicao: "A", titular: true, numero: 11 },
  { posicao: "G", titular: false, numero: 12 },
  { posicao: "L", lado: "D", titular: false, numero: 13 },
  { posicao: "Z", titular: false, numero: 14 },
  { posicao: "Z", titular: false, numero: 15 },
  { posicao: "L", lado: "E", titular: false, numero: 16 },
  { posicao: "M", titular: false, numero: 17 },
  { posicao: "M", titular: false, numero: 18 },
  { posicao: "A", titular: false, numero: 19 },
  { posicao: "M", titular: false, numero: 20 },
  { posicao: "A", titular: false, numero: 21 },
  { posicao: "Z", titular: false, numero: 22 },
  { posicao: "G", titular: false, numero: 23 },
  { posicao: "M", titular: false, numero: 25 },
  { posicao: "M", titular: false, numero: 26 },
];

export interface OpcoesElenco {
  /** Nacionalidade predominante e o grupo de nomes do país do clube. */
  nacionalidade: string;
  grupoNomes: string;
  hoje: string;
  /** Estrangeiros possíveis no elenco, com o grupo de nomes de cada um. */
  estrangeiros?: ReadonlyArray<{ nacionalidade: string; grupoNomes: string }>;
  /** Fração de estrangeiros (0 a 1). */
  fracaoEstrangeiros?: number;
  fimDeContrato?: string;
}

/** Gera um elenco completo e válido para um clube. */
export function gerarElenco(
  rng: Rng,
  clube: Pick<ClubeEntrada, "id" | "nivel">,
  o: OpcoesElenco,
): JogadorEntrada[] {
  const fracao = o.estrangeiros?.length ? (o.fracaoEstrangeiros ?? 0.15) : 0;
  return ELENCO_PADRAO.map((vaga) => {
    const estrangeiro = fracao > 0 && rng.chance(fracao) ? rng.pick(o.estrangeiros!) : undefined;
    const nivel = vaga.titular ? clube.nivel : Math.max(1, clube.nivel - rng.int(4, 10));
    // Titulares tendem a estar perto do auge; goleiros titulares, um pouco mais velhos.
    const idadeTitular = Math.round(rng.normal(vaga.posicao === "G" ? 29 : 27, 3));
    const idade = vaga.titular ? Math.min(34, Math.max(20, idadeTitular)) : undefined;
    const jogador = gerarJogador(rng, {
      id: `${clube.id}-${vaga.numero}`,
      nacionalidade: estrangeiro?.nacionalidade ?? o.nacionalidade,
      grupoNomes: estrangeiro?.grupoNomes ?? o.grupoNomes,
      posicao: vaga.posicao,
      nivel,
      hoje: o.hoje,
      clube: clube.id,
      ...(idade !== undefined ? { idade } : {}),
      ...(vaga.lado ? { lado: vaga.lado } : {}),
      ...(o.fimDeContrato ? { fimDeContrato: o.fimDeContrato } : {}),
    });
    return { ...jogador, numero: vaga.numero };
  });
}
