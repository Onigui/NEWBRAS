# Decisões do projeto

| Data       | Decisão                 | Escolha                                                                                                                                                                                                                                              | Consequência                                                                                                                                                                                                                                                                                                                        |
| ---------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23/11/2026 | Plataforma              | Web primeiro (React + TypeScript, PWA offline)                                                                                                                                                                                                       | Android (Capacitor) e PC (Tauri) na Fase 18                                                                                                                                                                                                                                                                                         |
| 23/11/2026 | Motor de partida        | Espacial desde a Fase 5: 22 jogadores e bola                                                                                                                                                                                                         | O modo clássico (linha de minutos) lê o mesmo registro de eventos do mini-campo                                                                                                                                                                                                                                                     |
| 23/11/2026 | Nomes                   | Clubes e jogadores reais                                                                                                                                                                                                                             | Escudos e camisas desenhados pelo jogo nas cores do clube, sem logotipos oficiais; banco num pacote de dados separado, trocável por um fictício                                                                                                                                                                                     |
| 23/11/2026 | Morte de veteranos      | Trocada pelo renascimento de lendas                                                                                                                                                                                                                  | Força 80+ ou estrela renasce com 16 a 18 anos na base de um clube aleatório, mesmo nome e características, atributos reduzidos na mesma proporção e potencial igual à força do auge                                                                                                                                                 |
| 23/11/2026 | Mercado                 | Mercado aquecido                                                                                                                                                                                                                                     | Todo clube da CPU diagnostica o elenco, define objetivo e orçamento e negocia com outros clubes                                                                                                                                                                                                                                     |
| 23/11/2026 | Transferências          | Janelas reais por país                                                                                                                                                                                                                               | Fora da janela, só jogadores livres; compras, vendas e empréstimos só com a janela do comprador aberta; pré-contrato nos últimos 6 meses                                                                                                                                                                                            |
| 23/11/2026 | Abrangência             | Futebol mundial por níveis                                                                                                                                                                                                                           | Nível 1: Brasil, Inglaterra, Espanha, Itália, Alemanha, França com várias divisões e todas as copas. Nível 2: cerca de 20 países com 1ª e 2ª divisão e copa. Nível 3: 1ª divisão dos demais países das copas continentais. Todas as seleções da FIFA                                                                                |
| 23/11/2026 | Jogadores               | Banco híbrido                                                                                                                                                                                                                                        | Reais nas primeiras divisões principais (atualizados até meados de 2026); gerados com nomes da nacionalidade no resto; planilha e editor para corrigir                                                                                                                                                                              |
| 23/11/2026 | Venda de craques        | Jogo duro                                                                                                                                                                                                                                            | Clubes classificam jogadores (intocável, peça-chave, negociável, dispensável), cobram muito acima do valor pelos raros, renovam e se reforçam para segurá-los; multa rescisória obriga a venda                                                                                                                                      |
| 23/11/2026 | Seleções                | Clube e seleção ao mesmo tempo                                                                                                                                                                                                                       | Convites pela reputação e pelos resultados; convocação em datas FIFA e torneios                                                                                                                                                                                                                                                     |
| 23/11/2026 | Estádios                | Base do Brasfoot + 4 melhorias                                                                                                                                                                                                                       | Obras com prazo e capacidade reduzida; público realista; setores e sócio-torcedor; manutenção, gramado e exigências por competição com aluguel de estádio; arena nova com financiamento, naming rights e eventos                                                                                                                    |
| 23/11/2026 | Ligas de veteranos      | MLS e Saudi Pro League completas e reais                                                                                                                                                                                                             | Todos os elencos reais (fonte FotMob, nov/2026); lendas em declínio com força atual baixa e força do auge guardada para o renascimento                                                                                                                                                                                              |
| 23/11/2026 | Ícones                  | 22 ídolos aposentados recomeçam na base                                                                                                                                                                                                              | Gareth Bale, Zidane, Ronaldo, Ronaldinho e outros nascem com 15 ou 16 anos na base de um clube sorteado pela semente, com potencial igual ao auge real                                                                                                                                                                              |
| 23/11/2026 | Categoria de base       | Base no estilo do FC (o Brasfoot só tinha o júnior que substitui o aposentado)                                                                                                                                                                       | Olheiros com nível mandados a países ou regiões, relatórios com faixa de potencial, elenco de base por clube, investimento em estrutura, promoção a partir dos 16 anos; a CPU também revela jogadores                                                                                                                               |
| 25/11/2026 | Posições e funções      | 13 posições de campo e 24 funções, com nota do jogador em cada uma (exceção à paridade, pedida pelo dono)                                                                                                                                            | O cadastro segue com as 5 posições do Brasfoot; em campo, o lugar da vaga vira posição e o técnico escolhe a função; a nota muda na hora no editor e o motor joga conforme a função                                                                                                                                                 |
| 25/11/2026 | Rumo do projeto         | O Brasfoot é referência, não teto: o NewBras é uma evolução, com ideias de PES e FIFA/FC                                                                                                                                                             | A paridade guia a ordem das fases, mas cada sistema pode ir além do original; o visual ganha uma revisão completa na Fase 16 (moderno e limpo, sem efeitos 3D exagerados, mais rico que o Brasfoot)                                                                                                                                 |
| 25/11/2026 | Lançamento              | Venda na Steam e depois Android e iPhone, só offline. Faixa de preço registrada em 26/11/2026: US$ 2,99 a US$ 4,99 de preço base, com o preço regional da Steam (barato no Brasil); o valor exato é decidido no fim, vendo o quanto o jogo ficou bom | Pendentes do dono: banco fictício ou real na versão vendida (licenças) e idiomas. Ideias e itens de lançamento em `docs/IDEIAS.md`. Por que não US$ 0,99: a Steam limita o desconto a 50% nesse preço (até 75% a US$ 1,99 e 90% a US$ 4,99), sobra pouco por venda depois dos 30% da Steam, e o preço passa a imagem de jogo barato |
| 25/11/2026 | Simulação do mundo      | Motor completo no jogo do técnico; simulação rápida calibrada em todos os outros jogos do mundo                                                                                                                                                      | O mundo tem 3.711 clubes: com o motor espacial em todos os jogos, uma temporada levaria mais de meia hora. A simulação rápida usa as mesmas forças e é calibrada contra o motor                                                                                                                                                     |
| 25/11/2026 | Idiomas                 | Português (Brasil), inglês, espanhol, francês, alemão, italiano, holandês, polonês, turco, russo, árabe, chinês simplificado, japonês, coreano e indonésio no lançamento (decisão do dono em 26/11/2026)                                             | Os mercados que mais jogam futebol no PC (Steam, EA FC, Football Manager). Textos fora do código desde a etapa 10c; traduções na Fase 16, quando a interface parar de mudar. O árabe precisa da interface da direita para a esquerda                                                                                                |
| 25/11/2026 | Nomes na versão vendida | Decidir no fim do projeto, sem correr riscos                                                                                                                                                                                                         | Pesquisa inicial em `docs/IDEIAS.md`: trocar letras ("Meci") não basta, e licenças completas custam muito para um jogo de preço simbólico; a direção mais provável é um mundo fictício próprio                                                                                                                                      |
| 25/11/2026 | Ideias aprovadas        | Todas as de `docs/IDEIAS.md`, com destaque para as conquistas da Steam e o modo Jornada                                                                                                                                                              | Cada uma entra na fase indicada lá                                                                                                                                                                                                                                                                                                  |

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
- **Números de referência** (200 jogos entre times de força 70, motor 0.7.0): 2,5 gols, 11 chutes e 4 no gol por time, 77% de passes certos, 21 faltas, 3,2 amarelos, 4 impedimentos, 32% de empates, 10 km por jogador. Um time 15 pontos mais forte vence mais de 60%. Cerca de 20 ms por partida. A linha de defesa recua menos do que avança e os atacantes esperam a bola na linha do penúltimo defensor (o centroavante arrisca e às vezes fica impedido).
- **Fica para a Fase 6:** mando de campo, humor, moral, dia iluminado, ajuste das táticas e a calibração com 10.000 jogos contra as metas.

