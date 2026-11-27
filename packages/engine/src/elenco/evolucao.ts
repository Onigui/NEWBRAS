/**
 * O mundo envelhece (etapa 12a). A cada temporada do país do clube, todos os jogadores do mundo
 * evoluem pela curva de idade, os veteranos se aposentam (um júnior entra no lugar, como no
 * Brasfoot) e as lendas renascem com 16 a 18 anos na base de um clube sorteado.
 *
 * Nada disso fica no salvamento: tudo sai da semente da carreira e da data. Cada jogador do banco é
 * uma vaga no clube, e cada vaga tem gerações: o jogador do banco, o júnior que entrou quando ele
 * parou, o júnior desse júnior... As lendas abrem uma vaga nova no clube onde renascem.
 */
import {
  caracteristicasDosAtributos,
  escalarAtributos,
  FORCA_TETO,
  gerarAtributos,
  type Atributo,
  type Atributos,
  type Clube,
  type Jogador,
  type Pais,
  type Posicao,
} from "@newbras/data";
import { fracaoDoPotencial, idadeEm } from "../evolucao";
import { gerarJogador } from "../gerador/jogador";
import { Rng } from "../rng";
import { somarDias } from "../carreira/datas";

/** O que a evolução precisa do mundo do banco. */
export interface MundoParaEvolucao {
  clubes?: readonly Clube[];
  clube(id: string): Clube | undefined;
  pais(codigo: string): Pais | undefined;
  /** Elenco profissional do banco. */
  elenco(clube: string): readonly Jogador[];
  /** Categoria de base do banco. */
  base?(clube: string): readonly Jogador[];
  jogador(id: string): Jogador | undefined;
}

/** A primeira temporada da carreira não conta: começa com o banco como está. */
const CARENCIA_DIAS = 30;
/** Idade de aposentadoria: média, desvio e limites (goleiros jogam 2 anos a mais). */
const APOSENTADORIA_MEDIA = 35;
const APOSENTADORIA_DESVIO = 1.6;
const APOSENTADORIA_MINIMA = 32;
const APOSENTADORIA_MAXIMA = 41;
/** Quem chega a essa força (ou é estrela) renasce como lenda. */
export const FORCA_DE_LENDA = 80;
/** Idade do júnior que entra no lugar do aposentado. */
const IDADE_JUNIOR: readonly [number, number] = [17, 20];
/** Idade em que a lenda renasce e em que sobe ao profissional. */
const IDADE_RENASCIMENTO: readonly [number, number] = [16, 18];
const IDADE_PROMOCAO = 18;
/** Atributos físicos: chegam ao auge antes e caem primeiro. */
const FISICOS: readonly Atributo[] = ["velocidade", "resistencia", "forcaFisica"];
/** A partir dessa idade (de linha), o físico cai 2,5% por ano a mais que o resto. */
const IDADE_QUEDA_FISICA = 29;

/** Uma geração de uma vaga: o jogador como entrou e o futuro dele, sorteado pela semente. */
export interface Geracao {
  j: Jogador;
  clube: string;
  /** Quando entrou no elenco profissional (a primeira geração: o começo da carreira). */
  inicio: string;
  idadeInicio: number;
  /** Até onde ele chega de verdade (o potencial mostrado é uma estimativa). */
  potencialReal: number;
  /** Idade em que pendura as chuteiras. */
  aposentadoria: number;
  /** Anos a mais (ou a menos) de auge antes do declínio. */
  atraso: number;
  /** Data da aposentadoria, quando já se sabe. */
  fim?: string;
  /** Renasceu como lenda (veio de outro jogador). */
  renascido?: boolean;
}

interface Vaga {
  clube: string;
  geracoes: Geracao[];
}

export type TipoEventoElenco = "aposentadoria" | "junior" | "renascimento";
export interface EventoElenco {
  tipo: TipoEventoElenco;
  data: string;
  /** O jogador (o que parou, o júnior que entrou ou a lenda que renasceu). */
  id: string;
  clube: string;
  /** Na aposentadoria e no renascimento: de quem se trata (o renascido vem do aposentado). */
  de?: string;
  idade: number;
}

const ehGoleiro = (p: Posicao) => p === "G";

/** Começo das temporadas do país contadas pela evolução (a 1ª depois da carência). */
export function inicioDaTemporadaContada(pais: Pais, referencia: string, k: number): string {
  const limite = somarDias(referencia, CARENCIA_DIAS);
  const ano = Number(limite.slice(0, 4));
  const primeiro = `${ano}-${pais.temporada.inicio}` > limite ? ano : ano + 1;
  return `${primeiro + k - 1}-${pais.temporada.inicio}`;
}

