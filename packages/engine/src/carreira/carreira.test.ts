import { describe, expect, it } from "vitest";
import {
  Competicao,
  gerarAtributos,
  type Clube,
  type Jogador,
  type Lado,
  type Pais,
  type Posicao,
} from "@newbras/data";
import { simularPartida } from "../partida/motor";
import { escalacaoAutomatica } from "../partida/escalacao";
import { FORMACOES } from "../partida/formacoes";
import { eventosDoDia, inicioDaCarreira, marcasDoMes, nomeTemporada } from "./calendario";
import {
  agendaCompleta,
  atualizarCarreira,
  avancarAteJogo,
  avancarDia,
  avisoPoupar,
  compromissoDoDia,
  elencoParaPartida,
  escalacaoDoTecnico,
  marcarAmistoso,
  novaCarreira,
  partidaDoCompromisso,
  problemasDoAmistoso,
  registrarJogo,
  type Carreira,
  type Mundo,
} from "./carreira";
import { dataPorExtenso, diaDaSemana, diasEntre, somarDias } from "./datas";

const BRASIL: Pais = {
  codigo: "BRA",
  nome: "Brasil",
  confederacao: "CONMEBOL",
  nivel: 1,
  grupoNomes: "pt-br",
  temporada: { inicio: "01-10", fim: "12-10" },
  janelas: [
    { inicio: "01-05", fim: "03-03" },
    { inicio: "07-20", fim: "09-11" },
  ],
  cores: { primaria: "#ffdf00", secundaria: "#009c3b" },
};
const EUROPA: Pais = {
  ...BRASIL,
  codigo: "ENG",
  nome: "Inglaterra",
  confederacao: "UEFA",
  temporada: { inicio: "08-01", fim: "05-31" },
  janelas: [
    { inicio: "06-15", fim: "09-01" },
    { inicio: "01-01", fim: "02-02" },
  ],
};

const ELENCO: ReadonlyArray<[Posicao, Lado]> = [
  ["G", "C"],
  ["G", "C"],
  ["L", "D"],
  ["L", "E"],
  ["Z", "C"],
  ["Z", "C"],
  ["Z", "C"],
  ["M", "C"],
  ["M", "C"],
  ["M", "D"],
  ["M", "E"],
  ["M", "C"],
  ["A", "C"],
  ["A", "C"],
  ["A", "D"],
  ["A", "E"],
];

function clube(id: string, nivel: number): Clube {
  return {
    id,
    nome: id,
    nomeCurto: id,
    abreviacao: id.slice(0, 3).toUpperCase(),
    pais: "BRA",
    cidade: "Cidade",
    estadio: { nome: "Estádio", capacidade: 30000 },
    cores: { primaria: "#ff0000", secundaria: "#ffffff" },
    reputacao: 3,
    nivel,
    rivais: [],
    aConferir: [],
  } as unknown as Clube;
}

function mundoDeTeste(): Mundo {
  const clubes = ["mandante", "rival-a", "rival-b", "rival-c"].map((id, i) => clube(id, 70 - i));
  const jogadores: Jogador[] = [];
  for (const c of clubes)
    ELENCO.forEach(([posicao, lado], i) => {
      const forca = c.nivel + (i % 5) - 2;
      jogadores.push({
        id: `${c.id}-${i}`,
        nome: `${c.id} ${i}`,
        nascimento: `${1994 + (i % 10)}-03-0${1 + (i % 9)}`,
        nacionalidade: "BRA",
        posicao,
        lado,
        forca,
        potencial: forca,
        caracteristicas: ["passe"],
        atributos: gerarAtributos({ semente: `${c.id}-${i}`, posicao, forca }),
        estrela: false,
        base: false,
        clube: c.id,
        aConferir: [],
      } as unknown as Jogador);
    });
  const porId = new Map(jogadores.map((j) => [j.id, j]));
  const liga = Competicao.parse({
    id: "liga-teste",
    nome: "Liga de Teste",
    nomeCurto: "Liga",
    tipo: "liga",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: "BRA" },
    divisao: 1,
    calendario: { inicio: "02-01", fim: "05-01" },
    participantes: { fixos: clubes.map((c) => c.id), quantidade: 4 },
    fases: [{ id: "pc", nome: "Pontos corridos", tipo: "grupos", grupos: 1, turnos: 2 }],
  });
  return {
    competicoes: [liga],
    competicao: (id) => (id === liga.id ? liga : undefined),
    clube: (id) => clubes.find((c) => c.id === id),
    jogador: (id) => porId.get(id),
    elenco: (id) => jogadores.filter((j) => j.clube === id),
    pais: (codigo) => (codigo === "BRA" ? BRASIL : undefined),
    clubesDoPais: () => clubes,
    datasFifa: [{ nome: "Data FIFA de março", periodo: { inicio: "03-23", fim: "03-31" } }],
  };
}

