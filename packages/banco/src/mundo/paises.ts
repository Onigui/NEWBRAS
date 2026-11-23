import type { Confederacao, Pais, Periodo } from "@newbras/data";

/**
 * As 211 seleções filiadas à FIFA.
 * Tupla: [código FIFA, nome em português, grupo de nomes do gerador, cor principal, cor secundária]
 */
type Linha = readonly [string, string, string, string, string];

const UEFA: readonly Linha[] = [
  ["ALB", "Albânia", "albanes", "#E41E20", "#000000"],
  ["AND", "Andorra", "es", "#0018A8", "#FEDF00"],
  ["ARM", "Armênia", "caucaso", "#D90012", "#0033A0"],
  ["AUT", "Áustria", "de", "#ED2939", "#FFFFFF"],
  ["AZE", "Azerbaijão", "tr", "#0092BC", "#E4002B"],
  ["BLR", "Belarus", "eslavo", "#C8313E", "#4AA657"],
  ["BEL", "Bélgica", "fr", "#E30613", "#000000"],
  ["BIH", "Bósnia e Herzegovina", "eslavo-sul", "#002395", "#FECB00"],
  ["BUL", "Bulgária", "eslavo", "#FFFFFF", "#00966E"],
  ["CRO", "Croácia", "eslavo-sul", "#FF0000", "#FFFFFF"],
  ["CYP", "Chipre", "grego", "#1F3B8C", "#FFFFFF"],
  ["CZE", "Tchéquia", "eslavo", "#D7141A", "#11457E"],
  ["DEN", "Dinamarca", "nordico", "#C8102E", "#FFFFFF"],
  ["ENG", "Inglaterra", "en", "#FFFFFF", "#1D2B5A"],
  ["EST", "Estônia", "baltico", "#0072CE", "#000000"],
  ["FRO", "Ilhas Faroé", "nordico", "#FFFFFF", "#0065BD"],
  ["FIN", "Finlândia", "nordico", "#FFFFFF", "#002F6C"],
  ["FRA", "França", "fr", "#1D2B5A", "#FFFFFF"],
  ["GEO", "Geórgia", "caucaso", "#FFFFFF", "#E8112D"],
  ["GER", "Alemanha", "de", "#FFFFFF", "#000000"],
  ["GIB", "Gibraltar", "en", "#DA000C", "#FFFFFF"],
  ["GRE", "Grécia", "grego", "#0D5EAF", "#FFFFFF"],
  ["HUN", "Hungria", "hungaro", "#CE2939", "#477050"],
  ["ISL", "Islândia", "nordico", "#02529C", "#FFFFFF"],
  ["ISR", "Israel", "hebraico", "#0038B8", "#FFFFFF"],
  ["ITA", "Itália", "it", "#0064AA", "#FFFFFF"],
  ["KAZ", "Cazaquistão", "asia-central", "#00AFCA", "#FEC50C"],
  ["KVX", "Kosovo", "albanes", "#244AA5", "#D0A650"],
  ["LVA", "Letônia", "baltico", "#9E3039", "#FFFFFF"],
  ["LIE", "Liechtenstein", "de", "#002B7F", "#CE1126"],
  ["LTU", "Lituânia", "baltico", "#FDB913", "#006A44"],
  ["LUX", "Luxemburgo", "fr", "#EF3340", "#00A3E0"],
  ["MLT", "Malta", "en", "#CF142B", "#FFFFFF"],
  ["MDA", "Moldávia", "romeno", "#0046AE", "#FFD200"],
  ["MNE", "Montenegro", "eslavo-sul", "#C40308", "#D3AE3B"],
  ["NED", "Holanda", "nl", "#F36C21", "#FFFFFF"],
  ["MKD", "Macedônia do Norte", "eslavo-sul", "#D20000", "#FFE600"],
  ["NIR", "Irlanda do Norte", "en", "#00843D", "#FFFFFF"],
  ["NOR", "Noruega", "nordico", "#BA0C2F", "#FFFFFF"],
  ["POL", "Polônia", "eslavo", "#FFFFFF", "#DC143C"],
  ["POR", "Portugal", "pt", "#C8102E", "#006600"],
  ["IRL", "Irlanda", "en", "#169B62", "#FFFFFF"],
  ["ROU", "Romênia", "romeno", "#FCD116", "#002B7F"],
  ["RUS", "Rússia", "eslavo", "#FFFFFF", "#D52B1E"],
  ["SMR", "San Marino", "it", "#5EB6E4", "#FFFFFF"],
  ["SCO", "Escócia", "en", "#1A2C5B", "#FFFFFF"],
  ["SRB", "Sérvia", "eslavo-sul", "#C6363C", "#0C4076"],
  ["SVK", "Eslováquia", "eslavo", "#FFFFFF", "#0B4EA2"],
  ["SVN", "Eslovênia", "eslavo-sul", "#FFFFFF", "#005DA4"],
  ["ESP", "Espanha", "es", "#C60B1E", "#FFC400"],
  ["SWE", "Suécia", "nordico", "#FECC02", "#006AA7"],
  ["SUI", "Suíça", "de", "#D52B1E", "#FFFFFF"],
  ["TUR", "Turquia", "tr", "#E30A17", "#FFFFFF"],
  ["UKR", "Ucrânia", "eslavo", "#FFD500", "#005BBB"],
  ["WAL", "País de Gales", "en", "#C8102E", "#00B140"],
];

