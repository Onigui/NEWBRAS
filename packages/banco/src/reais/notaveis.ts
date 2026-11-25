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

  // Lendas vivas: o potencial é o auge da carreira e não baixa com a idade.
  Neymar: {
    forca: 80,
    forcaAuge: 95,
    caracteristicas: ["drible", "finalizacao"],
    nascimento: "1992-02-05",
    posicao: "A",
    lado: "E",
    destaques: { drible: 98, velocidade: 93, finalizacao: 93 },
  },
  "Luka Modrić": {
    forcaAuge: 92,
    caracteristicas: ["passe", "armacao"],
    nascimento: "1985-09-09",
    posicao: "M",
    destaques: { passe: 95, armacao: 94 },
  },
  "Kevin De Bruyne": {
    forcaAuge: 93,
    caracteristicas: ["passe", "armacao"],
    nascimento: "1991-06-28",
    posicao: "M",
    destaques: { passe: 97, chuteLonge: 93 },
  },
  "Mohamed Salah": {
    forcaAuge: 92,
    caracteristicas: ["velocidade", "finalizacao"],
    nascimento: "1992-06-15",
    posicao: "A",
    lado: "D",
    destaques: { velocidade: 94, finalizacao: 93 },
  },
  "Virgil van Dijk": {
    forcaAuge: 92,
    caracteristicas: ["marcacao", "cabeceio"],
    nascimento: "1991-07-08",
    posicao: "Z",
    destaques: { marcacao: 94, cabeceio: 93 },
  },
  "Harry Kane": {
    forcaAuge: 93,
    caracteristicas: ["finalizacao", "chuteLonge"],
    nascimento: "1993-07-28",
    posicao: "A",
    destaques: { finalizacao: 96, chuteLonge: 92 },
  },
  "Manuel Neuer": {
    forcaAuge: 93,
    caracteristicas: ["saida", "reflexo"],
    nascimento: "1986-03-27",
    posicao: "G",
    destaques: { saida: 97, reflexo: 94 },
  },
  "Thibaut Courtois": {
    forcaAuge: 92,
    caracteristicas: ["reflexo", "colocacao"],
    nascimento: "1992-05-11",
    posicao: "G",
    destaques: { reflexo: 94 },
  },
  "Alisson Becker": {
    forcaAuge: 91,
    caracteristicas: ["reflexo", "saida"],
    nascimento: "1992-10-02",
    posicao: "G",
  },
  "Jan Oblak": {
    forcaAuge: 91,
    caracteristicas: ["reflexo", "colocacao"],
    nascimento: "1993-01-07",
    posicao: "G",
  },
  "Thiago Silva": {
    forcaAuge: 91,
    caracteristicas: ["marcacao", "desarme"],
    nascimento: "1984-09-22",
    posicao: "Z",
    destaques: { marcacao: 94 },
  },
  Hulk: {
    forcaAuge: 87,
    caracteristicas: ["chuteLonge", "forcaFisica"],
    nascimento: "1986-07-25",
    posicao: "A",
    lado: "D",
    destaques: { chuteLonge: 95, forcaFisica: 95 },
  },
  "Ángel Di María": {
    forcaAuge: 89,
    caracteristicas: ["cruzamento", "drible"],
    nascimento: "1988-02-14",
    posicao: "A",
    lado: "D",
    destaques: { cruzamento: 92, drible: 91 },
  },
  "N'Golo Kanté": {
    forcaAuge: 90,
    caracteristicas: ["desarme", "resistencia"],
    nascimento: "1991-03-29",
    posicao: "M",
    destaques: { desarme: 94, resistencia: 97 },
  },
  "Paulo Dybala": {
    forcaAuge: 89,
    caracteristicas: ["drible", "chuteLonge"],
    nascimento: "1993-11-15",
    posicao: "A",
    destaques: { drible: 91, chuteLonge: 90 },
  },
  "Edin Džeko": {
    forcaAuge: 87,
    caracteristicas: ["finalizacao", "cabeceio"],
    nascimento: "1986-03-17",
    posicao: "A",
  },
  "Olivier Giroud": {
    forcaAuge: 86,
    caracteristicas: ["cabeceio", "finalizacao"],
    nascimento: "1986-09-30",
    posicao: "A",
  },
  "Pierre-Emerick Aubameyang": {
    forcaAuge: 88,
    caracteristicas: ["velocidade", "finalizacao"],
    nascimento: "1989-06-18",
    posicao: "A",
    destaques: { velocidade: 96 },
  },
  "İlkay Gündoğan": {
    forcaAuge: 89,
    caracteristicas: ["passe", "armacao"],
    nascimento: "1990-10-24",
    posicao: "M",
  },
  "Marco Verratti": {
    forcaAuge: 89,
    caracteristicas: ["passe", "drible"],
    nascimento: "1992-11-05",
    posicao: "M",
  },
  "Roberto Firmino": {
    forcaAuge: 87,
    caracteristicas: ["passe", "finalizacao"],
    nascimento: "1991-10-02",
    posicao: "A",
  },
  "Riyad Mahrez": {
    forcaAuge: 88,
    caracteristicas: ["drible", "cruzamento"],
    nascimento: "1991-02-21",
    posicao: "A",
    lado: "D",
  },
  Isco: {
    forcaAuge: 88,
    caracteristicas: ["drible", "passe"],
    nascimento: "1992-04-21",
    posicao: "M",
  },
  "Romelu Lukaku": {
    forcaAuge: 88,
    caracteristicas: ["forcaFisica", "finalizacao"],
    nascimento: "1993-05-13",
    posicao: "A",
    destaques: { forcaFisica: 96 },
  },
  "Marc ter Stegen": {
    forcaAuge: 90,
    caracteristicas: ["reflexo", "reposicao"],
    nascimento: "1992-04-30",
    posicao: "G",
  },
  "David de Gea": {
    forcaAuge: 90,
    caracteristicas: ["reflexo", "penalti"],
    nascimento: "1990-11-07",
    posicao: "G",
  },
  Ederson: {
    forcaAuge: 89,
    caracteristicas: ["reposicao", "saida"],
    nascimento: "1993-08-17",
    posicao: "G",
    destaques: { reposicao: 96 },
  },
  "Antonio Rüdiger": {
    forcaAuge: 88,
    caracteristicas: ["forcaFisica", "marcacao"],
    nascimento: "1993-03-03",
    posicao: "Z",
  },
  "David Alaba": {
    forcaAuge: 89,
    caracteristicas: ["passe", "marcacao"],
    nascimento: "1992-06-24",
    posicao: "Z",
  },
  "Daniel Carvajal": {
    forcaAuge: 88,
    caracteristicas: ["cruzamento", "resistencia"],
    nascimento: "1992-01-11",
    posicao: "L",
    lado: "D",
  },
  "João Cancelo": {
    forcaAuge: 88,
    caracteristicas: ["cruzamento", "drible"],
    nascimento: "1994-05-27",
    posicao: "L",
    lado: "E",
  },
  "Philippe Coutinho": {
    forcaAuge: 88,
    caracteristicas: ["chuteLonge", "drible"],
    nascimento: "1992-06-12",
    posicao: "M",
    destaques: { chuteLonge: 93 },
  },
  "James Rodríguez": {
    forcaAuge: 89,
    caracteristicas: ["chuteLonge", "passe"],
    nascimento: "1991-07-12",
    posicao: "M",
    destaques: { chuteLonge: 93 },
  },
  "Arturo Vidal": {
    forcaAuge: 89,
    caracteristicas: ["desarme", "resistencia"],
    nascimento: "1987-05-22",
    posicao: "M",
  },
  "Radamel Falcao": {
    forcaAuge: 90,
    caracteristicas: ["finalizacao", "cabeceio"],
    nascimento: "1986-02-10",
    posicao: "A",
    destaques: { finalizacao: 95 },
  },
  "Keylor Navas": {
    forcaAuge: 89,
    caracteristicas: ["reflexo", "penalti"],
    nascimento: "1986-12-15",
    posicao: "G",
  },

  // Joias de hoje: o potencial vem do ajuste à mão.
  "Lamine Yamal": {
    forcaAuge: 96,
    caracteristicas: ["drible", "passe"],
    destaques: { drible: 97 },
  },
  "Kylian Mbappé": {
    forcaAuge: 95,
    caracteristicas: ["velocidade", "finalizacao"],
    destaques: { velocidade: 98 },
  },
  "Erling Haaland": {
    forcaAuge: 95,
    caracteristicas: ["finalizacao", "forcaFisica"],
    destaques: { finalizacao: 97 },
  },
  "Jude Bellingham": { forcaAuge: 94, caracteristicas: ["armacao", "resistencia"] },
};
