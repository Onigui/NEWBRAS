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

## Teto de força: CR7 99, Messi 97 (25/11/2026)

- Só o Cristiano Ronaldo chega a 99 (no auge): é o jogador mais completo da história, com quase todos os atributos no máximo, inclusive cabeceio e força física.
- Messi é o segundo, com 97: gênio com a bola (drible 100, finalização, passe e chute de longe 99), mas sem a altura, o cabeceio e o corpo do CR7 (cabeceio 86 e força física 87 no auge).
- Nenhum outro jogador passa de 97 em força, potencial ou força do auge (`FORCA_TETO` e `FORCA_RECORDE` em `packages/data/src/football.ts`). Vale para o banco, para os gerados e, na Fase 12, para a evolução e os renascidos.
- Os perfis dos dois no auge são feitos à mão (`atributosAuge` em `notaveis.ts`) e a força de hoje segue a idade (CR7 com 41 anos, Messi com 39).
- Para o atacante, cabeceio e passe pesam 1 e força física 0,5 na força: cabeceio fraco puxa a força para baixo, mas não impede um craque de técnica.

## Potencial, craques novos e tamanho dos elencos (25/11/2026)

**Potencial é o teto da carreira e não baixa.** Serve para comparar até onde o jogador chegou e quanto ele já caiu. Veterano guarda o auge: Neymar tem força 80 hoje e potencial 95.

- Lendas vivas têm o auge à mão em `notaveis.ts` (Neymar, Modrić, De Bruyne, Salah, Van Dijk, Kane, Neuer, Thiago Silva, Hulk, Di María, Kanté e outros), com posição, nascimento e destaques. Ajuste à mão só vale se a idade da fonte bater (±2 anos), para homônimos não herdarem dados.
- Sem ajuste à mão, o auge de quem passou dos 28 vem da curva de idade: até 8 pontos acima da força de hoje e no máximo 92.
- Estrela: força do auge 85 ou mais, ou força de hoje 82 ou mais.

**Craques novos são raros.** O mundo já recebe as lendas que renascem.

| Origem                | Regra                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Jogador gerado        | Potencial acima de 86 cresce um terço do sorteio, até 92                                      |
| Fenômeno gerado       | 1 em 20.000, só com até 20 anos, potencial de 93 a 97 (nenhum no mundo inicial)               |
| Promessa real (fonte) | Acima de 90 cresce pela metade, até 95; joias de verdade (Yamal 96, Mbappé, Haaland 95) à mão |
| Todos, menos o CR7    | Nunca acima de 97                                                                             |

**Elenco profissional: no máximo 30 por clube** (`ELENCO_MAXIMO`), como a lista A da CBF a partir de 2027; as ligas europeias inscrevem 25 mais os jovens. A base fica fora da conta, numa aba própria, com até 15 jogadores.

- Onde a fonte trazia mais de 30 (Vasco com 54, Chapecoense com 58), o clube fica com os melhores, garantindo 3 goleiros, 4 laterais, 5 zagueiros, 6 meias e 4 atacantes.
- Quem sobra com até 20 anos vai para a base do próprio clube; o resto vai para um clube do mesmo país com vaga (até 28 no elenco), do nível mais perto da força do jogador. O clube que cede não perde força e ninguém é inventado.
- A validação do banco avisa quando um clube passa de 30 profissionais.

## Motor de partida: como o núcleo funciona (Fase 5, 25/11/2026)