const CONMEBOL: readonly Linha[] = [
  ["ARG", "Argentina", "es-am", "#75AADB", "#FFFFFF"],
  ["BOL", "Bolívia", "es-am", "#007934", "#FFFFFF"],
  ["BRA", "Brasil", "pt-br", "#F4C430", "#1F5FAF"],
  ["CHI", "Chile", "es-am", "#D52B1E", "#0039A6"],
  ["COL", "Colômbia", "es-am", "#FCD116", "#003893"],
  ["ECU", "Equador", "es-am", "#FFDD00", "#034EA2"],
  ["PAR", "Paraguai", "es-am", "#D52B1E", "#FFFFFF"],
  ["PER", "Peru", "es-am", "#FFFFFF", "#D91023"],
  ["URU", "Uruguai", "es-am", "#5CBFEB", "#000000"],
  ["VEN", "Venezuela", "es-am", "#7B1E3B", "#FFFFFF"],
];

const CONCACAF: readonly Linha[] = [
  ["AIA", "Anguila", "en", "#00247D", "#FFFFFF"],
  ["ATG", "Antígua e Barbuda", "en", "#CE1126", "#000000"],
  ["ARU", "Aruba", "nl", "#FFD100", "#418FDE"],
  ["BAH", "Bahamas", "en", "#00778B", "#FFC72C"],
  ["BRB", "Barbados", "en", "#00267F", "#FFC726"],
  ["BLZ", "Belize", "en", "#003F87", "#CE1126"],
  ["BER", "Bermudas", "en", "#C8102E", "#FFFFFF"],
  ["VGB", "Ilhas Virgens Britânicas", "en", "#00247D", "#00A651"],
  ["CAN", "Canadá", "en", "#D80621", "#FFFFFF"],
  ["CAY", "Ilhas Cayman", "en", "#C8102E", "#FFFFFF"],
  ["CRC", "Costa Rica", "es-am", "#CE1126", "#002B7F"],
  ["CUB", "Cuba", "es-am", "#CB1515", "#FFFFFF"],
  ["CUW", "Curaçao", "nl", "#002B7F", "#F9E814"],
  ["DMA", "Dominica", "en", "#006B3F", "#FCD116"],
  ["DOM", "República Dominicana", "es-am", "#002D62", "#CE1126"],
  ["SLV", "El Salvador", "es-am", "#0F47AF", "#FFFFFF"],
  ["GRN", "Granada", "en", "#CE1126", "#FCD116"],
  ["GUA", "Guatemala", "es-am", "#FFFFFF", "#4997D0"],
  ["GUY", "Guiana", "en", "#009E49", "#FCD116"],
  ["HAI", "Haiti", "fr", "#00209F", "#D21034"],
  ["HON", "Honduras", "es-am", "#FFFFFF", "#0073CF"],
  ["JAM", "Jamaica", "en", "#FED100", "#009B3A"],
  ["MEX", "México", "es-am", "#006847", "#FFFFFF"],
  ["MSR", "Montserrat", "en", "#006A4E", "#FFFFFF"],
  ["NCA", "Nicarágua", "es-am", "#0067C6", "#FFFFFF"],
  ["PAN", "Panamá", "es-am", "#DA121A", "#FFFFFF"],
  ["PUR", "Porto Rico", "es-am", "#ED0A3F", "#0050F0"],
  ["SKN", "São Cristóvão e Névis", "en", "#009E49", "#CE1126"],
  ["LCA", "Santa Lúcia", "en", "#65CFFF", "#FCD116"],
  ["VIN", "São Vicente e Granadinas", "en", "#002674", "#FCD022"],
  ["SUR", "Suriname", "nl", "#377E3F", "#FFFFFF"],
  ["TRI", "Trinidad e Tobago", "en", "#CE1126", "#000000"],
  ["TCA", "Turks e Caicos", "en", "#00247D", "#FFFFFF"],
  ["USA", "Estados Unidos", "en", "#FFFFFF", "#0A3161"],
  ["VIR", "Ilhas Virgens Americanas", "en", "#002868", "#FFD100"],
];