## Formações e partida assistida (25/11/2026)

**Formações:** 27 prontas (do 4-4-2 ao WM e à pirâmide 2-3-5) e a **formação personalizada**: o técnico arrasta cada jogador para onde quiser no campo. A função da vaga vem do lugar (até 36 m do próprio gol é defesa, lateral se aberto e zagueiro se no meio; até 62 m é meio-campo; depois é ataque) e o motor usa esse desenho como referência de posicionamento na partida. Jogador fora da posição da vaga rende menos (nome em amarelo). As formações guardadas ficam no navegador por enquanto; a carreira guarda as suas na Fase 8.

**Partida assistida (Fase 7):** o jogo não é instantâneo. O técnico acompanha pelo mini-campo, pausa para trocar jogadores, mudar a formação e dar instruções, e pode pular para o fim se quiser.

| Velocidade | Duração real dos 90 minutos |
| ---------- | --------------------------- |
| Rápida     | cerca de 3 minutos          |
| Normal     | cerca de 5 minutos (padrão) |
| Lenta      | cerca de 10 minutos         |

Os lances de perigo andam mais devagar e o chute é mostrado como foi: a bola voa até a rede, a trave, a linha de fundo ou as mãos do goleiro e só então aparece o destaque ("GOL!"). A placa de acréscimo aparece nos lances e no placar ("+4 de acréscimo"); jogos de outros campos da rodada correm juntos no placar ao lado. Durante o jogo, abas trocam o painel de baixo entre lance a lance, estatísticas e notas parciais de cada jogador (com passes, fôlego e cartões, cores de verde a vermelho); a lista de troca mostra fôlego e nota de agora, para o técnico achar quem não está rendendo sem tirar os olhos do mini-campo.

**Régua relativa:** passe, chute, decisão e goleiro comparam o jogador com quem o marca e com o próprio nível, não com uma régua fixa. Assim um jogo entre dois times fortes tem números parecidos com o de dois times fracos (cerca de 2,6 a 2,9 gols de 55 a 85 de força), e a diferença de força entre os times é o que decide.

## Técnico da CPU e cartões (25/11/2026)

**A CPU lê o jogo.** A cada 5 minutos, e logo depois de gol ou expulsão, o técnico da CPU olha placar, minuto, diferença de força e número de jogadores em campo e escolhe uma postura:

| Situação (a partir dos 60 minutos) | O que a CPU faz                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| Empatando, sendo mais forte (70+)  | Vai para cima (4-4-2 no ataque)                                                   |
| Perdendo por 1                     | Adianta o time aos 65; tudo ou nada aos 82 (4-3-3, ataque total, marcação pesada) |
| Perdendo por 2                     | Se lança ao ataque para tentar a virada                                           |
| Perdendo por 3 ou mais             | Recua no contra-ataque para não tomar uma goleada maior                           |
| Ganhando por 1                     | Segura: contra-ataque aos 75, fecha a casinha aos 85 (4-5-1)                      |
| Ganhando por 2 ou mais             | Cadencia o jogo                                                                   |
| Com um a menos                     | Uma postura mais defensiva, salvo se estiver perdendo no fim                      |

Muda estilo, marcação e formação (cada um vai para a vaga onde rende mais) e, quando cabe, faz troca tática: atacante no lugar de zagueiro ou volante para buscar o gol, o contrário para segurar. Com dois ou mais amarelados, a marcação fica leve. Cada mudança aparece no lance a lance ("Palmeiras fecha a defesa para segurar a vantagem (4-5-1, contra-ataque)"). O time do humano nunca muda sozinho. Medição: quem está na frente aos 60 minutos e tem o técnico da CPU vence cerca de 80% das vezes; quem está atrás busca o empate com mais frequência do que sem ele.

**Expulsões existem:** vermelho direto e segundo amarelo, com o jogador saindo de campo e o time ficando com um a menos (goleiro expulso: entra o reserva ou um jogador da linha vai para o gol).

**Suspensões (Fases 9 e 12):** o motor já devolve os cartões de cada jogador por partida. A carreira vai guardar o acúmulo por competição: 3 amarelos = 1 jogo de suspensão (regra configurável por competição, como no Brasileirão e na Champions), vermelho = suspenso no jogo seguinte da mesma competição, zeragem dos amarelos onde o regulamento manda (por exemplo, antes das quartas). Suspenso fica indisponível na escalação daquela competição e livre nas outras.

**Passe em profundidade e o ferrolho:** contra linha alta, a bola no espaço atrás da defesa é a arma do contra-ataque; jogadores na frente do chute tiram ângulo e travam a bola. O equilíbrio fino entre estilos e formações (o 4-3-3 ainda rende demais e a linha de 5 se fecha atrás demais) fica para a calibração da Fase 6.

## Humor e condição física (desenho aprovado em 25/11/2026)

Estado da carreira salvo no jogo, não dado do banco. Implementação nas Fases 6 (humor no motor, feito) e 8 (escalação e sequências).

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

## Realismo e calibração (Fase 6, 25/11/2026)

Forma do dia, sorteada no começo de cada partida pela semente (o mesmo jogo, o mesmo resultado):

| Fator            | Valor                                                | Visível?                            |
| ---------------- | ---------------------------------------------------- | ----------------------------------- |
| Humor do jogador | tabela acima; a carreira pode impor o humor (Fase 8) | sim: trocas, notas ao vivo e resumo |
| Dia iluminado    | 2% de chance por jogador, +10% no rendimento         | não                                 |
| Dia do time      | ±5% em média, no máximo ±10%                         | não                                 |
| Mando de campo   | +4,5% para o mandante; nada em campo neutro          | sim                                 |
| Moral do time    | até ±3% (moral de 0 a 100, 50 é neutro)              | sim, a partir da Fase 8             |
| Acomodação       | −4% para quem vence por 3 gols ou mais               | não                                 |

Gols espalhados pelo time (pedido de 25/11/2026: em goleadas o mesmo atacante fazia todos):

- Diagnóstico: 30% dos gols saíam de pênalti, todos batidos pelo melhor finalizador; 85% dos gols eram de atacantes; 9,4% dos jogos tinham hat-trick.
- Ajustes: menos pênaltis (falta na área bem mais rara), meias e pontas chegando à área no fim da jogada, passe para trás (cutback) e para o companheiro livre na área, chute de fora quando há espaço, marcação mais forte em quem já marcou e atributos secundários dos meias e laterais mais perto do principal.
- Resultado em 10.000 jogos: pênaltis em 13% dos gols, hat-trick em 3,1% dos jogos, atacantes com 77% dos gols.

