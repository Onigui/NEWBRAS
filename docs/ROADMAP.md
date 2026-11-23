# Cronograma

Documento vivo com os detalhes: [NewBras — Plano e Cronograma](https://claude.ai/artifact/1pWmj5R5pvgSiqD5saRDTD). Este arquivo espelha o status de cada fase.

Marcos: **A** amistoso jogável (Fase 6), **B** temporada completa (Fase 8), **C** v1.0 cópia completa (Fase 13).

| Fase                     | Entregas principais                                                                                                                  | Tamanho   | Status    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------- | --------- |
| 0. Pesquisa e plano      | Pesquisa do Brasfoot, arquitetura, cronograma                                                                                        | P         | Concluída |
| 1. Fundação              | Monorepo, lint, testes, CI, publicação como PWA, tela inicial, documentação                                                          | P         | Concluída |
| 2. Modelo de dados       | Esquemas de país, estado, clube, jogador, liga, copa, seleção e técnico; validação; banco inicial; importar e exportar JSON e CSV    | M         | A fazer   |
| 3. Editor de Equipes     | Listar, adicionar, editar, deletar e procurar times e jogadores; transferir com botão direito; validação; escudos e camisas; patches | G         | A fazer   |
| 4. Motor: núcleo         | Semente, posicionamento, posse, ações e disputas, eventos, energia, substituições, notas, estatísticas                               | GG        | A fazer   |
| 5. Realismo e calibração | Forma do dia, dia iluminado, dia do time, moral, mando, placar, táticas; 10.000 jogos contra as metas                                | G         | A fazer   |
| 6. Tela de partida       | Mini-campo em tempo real, modo clássico, velocidades, substituições e tática ao vivo, placares da rodada (**Marco A**)               | G         | A fazer   |
| 7. Novo jogo e plantel   | Configuração do novo jogo, calendário, tela do plantel, escalação, salvar e carregar                                                 | G         | A fazer   |
| 8. Competições           | Ligas, estaduais, copas nacionais e continentais, seleções, amistosos (**Marco B**)                                                  | GG        | A fazer   |
| 9. Elenco e evolução     | Evolução, aposentadoria e juniores, renascimento de lendas, moral, lesões, suspensões, contratos, empréstimos                        | G         | A fazer   |
| 10. Mercado              | Mercado aquecido entre CPUs, propostas ao humano, leilões, renovação, passe livre; teste de 10 temporadas                            | GG        | A fazer   |
| 11. Finanças e estádio   | Ingressos, patrocínio, salários, ampliação do estádio, amistosos                                                                     | M         | A fazer   |
| 12. Carreira e prêmios   | Confiança, reputação, demissão, propostas, seleções, rankings, Bolas de Prata e de Ouro, notícias                                    | G         | A fazer   |
| 13. Paridade e polimento | Checklist de paridade, opções, atalhos, sons, desempenho, testes de ponta a ponta (**Marco C**)                                      | M         | A fazer   |
| 14. Melhorias NewBras    | Itens aprovados, um por vez                                                                                                          | A definir | A fazer   |
| 15. Android e desktop    | Capacitor e Tauri                                                                                                                    | M         | A fazer   |

## Histórico

| Data       | Fase                | O que mudou                                                             |
| ---------- | ------------------- | ----------------------------------------------------------------------- |
| 23/11/2026 | 1. Fundação         | Monorepo, CI, publicação no GitHub Pages, tela inicial, RNG com semente |
| 23/11/2026 | 0. Pesquisa e plano | Pesquisa concluída, arquitetura e cronograma criados                    |