const AFC: readonly Linha[] = [
  ["AFG", "Afeganistão", "persa", "#D32011", "#000000"],
  ["AUS", "Austrália", "en", "#FFCD00", "#00843D"],
  ["BHR", "Bahrein", "ar", "#CE1126", "#FFFFFF"],
  ["BAN", "Bangladesh", "indiano", "#006A4E", "#F42A41"],
  ["BHU", "Butão", "indiano", "#FFD520", "#FF4E12"],
  ["BRU", "Brunei", "sudeste-asiatico", "#F7E017", "#000000"],
  ["CAM", "Camboja", "sudeste-asiatico", "#032EA1", "#E00025"],
  ["CHN", "China", "chines", "#DE2910", "#FFDE00"],
  ["TPE", "Taipé Chinesa", "chines", "#0033A0", "#FFFFFF"],
  ["GUM", "Guam", "en", "#00297B", "#C62139"],
  ["HKG", "Hong Kong", "chines", "#DE2910", "#FFFFFF"],
  ["IND", "Índia", "indiano", "#0B3D91", "#FF9933"],
  ["IDN", "Indonésia", "sudeste-asiatico", "#FF0000", "#FFFFFF"],
  ["IRN", "Irã", "persa", "#FFFFFF", "#DA0000"],
  ["IRQ", "Iraque", "ar", "#007A3D", "#FFFFFF"],
  ["JPN", "Japão", "ja", "#1D2B5A", "#FFFFFF"],
  ["JOR", "Jordânia", "ar", "#CE1126", "#FFFFFF"],
  ["KOR", "Coreia do Sul", "ko", "#C60C30", "#003478"],
  ["PRK", "Coreia do Norte", "ko", "#ED1C27", "#024FA2"],
  ["KUW", "Kuwait", "ar", "#0057B8", "#FFFFFF"],
  ["KGZ", "Quirguistão", "asia-central", "#E8112D", "#FFEF00"],
  ["LAO", "Laos", "sudeste-asiatico", "#CE1126", "#002868"],
  ["LBN", "Líbano", "ar", "#ED1C24", "#FFFFFF"],
  ["MAC", "Macau", "chines", "#00785E", "#FFFFFF"],
  ["MAS", "Malásia", "sudeste-asiatico", "#FFCC00", "#010066"],
  ["MDV", "Maldivas", "indiano", "#D21034", "#007E3A"],
  ["MNG", "Mongólia", "asia-central", "#C4272F", "#015197"],
  ["MYA", "Mianmar", "sudeste-asiatico", "#E11B22", "#FECB00"],
  ["NEP", "Nepal", "indiano", "#DC143C", "#003893"],
  ["OMA", "Omã", "ar", "#DB161B", "#FFFFFF"],
  ["PAK", "Paquistão", "indiano", "#01411C", "#FFFFFF"],
  ["PLE", "Palestina", "ar", "#FFFFFF", "#007A3D"],
  ["PHI", "Filipinas", "sudeste-asiatico", "#0038A8", "#CE1126"],
  ["QAT", "Catar", "ar", "#8A1538", "#FFFFFF"],
  ["KSA", "Arábia Saudita", "ar", "#FFFFFF", "#006C35"],
  ["SGP", "Singapura", "chines", "#EF3340", "#FFFFFF"],
  ["SRI", "Sri Lanka", "indiano", "#8D153A", "#FFBE29"],
  ["SYR", "Síria", "ar", "#CE1126", "#FFFFFF"],
  ["TJK", "Tajiquistão", "persa", "#CC0000", "#FFFFFF"],
  ["THA", "Tailândia", "sudeste-asiatico", "#2D2A4A", "#FFFFFF"],
  ["TLS", "Timor-Leste", "pt", "#DC241F", "#000000"],
  ["TKM", "Turcomenistão", "asia-central", "#00843D", "#FFFFFF"],
  ["UAE", "Emirados Árabes Unidos", "ar", "#FFFFFF", "#00732F"],
  ["UZB", "Uzbequistão", "asia-central", "#FFFFFF", "#0099B5"],
  ["VIE", "Vietnã", "sudeste-asiatico", "#DA251D", "#FFFF00"],
  ["YEM", "Iêmen", "ar", "#CE1126", "#FFFFFF"],
];