Assistências: contadas no motor desde a Fase 5, agora aparecem no resumo (coluna "Assist.") e nas notas ao vivo (G/A). O ranking por campeonato (artilharia e assistências) entra com as competições (Fases 9 e 15).

Notas dos jogadores: com mais passes e desarmes por jogo, a média tinha subido para 7,2 e 3,7% dos titulares tiravam 10. Ajuste: desarme e interceptação valem menos, a nota parte de 5,9 e, acima de 7, cada ponto conta 75%. Agora a média é 6,6, 2,5% passam de 9 e o 10 fica para atuações raras (cerca de 0,6%), como hat-tricks.

Calibração: as metas ficam em `packages/engine/src/partida/calibracao.ts`; `pnpm calibrar` roda 10.000 jogos e grava `docs/CALIBRACAO.md`. A CI roda um lote de 600 jogos com folga nas faixas. Equilíbrio tático ainda imperfeito (num campo neutro, 4-2-3-1 tem saldo médio de +0,5 gol e 5-4-1 no contra-ataque, −0,5); ajuste fino fica para a Fase 16, com a paridade.

## Posições e funções (25/11/2026)

Pedido do dono: o atacante 90 não pode render 90 jogando de meia-armador, como no PES e no FIFA, e o técnico precisa escolher a função de cada jogador (o centroavante que joga de falso 9), vendo a nota mudar enquanto monta o time. Fica como exceção aprovada à paridade com o Brasfoot, que só tem goleiro, lateral, zagueiro, meia e atacante.

- **Cadastro:** continua com as 5 posições do Brasfoot. Os jogadores reais ganham também as posições de campo em que atuam (vindas da fonte: ponta-direita, centroavante, volante...), até 5, a primeira é a principal. Editáveis no editor e na planilha (coluna `posicoes_campo`).
- **Posições de campo (13):** GOL, ZAG, LD, LE, VOL, MC, MD, ME, MEI, PD, PE, SA, CA. A família vem da vaga (defesa, meio, ataque); o detalhe vem do lugar: meia central até 46 m é volante, até 56 m é meio-campista, depois meia-atacante; aberto é meia ou ponta; o atacante central antes de 66 m é segundo atacante.
- **Funções (24):** goleiro e goleiro-líbero; zagueiro, construtor e líbero; lateral, lateral defensivo e ala; volante e volante construtor; meio-campista, box-to-box e armador recuado; meia aberto e meia por dentro; meia-armador e meia-atacante; ponta e ponta invertido; segundo atacante; centroavante, pivô, falso 9 e atacante de velocidade. Cada uma tem pesos de atributos e um jeito de jogar no motor (avanço, largura, chegada na área, preferência por chute, passe, condução, cruzamento e lançamento, alvo de cruzamento e de lançamento, bote, cansaço).
- **Escolha:** na vaga dá para pedir as funções da posição dela e das vizinhas (no centroavante: segundo atacante; no volante: meio-campista ou zagueiro). Sem escolha, vale a automática: a função padrão da posição, a menos que outra renda mais de 2 pontos a mais.
- **Nota na vaga:** média dos atributos com os pesos da função, alinhada para a melhor função do jogador dar a força dele, vezes o encaixe. Encaixe: 1 nas posições em que ele atua; 0,96 numa posição da própria família que ele não faz; fora da família, a tabela antiga do motor (atacante de zagueiro 0,68, meia de atacante 0,90...); lateral do lado trocado 0,95; goleiro na linha ou jogador de linha no gol, cerca de 0,3 a 0,45. Exemplos do banco: Haaland 92 de centroavante, 78 de meia-atacante e 56 de zagueiro; Lamine Yamal 84 na ponta-direita e 81 na esquerda.
- **Motor:** o encaixe multiplica todos os atributos; o resto da diferença vem dos atributos que cada ação usa. A escalação automática da CPU escolhe pela nota na vaga.
- **Tela:** no editor de escalação (amistoso e durante a partida), cada jogador mostra a posição de campo e a nota (verde: rende o que vale; amarelo e laranja: rende menos; vermelho: improvisado). Clicar abre a vaga com as funções e a nota em cada uma, e quem pode jogar ali (trocar de vaga, escalar do banco ou substituir).
- **Calibração:** com as funções, as metas de 10.000 jogos continuam atendidas (`docs/CALIBRACAO.md`).

## Carreira: calendário, plantel, escalação e salvamento (Fase 8, 25/11/2026)

- **Começo:** a carreira começa na pré-temporada do país do clube, 21 dias antes do início da temporada seguinte à data de referência do banco (Europa em 11/07/2026, Brasil em 20/12/2026, para a temporada 2027). Três amistosos de pré-temporada já vêm marcados, contra clubes do mesmo país e de nível parecido.
- **Calendário:** dia a dia, com a temporada do país, as janelas de transferência e as datas FIFA marcadas no mês e virando notícia no dia em que começam e terminam. "Avançar um dia" e "Ir até o próximo jogo"; no dia de jogo, o calendário só anda depois da partida. Ligas e copas entram na Fase 9; por enquanto a agenda é de amistosos, que o técnico marca contra qualquer clube do mundo, em casa ou fora.
- **Condição física:** sai do jogo com o que o motor mediu e se recupera todo dia (de 4 a 22 pontos: mais com resistência alta, menos depois dos 30 anos). Abaixo de 70%, a escalação avisa "melhor poupar".
- **Humor:** muda um degrau de cada vez, com 15% de chance por dia (por isso vem em sequências), puxado pela moral do time, pelo cansaço e por ficar de fora (2 jogos seguidos sem jogar, para quem está entre os 16 melhores do elenco). Depois do jogo, nota 7,5 ou mais tende a melhorar o humor e nota 5,5 ou menos tende a piorar; vitória e derrota também puxam um pouco. Humor ruim ou péssimo entra no aviso de poupar.
- **Moral do time:** de 0 a 100, começa em 50; vitória +6, empate +1, derrota −6 e mais 3 em goleada (para cima ou para baixo); volta devagar para 50 com os dias. Vai para o motor (até ±3%).
- **Rodízio da CPU:** a escalação automática desconta cansaço e humor da nota na vaga, então a CPU poupa quem está esgotado ou num dia ruim.
- **Plantel:** tabela com idade, força, potencial, condição, humor, jogos, gols, assistências, média e contrato, ordenável por coluna; a ficha mostra os atributos e a nota em cada uma das 13 posições.
- **Escalação:** o editor da etapa 6b (campo com notas, funções, quem joga na vaga) mais as listas de titulares e reservas com condição, humor e o aviso de poupar, a tática, a escalação automática e as formações guardadas na carreira.
- **Salvamento:** a carreira se salva sozinha no navegador a cada mudança; F2 salva na hora. Dá para baixar como arquivo .json e abrir em outro aparelho. O salvamento guarda as edições do Editor de Equipes que valiam quando a carreira começou, para o mundo ser sempre o mesmo; se o banco oficial mudar depois, a carreira avisa e continua.
- **Vários técnicos humanos no mesmo jogo:** fica para depois (checklist de paridade da Fase 16); a Fase 8 tem um técnico.