/** Quantas temporadas do país já começaram desde a carência (0 = a do começo da carreira). */
export function temporadasContadas(pais: Pais, referencia: string, data: string): number {
  const s1 = inicioDaTemporadaContada(pais, referencia, 1);
  if (data < s1) return 0;
  const anos = Number(data.slice(0, 4)) - Number(s1.slice(0, 4));
  return anos + (data.slice(5) >= pais.temporada.inicio ? 1 : 0);
}

/** Força na idade, pela curva: cresce até o potencial real aos 28 e cai depois do auge. */
export function forcaNaIdade(g: Geracao, idade: number): number {
  const pos = g.j.posicao;
  const ag = ehGoleiro(pos) ? 2 : 0;
  const cresce = (i: number) => (i - ag >= 28 ? 1 : fracaoDoPotencial(i, pos));
  const cai = (i: number) => (i - ag - g.atraso <= 31 ? 1 : fracaoDoPotencial(i - g.atraso, pos));
  const i0 = g.idadeInicio;
  let f = g.j.forca;
  if (cresce(i0) < 1) {
    const p = Math.min(1, Math.max(0, (cresce(idade) - cresce(i0)) / (1 - cresce(i0))));
    f = f + (g.potencialReal - f) * p;
  }
  f = (f * cai(idade)) / cai(i0);
  const teto = Math.max(FORCA_TETO, g.j.potencial, g.j.forca);
  return Math.min(teto, Math.max(1, Math.round(f)));
}

/** A maior força que a geração alcança (para saber se é lenda). */
function auge(g: Geracao): number {
  return Math.max(g.j.forca, g.j.forcaAuge ?? 0, g.idadeInicio < 28 ? g.potencialReal : 0);
}

const ehLenda = (g: Geracao) => g.j.estrela || auge(g) >= FORCA_DE_LENDA;

/**
 * Atributos na força nova, na mesma proporção (conta direta: o mundo inteiro passa por aqui a cada
 * temporada). Depois dos 29, o físico cai mais que o resto, e o resto sobe um pouco para compensar.
 */
function atributosEvoluidos(j: Jogador, base: Atributos, forca: number, idade: number): Atributos {
  const fator = forca / Math.max(1, j.forca);
  const anos = idade - IDADE_QUEDA_FISICA;
  const queda = anos > 0 && !ehGoleiro(j.posicao) ? Math.min(0.5, anos * 0.025) : 0;
  const r: Atributos = {};
  for (const [a, v] of Object.entries(base) as [Atributo, number][]) {
    const fisico = FISICOS.includes(a);
    const ajuste = queda ? (fisico ? 1 - queda : 1 + queda / 3) : 1;
    r[a] = Math.min(100, Math.max(1, Math.round(v * fator * ajuste)));
  }
  return r;
}

/** O jogador da geração numa data (força e atributos da idade; os atributos saem só se usados). */
function jogadorNaData(g: Geracao, data: string): Jogador {
  const idade = idadeEm(g.j.nascimento, data);
  const ruido = idade < 31 ? Math.round(new Rng(`${g.j.id}:${data}:ruido`).normal(0, 1)) : 0;
  const forca = Math.min(
    Math.max(FORCA_TETO, g.j.potencial),
    Math.max(1, forcaNaIdade(g, idade) + (data === g.inicio ? 0 : ruido)),
  );
  if (forca === g.j.forca) return g.j;
  const j: Jogador = {
    ...g.j,
    forca,
    potencial: Math.max(g.j.potencial, forca),
    forcaAuge: Math.max(g.j.forcaAuge ?? 0, forca),
  };
  let atributos: Atributos | undefined;
  Object.defineProperty(j, "atributos", {
    enumerable: true,
    configurable: true,
    get: () => (atributos ??= atributosEvoluidos(g.j, g.j.atributos ?? {}, forca, idade)),
  });
  return j;
}

/** Evolução de um mundo numa carreira (semente e começo). */
export class EvolucaoDoMundo {
  private vagas: Vaga[] = [];
  private porClube = new Map<string, Vaga[]>();
  private porId = new Map<string, Geracao>();
  private eventosPorData = new Map<string, EventoElenco[]>();
  private horizonte = "";
  private clubes: Clube[] = [];
  /** Os dois últimos elencos de cada clube (a temporada atual e a anterior, para comparar). */
  private cacheElenco = new Map<string, { data: string; lista: Jogador[] }[]>();

