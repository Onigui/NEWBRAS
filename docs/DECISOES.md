# Decisões do projeto

| Data       | Decisão            | Escolha                                        | Consequência                                                                                                                                                                                                                                         |
| ---------- | ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23/11/2026 | Plataforma         | Web primeiro (React + TypeScript, PWA offline) | Android (Capacitor) e PC (Tauri) na Fase 18                                                                                                                                                                                                          |
| 23/11/2026 | Motor de partida   | Espacial desde a Fase 5: 22 jogadores e bola   | O modo clássico (linha de minutos) lê o mesmo registro de eventos do mini-campo                                                                                                                                                                      |
| 23/11/2026 | Nomes              | Clubes e jogadores reais                       | Escudos e camisas desenhados pelo jogo nas cores do clube, sem logotipos oficiais; banco num pacote de dados separado, trocável por um fictício                                                                                                      |
| 23/11/2026 | Morte de veteranos | Trocada pelo renascimento de lendas            | Força 80+ ou estrela renasce com 16 a 18 anos na base de um clube aleatório, mesmo nome e características, atributos reduzidos na mesma proporção e potencial igual à força do auge                                                                  |
| 23/11/2026 | Mercado            | Mercado aquecido                               | Todo clube da CPU diagnostica o elenco, define objetivo e orçamento e negocia com outros clubes                                                                                                                                                      |
| 23/11/2026 | Transferências     | Janelas reais por país                         | Fora da janela, só jogadores livres; compras, vendas e empréstimos só com a janela do comprador aberta; pré-contrato nos últimos 6 meses                                                                                                             |
| 23/11/2026 | Abrangência        | Futebol mundial por níveis                     | Nível 1: Brasil, Inglaterra, Espanha, Itália, Alemanha, França com várias divisões e todas as copas. Nível 2: cerca de 20 países com 1ª e 2ª divisão e copa. Nível 3: 1ª divisão dos demais países das copas continentais. Todas as seleções da FIFA |
| 23/11/2026 | Jogadores          | Banco híbrido                                  | Reais nas primeiras divisões principais (atualizados até meados de 2026); gerados com nomes da nacionalidade no resto; planilha e editor para corrigir                                                                                               |
| 23/11/2026 | Seleções           | Clube e seleção ao mesmo tempo                 | Convites pela reputação e pelos resultados; convocação em datas FIFA e torneios                                                                                                                                                                      |

## Exceções à regra "paridade antes de inovação"

O NewBras recria o Brasfoot antes de inovar. Estas exceções foram aprovadas e entram já na cópia:

1. Motor espacial com mini-campo.
2. Mercado aquecido entre clubes da CPU.
3. Janelas de transferência reais (o Brasfoot permitia comprar a qualquer momento).
4. Renascimento de lendas no lugar da morte de veteranos.
5. Futebol mundial completo, com todas as competições reais.

## Curva de evolução por idade

Implementada em `packages/engine/src/evolucao.ts` como fração do potencial:

| Idade        | Fração do potencial                                         |
| ------------ | ----------------------------------------------------------- |
| 16 ou menos  | 55%                                                         |
| 17 a 23      | sobe de 55% a 88%                                           |
| 24 a 27      | sobe de 88% a 100%                                          |
| 28 a 31      | 100% (auge)                                                 |
| 32 em diante | cai cada vez mais rápido (98,5%, 95,5%, 91%, 85%, 77,5%...) |

Goleiros seguem a mesma curva com 2 anos de atraso.

## Regras definidas pelo NewBras (o Brasfoot não documenta)

| Tema                   | Regra                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| Cartões                | 3 amarelos suspendem 1 jogo; vermelho suspende pelo menos 1             |
| Lesões                 | Duração sorteada por gravidade; detalhada na Fase 12                    |
| Formatos de competição | Os reais, conferidos na fonte oficial durante a fase de cada competição |