## Competições na carreira (etapa 9a, 25/11/2026)

- **Motor de competições:** lê a descrição em dados de cada competição: grupos em pontos corridos (por sorteio, pela ordem da lista ou em "serpente" pela campanha), mata-mata em jogo único ou ida e volta (final única quando a competição pede), chaveamento por campanha (1º x 8º...), sorteio ou chave fixa, mando da melhor campanha, sorteado ou em campo neutro, folga para os melhores quando o número não fecha, times que entram direto numa fase pela colocação (playoff da Championship), desempates na ordem da competição (pontos, vitórias, saldo, gols pró, confronto direto, menos derrotas, sorteio estável).
- **Mata-mata no motor espacial:** o jogo de volta recebe o placar da ida; prorrogação e pênaltis só se o agregado empatar.
- **Classificação final:** a da primeira fase, reordenada pelas fases seguintes; fases de playoff (a partir de uma faixa que não começa no 1º) não reordenam: o líder segue campeão e o vencedor do playoff ganha a vaga extra de acesso.
- **Acesso e rebaixamento:** pelas posições da classificação final; o vencedor do playoff sobe; as divisões da temporada seguinte saem desses movimentos.
- **Datas:** cada competição espalha as rodadas entre o início e o fim dela, sem data FIFA e com pelo menos 2 dias entre rodadas. Primeiro os estaduais e regionais (janela curta), depois as ligas e as copas, e cada uma foge das datas das anteriores e dos dias vizinhos: nenhum clube brasileiro tem dois jogos no mesmo dia ou em dias seguidos. Por isso o Brasileirão começa depois dos estaduais.
- **Mundo inteiro:** as 268 competições nacionais e estaduais do banco rodam juntas, cada país na sua temporada. Ao começar a carreira, os jogos já marcados antes da data são simulados (as ligas europeias chegam com a tabela em dia). Quando a temporada de um país acaba, ficam o histórico (campeão, vice, artilheiro), os movimentos e a próxima temporada. Abrir o mundo leva cerca de 1,5 s; cada dia, cerca de 10 ms.
- **Simulação rápida:** gols por Poisson a partir da força dos times (melhor goleiro e os 10 melhores da linha), com o efeito da diferença de força saturando (gigante contra pequeno no estadual não vira 7 a 0 toda rodada) e um empurrão para o empate. Calibrada contra o motor: cerca de 2,5 gols por jogo, 44% de vitórias do mandante, 31% de empates e o favorito com 10 de força a mais vencendo 67%. Os gols vão para os jogadores pela finalização e pela posição, com assistência em 70% deles.
- **Cartões:** no elenco do técnico, 3 amarelos na mesma competição dão 1 jogo de suspensão; vermelho, o próximo jogo da competição. Suspenso fica fora da escalação daquele jogo e aparece nos avisos.
- **Tela:** aba Competições com tabela (zonas de classificação, acesso, playoff e rebaixamento), mata-mata, jogos de cada rodada, artilharia, assistências e campeões anteriores; jogos oficiais na agenda, no calendário e no início, com o nome da competição e da rodada.
- **Salvamento:** formato 2 (com as competições, cerca de 5 MB); os de formato 1 ganham as competições ao abrir.

## Copas nacionais e supercopas (etapa 9b, 25/11/2026)

- **Quais:** 27 copas nacionais nos 26 países de nível 1 e 2 (a Inglaterra tem FA Cup e EFL Cup) e 7 supercopas (Brasil, Inglaterra, Espanha, Itália, Alemanha, França e Portugal; a Supercopa de España e a Supercoppa com 4 times). Copa do Brasil com 64 times (Séries A, B e C e 4 da D), jogo único nas duas primeiras fases e ida e volta das oitavas à final, sem prorrogação.
- **Participantes pelas vagas:** a cada temporada a copa monta a lista de novo: os primeiros de cada divisão pela classificação da temporada anterior (promovidos e rebaixados entram pela divisão em que estão agora); na primeira temporada, pela força do elenco. A supercopa junta o campeão da liga e o da copa da temporada anterior; se o mesmo time ganhou as duas, a vaga passa para o próximo.
- **Formato:** uma fase de mata-mata por eliminatória, sorteio na primeira e chave fixa depois; folgas quando o número não fecha. Final em campo neutro onde é tradição (FA Cup, Copa del Rey, DFB-Pokal...); a DFL-Supercup é na casa do campeão.
- **Datas:** a supercopa marca primeiro (janela curta) e os estaduais e ligas fogem dela; as copas vêm depois das ligas, nas datas livres. Continua sem clube com dois jogos no mesmo dia ou em dias seguidos.
- **Temporada do país:** passa a conter todas as competições dele. Onde a liga não cabia na temporada da região (Índia, J1 de agosto a junho, Uzbequistão, Caribe, Argentina e outros), a temporada se ajusta à liga. Antes, a virada da temporada encerrava essas ligas no meio, sem campeão.
- **Mando no pontos corridos:** a alternância de casa e fora estava errada (havia time com 19 jogos seguidos em casa). Agora ninguém joga mais de 3 seguidos em casa ou fora.
- **Classificação de mata-mata:** a de uma fase única de mata-mata (a final de uma supercopa) agora sai do resultado, e não da ordem de entrada.

## Copas regionais e plantão de gols (etapa 9c, 25/11/2026)

- **Copas regionais:** Copa do Nordeste (16 clubes dos 9 estados, dois grupos de 8 em turno único, 4 de cada grupo no mata-mata, final em ida e volta) e Copa Verde (16 clubes do Norte, do Centro-Oeste e do Espírito Santo, mata-mata com semifinal e final em ida e volta). As vagas saem dos estaduais pela classificação da temporada anterior; se o clube já entrou, a vaga passa para o próximo do estado. Ficam no calendário logo depois dos estaduais e antes das ligas.
- **Plantão de gols:** ao começar o jogo do técnico, os outros jogos do dia no país já saem simulados, pelo mesmo sorteio que o dia usa depois: o plantão mostra exatamente os placares que ficam registrados. Os gols aparecem no minuto em que saem, acompanhando o relógio da partida (o minuto vem de um sorteio à parte, que não muda os resultados). Primeiro a competição do jogo, com o jogo do técnico em destaque, depois as ligas da 1ª divisão para baixo, as copas e os estaduais dos outros estados. A lista de últimos gols fica só na competição do jogo.
- **Tabela ao vivo:** em fase de pontos corridos, a tabela do grupo com os placares de agora, as zonas e setas de quem subiu ou caiu desde o começo da rodada.

## Copas continentais (etapa 10a, 25/11/2026)