  constructor(
    readonly mundo: MundoParaEvolucao,
    readonly semente: string,
    readonly referencia: string,
  ) {}

  /** Data em que valem as forças do clube (o começo da temporada contada; antes, a referência). */
  dataDoClube(clube: string, data: string): string {
    const pais = this.mundo.pais(this.mundo.clube(clube)?.pais ?? "");
    if (!pais) return this.referencia;
    const k = temporadasContadas(pais, this.referencia, data);
    return k ? inicioDaTemporadaContada(pais, this.referencia, k) : this.referencia;
  }

  private iniciar() {
    if (this.vagas.length || !this.mundo.clubes) return;
    this.clubes = this.mundo.clubes.filter((c) => !c.filialDe);
    for (const c of this.mundo.clubes) {
      for (const j of this.mundo.elenco(c.id)) this.novaVaga(c.id, j, this.referencia);
      // A CPU revela os garotos da base do banco: os ícones e quem tem potencial para o clube
      // sobem aos 18; os outros (potencial abaixo do nível do clube + 2) saem da base.
      for (const j of this.mundo.base?.(c.id) ?? [])
        if (j.forcaAuge || j.potencial >= c.nivel + 2) this.subirDaBase(c, j);
    }
  }

  /** Garotos da base do banco que a CPU sobe (o clube do técnico decide os dele). */
  readonly daBase = new Set<string>();

  private subirDaBase(c: Clube, j: Jogador) {
    const pais = this.mundo.pais(c.pais);
    if (!pais) return;
    for (let k = 1; k < 10; k++) {
      const s = inicioDaTemporadaContada(pais, this.referencia, k);
      if (idadeEm(j.nascimento, s) < IDADE_PROMOCAO) continue;
      const forca = Math.max(
        j.forca,
        Math.round(j.potencial * fracaoDoPotencial(idadeEm(j.nascimento, s), j.posicao)),
      );
      const atributos = escalarAtributos(j.posicao, j.atributos ?? {}, forca);
      const g = this.novaVaga(c.id, { ...j, base: false, forca, atributos }, s);
      g.potencialReal = Math.max(forca, j.forcaAuge ?? j.potencial);
      this.daBase.add(j.id);
      this.evento({ tipo: "junior", data: s, id: j.id, clube: c.id, idade: g.idadeInicio });
      return;
    }
  }

  private novaVaga(clube: string, j: Jogador, inicio: string, renascido = false): Geracao {
    const g = this.geracao(clube, j, inicio, renascido);
    const v: Vaga = { clube, geracoes: [g] };
    this.vagas.push(v);
    const l = this.porClube.get(clube);
    if (l) l.push(v);
    else this.porClube.set(clube, [v]);
    return g;
  }

  private geracao(clube: string, j: Jogador, inicio: string, renascido = false): Geracao {
    const rng = new Rng(`${this.semente}:evolucao:${j.id}`);
    const idadeInicio = idadeEm(j.nascimento, inicio);
    const teto = Math.max(FORCA_TETO, j.potencial);
    const potencialReal =
      idadeInicio < 28 && !renascido
        ? Math.min(teto, Math.max(j.forca, Math.round(j.potencial + rng.normal(0, 2.5))))
        : j.potencial;
    const extra = (ehGoleiro(j.posicao) ? 2 : 0) + (j.estrela ? 1 : 0);
    const sorteada = Math.round(rng.normal(APOSENTADORIA_MEDIA, APOSENTADORIA_DESVIO)) + extra;
    const aposentadoria = Math.max(
      Math.min(APOSENTADORIA_MAXIMA + extra, Math.max(APOSENTADORIA_MINIMA, sorteada)),
      // Quem já passou da idade joga ao menos mais uma temporada.
      idadeInicio + 1,
    );
    const atraso = Math.round(rng.float(-1.5, 2) + (j.estrela ? 1 : 0));
    const g: Geracao = {
      j,
      clube,
      inicio,
      idadeInicio,
      potencialReal,
      aposentadoria,
      atraso,
      ...(renascido ? { renascido: true } : {}),
    };
    this.porId.set(j.id, g);
    return g;
  }