function nova(mundo = mundoDeTeste(), semente = "teste"): Carreira {
  return novaCarreira(mundo, {
    id: "c1",
    semente,
    tecnico: "Guilherme",
    clube: "mandante",
    referencia: "2026-07-01",
    versaoBanco: "0.0.0",
  });
}

describe("datas e calendário", () => {
  it("conta dias, dia da semana e escreve por extenso", () => {
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somarDias("2028-02-28", 1)).toBe("2028-02-29");
    expect(diasEntre("2026-11-25", "2026-12-25")).toBe(30);
    expect(diaDaSemana("2026-11-25")).toBe(3);
    expect(dataPorExtenso("2026-11-25")).toBe("quarta-feira, 25 de novembro de 2026");
  });

  it("a carreira começa na pré-temporada do país", () => {
    expect(inicioDaCarreira(EUROPA, "2026-07-01")).toBe("2026-07-11");
    expect(inicioDaCarreira(BRASIL, "2026-07-01")).toBe("2026-12-20");
    expect(nomeTemporada(EUROPA, "2027-01-15")).toBe("2026/27");
    expect(nomeTemporada(BRASIL, "2026-12-20")).toBe("2027");
  });

  it("marca janelas, datas FIFA e temporada no calendário", () => {
    const eventos = eventosDoDia("2027-01-05", BRASIL, []).map((e) => e.tipo);
    expect(eventos).toContain("janela-abre");
    const marco = marcasDoMes(2027, 3, BRASIL, [
      { nome: "Data FIFA de março", periodo: { inicio: "03-23", fim: "03-31" } },
    ]);
    expect(marco).toHaveLength(31);
    expect(marco[24]?.dataFifa).toBe("Data FIFA de março");
    expect(marco[0]?.janela).toBe(true);
    expect(marco[10]?.janela).toBe(false);
    expect(marco.every((d) => d.temporada)).toBe(true);
  });
});