- **Quais:** Libertadores e Sul-Americana (32 cada, grupos e mata-mata com final única em campo neutro), Champions League, Europa League e Conference League (fase de liga de 36 com 8 ou 6 jogos, 1º ao 8º direto às oitavas e playoff do 9º ao 24º), Copa dos Campeões da CONCACAF (16 em mata-mata), Champions League da AFC (fase de liga de 24), da CAF (grupos e mata-mata em ida e volta) e da OFC (dois grupos de 4). Sem as fases preliminares por enquanto.
- **Vagas:** saem das ligas e copas de cada país, pela temporada anterior (na primeira, pela força). O campeão da copa entra antes; se já tiver vaga pela liga, ela passa ao próximo da tabela. A competição de baixo exclui quem está na de cima (Sul-Americana sem os da Libertadores; Europa League sem os da Champions; Conference sem os das duas).
- **Temporada continental:** cada confederação tem a sua e ela começa depois das ligas que dão as vagas (CONMEBOL, CONCACAF e OFC no ano civil; UEFA, AFC e CAF de julho a junho): a Libertadores de 2028 usa o Brasileirão de 2027.
- **Datas:** as continentais jogam às quartas (a principal) e às quintas (as outras), em datas que saem só do calendário e da quantidade prevista de participantes. Por isso são conhecidas antes de a temporada continental abrir, e a 1ª divisão, as copas e os estaduais de cada país marcam os jogos fugindo delas. As divisões de baixo não reservam essas datas.
- **Datas por clube:** cada competição do país agora foge só das datas das competições com quem divide clubes (o Paulistão não atrapalha o Carioca; a Copa do Nordeste só pesa para quem a joga). As copas marcam logo depois da 1ª divisão e antes das outras divisões. Resultado: em dois anos de mundo inteiro com as continentais, nenhum clube com dois jogos no mesmo dia ou em dias seguidos.
- **Na carreira:** os jogos continentais entram na agenda, no calendário e no plantão; a aba Competições mostra as continentais de cada confederação no topo da lista de países; a notícia de campeão sai para as continentais da confederação do técnico. As notícias de campeão passaram a filtrar pelo país (antes podiam aparecer campeões de outro país com o mesmo nome de temporada).
- **Salvamento:** formato 3. Os de formato 2 ganham as temporadas continentais ao abrir, com os jogos que já passaram disputados; as outras competições não mudam.
- **Simplificação conhecida:** na fase de liga os adversários saem do todos contra todos (8 de 35 rodadas espalhadas), sem os potes e sem evitar clubes do mesmo país.

## Formato real das competições, começando pela CONMEBOL (etapa 10a2, 26/11/2026)

- **Regra:** o NewBras busca a experiência mais próxima do real. Se a competição tem fases preliminares na vida real, aqui também tem. A 10a simplificada vira o ponto de partida: a CONMEBOL agora está no formato real de 2026; a UEFA (10a3) e as outras confederações (10a4) seguem o mesmo caminho, e as copas nacionais (Copa do Brasil com 126 clubes etc.) entram depois.
- **Libertadores 2026:** 47 clubes. 1ª fase com 6 (o 4º de Bolívia, Equador, Paraguai, Peru, Uruguai e Venezuela), 2ª fase com mais 13 (Brasil 5º e 6º, Argentina 5º, Chile e Colômbia 3º e 4º, os outros 3º), 3ª fase com os 8 vencedores; os 4 que passam vão aos grupos com os 28 que entram direto (o atual campeão da Libertadores e o da Sul-Americana como vagas extras do país, o campeão da Copa do Brasil e da Copa Argentina). Eliminatórias em ida e volta com pênaltis direto (sem prorrogação), grupos por potes sem compatriotas juntos, oitavas com os primeiros contra os segundos sorteados, final única em campo neutro com prorrogação. Cada fase na sua janela do calendário real: 1ª fase em fevereiro, grupos em abril e maio, oitavas em agosto, final no fim de novembro.
- **Sul-Americana 2026:** 56 clubes. 1ª fase com 32 (4 de cada país menos Brasil e Argentina), em jogo único entre clubes do mesmo país; grupos com os 16 vencedores, 6 do Brasil, 6 da Argentina e os 4 eliminados da 3ª fase da Libertadores (no pote 4); os primeiros vão às oitavas e os segundos jogam o playoff contra os 3º colocados dos grupos da Libertadores, que decidem em casa.
- **Como o motor faz:** clube pode entrar numa fase adiante (vaga fixa desde o começo da temporada) ou chegar de outra competição no meio dela (eliminados de uma fase, colocados de um grupo). A fase que espera esses clubes só abre quando a fase de origem termina. As vagas das fases mais adiantadas são resolvidas antes, como no real: o atual campeão entra nos grupos e empurra os do seu país um lugar para baixo. Fase de uma eliminatória só que alimenta outra com mais clubes pareia todo mundo, sem folga.
- **Primeira temporada:** o último campeão antes do banco fica nos dados (Flamengo na Libertadores de 2025, Lanús na Sul-Americana). Vaga de campeão sem dono conhecido vai para o mais forte que sobra.
- **Salvamento:** formato 4. Nos de formato 3, as continentais são abertas de novo no formato real, com os jogos que já passaram disputados.

## UEFA no formato real (etapa 10a3, 26/11/2026)

- **Lista de acesso de 2026/27:** o ranking das 55 federações (Rússia suspensa, Liechtenstein sem liga) define quantas vagas cada país tem e em que rodada cada clube entra, nas três competições. Inglaterra e Espanha com as vagas de desempenho europeu (o 5º colocado na Champions).
- **Champions League (81 clubes):** 1ª qualificatória com 28 campeões; 2ª com mais 10 campeões e 4 vices (caminho da liga); 3ª com 6 colocados das federações 5 a 12; rodada de playoff com os campeões de 11 a 14; 7 sobem (5 do caminho dos campeões, 2 do da liga) e se juntam aos 29 da fase de liga. O campeão da Champions e o da Europa League entram depois das vagas pela liga: se já estiverem classificados, a vaga vai para o campeão ucraniano e para o vice português (o que a UEFA fez em 2026/27).
- **Europa League (76) e Conference League (164):** quatro rodadas de qualificação com campeões de copa e colocados das ligas (quem não tem copa no banco manda o melhor da liga que sobra), e os eliminados de cima entrando em cada rodada pelo caminho de onde vieram: perdeu a 1ª qualificatória da Champions, vai à 2ª da Conference (caminho dos campeões); a 2ª, à 3ª da Europa League; a 3ª, ao playoff da Europa League (campeões) ou à fase de liga (liga); o playoff, à fase de liga da Europa League. Da Europa League para a Conference, a mesma lógica.
- **Fase de liga:** potes pela força; cada clube enfrenta 2 de cada um dos 4 potes (Champions e Europa League) ou 1 de cada um dos 6 (Conference), sem adversário do mesmo país e com no máximo 2 do mesmo país, metade dos jogos em casa e todos jogando em cada rodada. O pote 1 tem o atual campeão da Champions e os mais fortes.
- **Calendário real:** qualificatórias de 7 de julho a 27 de agosto, fase de liga de setembro a janeiro, playoff em fevereiro, final da Champions em 5 de junho, da Europa League em 26 de maio.
- **Datas FIFA:** a pausa da Copa do Mundo (até 20 de julho) valia todo ano por engano e travava as qualificatórias de julho. Agora vale só em 2026; nos outros anos, junho tem a data FIFA normal. As divisões de baixo também reservam as datas continentais (o campeão de copa da 2ª divisão pode jogá-las).
- **Salvamento:** formato 5 (as continentais dos formatos 3 e 4 são abertas de novo).

## CONCACAF, AFC, CAF e OFC no formato real (etapa 10a4, 26/11/2026)