  /** Data da aposentadoria: o começo da 1ª temporada contada em que ele tem a idade sorteada. */
  private fimDe(g: Geracao): string | undefined {
    if (g.fim) return g.fim;
    const pais = this.mundo.pais(this.mundo.clube(g.clube)?.pais ?? "");
    if (!pais) return undefined;
    const k0 = Math.max(1, temporadasContadas(pais, this.referencia, g.inicio) + 1);
    for (let k = k0; k < k0 + 40; k++) {
      const s = inicioDaTemporadaContada(pais, this.referencia, k);
      if (s > g.inicio && idadeEm(g.j.nascimento, s) >= g.aposentadoria) return (g.fim = s);
    }
    return undefined;
  }

  private evento(e: EventoElenco) {
    const l = this.eventosPorData.get(e.data);
    if (l) l.push(e);
    else this.eventosPorData.set(e.data, [e]);
  }

  /** Estende as vagas do mundo até a data (aposentadorias, juniores e renascimentos). */
  private estender(ate: string) {
    if (ate <= this.horizonte) return;
    this.iniciar();
    for (let i = 0; i < this.vagas.length; i++) {
      const v = this.vagas[i] as Vaga;
      for (;;) {
        const g = v.geracoes[v.geracoes.length - 1] as Geracao;
        const fim = this.fimDe(g);
        if (!fim || fim > ate) break;
        this.evento({
          tipo: "aposentadoria",
          data: fim,
          id: g.j.id,
          clube: v.clube,
          idade: idadeEm(g.j.nascimento, fim),
        });
        const junior = this.junior(v, g, fim);
        v.geracoes.push(junior);
        this.evento({
          tipo: "junior",
          data: fim,
          id: junior.j.id,
          clube: v.clube,
          de: g.j.id,
          idade: junior.idadeInicio,
        });
        if (ehLenda(g)) this.renascer(g, fim);
      }
    }
    this.horizonte = ate;
  }

  private junior(v: Vaga, anterior: Geracao, data: string): Geracao {
    const clube = this.mundo.clube(v.clube);
    const pais = this.mundo.pais(clube?.pais ?? "");
    const id = `${v.geracoes[0]!.j.id}~${v.geracoes.length}`;
    const rng = new Rng(`${this.semente}:junior:${id}`);
    const entrada = gerarJogador(rng, {
      id,
      nacionalidade: pais?.codigo ?? anterior.j.nacionalidade,
      grupoNomes: pais?.grupoNomes ?? "pt-br",
      posicao: anterior.j.posicao,
      nivel: clube?.nivel ?? 50,
      hoje: data,
      clube: v.clube,
      idade: rng.int(IDADE_JUNIOR[0], IDADE_JUNIOR[1]),
    });
    // O aposentado estrela tem mais chance de deixar um júnior estrela.
    const estrela = entrada.estrela || (anterior.j.estrela && rng.chance(0.25));
    return this.geracao(v.clube, completar({ ...entrada, estrela }), data);
  }

