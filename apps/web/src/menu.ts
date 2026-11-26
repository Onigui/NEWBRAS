import { t } from "@newbras/textos";
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
    label: t("Novo jogo"),
    key: "n",
    description: t(
      "Escolha seu nome e o clube; a carreira começa na pré-temporada do país, com amistosos marcados.",
    ),
    fase: 8,
  },
  {
    id: "carregar",
    label: t("Carregar jogo"),
    key: "c",
    description: t(
      "Continue uma carreira salva (ela se salva sozinha; F2 salva na hora) ou abra um arquivo.",
    ),
    fase: 8,
  },
  {
    id: "amistoso",
    label: t("Amistoso"),
    key: "a",
    description: t(
      "Prévia do motor de partida: escolha dois times do banco e veja o jogo lance a lance, com estatísticas e notas.",
    ),
    fase: 5,
  },
  {
    id: "editor",
    label: t("Editor de equipes"),
    key: "e",
    description: t(
      "Crie e edite times e jogadores antes de começar: nome, posição, força, características, estrelas, escudos e camisas.",
    ),
    fase: 4,
  },
  {
    id: "opcoes",
    label: t("Opções"),
    key: "o",
    description: t(
      "Velocidade das partidas, avisos de contrato, sons e regras como o renascimento de lendas.",
    ),
    fase: 16,
  },
];

export function findMenuItem(id: ScreenId): MenuItem {
  const item = MENU.find((m) => m.id === id);
  if (!item) throw new Error(`Item de menu desconhecido: ${id}`);
  return item;
}