- **CONCACAF:** Copa dos Campeões com 27 clubes; 22 na 1ª fase e 5 direto às oitavas (campeões da MLS, da Liga MX, da Leagues Cup, da Copa Centro-Americana e da Copa do Caribe), final em jogo único. As competições que dão vaga entram no banco: Leagues Cup (18 da MLS e 18 da Liga MX, fase de 3 jogos e mata-mata dos 8 melhores em jogo único), Copa Centro-Americana (20 clubes em 4 grupos de 5) e Copa do Caribe (10 em 2 grupos de 5). Simplificação: na Leagues Cup real só há jogos entre a MLS e a Liga MX; aqui o sorteio é livre.
- **AFC:** Champions League Elite com fase preliminar em jogo único por região e duas ligas de 16 (Oeste e Leste), 8 jogos para cada um dentro da região, potes montados para não juntar compatriotas e sem o limite de 2 por país da UEFA. Oitavas na região pela campanha (1º x 8º) e fase final em jogo único em sede neutra. A Champions League Two tem 32 em 8 grupos regionais, recebe os eliminados da preliminar da Elite e o campeão dela vai à preliminar da Elite.
- **CAF:** Champions League com 61 clubes e Copa das Confederações com 56; 1ª fase preliminar, 2ª com os mais fortes (3 e 8 direto), 16 em 4 grupos, quartas, semifinal e final em ida e volta. As 12 federações mais fortes do ranking têm duas vagas em cada.
- **OFC:** qualificatória das quatro federações menores e fase final em sede única com dois grupos de 4, semifinal e final. A OFC Professional League (2026) fica para quando os clubes dela estiverem no banco.
- **Motor:** fase de liga com mais de uma tabela (`grupos`, uma por caminho) e chaveamento `caminhos-campanha`. Se um sorteio da fase de liga não fecha com as restrições de país, ele é refeito sem elas, em vez de virar todos contra todos.
- **Interface:** as tabelas da fase de liga da Ásia aparecem como "Oeste" e "Leste".
- **Salvamento:** formato 6. Nos de formato 5, as copas dessas quatro confederações são abertas de novo; as da CONMEBOL e da UEFA ficam como estão.

## Supercopas, Intercontinental e Mundial de Clubes (etapa 10b, 26/11/2026)

- **Recopa Sul-Americana:** campeão da Libertadores x campeão da Sul-Americana, ida e volta em fevereiro, às quintas, com prorrogação e pênaltis; o campeão da Libertadores decide em casa.
- **Supercopa da UEFA:** jogo único em campo neutro na quarta da metade de agosto, direto para os pênaltis. **Supercopa da CAF:** jogo único em outubro, na casa do campeão da Champions africana.
- **Copa Intercontinental (anual, formato de 2024 a 2026):** o campeão da Ásia recebe o da Oceania em agosto (playoff da Copa África-Ásia-Pacífico); o vencedor visita o campeão da África em setembro. Em dezembro, em sede neutra: Dérbi das Américas (CONCACAF x CONMEBOL), Copa Challenger e final contra o campeão da Champions. Cada campeão entra quando a final da sua continental acontece; a vaga olha a edição que termina no mesmo ano (a Champions de 2028/29 na Intercontinental de 2029).
- **Mundial de Clubes (a cada 4 anos, próximo em 2029):** 32 clubes, 8 grupos de 4 sem dois da mesma confederação (a UEFA, com 12, repete em quatro grupos), mata-mata em jogo único em junho e julho. Vagas: os campeões continentais dos 4 anos anteriores (campeão repetido dá a vaga ao ranking) e o ranking pelas campanhas nas continentais desses anos (UEFA 12, CONMEBOL 6, AFC, CAF e CONCACAF 4, OFC 1, no máximo 2 do mesmo país pelo ranking). Os campeões reais anteriores ao banco contam (PSG em 2024/25, Pyramids, Al-Ahli).
- **Pendente no real:** a FIFA ainda não confirmou a sede de 2029 nem a ampliação para 48 clubes (nov/2026). Até lá, o formato é o de 2025 e a vaga da sede vai provisoriamente para o campeão do Marrocos, favorito nas notícias. Quando a FIFA decidir, só os dados mudam.
- **Motor:** chave de temporada "mundial" (janeiro a dezembro), que vira antes das outras; competições que não são anuais respeitam a `periodicidade`; primeira fase que espera clubes de outras competições; critérios de vaga `campeoes` e `ranking`; `campeoesAnteriores` nos dados; o histórico das continentais guarda os 32 primeiros.
- **Datas:** as ligas reservam as datas da Intercontinental de cada fase em diante a partir daquela em que entra o campeão da confederação delas (a Premier League só a da final). As continentais também fogem delas. O Mundial de Clubes, com participantes conhecidos no começo do ano, trava as datas só nas competições dos clubes que vão (o Brasileirão para no Mundial). `diasDeJogo` nos dados dá o dia da semana fora do padrão (Recopa às quintas).
- **Calendário apertado:** quando não dá para deixar um dia de folga, a rodada fica ao menos fora do dia ocupado (antes caía em cima). Em quatro temporadas simuladas, os jogos do mesmo clube no mesmo dia caíram de 43 para 0; sobram 40 casos de dias seguidos, quase todos nas divisões de baixo do Brasil com a Copa do Nordeste.
- **Salvamento:** formato 7. Nos de formato 6, as competições mundiais são abertas com os jogos já passados; as supercopas continentais entram na virada da temporada.

## Textos fora do código (etapa 10c, 26/11/2026)

- **Pacote `@newbras/textos`:** `t("Avançar um dia")`, no estilo gettext: a chave é o próprio texto em português (a língua de referência), com as partes variáveis entre chaves (`t("Ir até o próximo jogo ({dias} dias)", { dias })`). Texto sem tradução aparece em português.
- **Catálogos:** um JSON por idioma em `packages/textos/src/catalogos`, com todas as chaves; `pnpm --filter @newbras/textos extrair` acrescenta as novas (vazias) e tira as que saíram do código. O teste confere que os catálogos batem com o código, que as traduções têm as mesmas partes variáveis e que nenhum texto ficou escrito direto no JSX.
- **O que o motor guarda:** notícias, eventos do calendário e avisos são salvos com a chave em português e os parâmetros (`marcar()`), e traduzidos na hora de mostrar. Salvamentos antigos, com o texto pronto, continuam aparecendo em português. A narração da partida, os nomes das rodadas e os avisos da formação são traduzidos ao aparecer.
- **Datas e números:** fora do português, datas por extenso, meses, dias da semana e números seguem o idioma escolhido (Intl).
- **Idioma:** guardado no navegador; trocar recarrega a interface (as listas fixas, como as abas, são montadas ao carregar). O seletor entra nas Opções quando houver tradução.
- **Ainda em português nos dados:** nomes de países, competições e posições vêm do banco; ganham tradução junto com os textos, na Fase 16.
- **Idiomas do lançamento:** 15 (ver a decisão Idiomas acima), com o português como referência.

## Copa do Brasil real e correções nas divisões (etapa 9d, 26/11/2026)

