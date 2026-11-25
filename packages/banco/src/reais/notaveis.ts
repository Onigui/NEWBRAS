import type { Atributos, JogadorEntrada } from "@newbras/data";

type Caracteristicas = NonNullable<JogadorEntrada["caracteristicas"]>;

/**
 * Ajustes à mão para jogadores consagrados. O resto vem do modelo (valor de mercado, idade, posição).
 * - forca: força de hoje, quando o modelo erraria (lendas veteranas valem pouco no mercado);
 * - forcaAuge: a força do auge da carreira; é o potencial quando a lenda renascer;
 * - nascimento: data exata, conhecida;
 * - contratoFim: fim de contrato divulgado;
 * - destaques: atributos marcantes, na escala do auge (a velocidade do Werner);
 * - atributosAuge: o perfil inteiro no auge, à mão; a força do auge tem de sair dele (CR7 e Messi).
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
  destaques?: Atributos;
  atributosAuge?: Atributos;
}

export const NOTAVEIS: Readonly<Record<string, Notavel>> = {
  // MLS
  "Lionel Messi": {
    forca: 86,
    // O segundo maior da história: gênio com a bola, mas sem a altura, o cabeceio e o corpo do CR7.
    forcaAuge: 97,
    caracteristicas: ["drible", "finalizacao"],
    nascimento: "1987-06-24",
    posicao: "A",
    contratoFim: "2028-12-31",
    atributosAuge: {
      finalizacao: 99,
      drible: 100,
      velocidade: 97,
      chuteLonge: 99,
      passe: 99,
      cabeceio: 86,
      forcaFisica: 87,
      armacao: 99,
      cruzamento: 88,
      resistencia: 82,
      desarme: 38,
      marcacao: 32,
    },
  },
  "Luis Suárez": {
    forca: 76,
    forcaAuge: 93,
    caracteristicas: ["finalizacao", "drible"],
    nascimento: "1987-01-24",
    destaques: { finalizacao: 95 },
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
    destaques: { desarme: 92, forcaFisica: 90 },
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
    destaques: { finalizacao: 97, cabeceio: 92 },
  },
  "Antoine Griezmann": {
    forca: 83,
    forcaAuge: 91,
    caracteristicas: ["finalizacao", "armacao"],
    nascimento: "1991-03-21",
    destaques: { armacao: 91 },
  },
  "Heung-Min Son": {
    forca: 83,
    forcaAuge: 90,
    caracteristicas: ["finalizacao", "velocidade"],
    nascimento: "1992-07-08",
    destaques: { velocidade: 93, chuteLonge: 90 },
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
    destaques: { velocidade: 94 },
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
    // O único 99 do jogo: o jogador mais completo da história, quase tudo no máximo.
    forcaAuge: 99,
    caracteristicas: ["finalizacao", "cabeceio"],
    nascimento: "1985-02-05",
    posicao: "A",
    contratoFim: "2027-06-30",
    atributosAuge: {
      finalizacao: 100,
      cabeceio: 100,
      chuteLonge: 99,
      velocidade: 99,
      drible: 98,
      forcaFisica: 99,
      passe: 94,
      armacao: 86,
      cruzamento: 89,
      resistencia: 97,
      desarme: 52,
      marcacao: 48,
    },
  },
  "Sadio Mané": {
    forca: 78,
    forcaAuge: 90,
    caracteristicas: ["velocidade", "drible"],
    nascimento: "1992-04-10",
    destaques: { velocidade: 95 },
  },
  "Kalidou Koulibaly": {
    forca: 78,
    forcaAuge: 89,
    caracteristicas: ["desarme", "cabeceio"],
    nascimento: "1991-06-20",
    destaques: { forcaFisica: 94 },
  },
  "Yassine Bounou": {
    forca: 81,
    forcaAuge: 87,
    caracteristicas: ["reflexo", "penalti"],
    nascimento: "1991-04-05",
    destaques: { reflexo: 90 },
  },
  "Théo Hernández": {
    forcaAuge: 87,
    caracteristicas: ["velocidade", "cruzamento"],
    nascimento: "1997-10-06",
    lado: "E",
    destaques: { velocidade: 95 },
  },
  "Kingsley Coman": {
    forcaAuge: 86,
    caracteristicas: ["velocidade", "drible"],
    nascimento: "1996-06-13",
    destaques: { velocidade: 94 },
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