const CAF: readonly Linha[] = [
  ["ALG", "Argélia", "ar", "#FFFFFF", "#006233"],
  ["ANG", "Angola", "pt", "#CC092F", "#000000"],
  ["BEN", "Benin", "fr", "#FCD116", "#008751"],
  ["BOT", "Botsuana", "africa", "#75AADB", "#000000"],
  ["BFA", "Burkina Faso", "fr", "#009E49", "#EF2B2D"],
  ["BDI", "Burundi", "fr", "#CE1126", "#1EB53A"],
  ["CMR", "Camarões", "fr", "#007A5E", "#CE1126"],
  ["CPV", "Cabo Verde", "pt", "#003893", "#FFFFFF"],
  ["CTA", "República Centro-Africana", "fr", "#003082", "#FFCE00"],
  ["CHA", "Chade", "fr", "#002664", "#FECB00"],
  ["COM", "Comores", "fr", "#3A75C4", "#FFFFFF"],
  ["CGO", "Congo", "fr", "#009543", "#FBDE4A"],
  ["COD", "RD Congo", "fr", "#007FFF", "#CE1021"],
  ["CIV", "Costa do Marfim", "fr", "#F77F00", "#FFFFFF"],
  ["DJI", "Djibuti", "fr", "#6AB2E7", "#12AD2B"],
  ["EGY", "Egito", "ar", "#CE1126", "#FFFFFF"],
  ["EQG", "Guiné Equatorial", "es-am", "#E32118", "#3E9A00"],
  ["ERI", "Eritreia", "africa", "#4189DD", "#EA0437"],
  ["SWZ", "Essuatíni", "africa", "#3E5EB9", "#FFD900"],
  ["ETH", "Etiópia", "africa", "#078930", "#FCDD09"],
  ["GAB", "Gabão", "fr", "#FCD116", "#009E60"],
  ["GAM", "Gâmbia", "africa", "#CE1126", "#0C1C8C"],
  ["GHA", "Gana", "africa", "#FFFFFF", "#000000"],
  ["GUI", "Guiné", "fr", "#CE1126", "#FCD116"],
  ["GNB", "Guiné-Bissau", "pt", "#CE1126", "#009E49"],
  ["KEN", "Quênia", "africa", "#BB0000", "#006600"],
  ["LES", "Lesoto", "africa", "#00209F", "#009543"],
  ["LBR", "Libéria", "africa", "#002868", "#BF0A30"],
  ["LBY", "Líbia", "ar", "#E70013", "#000000"],
  ["MAD", "Madagascar", "fr", "#FC3D32", "#007E3A"],
  ["MWI", "Malaui", "africa", "#CE1126", "#000000"],
  ["MLI", "Mali", "fr", "#14B53A", "#FCD116"],
  ["MTN", "Mauritânia", "ar", "#006233", "#FFC400"],
  ["MRI", "Maurício", "fr", "#EA2839", "#1A206D"],
  ["MAR", "Marrocos", "ar", "#C1272D", "#006233"],
  ["MOZ", "Moçambique", "pt", "#D21034", "#000000"],
  ["NAM", "Namíbia", "africa", "#003580", "#D21034"],
  ["NIG", "Níger", "fr", "#E05206", "#0DB02B"],
  ["NGA", "Nigéria", "africa", "#008751", "#FFFFFF"],
  ["RWA", "Ruanda", "fr", "#00A1DE", "#FAD201"],
  ["STP", "São Tomé e Príncipe", "pt", "#12AD2B", "#FFCE00"],
  ["SEN", "Senegal", "fr", "#FFFFFF", "#00853F"],
  ["SEY", "Seychelles", "fr", "#D62828", "#003F87"],
  ["SLE", "Serra Leoa", "africa", "#1EB53A", "#0072C6"],
  ["SOM", "Somália", "ar", "#4189DD", "#FFFFFF"],
  ["RSA", "África do Sul", "africa", "#FFB81C", "#007749"],
  ["SSD", "Sudão do Sul", "africa", "#0F47AF", "#078930"],
  ["SDN", "Sudão", "ar", "#D21034", "#FFFFFF"],
  ["TAN", "Tanzânia", "africa", "#1EB53A", "#00A3DD"],
  ["TOG", "Togo", "fr", "#FFCE00", "#006A4E"],
  ["TUN", "Tunísia", "ar", "#E70013", "#FFFFFF"],
  ["UGA", "Uganda", "africa", "#FCDC04", "#D90000"],
  ["ZAM", "Zâmbia", "africa", "#198A00", "#EF7D00"],
  ["ZIM", "Zimbábue", "africa", "#FFD200", "#319208"],
];