- **Copa do Brasil de 126 clubes (formato de 2026):** 1ª fase com 28 e 2ª com mais 74, das vagas estaduais (a quantidade de cada estado é a de 2026; cada vaga vai para o melhor do estadual que ainda não tem vaga); 3ª fase com os campeões da Copa do Nordeste, da Copa Verde e das Séries C e D; 4ª fase; 5ª fase com os 20 da Série A; oitavas, quartas e semifinal em ida e volta e final em jogo único, em campo neutro. Até a 4ª fase, jogo único e empate direto nos pênaltis. São 155 jogos, como no real. Em 2027 a CBF passa a 128 clubes com a Copa Norte, a Copa Centro-Oeste e a Copa Sul-Sudeste, que ainda não estão no banco.
- **Série B:** os playoffs de 2026 (3º x 6º e 4º x 5º, ida e volta) dão duas vagas; antes, só uma, e a Série A perdia um clube por temporada. Nova opção `eliminatorias` na fase de mata-mata.
- **Série C:** ampliação de 20 para 24 e 28 clubes (2 rebaixados até a de 24 e 6 depois); como o banco tem as divisões de 2026 e a carreira começa em 2027, a escada vem um ano depois. Movimentos de acesso e rebaixamento agora podem valer só em alguns anos (`desde`, `ate`). O formato com dois grupos de 14, de 2028, ainda não foi feito.
- **Série D:** sobem 6 (os semifinalistas e os 2 de melhor campanha entre os eliminados nas quartas, no lugar do playoff real entre eles). Ela ainda é uma liga fechada (fica com 88 clubes); no real, os 96 vêm dos estaduais a cada ano (feito na etapa 9e).
- **Barragens e playout:** o 16º da Ligue 1 contra o vencedor do playoff da Ligue 2 (e o mesmo entre a Ligue 2 e o National), o 10º e o 11º da K League 1 contra os vencedores do playoff da K League 2 e o playout da Serie B (16º x 17º, quem perde cai) agora acontecem, na virada da temporada, num confronto resumido pela força dos elencos. Antes eram ignorados, e essas ligas cresciam ou encolhiam a cada ano.
- **Ligas em grupos:** o acesso "o 1º de cada grupo" e a faixa do playoff ("do 2º ao 5º") agora valem em cada grupo (Primera Federación, Serie C italiana, Argentina); antes, só no primeiro.
- **Conferência:** em quatro temporadas simuladas, todas as ligas do mundo mantêm o tamanho, menos as Séries C e D pela ampliação real.
- **Salvamento:** formato 8; nos antigos, a Copa do Brasil é montada de novo no formato novo, com os jogos já passados disputados.

## Copas da Europa no formato real e Série D pelos estaduais (etapa 9e, 26/11/2026)

- **Oito copas no formato de 2026/27**, cada divisão entrando na rodada em que entra no real:
  - FA Cup: League One e Two na 1ª fase, Premier League e Championship na 3ª (64); jogo único com prorrogação e pênaltis, sem replay; semifinal e final em Wembley.
  - EFL Cup: os 92 clubes, como no real (preliminar com 4, 70 na 1ª fase, os 11 da Premier League fora da Europa na 2ª e os 9 que jogam a Europa na 3ª); pênaltis direto e prorrogação só na final; semifinal em ida e volta.
  - Copa del Rey: todos na 1ª eliminatória, menos os quatro da Supercopa, que estreiam nos 16 avos; o clube de divisão mais baixa manda o jogo até as quartas; semifinal em ida e volta; final em campo neutro.
  - Coppa Italia: 44, como no real (preliminar com 4 da Serie B e 4 da Serie C, a Serie A de 9º a 20º na 1ª fase, os 8 primeiros nas oitavas); o mais bem colocado em casa até as quartas; semifinal em ida e volta; final em Roma.
  - DFB-Pokal: 1ª rodada de 64, pote dos profissionais contra o de baixo; o clube da 3. Liga para baixo manda contra os profissionais até a semifinal; final em Berlim.
  - Coupe de France: a partir dos 32 avos, quando entra a Ligue 1; o clube dois níveis abaixo manda; pênaltis direto até a semifinal, prorrogação só na final.
  - Taça de Portugal (formato novo de 2026/27): a I Liga entra na 3ª eliminatória e os 6 das copas europeias na 4ª; semifinal em jogo único, em campo neutro, depois do fim da liga; final no Jamor.
  - KNVB Beker: os 6 das copas europeias só na 2ª rodada.
- **Os amadores que faltam:** o banco não tem os clubes abaixo das divisões nacionais. A rodada guarda os lugares do real (112 na 1ª eliminatória da Copa del Rey, 80 na 1ª fase da FA Cup, 64 no DFB-Pokal e na Coupe de France, 52 na Taça e na KNVB) e os que faltam viram folga para os melhores pela ordem de entrada. Assim a rodada seguinte tem o tamanho real, e os grandes "passam" pelo jogo que no real fariam contra um amador.
- **Quem joga a Europa** (EFL Cup, Taça, KNVB): os primeiros da liga na temporada anterior, na quantidade de 2026/27 (9 na Inglaterra, 6 em Portugal e na Holanda). O campeão da copa que joga a Europa por ela, fora dessas posições, não é contado.
- **Times B e sub-23** não jogam as copas nacionais (Real Sociedad B, Jong Ajax, Stuttgart II, Sporting B, Juventus Next Gen).
- **Correção:** na virada, as copas abrem antes das divisões de baixo e liam a lista da temporada que acabou; quem subia ou caía entre a 1ª e a 2ª divisão ficava fora da copa. Agora a lista é a da temporada nova.
- **Campeões de 2025/26** guardados para a primeira Supercopa: Real Sociedad (Copa del Rey), Bayern (DFB-Pokal), Torreense (Taça de Portugal) e AZ (KNVB Beker).
- **Série D pelos estaduais (a partir de 2027):** ficam os 32 que chegaram à 3ª fase, menos os 6 que sobem, e entram os rebaixados da Série C; as 64 vagas estaduais de 2027 (no mínimo duas por estado; a lista publicada soma 65, com uma de São Paulo a definir) vão para os melhores de cada estadual que não estão nas Séries A a C; a força completa os 96, no lugar do ranking nacional de clubes. A lista segue a ordem geográfica da de 2026, para os grupos regionais de 6.
- **Ainda aproximado:** a regionalização dos sorteios (as duas primeiras fases da EFL Cup em Norte e Sul, os grupos da Copa del Rey), as datas dos jogos (as copas jogam no meio da semana, como as outras do jogo), e as outras copas nacionais (Bélgica, Escócia, Turquia e as de fora da Europa), que seguem no formato aproximado.
- **Salvamento:** formato 9; nos antigos, as oito copas são montadas de novo no formato novo, com os jogos já passados disputados.

## Seleções no motor e Nations League (etapa 11a, 26/11/2026)