describe("carreira", () => {
  it("começa com o elenco acompanhado e três amistosos de pré-temporada", () => {
    const c = nova();
    expect(c.data).toBe("2026-12-20");
    expect(Object.keys(c.jogadores)).toHaveLength(ELENCO.length);
    expect(c.agenda).toHaveLength(3);
    expect(c.agenda.every((x) => x.adversario !== "mandante" && x.data > c.data)).toBe(true);
  });

  it("avança até o dia de jogo e não passa dele sem jogar", () => {
    const mundo = mundoDeTeste();
    const c = nova(mundo);
    const r = avancarAteJogo(c, mundo);
    expect(r.parouPor).toBe("jogo");
    expect(r.carreira.data).toBe(c.agenda[0]?.data);
    expect(compromissoDoDia(r.carreira)?.id).toBe(c.agenda[0]?.id);
    expect(avancarDia(r.carreira, mundo).carreira).toBe(r.carreira);
  });

  it(
    "o jogo cansa, o descanso recupera e o resultado entra na carreira",
    { timeout: 60_000 },
    () => {
      const mundo = mundoDeTeste();
      let c = avancarAteJogo(nova(mundo), mundo).carreira;
      const x = compromissoDoDia(c)!;
      const r = simularPartida(partidaDoCompromisso(c, mundo, x));
      c = registrarJogo(c, mundo, x.id, r);
      expect(c.agenda.find((y) => y.id === x.id)?.resultado?.placar).toEqual(r.placar);
      // O mais cansado do time que jogou o jogo todo (o goleiro quase não cansa).
      const titular = r.jogadores
        .filter((e) => e.time === x.mando && e.titular && e.minutos >= 90)
        .sort((a, b) => a.condicaoFinal - b.condicaoFinal)[0]!;
      const depois = c.jogadores[titular.id]!;
      expect(depois.jogos).toBe(1);
      expect(depois.condicao).toBeLessThan(90);
      // O adversário passa a ser acompanhado também.
      const deles = r.jogadores.find((e) => e.time !== x.mando)!;
      expect(c.jogadores[deles.id]).toBeDefined();
      // Dois dias depois, recuperou bastante.
      c = avancarDia(avancarDia(c, mundo).carreira, mundo).carreira;
      expect(c.jogadores[titular.id]!.condicao).toBeGreaterThan(depois.condicao + 15);
      expect(c.noticias.some((n) => n.texto.startsWith("Amistoso:"))).toBe(true);
    },
  );

  it("é determinística e cabe num salvamento JSON", { timeout: 60_000 }, () => {
    const rodar = () => {
      const mundo = mundoDeTeste();
      let c = avancarAteJogo(nova(mundo, "mesma"), mundo).carreira;
      const x = compromissoDoDia(c)!;
      c = registrarJogo(c, mundo, x.id, simularPartida(partidaDoCompromisso(c, mundo, x)));
      return avancarAteJogo(c, mundo).carreira;
    };
    const a = rodar();
    expect(rodar()).toEqual(a);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });

  it("o humor anda em sequências e a moral alta puxa para cima", () => {
    const mundo = mundoDeTeste();
    const contar = (moral: number) => {
      let c: Carreira = { ...nova(mundo, `humor-${moral}`), agenda: [], moral };
      let bons = 0;
      let ruins = 0;
      let mudancas = 0;
      for (let d = 0; d < 90; d++) {
        const antes = c.jogadores;
        c = { ...avancarDia(c, mundo).carreira, moral };
        for (const [id, e] of Object.entries(c.jogadores)) {
          if (antes[id]?.humor !== e.humor) mudancas++;
          if (e.humor === "bom" || e.humor === "otimo") bons++;
          if (e.humor === "ruim" || e.humor === "pessimo") ruins++;
        }
      }
      return { bons, ruins, mudancas };
    };
    const alta = contar(90);
    const baixa = contar(10);
    expect(alta.bons).toBeGreaterThan(baixa.bons);
    expect(baixa.ruins).toBeGreaterThan(alta.ruins);
    // Muda de vez em quando, não todo dia: menos de 1 mudança a cada 4 dias por jogador.
    expect(alta.mudancas).toBeLessThan((90 * ELENCO.length) / 4);
    expect(alta.mudancas).toBeGreaterThan(0);
  });

  it("marca amistoso só em data livre e futura", () => {
    const mundo = mundoDeTeste();
    const c = nova(mundo);
    expect(problemasDoAmistoso(c, mundo, { data: c.data, adversario: "rival-a" })).toHaveLength(1);
    expect(
      problemasDoAmistoso(c, mundo, { data: c.agenda[0]!.data, adversario: "rival-a" }),
    ).toContain("já há um jogo nesse dia");
    const marcada = marcarAmistoso(c, mundo, {
      data: somarDias(c.data, 30),
      adversario: "rival-c",
      mando: "fora",
    });
    expect(marcada.agenda).toHaveLength(4);
    expect(marcada.agenda.at(-1)?.adversario).toBe("rival-c");
  });

  it("escalação salva é respeitada e a vaga de quem saiu é preenchida", () => {
    const mundo = mundoDeTeste();
    const c = nova(mundo);
    const jogadores = elencoParaPartida(c, mundo, "mandante");
    const auto = escalacaoAutomatica(jogadores, "4-4-2");
    const titulares = [...auto.titulares];
    titulares[10] = "jogador-que-saiu";
    const salva: Carreira = {
      ...c,
      escalacao: {
        formacao: "4-4-2",
        vagas: [],
        titulares,
        reservas: [...auto.reservas],
        papeis: [],
      },
    };
    salva.escalacao!.vagas = FORMACOES["4-4-2"].map((v) => ({ ...v }));
    const e = escalacaoDoTecnico(salva, jogadores);
    expect(e.titulares.slice(0, 10)).toEqual(auto.titulares.slice(0, 10));
    expect(e.titulares[10]).not.toBe("jogador-que-saiu");
    expect(e.titulares[10]).toBeTruthy();
    expect(new Set(e.titulares).size).toBe(11);
  });

  it("rodízio: a CPU poupa quem está esgotado e o aviso aparece", () => {
    const mundo = mundoDeTeste();
    const c = nova(mundo);
    const jogadores = elencoParaPartida(c, mundo, "mandante");
    const auto = escalacaoAutomatica(jogadores, "4-4-2");
    const estrela = auto.titulares[9]!;
    const cansados = jogadores.map((j) => (j.id === estrela ? { ...j, condicao: 35 } : j));
    expect(escalacaoAutomatica(cansados, "4-4-2").titulares).not.toContain(estrela);
    expect(avisoPoupar({ condicao: 35, humor: "normal" })).toContain("cansado");
    expect(avisoPoupar({ condicao: 95, humor: "pessimo" })).toBe("humor péssimo");
    expect(avisoPoupar({ condicao: 95, humor: "bom" })).toBeNull();
  });

  it(
    "liga oficial: jogos na agenda, jogo do técnico no motor, tabela, campeão e histórico",
    { timeout: 120_000 },
    () => {
      const mundo = mundoDeTeste();
      let c: Carreira = { ...nova(mundo, "liga"), agenda: [] };
      const oficiais = agendaCompleta(c).filter((x) => x.tipo === "oficial");
      expect(oficiais).toHaveLength(6);
      expect(oficiais.every((x) => x.data >= "2027-02-01" && x.data <= "2027-05-01")).toBe(true);
      for (let i = 0; i < 6; i++) {
        c = avancarAteJogo(c, mundo).carreira;
        const x = compromissoDoDia(c)!;
        expect(x.tipo).toBe("oficial");
        const r = simularPartida(partidaDoCompromisso(c, mundo, x));
        c = registrarJogo(c, mundo, x.id, r);
        const e = c.competicoes.competicoes["liga-teste"]!;
        // O jogo do técnico e o outro jogo do dia estão lançados.
        const doDia = e.jogos.filter((j) => e.datas[j.rodada] === c.data);
        expect(doDia.every((j) => j.placar)).toBe(true);
      }
      const e = c.competicoes.competicoes["liga-teste"]!;
      expect(e.encerrada).toBe(true);
      expect(e.campeao).toBeTruthy();
      expect(Object.values(e.artilharia).reduce((s, [g]) => s + g, 0)).toBeGreaterThan(0);
      // Passa do fim da temporada: histórico, notícia do campeão e a temporada seguinte aberta.
      for (let i = 0; i < 260 && c.data <= "2027-12-12"; i++) c = avancarDia(c, mundo).carreira;
      expect(
        c.competicoes.historico.some(
          (h) => h.competicao === "liga-teste" && h.temporada === "2027",
        ),
      ).toBe(true);
      expect(c.noticias.some((n) => n.texto.includes("campeão"))).toBe(true);
      expect(c.competicoes.competicoes["liga-teste"]?.temporada).toBe("2028");
    },
  );

  it("salvamento antigo (formato 1) ganha as competições ao abrir", () => {
    const mundo = mundoDeTeste();
    const { competicoes: _c, ...resto } = nova(mundo);
    const antiga = { ...resto, formato: 1 } as unknown as Carreira;
    const nova2 = atualizarCarreira(antiga, mundo);
    expect(nova2.formato).toBe(5);
    expect(nova2.competicoes.competicoes["liga-teste"]).toBeDefined();
  });
});