const OFC: readonly Linha[] = [
  ["ASA", "Samoa Americana", "en", "#002B7F", "#BF0A30"],
  ["COK", "Ilhas Cook", "en", "#00247D", "#FFFFFF"],
  ["FIJ", "Fiji", "en", "#FFFFFF", "#68BFE5"],
  ["NCL", "Nova Caledônia", "fr", "#0035AD", "#ED2939"],
  ["NZL", "Nova Zelândia", "en", "#FFFFFF", "#000000"],
  ["PNG", "Papua-Nova Guiné", "en", "#CE1126", "#000000"],
  ["SAM", "Samoa", "en", "#002B7F", "#CE1126"],
  ["SOL", "Ilhas Salomão", "en", "#0051BA", "#FCD116"],
  ["TAH", "Taiti", "fr", "#ED2939", "#FFFFFF"],
  ["TGA", "Tonga", "en", "#C10000", "#FFFFFF"],
  ["VAN", "Vanuatu", "en", "#D21034", "#009543"],
];

const POR_CONFEDERACAO: ReadonlyArray<readonly [Confederacao, readonly Linha[]]> = [
  ["UEFA", UEFA],
  ["CONMEBOL", CONMEBOL],
  ["CONCACAF", CONCACAF],
  ["AFC", AFC],
  ["CAF", CAF],
  ["OFC", OFC],
];

/** Profundidade de cada país no banco (docs/DECISOES.md). Quem não aparece é nível 0 (só seleção). */
const NIVEL_1 = ["BRA", "ENG", "ESP", "ITA", "GER", "FRA"];
const NIVEL_2 = [
  "POR",
  "NED",
  "BEL",
  "SCO",
  "TUR",
  "AUT",
  "SUI",
  "GRE",
  "DEN",
  "SWE",
  "ARG",
  "URU",
  "COL",
  "CHI",
  "MEX",
  "USA",
  "KSA",
  "JPN",
  "KOR",
  "QAT",
];
const NIVEL_3 = [
  // Demais UEFA (todas mandam clubes às copas da UEFA; a Rússia está suspensa, mas segue no banco)
  ...UEFA.map((l) => l[0]).filter((c) => !NIVEL_1.includes(c) && !NIVEL_2.includes(c)),
  // Demais CONMEBOL
  "BOL",
  "ECU",
  "PAR",
  "PER",
  "VEN",
  // Principais da CONCACAF, AFC e CAF
  "CAN",
  "CRC",
  "HON",
  "PAN",
  "GUA",
  "JAM",
  "SLV",
  "AUS",
  "CHN",
  "IRN",
  "UAE",
  "IRQ",
  "UZB",
  "THA",
  "IDN",
  "MAS",
  "VIE",
  "IND",
  "JOR",
  "KUW",
  "BHR",
  "OMA",
  "EGY",
  "MAR",
  "TUN",
  "ALG",
  "RSA",
  "NGA",
  "GHA",
  "SEN",
  "CIV",
  "CMR",
  "COD",
  "ANG",
  "TAN",
  "NZL",
];

const p = (inicio: string, fim: string): Periodo => ({ inicio, fim });

/**
 * Temporada e janelas por perfil de calendário. As datas do Brasil são as oficiais da CBF para 2026;
 * as demais são aproximadas e serão conferidas país a país na Fase 13 (mercado e janelas).
 */