- **Fase 11 em etapas:** 11a (seleções no motor e a Nations League 2026/27), 11b (Euro 2028 com as eliminatórias e a ligação com a Nations League), 11c (Copa do Mundo de 2030 com as eliminatórias das seis confederações), 11d (Copa América, Copa Ouro, Copa da Ásia, Copa Africana e a Nations League da CONCACAF), 11e (seleções na interface e amistosos nas datas FIFA). Fecha o Marco B.
- **Convocação automática:** a seleção leva os 26 melhores da nacionalidade, em qualquer clube do mundo: 3 goleiros, 5 zagueiros, 4 laterais, 8 meias e 6 atacantes; sobrando vaga numa posição, entra o melhor de linha que ficou de fora. País com poucos jogadores no banco (Liechtenstein tem 3) completa a lista com jogadores genéricos de força 40. A segunda nacionalidade e a escolha à mão pelo técnico ficam para a Fase 15.
- **Temporada própria:** cada competição de seleções tem a temporada dela (a Nations League vai de setembro a junho, a cada dois anos), separada da dos países e das confederações. As seleções jogam justamente nas datas FIFA, que as ligas já evitam.
- **Dias exatos:** uma fase pode ter os dias das rodadas (`datas`), como as seis rodadas da fase de liga (25/09, 28/09, 02/10, 05/10, 13/11 e 16/11), as quartas (25 e 28/03) e a fase final (09 e 13/06).
- **Nations League 2026/27:** as 54 seleções da UEFA (a Rússia segue fora) nas Ligas A, B, C e D com os grupos do sorteio de 12/02/2026; quartas da Liga A em ida e volta, com o 1º de um grupo contra o 2º de outro (sorteio que evita repetir o grupo) e o 1º mandando a volta; semifinal e final em campo neutro. Portugal é o atual campeão (2024/25).
- **Ainda fora:** o jogo do 3º lugar da fase final, os playoffs de acesso e rebaixamento entre as ligas (março de 2027; a edição de 2028/29 passa a três ligas e entra na 11b) e a ligação com as eliminatórias da Euro 2028.
- **Copa do Mundo de 2026:** Espanha campeã (1 a 0 na Argentina, na prorrogação, em 19/07/2026). Fica registrada como campeã anterior na 11c, junto com a Copa de 2030.

## Euro 2028 e as eliminatórias (etapa 11b, 26/11/2026)

- **Eliminatórias (março de 2027 a março de 2028):** as 54 seleções em 12 grupos de 4 ou 5, sorteados em potes pela campanha na Nations League de 2026/27 (no jogo, o sorteio acontece quando as eliminatórias começam; o real é em 6/12/2026, em Belfast). Os 6 primeiros da Nations League vão para os grupos de 4, que jogam só as seis últimas rodadas (setembro a novembro); os anfitriões (Inglaterra, Irlanda, Escócia e País de Gales) ficam em grupos separados. Dez rodadas nas datas FIFA de 2027.
- **Quem vai à Euro:** os 12 primeiros e os 8 melhores segundos; duas vagas para os anfitriões mais bem colocados que ainda não se classificaram; e os dois vencedores dos playoffs de março de 2028 (8 seleções em dois caminhos, semifinal e final em jogo único), com os segundos que sobraram e os campeões de grupo da Nations League ainda sem vaga.
- **Aproximação:** se menos de dois anfitriões precisarem da vaga reservada, ela vai para o melhor segundo que sobrou (no real, os playoffs mudam de tamanho: 12 seleções em três caminhos ou quatro confrontos de ida e volta). Duas seleções das quartas da Nations League caem em grupos de 5 e jogam a rodada de março das duas competições.
- **Fase final (9 de junho a 9 de julho de 2028):** 24 em 6 grupos de 4; os 2 primeiros e os 4 melhores terceiros vão às oitavas (sorteio sem repetir o grupo); quartas, semifinal e final em Wembley. Espanha é a atual campeã (2024).
- **Motor:** edições de vários anos (`anos`), com intervalo entre elas em que nada abre (a edição anterior continua no estado e serve a quem depende dela); vagas de outra edição para seleções (a Nations League de 2026/27 alimenta as eliminatórias de 2027/28); regras de `classificados` nas eliminatórias; `foraDosClassificados` e `limiteDeEntradas` para os playoffs; grupos de tamanhos diferentes (`menoresNoFim`, `menoresPara`) e times separados no sorteio (`separar`).

## Copa do Mundo de 2030 e as eliminatórias (etapa 11c, 26/11/2026)

- **Anfitriões:** Espanha, Portugal e Marrocos (sedes principais) e Uruguai, Argentina e Paraguai (jogos do centenário) entram direto, e as vagas deles saem da cota de cada confederação.
- **Vagas:** as da Copa de 2026, enquanto a FIFA não publica as de 2030: UEFA 16 (14 pelas eliminatórias), CONMEBOL 6 (3) + 1 na repescagem, Concacaf 6 + 2, AFC 8 + 1, CAF 9 (8) + 1, OFC 1 + 1; a repescagem de 6 seleções dá as 2 últimas.
- **UEFA (setembro de 2029 a março de 2030):** a ideia anunciada pela UEFA, completada aqui. As 36 melhores na Nations League de 2028/29 (sem Espanha e Portugal) na Liga 1, em três ligas de 12 no formato suíço (6 jogos, 2 contra cada pote); as 16 de pior campanha na Liga 2, em 4 grupos de 4. Os 3 primeiros da Liga 1 vão à Copa; do 2º ao 7º de cada liga e os 4 primeiros da Liga 2 jogam os playoffs de março de 2030 em ida e volta, por 11 vagas.
- **CONMEBOL:** as 7 que não são anfitriãs em turno e returno (14 rodadas, de setembro de 2027 a novembro de 2028); 3 vão à Copa e a 4ª à repescagem. A CONMEBOL ainda discute o formato.
- **Concacaf:** o formato anunciado (1ª fase em ida e volta com as 22 de pior ranking; 2ª fase com 24 em 6 grupos; fase final com 12 em 3 grupos, em junho de 2028 e setembro e outubro de 2029); as 2 primeiras de cada grupo vão à Copa. Com as vagas de 2026, as 2 melhores terceiras vão à repescagem (a Concacaf anunciou um playoff entre elas por uma vaga só).
- **AFC, CAF e OFC:** o formato do ciclo de 2026, quatro anos depois. AFC: cinco fases (a 3ª com 18 em 3 grupos de 6 dá 6 vagas, a 4ª dá mais 2 e a 5ª manda 1 à repescagem). CAF: 9 grupos de 6 (um de 5, sem Marrocos); os 8 melhores primeiros vão à Copa e o 9º primeiro e os 3 melhores segundos jogam os playoffs pela repescagem. OFC: 1ª fase com as 6 de pior ranking em jogo único (no real, as 4 últimas em turno único), grupos, semifinal e final; a campeã vai à Copa e a vice à repescagem.
- **Repescagem (março de 2030, em campo neutro):** as 2 primeiras da lista (a 4ª da CONMEBOL e a melhor terceira da Concacaf) direto na final de cada caminho; as outras 4 jogam as semifinais.
- **Fase final (13/06 a 21/07/2030):** 48 em 12 grupos de 4, sem duas da mesma confederação no grupo (a UEFA, com 16, divide alguns); os 2 primeiros e os 8 melhores terceiros vão aos 16 avos. Espanha é a atual campeã. Os três jogos do centenário na América do Sul e a disputa do 3º lugar ainda não estão no jogo.
- **Motor:** vagas com `exceto`, `pular`, `maximo` e `melhores`; regra `perdedores`; dias com `*` para pular um ano; vagas de edições até 3 anos antes nas seleções; anfitriões na frente da lista da primeira fase; fase de liga dividida em ligas por sorteio de potes; `todosJogam` também na última fase.
