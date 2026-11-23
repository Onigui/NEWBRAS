# Banco mundial: progresso e fontes

O banco é montado por `packages/banco` (`montarBanco()`). Para conferir o resultado em planilha:

```bash
pnpm --filter @newbras/banco exportar   # gera packages/banco/saida/ (JSON e CSVs)
```

## Etapas da Fase 3

| Etapa | Conteúdo                                                                                                                                                     | Status    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 3.1   | Pacote do banco, 211 países da FIFA (confederação, nível, nomes, temporada, janelas, cores), seleções, datas FIFA 2026, 27 estados e Séries A, B e C de 2026 | Concluída |
| 3.2   | Brasil: Série D (96 clubes) e os 27 estaduais de 2026 (123 clubes que só jogam estadual)                                                                     | Concluída |
| 3.3   | Inglaterra (4 divisões), Espanha, Itália, Alemanha e França (3 divisões cada) na temporada 2026/27: 384 clubes                                               | Concluída |
| 3.4a  | EUA (MLS, 30 clubes) e Arábia Saudita (Pro League e First Division) com todos os jogadores reais da MLS e da Pro League; 22 ícones na base                   | Concluída |
| 3.4b  | Os outros 18 países de nível 2 (1ª e 2ª divisão) e a USL Championship                                                                                        | A fazer   |
| 3.5   | Os países de nível 3                                                                                                                                         | A fazer   |
| 3.6   | Jogadores reais nas primeiras divisões dos 6 países de nível 1                                                                                               | A fazer   |
| 3.7   | Jogadores reais nas principais ligas de nível 2                                                                                                              | A fazer   |

Enquanto não há jogadores reais, cada clube recebe um elenco gerado (25 jogadores) com nomes da nacionalidade e força coerente com o nível do clube. A semente é por clube: editar um clube não muda os outros.

## Referências da temporada

- Brasil: temporada 2026. Europa: temporada 2026/27.
- Idades e contratos calculados a partir de 01/07/2026. Contratos gerados vencem em 31/12 no Brasil e em 30/06 na Europa.
- Janelas do Brasil: as oficiais da CBF para 2026. Demais países: aproximadas por perfil de calendário, conferidas na Fase 13.
- Estádios, capacidades e cores: cadastrados de memória e conferidos por amostragem. Quando um campo não foi confirmado em fonte, o clube leva a marcação `aConferir` com o nome do campo, e o editor destaca para correção.

## Fontes consultadas

