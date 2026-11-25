# Decisões do projeto

| Data       | Decisão            | Escolha                                                                        | Consequência                                                                                                                                                                                                                                         |
| ---------- | ------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23/11/2026 | Plataforma         | Web primeiro (React + TypeScript, PWA offline)                                 | Android (Capacitor) e PC (Tauri) na Fase 18                                                                                                                                                                                                          |
| 23/11/2026 | Motor de partida   | Espacial desde a Fase 5: 22 jogadores e bola                                   | O modo clássico (linha de minutos) lê o mesmo registro de eventos do mini-campo                                                                                                                                                                      |
| 23/11/2026 | Nomes              | Clubes e jogadores reais                                                       | Escudos e camisas desenhados pelo jogo nas cores do clube, sem logotipos oficiais; banco num pacote de dados separado, trocável por um fictício                                                                                                      |
| 23/11/2026 | Morte de veteranos | Trocada pelo renascimento de lendas                                            | Força 80+ ou estrela renasce com 16 a 18 anos na base de um clube aleatório, mesmo nome e características, atributos reduzidos na mesma proporção e potencial igual à força do auge                                                                  |
| 23/11/2026 | Mercado            | Mercado aquecido                                                               | Todo clube da CPU diagnostica o elenco, define objetivo e orçamento e negocia com outros clubes                                                                                                                                                      |
| 23/11/2026 | Transferências     | Janelas reais por país                                                         | Fora da janela, só jogadores livres; compras, vendas e empréstimos só com a janela do comprador aberta; pré-contrato nos últimos 6 meses                                                                                                             |
| 23/11/2026 | Abrangência        | Futebol mundial por níveis                                                     | Nível 1: Brasil, Inglaterra, Espanha, Itália, Alemanha, França com várias divisões e todas as copas. Nível 2: cerca de 20 países com 1ª e 2ª divisão e copa. Nível 3: 1ª divisão dos demais países das copas continentais. Todas as seleções da FIFA |
| 23/11/2026 | Jogadores          | Banco híbrido                                                                  | Reais nas primeiras divisões principais (atualizados até meados de 2026); gerados com nomes da nacionalidade no resto; planilha e editor para corrigir                                                                                               |
| 23/11/2026 | Venda de craques   | Jogo duro                                                                      | Clubes classificam jogadores (intocável, peça-chave, negociável, dispensável), cobram muito acima do valor pelos raros, renovam e se reforçam para segurá-los; multa rescisória obriga a venda                                                       |
| 23/11/2026 | Seleções           | Clube e seleção ao mesmo tempo                                                 | Convites pela reputação e pelos resultados; convocação em datas FIFA e torneios                                                                                                                                                                      |
| 23/11/2026 | Estádios           | Base do Brasfoot + 4 melhorias                                                 | Obras com prazo e capacidade reduzida; público realista; setores e sócio-torcedor; manutenção, gramado e exigências por competição com aluguel de estádio; arena nova com financiamento, naming rights e eventos                                     |
| 23/11/2026 | Ligas de veteranos | MLS e Saudi Pro League completas e reais                                       | Todos os elencos reais (fonte FotMob, nov/2026); lendas em declínio com força atual baixa e força do auge guardada para o renascimento                                                                                                               |
| 23/11/2026 | Ícones             | 22 ídolos aposentados recomeçam na base                                        | Gareth Bale, Zidane, Ronaldo, Ronaldinho e outros nascem com 15 ou 16 anos na base de um clube sorteado pela semente, com potencial igual ao auge real                                                                                               |
| 23/11/2026 | Categoria de base  | Base no estilo do FC (o Brasfoot só tinha o júnior que substitui o aposentado) | Olheiros com nível mandados a países ou regiões, relatórios com faixa de potencial, elenco de base por clube, investimento em estrutura, promoção a partir dos 16 anos; a CPU também revela jogadores                                                |

## Exceções à regra "paridade antes de inovação"

O NewBras recria o Brasfoot antes de inovar. Estas exceções foram aprovadas e entram já na cópia:

1. Motor espacial com mini-campo.
2. Mercado aquecido entre clubes da CPU.
3. Janelas de transferência reais (o Brasfoot permitia comprar a qualquer momento).
4. Renascimento de lendas no lugar da morte de veteranos.
5. Futebol mundial completo, com todas as competições reais.
6. Categoria de base com olheiros, no estilo do FC.
7. Ícones aposentados recomeçando na base.
8. Atributos dos jogadores por trás da força e das características.
9. Humor do jogador visível na escalação e barra de condição física.

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

## Força dos jogadores reais

Para elencos reais sem ajuste à mão, a força vem do valor de mercado e da idade:

- força pelo valor = 54 + 12 × log10(valor em mil euros ÷ 100) (€53 mi ≈ 87; €2 mi ≈ 70; €300 mil ≈ 60);
- até 22 anos, o valor reflete o potencial: a força cai 2,5 por ano abaixo de 23 e o potencial sobe 1,5 por ano;
- a partir dos 29, o valor cai mais rápido que a força: soma 1,3 por ano acima de 28 (no máximo 12);
- sem valor na fonte, a força parte do nível do clube.

Lendas e craques têm força atual e força do auge ajustadas à mão (`packages/banco/src/reais/notaveis.ts`).

## Atributos dos jogadores (etapa 4b, aprovada em 25/11/2026)

O Brasfoot mostra só força e 2 características. O NewBras guarda atributos para o motor espacial poder diferenciar quem é rápido, quem chuta de longe, quem cansa. Na tela, a força e as características continuam como no Brasfoot.

| Grupo   | Atributos (1 a 100)                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linha   | Velocidade, Resistência, Força física (novo), Finalização, Chute de longe (novo), Cabeceio, Drible, Passe, Cruzamento, Armação, Desarme, Marcação |
| Goleiro | Reflexo, Colocação, Saída do gol, Defesa de pênalti, Reposição (novo)                                                                             |

- A força é a média ponderada dos atributos com pesos por posição (`packages/data/src/atributos.ts`). Mudar de posição muda a força: um zagueiro escalado de atacante rende menos.
- As características são o atributo mais alto e, se estiver a até 8 pontos dele, o segundo. Só uma característica marca jogador limitado, como no Brasfoot (cerca de 12% do banco).
- Sem atributos na fonte, o perfil é gerado pela semente do id: os atributos que pesam na posição ficam em volta da força, os outros abaixo, as características acima de todos. O perfil é montado numa força de no máximo 92 e escalado para a de hoje, para os destaques caberem acima do resto.
- Craques e ícones têm destaques à mão na escala do auge (velocidade 99 do Bale, chute de longe 97 do Roberto Carlos, drible 99 do Messi). Lendas renascidas mantêm o perfil.
- No editor, mexer num atributo recalcula força e características; mexer na força escala todos os atributos na mesma proporção. Nas planilhas, cada atributo tem sua coluna.
- Evolução (Fase 12): atributos físicos (velocidade, resistência, força física) chegam ao auge por volta dos 25 a 28 anos e caem primeiro; técnicos e mentais caem mais tarde.

## Humor e condição física (desenho aprovado em 25/11/2026)

Estado da carreira salvo no jogo, não dado do banco. Implementação nas Fases 6 (humor no motor) e 8 (escalação).

| Humor   | Chance base | Efeito no rendimento |
| ------- | ----------- | -------------------- |
| Ótimo   | 10%         | +6%                  |
| Bom     | 30%         | +3%                  |
| Normal  | 45%         | 0                    |
| Ruim    | 12%         | −5%                  |
| Péssimo | 3%          | −10%                 |

- O humor dura alguns dias (sequências boas e ruins) e é puxado pela moral, pelo cansaço acumulado e pela adaptação de quem chegou ao clube. Aparece na escalação; o "dia iluminado" continua escondido.
- Condição física de 0 a 100%: cai durante o jogo conforme os minutos, a intensidade e a resistência; recupera a cada dia. Abaixo de certo ponto, corta os atributos físicos e aumenta o risco de lesão.
- A escalação avisa "melhor poupar" quando um titular está esgotado ou num dia ruim; a CPU usa a mesma regra para fazer rodízio.