  /**
   * A lenda renasce com 16 a 18 anos na base de qualquer clube do mundo, sorteado com chance igual
   * para todos (menos o clube de onde ela saiu): a graça é um time fraco ganhar um prodígio. Sobe
   * ao profissional aos 18 (no clube do técnico, quem decide é ele).
   */
  private renascer(g: Geracao, data: string) {
    const candidatos = this.clubes.filter((c) => c.id !== g.clube);
    if (!candidatos.length) return;
    const rng = new Rng(`${this.semente}:renascimento:${g.j.id}`);
    const destino = candidatos[rng.int(0, candidatos.length - 1)] as Clube;
    const pais = this.mundo.pais(destino.pais);
    if (!pais) return;
    const idade = rng.int(IDADE_RENASCIMENTO[0], IDADE_RENASCIMENTO[1]);
    const [a, m, d] = data.split("-").map(Number) as [number, number, number];
    const nascimento = new Date(Date.UTC(a - idade, m - 1, d) - rng.int(1, 300) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const pico = auge(g);
    // Sobe ao profissional no começo da 1ª temporada do país em que tem 18 anos.
    let promocao = data;
    for (let k = 1; k < 60; k++) {
      const s = inicioDaTemporadaContada(pais, this.referencia, k);
      if (s > data && idadeEm(nascimento, s) >= IDADE_PROMOCAO) {
        promocao = s;
        break;
      }
    }
    // Força da idade da promoção pela curva até o auge; o perfil é o mesmo, reduzido.
    const forca = Math.max(
      30,
      Math.round(pico * fracaoDoPotencial(idadeEm(nascimento, promocao), g.j.posicao)),
    );
    const j = {
      ...g.j,
      id: `${g.j.id}~r`,
      nascimento,
      clube: destino.id,
      forca,
      potencial: Math.max(forca, pico),
      forcaAuge: pico,
      atributos: escalarAtributos(g.j.posicao, g.j.atributos ?? {}, forca),
      base: false,
      ...(g.j.contrato
        ? {
            contrato: {
              fim: `${a + 3}-${g.j.contrato.fim.slice(5)}`,
              salario: g.j.contrato.salario,
            },
          }
        : {}),
    } as Jogador;
    delete (j as { numero?: number }).numero;
    this.novaVaga(destino.id, j, promocao, true);
    this.renascidos.add(j.id);
    this.evento({
      tipo: "renascimento",
      data,
      id: j.id,
      clube: destino.id,
      de: g.j.id,
      idade: idadeEm(nascimento, data),
    });
  }

  /** Lendas renascidas (ids). */
  readonly renascidos = new Set<string>();

  /** Elenco profissional do clube na data. */
  elenco(clube: string, data: string): readonly Jogador[] {
    const d = this.dataDoClube(clube, data);
    if (d === this.referencia) return this.mundo.elenco(clube);
    const cache = this.cacheElenco.get(clube) ?? [];
    const guardado = cache.find((x) => x.data === d);
    if (guardado) return guardado.lista;
    this.estender(fimDoAno(d));
    const lista: Jogador[] = [];
    for (const v of this.porClube.get(clube) ?? []) {
      const g = v.geracoes.find((x) => x.inicio <= d && (!x.fim || x.fim > d));
      if (g) lista.push(jogadorNaData(g, d));
    }
    this.cacheElenco.set(clube, [{ data: d, lista }, ...cache].slice(0, 2));
    return lista;
  }

  /** O jogador na data (aposentados aparecem como pararam; renascidos na base antes de subir). */
  jogador(id: string, data: string): Jogador | undefined {
    const g = this.porId.get(id);
    if (!g) return this.mundo.jogador(id);
    const d = this.dataDoClube(g.clube, data);
    if (this.renascidos.has(id) && data < g.inicio) return { ...g.j, base: true };
    const quando =
      g.fim && g.fim <= d
        ? this.dataDoClube(g.clube, somarDias(g.fim, -1))
        : d < g.inicio
          ? g.inicio
          : d;
    return jogadorNaData(g, quando < g.inicio ? g.inicio : quando);
  }

  /** O jogador já pendurou as chuteiras na data? */
  aposentado(id: string, data: string): boolean {
    const g = this.porId.get(id);
    if (!g) return false;
    this.estender(fimDoAno(data));
    return !!g.fim && g.fim <= this.dataDoClube(g.clube, data);
  }

  /** O que aconteceu nos elencos do mundo na data. */
  eventos(data: string): readonly EventoElenco[] {
    this.estender(fimDoAno(data));
    return this.eventosPorData.get(data) ?? [];
  }

  /** Marca do estado do mundo na data: muda quando alguma temporada contada começa. */
  marca(data: string): string {
    if (!this.paises) {
      const codigos = new Set((this.mundo.clubes ?? []).map((c) => c.pais));
      this.paises = [...codigos].map((p) => this.mundo.pais(p)).filter((p): p is Pais => !!p);
    }
    let maior = this.referencia;
    for (const p of this.paises) {
      const k = temporadasContadas(p, this.referencia, data);
      if (k) {
        const s = inicioDaTemporadaContada(p, this.referencia, k);
        if (s > maior) maior = s;
      }
    }
    return maior;
  }
  private paises: Pais[] | undefined;

  /** Para o mundo andar: já passou alguma temporada contada em algum país? */
  ativo(data: string): boolean {
    return data >= somarDias(this.referencia, CARENCIA_DIAS);
  }
}

const fimDoAno = (data: string) => `${data.slice(0, 4)}-12-31`;

/** Completa um jogador gerado (atributos e características a partir da força). */
export function completar(e: ReturnType<typeof gerarJogador>): Jogador {
  const atributos = gerarAtributos({
    semente: e.id,
    posicao: e.posicao,
    forca: e.forca,
    ...(e.caracteristicas ? { caracteristicas: e.caracteristicas as Atributo[] } : {}),
  });
  return {
    ...e,
    atributos,
    caracteristicas: caracteristicasDosAtributos(e.posicao, atributos),
    estrela: e.estrela ?? false,
    base: false,
    aConferir: [],
  } as unknown as Jogador;
}
