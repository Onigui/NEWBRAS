import type { JogadorEntrada } from "@newbras/data";

type Caracteristicas = JogadorEntrada["caracteristicas"];

/**
 * Ajustes à mão para jogadores consagrados. O resto vem do modelo (valor de mercado, idade, posição).
 * - forca: força de hoje, quando o modelo erraria (lendas veteranas valem pouco no mercado);
 * - forcaAuge: a força do auge da carreira; é o potencial quando a lenda renascer;
 * - nascimento: data exata, conhecida;
 * - contratoFim: fim de contrato divulgado.
 * Escala do jogo: 99 é o topo absoluto; titulares de Premier League ficam perto de 85.
 */
export interface Notavel {
  forca?: number;
  forcaAuge: number;
  caracteristicas?: Caracteristicas;
  nascimento?: string;
  lado?: JogadorEntrada["lado"];
  posicao?: JogadorEntrada["posicao"];
  contratoFim?: string;
}

export const NOTAVEIS: Readonly<Record<string, Notavel>> = {
  // MLS
  "Lionel Messi": {
    forca: 86,
    forcaAuge: 99,
    caracteristicas: ["drible", "finalizacao"],
    nascimento: "1987-06-24",
    posicao: "A",
    contratoFim: "2028-12-31",
  },
  "Luis Suárez": {
    forca: 76,
    forcaAuge: 93,
    caracteristicas: ["finalizacao", "drible"],
    nascimento: "1987-01-24",
  },
  "Rodrigo De Paul": {
    forca: 81,
    forcaAuge: 85,
    caracteristicas: ["passe", "resistencia"],
    nascimento: "1994-05-24",
  },
  Casemiro: {
    forca: 79,
    forcaAuge: 89,
    caracteristicas: ["desarme", "marcacao"],
    nascimento: "1992-02-23",
  },
  "Sergio Reguilón": {
    forca: 74,
    forcaAuge: 82,
    caracteristicas: ["velocidade", "cruzamento"],
    nascimento: "1996-12-16",
    lado: "E",
  },
  "Robert Lewandowski": {
    forca: 84,
    forcaAuge: 95,
    caracteristicas: ["finalizacao", "cabeceio"],
    nascimento: "1988-08-21",
  },
  "Antoine Griezmann": {
    forca: 83,
    forcaAuge: 91,
    caracteristicas: ["finalizacao", "armacao"],
    nascimento: "1991-03-21",
  },
  "Heung-Min Son": {
    forca: 83,
    forcaAuge: 90,
    caracteristicas: ["finalizacao", "velocidade"],
    nascimento: "1992-07-08",
  },
  "Hugo Lloris": {
    forca: 76,
    forcaAuge: 89,
    caracteristicas: ["reflexo", "saida"],
    nascimento: "1986-12-26",
  },
  "Thomas Müller": {
    forca: 79,
    forcaAuge: 90,
    caracteristicas: ["armacao", "finalizacao"],
    nascimento: "1989-09-13",
  },
  "Marco Reus": {
    forca: 74,
    forcaAuge: 89,
    caracteristicas: ["armacao", "finalizacao"],
    nascimento: "1989-05-31",
  },
  "Hirving Lozano": {
    forca: 74,
    forcaAuge: 84,
    caracteristicas: ["velocidade", "drible"],
    nascimento: "1995-07-30",
  },
  "Sergi Roberto": {
    forca: 72,
    forcaAuge: 84,
    caracteristicas: ["passe", "resistencia"],
    nascimento: "1992-02-07",
  },
  "Alexis Sánchez": {
    forca: 74,
    forcaAuge: 88,
    caracteristicas: ["drible", "finalizacao"],
    nascimento: "1988-12-19",
  },
  "Timo Werner": {
    forca: 75,
    forcaAuge: 85,
    caracteristicas: ["velocidade", "finalizacao"],
    nascimento: "1996-03-06",
  },
  "Héctor Herrera": { forcaAuge: 84, nascimento: "1990-04-19" },
  "Emil Forsberg": { forcaAuge: 84, nascimento: "1991-10-23" },
  "Eric Maxim Choupo-Moting": { forcaAuge: 80, nascimento: "1989-03-23" },
  "André Gomes": { forcaAuge: 82, nascimento: "1993-07-30" },
  "Eric Bailly": { forcaAuge: 82, nascimento: "1994-04-12" },
  "Allan Saint-Maximin": { forcaAuge: 82, nascimento: "1997-03-12" },
  "Maya Yoshida": { forcaAuge: 79 },
  "Kyogo Furuhashi": { forcaAuge: 81 },
  "Riqui Puig": { forcaAuge: 79 },
  "Miguel Almirón": { forcaAuge: 81 },
  "Breel Embolo": { forcaAuge: 82 },

  // Saudi Pro League
  "Cristiano Ronaldo": {
    forca: 82,
    forcaAuge: 98,
    caracteristicas: ["finalizacao", "cabeceio"],
    nascimento: "1985-02-05",
    contratoFim: "2027-06-30",
  },
  "Sadio Mané": {
    forca: 78,
    forcaAuge: 90,
    caracteristicas: ["velocidade", "drible"],
    nascimento: "1992-04-10",
  },
  "Kalidou Koulibaly": {
    forca: 78,
    forcaAuge: 89,
    caracteristicas: ["desarme", "cabeceio"],
    nascimento: "1991-06-20",
  },
  "Yassine Bounou": {
    forca: 81,
    forcaAuge: 87,
    caracteristicas: ["reflexo", "penalti"],
    nascimento: "1991-04-05",
  },
  "Théo Hernández": {
    forcaAuge: 87,
    caracteristicas: ["velocidade", "cruzamento"],
    nascimento: "1997-10-06",
    lado: "E",
  },
  "Kingsley Coman": {
    forcaAuge: 86,
    caracteristicas: ["velocidade", "drible"],
    nascimento: "1996-06-13",
  },
  "João Félix": { forcaAuge: 84, nascimento: "1999-11-10" },
  "Iñigo Martínez": { forcaAuge: 84, nascimento: "1991-05-17" },
  "Rúben Neves": { forcaAuge: 84, nascimento: "1997-03-13" },
  "Milinković-Savić": { forcaAuge: 86, nascimento: "1995-02-27" },
  "Salem Al Dawsari": { forcaAuge: 80, nascimento: "1991-08-19" },
  Nacho: { forcaAuge: 84, nascimento: "1990-01-18" },
  "Édouard Mendy": { forcaAuge: 86, nascimento: "1992-03-01" },
  "Georginio Wijnaldum": { forcaAuge: 86, nascimento: "1990-11-11" },
  "Danilo Pereira": { forcaAuge: 83 },
  "Alexandre Lacazette": { forcaAuge: 86, nascimento: "1991-05-28" },
  "Idrissa Gueye": { forcaAuge: 84, nascimento: "1989-09-26" },
  "Thomas Partey": { forcaAuge: 85, nascimento: "1993-06-13" },
  "Yannick Carrasco": { forcaAuge: 85, nascimento: "1993-09-04" },
  "Nabil Fekir": { forcaAuge: 85, nascimento: "1993-07-18" },
  "Michy Batshuayi": { forcaAuge: 81 },
  "Moussa Dembélé": { forcaAuge: 82 },
  "Darwin Núñez": { forcaAuge: 84 },
  "Ivan Toney": { forcaAuge: 83 },
};
