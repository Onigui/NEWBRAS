# Banco mundial: progresso e fontes

O banco é montado por `packages/banco` (`montarBanco()`). Para conferir o resultado em planilha:

```bash
pnpm --filter @newbras/banco exportar   # gera packages/banco/saida/ (JSON e CSVs)
```

## Etapas da Fase 3

| Etapa | Conteúdo                                                                                                                                                     | Status    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 3.1   | Pacote do banco, 211 países da FIFA (confederação, nível, nomes, temporada, janelas, cores), seleções, datas FIFA 2026, 27 estados e Séries A, B e C de 2026 | Concluída |
| 3.2   | Brasil: Série D (96 clubes) e clubes dos estaduais                                                                                                           | A fazer   |
| 3.3   | Inglaterra, Espanha, Itália, Alemanha e França, todas as divisões previstas                                                                                  | A fazer   |
| 3.4   | Os 20 países de nível 2                                                                                                                                      | A fazer   |
| 3.5   | Os países de nível 3                                                                                                                                         | A fazer   |
| 3.6   | Jogadores reais nas primeiras divisões dos 6 países de nível 1                                                                                               | A fazer   |
| 3.7   | Jogadores reais nas principais ligas de nível 2                                                                                                              | A fazer   |

Enquanto não há jogadores reais, cada clube recebe um elenco gerado (25 jogadores) com nomes da nacionalidade e força coerente com o nível do clube. A semente é por clube: editar um clube não muda os outros.

## Referências da temporada

- Brasil: temporada 2026. Europa: temporada 2026/27 (a cadastrar).
- Idades e contratos calculados a partir de 01/07/2026.
- Janelas do Brasil: as oficiais da CBF para 2026. Demais países: aproximadas por perfil de calendário, conferidas na Fase 13.
- Estádios, capacidades e cores: cadastrados de memória e conferidos por amostragem; correções pelo editor ou por planilha.

## Fontes consultadas

- Série A 2026: [Band](https://www.band.com.br/esportes/futebol/noticias/veja-20-times-serie-a-brasileirao-2026-202512071422), [CBF, conselho técnico](https://www.cbf.com.br/a-cbf/noticias/balancos/federacoes/cbf-realiza-conselho-tecnico-da-serie-a-de-2026)
- Série B 2026: [Lance!](https://www.lance.com.br/futebol-nacional/quando-comeca-a-serie-b-de-2026-veja-participantes.html), [CNN Brasil, playoffs](https://www.cnnbrasil.com.br/esportes/futebol/serie-b-completa-20-anos-adota-playoffs-e-amplia-transmissoes/)
- Série C 2026: [Diário do Pará](https://diariodopara.com.br/bola/serie-c-2026-com-o-paysandu-em-campo-veja-onde-assistir-e-como-sera-o-formato/), [CBF](https://www.cbf.com.br/futebol-brasileiro/noticias/jogos-selecao-futsal/a/cbf-publica-documentos-tecnicos-da-serie-c-de-2026)
- Janelas e datas FIFA 2026: [CBF, calendário 2026](https://www.cbf.com.br/a-cbf/arbitragem/comissao-termos-sorteios/a/cbf-oficializa-datas-do-calendario-do-futebol-do-brasil-profissional-masculino-de-2026), [Itatiaia](https://www.itatiaia.com.br/esportes/futebol/futebol-nacional/veja-todas-as-datas-do-novo-calendario-do-futebol-brasileiro-em-2026/)
