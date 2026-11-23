# NewBras

Manager de futebol inspirado no Brasfoot: você comanda um clube, escala o time, negocia no mercado e acompanha as partidas num mini-campo simulado em tempo real. O editor de times e jogadores fica na tela inicial, antes de começar o jogo.

O plano é recriar primeiro tudo o que o Brasfoot tinha e só depois evoluir. O cronograma completo, com o status de cada fase, está em [docs/ROADMAP.md](docs/ROADMAP.md).

## Como rodar

Requisitos: Node 20+ e pnpm 10.

```bash
pnpm install
pnpm dev        # abre o jogo em http://localhost:5173
pnpm check      # formato, lint, tipos, testes e build
```

## Estrutura

| Pasta             | O que tem                                                                     |
| ----------------- | ----------------------------------------------------------------------------- |
| `apps/web`        | O jogo (React + TypeScript + Tailwind), instalável como PWA e jogável offline |
| `packages/engine` | Motor determinístico: partidas, temporadas, mercado, carreira                 |
| `packages/data`   | Modelo de dados aberto: posições, características, times, jogadores, ligas    |
| `docs`            | Pesquisa sobre o Brasfoot, decisões e cronograma                              |

## Documentação

- [Pesquisa: como o Brasfoot funcionava](docs/PESQUISA.md)
- [Decisões do projeto](docs/DECISOES.md)
- [Cronograma](docs/ROADMAP.md)

O NewBras não usa código, banco de dados, escudos nem imagens do Brasfoot. As mecânicas foram recriadas a partir de manuais e documentação pública.