- Série A 2026: [Band](https://www.band.com.br/esportes/futebol/noticias/veja-20-times-serie-a-brasileirao-2026-202512071422), [CBF, conselho técnico](https://www.cbf.com.br/a-cbf/noticias/balancos/federacoes/cbf-realiza-conselho-tecnico-da-serie-a-de-2026)
- Série B 2026: [Lance!](https://www.lance.com.br/futebol-nacional/quando-comeca-a-serie-b-de-2026-veja-participantes.html), [CNN Brasil, playoffs](https://www.cnnbrasil.com.br/esportes/futebol/serie-b-completa-20-anos-adota-playoffs-e-amplia-transmissoes/)
- Série C 2026: [Diário do Pará](https://diariodopara.com.br/bola/serie-c-2026-com-o-paysandu-em-campo-veja-onde-assistir-e-como-sera-o-formato/), [CBF](https://www.cbf.com.br/futebol-brasileiro/noticias/jogos-selecao-futsal/a/cbf-publica-documentos-tecnicos-da-serie-c-de-2026)
- Série D 2026: grupos em [Correio Braziliense](https://www.correiobraziliense.com.br/esportes/2026/03/7370211-serie-d-veja-os-grupos-de-brasiliense-capital-ceilandia-e-gama.html), cidades na [Wikipédia](https://en.wikipedia.org/wiki/2026_Campeonato_Brasileiro_S%C3%A9rie_D), formato em [TNH1](https://www.tnh1.com.br/noticia/nid/serie-d-confira-os-grupos-formato-datas-e-premiacao/)
- Estaduais 2026: [guia do Terra](https://www.terra.com.br/esportes/futebol/estaduais/campeonato-carioca/confira-o-guia-completo-de-todos-os-estaduais-de-2026-veja-os-duelos,f07fc726855d272383b6b9fc621bd708oianqktd.html), Pernambuco e Rio Grande do Norte conferidos na imprensa local. Formatos simplificados; detalhados na Fase 9. Clubes que só jogam estadual estão com cidade, estádio e cores a conferir.
- Janelas e datas FIFA 2026: [CBF, calendário 2026](https://www.cbf.com.br/a-cbf/arbitragem/comissao-termos-sorteios/a/cbf-oficializa-datas-do-calendario-do-futebol-do-brasil-profissional-masculino-de-2026), [Itatiaia](https://www.itatiaia.com.br/esportes/futebol/futebol-nacional/veja-todas-as-datas-do-novo-calendario-do-futebol-brasileiro-em-2026/)
- Inglaterra 2026/27: Wikipédia, [Premier League](https://en.wikipedia.org/wiki/2026%E2%80%9327_Premier_League), [Championship](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_Championship) (playoffs com seis clubes a partir desta temporada), [League One](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_One) e [League Two](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_Two)
- Espanha 2026/27: Wikipédia, [LaLiga](https://en.wikipedia.org/wiki/2026%E2%80%9327_La_Liga), [LaLiga 2](https://en.wikipedia.org/wiki/2026%E2%80%9327_Segunda_Divisi%C3%B3n) e [Primera Federación](https://en.wikipedia.org/wiki/2026%E2%80%9327_Primera_Federaci%C3%B3n)
- Itália 2026/27: Wikipédia, [Serie A](https://en.wikipedia.org/wiki/2026%E2%80%9327_Serie_A) e [Serie B](https://en.wikipedia.org/wiki/2026%E2%80%9327_Serie_B); grupos da Serie C no [Calcio e Finanza](https://www.calcioefinanza.it/?p=233012) e estádios na página da [Serie C 2025/26](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/2025%E2%80%9326_Serie_C) e no [Fichajes](https://www.fichajes.com/italia/serie-c/estadios) (capacidade a conferir para quem chegou nesta temporada)
- Alemanha 2026/27: Wikipédia, [Bundesliga](https://en.wikipedia.org/wiki/2026%E2%80%9327_Bundesliga), [2. Bundesliga](https://en.wikipedia.org/wiki/2026%E2%80%9327_2._Bundesliga) e [3. Liga](https://en.wikipedia.org/wiki/2026%E2%80%9327_3._Liga)
- França 2026/27: Wikipédia, [Ligue 1](https://en.wikipedia.org/wiki/2026%E2%80%9327_Ligue_1) e [Ligue 2](https://en.wikipedia.org/wiki/2026%E2%80%9327_Ligue_2); clubes da Ligue 3 na [FFF](https://www.fff.fr/article/17022-le-calendrier-2026-2027-est-servi.html) e estádios no [National 2025/26](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/Ligue_3)
- Cores dos clubes europeus: cadastradas de memória; as menos conhecidas estão marcadas para conferir. Os níveis seguintes (5ª divisão inglesa, 4ª das demais) entram junto com as copas nacionais, na Fase 9.
- MLS 2026 e Saudi Pro League 2026/27, elencos: [FotMob](https://www.fotmob.com) (consulta em 23/11/2026; nome, posições, número, idade, nacionalidade e valor de mercado). Inter Miami pela [ESPN](https://www.espn.com/soccer/team/squad/_/id/20232/usa.inter_miami), com posições detalhadas completadas à mão. Clubes da First Division saudita pela tabela do FotMob; formato de acesso pela [RSSSF](https://rsssf.org/tabless/sau2026.html).
- Jogadores reais: o nascimento é aproximado pela idade (marcado `aConferir`), exceto nos ajustados à mão; força e potencial pelo modelo de valor de mercado descrito em `docs/DECISOES.md`.
- Ícones: lista escolhida a partir dos rankings de melhores do século XXI da [Goal](https://www.goal.com/en/lists/best-mens-footballers-21st-century-ranked/bltfabf5fe89f36470a), da [FourFourTwo](https://www.fourfourtwo.com/features/ranked-the-100-best-players-of-the-21st-century/6), da [ESPN](https://global.espn.com/football/story/_/id/40490059/ranking-top-25-men-soccer-players-21st-century) e da [OneFootball](https://ca.sports.yahoo.com/news/25-greatest-players-last-25-101600056.html), mais Gareth Bale.
