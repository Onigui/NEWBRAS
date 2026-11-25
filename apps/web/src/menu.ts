export type ScreenId = "novo-jogo" | "carregar" | "amistoso" | "editor" | "opcoes";

export interface MenuItem {
  id: ScreenId;
  label: string;
  /** Tecla de atalho, como nos menus do Brasfoot. */
  key: string;
  /** O que a tela vai fazer, mostrado enquanto ela não existe. */
  description: string;
  /** Fase do cronograma em que a tela fica pronta. */
  fase: number;
}

export const MENU: readonly MenuItem[] = [
  {
    id: "novo-jogo",
    label: "Novo jogo",
    key: "n",
    description:
      "Escolha os países e ligas, quantos técnicos humanos vão jogar e o time de cada um.",
    fase: 8,
  },
  {
    id: "carregar",
    label: "Carregar jogo",
    key: "c",
    description: "Continue uma carreira salva com F2 durante o jogo.",
    fase: 8,
  },
  {
    id: "amistoso",
    label: "Amistoso",
    key: "a",
    description:
      "Prévia do motor de partida: escolha dois times do banco e veja o jogo lance a lance, com estatísticas e notas.",
    fase: 5,
  },
  {
    id: "editor",
    label: "Editor de equipes",
    key: "e",
    description:
      "Crie e edite times e jogadores antes de começar: nome, posição, força, características, estrelas, escudos e camisas.",
    fase: 4,
  },
  {
    id: "opcoes",
    label: "Opções",
    key: "o",
    description:
      "Velocidade das partidas, avisos de contrato, sons e regras como o renascimento de lendas.",
    fase: 16,
  },
];

export function findMenuItem(id: ScreenId): MenuItem {
  const item = MENU.find((m) => m.id === id);
  if (!item) throw new Error(`Item de menu desconhecido: ${id}`);
  return item;
}