const CALENDARIOS = {
  europeu: { temporada: p("08-01", "05-31"), janelas: [p("06-15", "09-01"), p("01-01", "02-02")] },
  anoCivilEuropa: {
    temporada: p("03-01", "11-30"),
    janelas: [p("01-01", "03-31"), p("07-01", "08-31")],
  },
  brasil: { temporada: p("01-10", "12-10"), janelas: [p("01-05", "03-03"), p("07-20", "09-11")] },
  sulAmericano: {
    temporada: p("01-25", "12-10"),
    janelas: [p("01-05", "03-31"), p("07-01", "08-31")],
  },
  mls: { temporada: p("02-20", "12-10"), janelas: [p("02-01", "04-30"), p("07-15", "08-15")] },
  mexico: { temporada: p("07-10", "05-31"), janelas: [p("06-01", "09-01"), p("12-15", "02-15")] },
  americaCentral: {
    temporada: p("07-15", "05-31"),
    janelas: [p("06-15", "08-31"), p("12-15", "01-31")],
  },
  golfo: { temporada: p("08-15", "05-31"), janelas: [p("07-01", "09-01"), p("01-05", "02-02")] },
  asiaLeste: {
    temporada: p("02-15", "12-10"),
    janelas: [p("01-01", "03-31"), p("07-01", "08-15")],
  },
  australia: {
    temporada: p("10-15", "05-31"),
    janelas: [p("07-01", "09-30"), p("01-01", "01-31")],
  },
  africano: { temporada: p("08-15", "05-31"), janelas: [p("07-01", "09-30"), p("01-01", "01-31")] },
} as const;

const ANO_CIVIL_EUROPA = [
  "NOR",
  "SWE",
  "FIN",
  "ISL",
  "FRO",
  "IRL",
  "EST",
  "LVA",
  "LTU",
  "BLR",
  "KAZ",
];
const GOLFO = [
  "KSA",
  "QAT",
  "UAE",
  "KUW",
  "BHR",
  "OMA",
  "IRQ",
  "JOR",
  "IRN",
  "UZB",
  "LBN",
  "SYR",
  "PLE",
  "YEM",
];
const ASIA_LESTE = [
  "JPN",
  "KOR",
  "CHN",
  "PRK",
  "THA",
  "VIE",
  "MAS",
  "IDN",
  "SGP",
  "HKG",
  "TPE",
  "PHI",
];
const AMERICA_CENTRAL = ["CRC", "HON", "PAN", "GUA", "SLV", "NCA"];

function calendarioDe(
  codigo: string,
  conf: Confederacao,
): (typeof CALENDARIOS)[keyof typeof CALENDARIOS] {
  if (codigo === "BRA") return CALENDARIOS.brasil;
  if (codigo === "USA" || codigo === "CAN") return CALENDARIOS.mls;
  if (codigo === "MEX") return CALENDARIOS.mexico;
  if (codigo === "AUS" || codigo === "NZL") return CALENDARIOS.australia;
  if (ANO_CIVIL_EUROPA.includes(codigo)) return CALENDARIOS.anoCivilEuropa;
  if (GOLFO.includes(codigo)) return CALENDARIOS.golfo;
  if (ASIA_LESTE.includes(codigo)) return CALENDARIOS.asiaLeste;
  if (AMERICA_CENTRAL.includes(codigo)) return CALENDARIOS.americaCentral;
  switch (conf) {
    case "UEFA":
      return CALENDARIOS.europeu;
    case "CONMEBOL":
      return CALENDARIOS.sulAmericano;
    case "CAF":
      return CALENDARIOS.africano;
    case "AFC":
      return CALENDARIOS.asiaLeste;
    default:
      return CALENDARIOS.sulAmericano;
  }
}

function nivelDe(codigo: string): Pais["nivel"] {
  if (NIVEL_1.includes(codigo)) return 1;
  if (NIVEL_2.includes(codigo)) return 2;
  if (NIVEL_3.includes(codigo)) return 3;
  return 0;
}

export const PAISES: readonly Pais[] = POR_CONFEDERACAO.flatMap(([confederacao, linhas]) =>
  linhas.map(([codigo, nome, grupoNomes, primaria, secundaria]) => {
    const cal = calendarioDe(codigo, confederacao);
    return {
      codigo,
      nome,
      confederacao,
      nivel: nivelDe(codigo),
      grupoNomes,
      temporada: { ...cal.temporada },
      janelas: cal.janelas.map((j) => ({ ...j })),
      cores: { primaria, secundaria },
    };
  }),
);

export function pais(codigo: string): Pais {
  const encontrado = PAISES.find((x) => x.codigo === codigo);
  if (!encontrado) throw new Error(`País ${codigo} não está no banco`);
  return encontrado;
}
