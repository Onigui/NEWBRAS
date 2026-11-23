import type { BancoEntrada } from "./schemas/banco";
import type { JogadorEntrada } from "./schemas/jogador";

/** Elenco mínimo válido: 2 goleiros e 12 de linha. */
export function elencoExemplo(clube: string, nacionalidade: string): JogadorEntrada[] {
  const posicoes = ["G", "G", "L", "L", "Z", "Z", "Z", "M", "M", "M", "M", "A", "A", "A"] as const;
  return posicoes.map((posicao, i) => ({
    id: `${clube}-j${i + 1}`,
    nome: `Jogador ${i + 1}`,
    nascimento: "2000-05-10",
    nacionalidade,
    posicao,
    lado: posicao === "L" ? (i % 2 ? "E" : "D") : "C",
    forca: 50 + i,
    potencial: 70,
    caracteristicas: posicao === "G" ? ["reflexo"] : ["passe", "velocidade"],
    clube,
    contrato: { fim: "2027-12-31", salario: 50_000 },
    numero: i + 1,
  }));
}

export function bancoExemplo(): BancoEntrada {
  return {
    formato: 1,
    meta: { id: "newbras/exemplo", nome: "Exemplo", versao: "1.0.0", atualizadoEm: "2026-11-23" },
    paises: [
      {
        codigo: "BRA",
        nome: "Brasil",
        confederacao: "CONMEBOL",
        nivel: 1,
        grupoNomes: "pt-br",
        temporada: { inicio: "01-20", fim: "12-10" },
        janelas: [
          { inicio: "01-01", fim: "03-31" },
          { inicio: "07-01", fim: "08-31" },
        ],
        cores: { primaria: "#F4C430", secundaria: "#1F5FAF" },
      },
      {
        codigo: "ENG",
        nome: "Inglaterra",
        confederacao: "UEFA",
        nivel: 1,
        grupoNomes: "en",
        temporada: { inicio: "08-10", fim: "05-25" },
        janelas: [
          { inicio: "06-15", fim: "09-01" },
          { inicio: "01-01", fim: "02-02" },
        ],
        cores: { primaria: "#FFFFFF", secundaria: "#1D2B5A" },
      },
    ],
    estados: [
      { sigla: "SP", nome: "São Paulo", pais: "BRA" },
      { sigla: "RJ", nome: "Rio de Janeiro", pais: "BRA" },
    ],
    datasFifa: [{ nome: "Março", periodo: { inicio: "03-16", fim: "03-31" } }],
    clubes: [
      {
        id: "bra-santos",
        nome: "Santos Futebol Clube",
        nomeCurto: "Santos",
        abreviacao: "SAN",
        pais: "BRA",
        estado: "SP",
        cidade: "Santos",
        estadio: { nome: "Vila Belmiro", capacidade: 16_000 },
        cores: { primaria: "#FFFFFF", secundaria: "#000000" },
        reputacao: 4,
        nivel: 68,
        rivais: ["bra-flamengo"],
      },
      {
        id: "bra-flamengo",
        nome: "Clube de Regatas do Flamengo",
        nomeCurto: "Flamengo",
        abreviacao: "FLA",
        pais: "BRA",
        estado: "RJ",
        cidade: "Rio de Janeiro",
        estadio: { nome: "Maracanã", capacidade: 78_000 },
        cores: { primaria: "#C8102E", secundaria: "#000000" },
        reputacao: 5,
        nivel: 78,
      },
    ],
    jogadores: [...elencoExemplo("bra-santos", "BRA"), ...elencoExemplo("bra-flamengo", "BRA")],
    competicoes: [
      {
        id: "bra-serie-a",
        nome: "Campeonato Brasileiro Série A",
        tipo: "liga",
        categoria: "clubes",
        escopo: { tipo: "pais", pais: "BRA" },
        divisao: 1,
        calendario: { inicio: "04-01", fim: "12-10" },
        participantes: { fixos: ["bra-santos", "bra-flamengo"], quantidade: 2 },
        fases: [{ id: "unica", nome: "Fase única", tipo: "grupos", grupos: 1, turnos: 2 }],
      },
      {
        id: "conmebol-libertadores",
        nome: "Copa Libertadores",
        tipo: "continental",
        categoria: "clubes",
        escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
        calendario: { inicio: "02-01", fim: "11-30" },
        participantes: {
          vagas: [{ de: "bra-serie-a", criterio: "posicoes", posicoes: [1] }],
          quantidade: 47,
        },
        fases: [
          {
            id: "grupos",
            nome: "Fase de grupos",
            tipo: "grupos",
            grupos: 8,
            turnos: 2,
            classificamPorGrupo: 2,
          },
          { id: "final", nome: "Final", tipo: "mata-mata", jogos: 1, mando: "neutro" },
        ],
      },
    ],
    selecoes: [
      { pais: "BRA", reputacao: 5 },
      { pais: "ENG", reputacao: 5 },
    ],
    tecnicos: [
      {
        id: "tec-santos",
        nome: "Técnico do Santos",
        nacionalidade: "BRA",
        reputacao: 3,
        clube: "bra-santos",
      },
    ],
  };
}