- **Relógio:** a partida anda de segundo em segundo, com acréscimos pelos gols, trocas, cartões e lesões do período. Prorrogação (2 × 15) e disputa de pênaltis existem para o mata-mata.
- **Movimento:** cada jogador tem uma vaga da formação (9 formações) que se desloca com a bola e com a fase do jogo; sem a bola, o time recua, fecha o lado da bola e marca o adversário mais perto, entre ele e o gol; os 1 ou 2 mais próximos pressionam (2 com marcação pesada). Velocidade e condição física decidem quanto cada um corre.
- **Decisão:** quem tem a bola escolhe entre passar, conduzir, driblar, cruzar e chutar, pela posição e pelos atributos (chute de longe só pesa de fora da área, cruzamento só pelas pontas no terço final). O passe pesa o avanço contra o risco de interceptação.
- **Disputas:** cada ação enfrenta o adversário mais perto: drible contra desarme e velocidade, bote do marcador, cabeceio contra cabeceio e marcação, goleiro contra chute (reflexo, colocação, saída e defesa de pênalti). O chute tem probabilidade de gol (xG) pela distância, ângulo, pressão e habilidade.
- **Cansaço:** a condição cai com a distância corrida, mais em quem tem pouca resistência, e corta os atributos físicos (até 30%) e técnicos (até 10%). A CPU troca os cansados a partir dos 58 minutos; o humano troca quando quiser (até 5 trocas em 3 paradas). Lesionado sai na hora.
- **Saída:** registro de eventos (modo clássico), estatísticas por time e por jogador, notas de 0,5 a 10 e, para o jogo assistido, a posição dos 22 e da bola a cada segundo (mini-campo da Fase 7).
- **Números de referência** (200 jogos entre times de força 70): 2,8 gols, 14 chutes e 5 no gol por time, 78% de passes certos, 21 faltas, 3,3 amarelos, 29% de empates, 10 km por jogador. Um time 15 pontos mais forte vence mais de 60%. Cerca de 20 ms por partida.
- **Fica para a Fase 6:** mando de campo, humor, moral, dia iluminado, ajuste das táticas e a calibração com 10.000 jogos contra as metas.

## Formações e partida assistida (25/11/2026)

**Formações:** 27 prontas (do 4-4-2 ao WM e à pirâmide 2-3-5) e a **formação personalizada**: o técnico arrasta cada jogador para onde quiser no campo. A função da vaga vem do lugar (até 36 m do próprio gol é defesa, lateral se aberto e zagueiro se no meio; até 62 m é meio-campo; depois é ataque) e o motor usa esse desenho como referência de posicionamento na partida. Jogador fora da posição da vaga rende menos (nome em amarelo). As formações guardadas ficam no navegador por enquanto; a carreira guarda as suas na Fase 8.

**Partida assistida (Fase 7):** o jogo não é instantâneo. O técnico acompanha pelo mini-campo, pausa para trocar jogadores, mudar a formação e dar instruções, e pode pular para o fim se quiser.

| Velocidade | Duração real dos 90 minutos |
| ---------- | --------------------------- |
| Rápida     | cerca de 3 minutos          |
| Normal     | cerca de 4 minutos (padrão) |
| Lenta      | cerca de 5 minutos          |

Os lances de perigo e os gols ganham um instante a mais na tela; jogos de outros campos da rodada correm juntos no placar ao lado. A tela Amistoso de hoje é só a prévia do motor.

**Régua relativa:** passe, chute, decisão e goleiro comparam o jogador com quem o marca e com o próprio nível, não com uma régua fixa. Assim um jogo entre dois times fortes tem números parecidos com o de dois times fracos (cerca de 2,6 a 2,9 gols de 55 a 85 de força), e a diferença de força entre os times é o que decide.

## Humor e condição física (desenho aprovado em 25/11/2026)

Estado da carreira salvo no jogo, não dado do banco. Implementação nas Fases 6 (humor no motor) e 8 (escalação).

| Humor   | Chance base | Efeito no rendimento |
| ------- | ----------- | -------------------- |
| Ótimo   | 8%          | +5%                  |
| Bom     | 22%         | +2%                  |
| Normal  | 50%         | 0                    |
| Ruim    | 15%         | −10%                 |
| Péssimo | 5%          | −20%                 |

O dia ruim pesa mais que o dia bom ajuda (ajuste de 25/11/2026): quem está mal precisa ser poupado, e a boa fase não transforma um jogador mediano em craque.

- O humor dura alguns dias (sequências boas e ruins) e é puxado pela moral, pelo cansaço acumulado e pela adaptação de quem chegou ao clube. Aparece na escalação; o "dia iluminado" continua escondido.
- Condição física de 0 a 100%: cai durante o jogo conforme os minutos, a intensidade e a resistência; recupera a cada dia. Abaixo de certo ponto, corta os atributos físicos e aumenta o risco de lesão.
- A escalação avisa "melhor poupar" quando um titular está esgotado ou num dia ruim; a CPU usa a mesma regra para fazer rodízio.
