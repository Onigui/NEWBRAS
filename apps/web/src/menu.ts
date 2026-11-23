export type ScreenId = "novo-jogo" | "carregar" | "editor" | "opcoes";

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
      "Escolha a liga, o formato das divisões, quantos técnicos humanos vão jogar e o time de cada um.",
    fase: 7,
  },
  {
    id: "carregar",
    label: "Carregar jogo",
    key: "c",
    description: "Continue uma carreira salva com F2 durante o jogo.",
    fase: 7,
  },
  {
    id: "editor",
    label: "Editor de equipes",
    key: "e",
    description:
      "Crie e edite times e jogadores antes de começar: nome, posição, força, características, estrelas, escudos e camisas.",
    fase: 3,
  },
  {
    id: "opcoes",
    label: "Opções",
    key: "o",
    description:
      "Velocidade das partidas, avisos de contrato, sons e regras como o renascimento de lendas.",
    fase: 13,
  },
];

export function findMenuItem(id: ScreenId): MenuItem {
  const item = MENU.find((m) => m.id === id);
  if (!item) throw new Error(`Item de menu desconhecido: ${id}`);
  return item;
}
