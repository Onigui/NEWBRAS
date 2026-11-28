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

## Copas continentais de seleções (etapa 11d, 26/11/2026)

- **Copa Africana de 2027:** eliminatórias com as 48 seleções nos 12 grupos do sorteio de maio de 2026, seis rodadas nas datas FIFA de setembro de 2026 a março de 2027. Passam os 2 primeiros de cada grupo; nos grupos dos anfitriões (Quênia, Uganda e Tanzânia, já classificados), só o melhor dos outros. Fase final de 19/06 a 17/07/2027 com 24 em 6 grupos; os 2 primeiros e os 4 melhores terceiros vão às oitavas. A CAF anunciou em 2025 a Copa a cada 4 anos a partir de 2028 e uma Nations League africana em 2029, mas em outubro de 2026 disse que pode voltar atrás; o jogo mantém a Copa a cada 2 anos, com os mesmos anfitriões, até haver decisão.
- **Copa da Ásia de 2027:** na Arábia Saudita, adiada para 23/12/2027 a 21/01/2028, com os 6 grupos do sorteio de maio de 2026 e o mesmo formato da Copa Africana. O Catar é o atual campeão.
- **Nations League da Concacaf de 2026/27:** Liga A com México, Estados Unidos, Canadá e Panamá direto nas quartas; as outras 11 em 2 grupos em turno único (no real, 12 em 2 grupos de 6 no formato suíço; a Martinica, que não é da FIFA, fica fora). Os 2 primeiros de cada grupo vão às quartas em ida e volta, em novembro; semifinal e final em março de 2027. Liga B com 12 em 4 grupos de 3 em turno e returno (as que não são da FIFA ficam fora, e as Ilhas Cayman completam o grupo D). A Liga C, só com seleções pequenas, ainda não entra.
- **Copa Ouro de 2027 (17/06 a 11/07):** o formato novo de 2 grupos de 8, em que cada um joga 4 vezes, e os 4 primeiros de cada grupo vão às quartas. No jogo, as 16 vêm da Nations League: os 8 das quartas e os 2 terceiros dos grupos da Liga A, os 4 primeiros e os 2 melhores segundos da Liga B. No real, 8 vêm direto, 7 de uma fase preliminar e 1 é convidado.
- **Copa América de 2028 (junho e julho):** sede e formato ainda não anunciados; o jogo segue 2024, com as 10 da CONMEBOL e as 6 melhores da Copa Ouro de 2027 em 4 grupos de 4. A Argentina é a atual campeã.
- **Edições seguintes:** os grupos do sorteio real valem só na primeira edição (`gruposFixosAte`); depois, os mesmos participantes são sorteados de novo. A Nations League da UEFA passou a sortear também.
- **Motor:** `fixosAqui` põe seleções direto numa fase adiante; a regra `anfitrioes` tira do grupo a vaga do anfitrião já classificado; cada edição nova de seleções volta à lista da definição (quem chegou pelas vagas não fica).

## Seleções na interface e amistosos nas datas FIFA (etapa 11e, 26/11/2026)

- **Amistosos:** cada data FIFA tem dias de amistoso (2 em março, junho e novembro; 4 na de setembro e outubro). Na véspera de cada um, as seleções sem jogo oficial a 2 dias dele entram no sorteio (85% delas; nem todas acham adversário) e são pareadas com uma de força parecida, de preferência da mesma confederação. Um amistoso que cai perto de um jogo oficial sorteado depois é cancelado. Ficam guardados os do último ano.
- **Convocados do clube:** quem está na convocação automática da seleção (os 26 melhores do país) fica fora do clube durante as datas FIFA, como manda a regra da liberação. Fora delas, sai 3 dias antes de cada jogo da seleção, volta no dia seguinte e fica durante os torneios. Assim um clube brasileiro perde os convocados na Copa América de 2028, com o Brasileirão em andamento. Só o clube do técnico sente isso por enquanto; os da CPU seguem com o elenco inteiro.
- **Volta cansado:** quem joga pela seleção perde condição (30 o titular, 10 o reserva que entrou). Os titulares são um 4-4-2 pela força dentro da convocação, e um reserva entra em 45% dos jogos. Os jogos e gols pela seleção ficam na ficha do jogador.
- **Notícias:** a apresentação dos convocados, os gols deles pela seleção e os resultados da seleção do país do clube.
- **Interface:**
  - Aba Seleções: os convocados do clube e, de qualquer seleção, os próximos jogos, os resultados (oficiais e amistosos) e a convocação.
  - Plantel: marca de convocado.
  - Escalação: aviso "com a seleção" para quem estiver fora no próximo jogo.
- **Para depois:** escolher a convocação à mão, ser técnico de seleção e receber convites vêm na Fase 15. A convocação ainda não acompanha a evolução dos jogadores na carreira.

## O mundo envelhece: evolução, aposentadoria, juniores e lendas (etapa 12a, 26/11/2026)

- **Fase 12 em etapas:**
  - 12a: evolução do mundo inteiro, aposentadoria com júnior no lugar e renascimento das lendas.
  - 12b: lesões, contratos (fim, renovação e jogador livre) e moral de cada jogador.
  - 12c: categoria de base com olheiros, promoção dos jovens e os ícones subindo da base.
- **Sem peso no salvamento:** a evolução sai da semente da carreira e da data, e nada vai para o arquivo. Cada jogador do banco é uma vaga no clube. Quando ele para, o júnior que entra ocupa a mesma vaga, e o júnior desse júnior também.
- **Quando muda:** no começo de cada temporada do país do clube (agosto na Inglaterra, janeiro no Brasil). A primeira temporada da carreira começa com o banco como está.
- **Evolução:**
  - O jovem cresce pela curva até o potencial real aos 28 anos. O potencial real é o mostrado com um sorteio de ±2,5, e o potencial mostrado nunca baixa.
  - Depois do auge, a força cai pela curva. Cada jogador tem de 1,5 ano a menos a 2 anos a mais de auge, e a estrela ganha mais 1.
  - Até os 30 anos, cada temporada tem uma pequena variação.
  - Os atributos acompanham a força na mesma proporção. Depois dos 29, o físico (velocidade, resistência e força física) cai 2,5% por ano a mais, e o resto compensa um pouco.
- **Aposentadoria:**
  - Idade sorteada em torno de 35 anos, entre 32 e 41. Goleiros jogam 2 anos a mais e estrelas, 1.
  - Quem já passou da idade joga ao menos mais uma temporada (o CR7, com 41, para em 2027).
  - No lugar entra um júnior de 17 a 20 anos, do país do clube e da mesma posição, com força pelo nível do clube. Raramente é estrela; o aposentado estrela tem mais chance de deixar um júnior estrela.
- **Lendas que renascem:**
  - Quem chegou a força 80 ou é estrela renasce com 16 a 18 anos, com o mesmo nome, as mesmas características e o perfil reduzido.
  - O potencial é a força do auge (o Messi volta podendo chegar a 97).
  - Renasce na base de qualquer clube do mundo, com chance igual para todos, menos o clube de onde saiu (regra do dono em 27/11/2026, abaixo). Sobe ao profissional aos 18, numa vaga nova do clube.
- **Notícias:**
  - Do clube: aposentadorias, quem sobe dos juniores ou da base e quem mais evoluiu e mais caiu na temporada nova.
  - Do mundo: até 6 lendas famosas por dia (força de auge 86 ou mais), com o clube onde renasceram.
- **Interface:** o plantel mostra quanto cada jogador subiu ou caiu desde a temporada anterior.
- **Desempenho:**
  - Uma temporada da carreira leva cerca de 10 segundos no total.
  - Para isso, as contas de datas ficam guardadas, os resultados do dia entram de uma vez em cada competição e os atributos evoluídos só são calculados quando alguém os usa.
- **Para depois:**
  - Os minutos jogados ainda não pesam na evolução (fica para a 12b, com a moral).
  - Os jogadores da base do banco ainda não sobem; isso vem na 12c.
  - Os elencos crescem um pouco com as lendas renascidas, até o mercado (Fase 13) trazer as dispensas.

## Lesões, contratos e moral de cada jogador (etapa 12b, 26/11/2026)

- **Lesões:**
  - Vêm do motor de partida (pancadas e cansaço) e do treino: 0,1% por dia, mais com o jogador cansado.
  - A duração sai pelo tipo: pancada (2 a 6 dias), estiramento (7 a 21), entorse (10 a 28), lesão muscular na coxa (21 a 45), joelho (40 a 100), fratura (60 a 120) e ligamento cruzado (180 a 270). As leves são as mais comuns.
  - O lesionado não joga pelo clube nem vai à seleção. Volta com no máximo 85 de condição.
- **Moral de cada jogador (0 a 100, 60 é o normal):**
  - Sobe ao jogar: titular +2, reserva que entrou +1, +2 por gol e +1 por vitória.
  - Cai com a derrota (-1) e com o pênalti perdido (-4).
  - Quem está entre os 16 principais e fica de fora perde 2 (os 5 melhores, 3).
  - O atacante cobra de si mesmo depois de 5 jogos sem marcar.
  - Volta aos poucos ao normal e desce devagar com o contrato nos últimos 6 meses.
  - Puxa o humor junto com a moral do time.
  - Aparece no plantel como insatisfeito, abatido, normal ou motivado.
- **Contratos:**
  - Avisos 6 meses e 1 mês antes do fim. No dia seguinte ao fim, sem renovação, o jogador sai do clube. Fica livre, e o mercado da Fase 13 cuida dele.
  - A renovação abre com até 2 anos de contrato pela frente. O jogador pede um salário pela força (estrela pede mais, o insatisfeito também), nunca menos que 5% acima do atual.
  - Durações: 6 meses, 1, 2 ou 3 anos. Com 33 anos, até 2 anos; com 35, até 1 ano.
  - O insatisfeito (moral abaixo de 25) não quer conversar; com 38 anos, pensa em parar.
  - Renovar levanta a moral.
- **Minutos na evolução:** na virada da temporada do clube, o jovem de até 23 anos que jogou 60% dos minutos do mais usado ganha 1 de força, e mais 1 se jogou 40% com a moral alta. Quem quase não jogou perde 1. O ajuste fica entre -4 e +4, somado à curva da evolução.
- **Interface:**
  - Plantel: marca de lesionado, coluna de moral e fim de contrato em destaque quando faltam 6 meses.
  - Ficha: moral, lesão e a renovação com o salário pedido.
  - Escalação: aviso "lesionado até".
- **Para depois:** lesões e moral dos jogadores dos clubes da CPU (eles seguem com o elenco inteiro), salários pesando no caixa (Fase 14) e jogador livre assinando com outro clube (Fase 13).

## Lesões mais realistas (etapa 12b2, 26/11/2026)

- **O risco de cada jogador** multiplica a chance de lesão no jogo e no treino:
  - Posição: goleiro ×0,35, zagueiro ×0,9, meia ×1, lateral e atacante ×1,1.
  - Idade: +4% por ano acima dos 28.
  - Físico: resistência e força física altas tiram até 12% do risco; baixas somam até 15%. Não vale para goleiros.
  - Fragilidade: fixa para cada jogador, sorteada pela semente da carreira, de 0,5 a 2,2 com média perto de 1. Na ficha aparece "propenso a lesões" ou "raramente se machuca".
  - Recaída: na volta, o risco chega a 2,5 vezes e cai até o normal em 4 semanas.
- **No motor de partida:** o risco pesa inteiro na lesão por cansaço e pela raiz na pancada de falta (quem bate não escolhe a vítima frágil). O evento de lesão guarda quem fez a falta, e isso diz a causa.
- **O tipo depende da causa:**
  - Falta: pancada 45%, entorse 22%, fratura 9%, joelho 9%.
  - Cansaço no jogo: estiramento 40%, lesão na coxa 26%.
  - Treino: estiramento 35%, pancada 25%, coxa 17%.
  - Ligamento cruzado: 3% a 5% em todas.
- **Recuperação:** cada ano acima dos 28 alonga a volta em 2%.
- **Férias sem treino:** sem lesão de treino entre 3 semanas depois do fim da temporada e 3 semanas antes do começo da seguinte (junho e quase todo julho na Europa, a segunda metade de dezembro no Brasil).
- **Clubes da CPU:**
  - Depois de cada jogo simulado, cada time tem 24% de chance de perder alguém (a média do motor), escolhido entre os 16 mais fortes pelo risco.
  - O lesionado fica fora dos jogos seguintes (força do time e autores dos gols) e também da partida contra o técnico. A lista é limpa uma vez por mês.
  - Seleções não entram: o elenco delas é a convocação.
- **Números de uma temporada simulada (Real Madrid, 64 jogos):** cerca de 22 lesões em jogo e 11 em treino, quase nenhuma de goleiro. A média dos estudos com a elite europeia fica perto de 1,5 lesão por jogador por temporada.
- **Peso:** a lista da CPU soma uns 160 KB ao salvamento, e a temporada continua em cerca de 11 segundos.

## Categoria de base (etapa 12c, 26/11/2026)

- **A base do clube do técnico** (aba Base, tecla 8) tem até 15 garotos, fora dos 30 do profissional. Começa com a base do banco. Os garotos evoluem pela mesma curva do mundo e cada um tem o potencial de verdade escondido.
- **Olheiros:**
  - Até 3 contratados, com nível de 1 a 5 estrelas e salário de 2.000 × nível² por mês (o salário pesa no caixa na Fase 14).
  - O mercado tem 3 opções, que mudam todo mês.
  - O técnico manda cada olheiro a um país por 1, 2, 3 ou 6 meses. A cada 10 dias de missão ele manda até 2 relatórios (às vezes nenhum).
  - Os garotos têm de 15 a 17 anos, e a qualidade vem do nível do olheiro e da força do país no futebol.
- **Relatórios:**
  - Mostram a força de hoje e uma faixa de potencial de ± (9 − 2 × nível do olheiro), com o potencial de verdade sorteado dentro dela. O olheiro de 5 estrelas erra por 1; o de 1 estrela, por até 7.
  - Somem em 45 dias sem resposta. O técnico traz o garoto para a base ou descarta.
- **Peneira:** a cada temporada do clube, de 2 a 4 garotos de 15 e 16 anos do país chegam à base, com qualidade pelo nível do clube.
- **Promoção e dispensa:**
  - A promoção abre aos 16 anos, com vaga nos 30 do profissional. O garoto sobe com contrato de 3 anos e passa a evoluir no elenco pela curva desde o dia da promoção.
  - Quem faz 20 anos na base sem subir é dispensado.
  - Com o elenco cheio, a vaga só abre quando alguém sai ou se aposenta (a dispensa de profissionais vem com o mercado da Fase 13).
- **A CPU também revela:** os garotos da base do banco nos outros clubes sobem aos 18 anos quando são ícones ou têm potencial de pelo menos o nível do clube + 2 (586 no mundo inicial); os outros saem da base. O júnior que entra no lugar do aposentado também representa a revelação da CPU.
- **Ícones:** os 22 ídolos que recomeçam na base (Zidane, Ronaldo, Bale e outros) sobem ao profissional dos seus clubes aos 18. Por exemplo, Zidane chega ao profissional do Rondoniense em 2028, com força 66 e potencial 96. Se o clube for o do técnico, quem decide a promoção é ele.
- **Fica para depois:** investimento na estrutura da base (com as finanças, na Fase 14) e campeonatos de base.

## Mercado do técnico (etapa 13a, 26/11/2026)

- **A Fase 13 em etapas:**
  - 13a: mercado do técnico (comprar, vender, dispensar, livres, janelas).
  - 13b: mercado aquecido entre os clubes da CPU (diagnóstico do elenco, objetivo, orçamento e negociação), com dispensas da CPU alimentando os livres.
  - 13c: pré-contrato nos últimos 6 meses, empréstimos e leilões.
- **Transferências na carreira:** cada mudança de clube vira um registro (compra, venda, dispensa, fim de contrato, livre contratado). O mundo da data lê os registros para montar os elencos: quem saiu some, quem chegou entra com a evolução dele e quem ficou sem clube é livre. O jogador transferido que se aposenta abre o júnior no clube de origem (simplificação).
- **Valor de mercado:**
  - Cresce uns 4 vezes a cada 10 pontos de força; força 90 no auge vale 100 milhões.
  - O jovem com margem de crescer vale até 2,5 vezes; o valor cai com a idade a partir dos 28 (30 anos ×0,7; 32 ×0,5).
  - O contrato no fim derruba o valor (menos de 1 ano ×0,75; menos de 6 meses ×0,5). Estrela vale ×1,15.
  - Exemplos: Haaland, 160 milhões; Olise, 150; Kane, aos 32, 66.
- **Caixa:** começa com 10% do valor do elenco (147 milhões no Real Madrid). Compras saem e vendas entram. Salários e receitas vêm com as finanças, na Fase 14 (por enquanto a escala de salários é mais baixa que a dos valores).
- **Janelas reais:** compra só com a janela do país do comprador aberta. Fora dela, só jogadores livres, que podem ser contratados a qualquer hora. Um país sem janelas no banco usa as da Europa.
- **Comprar:**
  - O clube pede pelo valor: ×1,6 pelos 3 melhores do elenco, ×1,3 pelos titulares e ×1,05 pelo resto (clube rico, ×1,15 a mais).
  - Oferta de pelo menos 85% do pedido vira contraproposta.
  - O clube não vende com 18 ou menos no elenco. O jogador recusa descer mais de 8 níveis, a não ser que caiba no clube novo.
  - Contrato de 3 anos (2 depois dos 31, 1 depois dos 34), pelo salário que ele pede.
- **Vender:**
  - Na janela, o jogador à venda recebe propostas da CPU (12% por dia), de clubes de nível perto da força dele, com 80% a 110% do valor.
  - Os 5 melhores recebem propostas sem estar à venda, de vez em quando, com 110% a 150% do valor.
  - A proposta vale 7 dias.
- **Dispensar:** a rescisão custa metade dos salários que faltam. O jogador fica livre, como quem termina o contrato.
- **Interface:**
  - Aba Mercado (tecla 9): caixa e janela, propostas recebidas, busca no mundo inteiro (nome, posição, força, idade, valor, só livres), proposta com resposta na hora, à venda e transferências do clube.
  - Ficha do jogador: valor, pôr à venda e dispensar.

## Pedidos do dono em 27/11/2026: renascimento, trocas, empréstimos e a crise do clube mal administrado

- **Renascimento (feito nesta data):**
  - A lenda renasce na base de qualquer clube do mundo, sorteado com chance igual para todos, e nunca no clube de onde saiu. Antes, os clubes de nível alto tinham mais chance. A graça é um time fraco ter a sorte de ganhar um prodígio.
  - Se o sorteado for o clube do técnico, ela chega à aba Base, com a idade e a força do renascimento e o potencial do auge, mesmo com a base cheia. A promoção é decisão do técnico (teste: Modrić renasce aos 18 na base do Ipswich).
- **Trocas e empréstimos (entram na etapa 13c, com o pré-contrato e os leilões):**
  - Troca de um jogador por outro, com ou sem diferença em dinheiro para qualquer lado. Os dois clubes e os dois jogadores precisam aceitar.
  - Empréstimo nos dois sentidos: ceder ao clube da CPU e pegar emprestado.
  - Condições do empréstimo: prazo (até o fim da temporada ou de 6 a 18 meses), quem paga o salário (ou a divisão), taxa de empréstimo e opção de compra com valor fixo.
  - O emprestado volta no fim do prazo. A CPU também empresta jovens para dar minutos.
- **A crise do clube mal administrado (Fase 14, finanças e estádio), com o efeito cascata pedido:**
  - **Receitas:**
    - Bilheteria pelo público real: cai com a fase ruim, com o preço alto e com o estádio velho, e sobe com as vitórias e os títulos.
    - Sócio-torcedor, que também foge na crise.
    - Premiações de campeonato e copa.
    - Cotas de TV pela divisão.
    - Patrocínio pela reputação: com o clube em baixa, os contratos encolhem ou vêm piores.
    - Vendas de jogadores.
  - **Despesas:** salários todo mês, manutenção do estádio, obras, olheiros e estrutura da base, juros.
  - **No vermelho:**
    - O caixa negativo vira dívida.
    - Sem dinheiro no dia do pagamento, os salários atrasam: a moral desaba, os jogadores pedem para sair e recusam renovar, e os melhores vão embora de graça.
    - Aí vêm menos vitórias, menos público e menos dinheiro, e a bola de neve segue.
    - Punições da liga em dívida grave: proibição de contratar e perda de pontos onde a vida real faz isso.
  - **A saída: empréstimo bancário.**
    - O técnico vê quanto precisa e decide quanto mais pegar para investir (elenco, estádio, base).
    - Escolhe o prazo; a parcela mensal vem com juros. O limite e a taxa dependem do tamanho do clube e da dívida que já tem, e o juro sobe com o risco.
    - Pagando em dia e voltando a ter resultado, o clube se recupera. Atrasando, a dívida cresce e o crédito acaba, até afundar de vez.
  - **CPU:** os clubes da CPU passam pelo mesmo ciclo, de forma simplificada, para o mundo ter ascensões e quedas.

## Mercado aquecido entre os clubes da CPU e o jogo duro na venda (etapa 13b, 27/11/2026)

- **Jogo duro na venda (regra do dono em 27/11/2026):**
  - Ninguém é intransferível só por ser bom. O clube decide pela própria situação e pelo peso do jogador, na mesma regra para o técnico e para a CPU.
  - O pedido parte do valor de mercado: craque (os 3 melhores do elenco) ×1,6, titular (até o 11º) ×1,3, reserva ×1,05; prodígio (até 21 anos, potencial 85 ou mais) ×1,3 a mais; clube rico (nível 85 ou mais) ×1,15.
  - Precisar de dinheiro baixa o pedido em até 35%: vender arruma as contas e reforça o time todo.
  - Fora da briga, o clube faz jogo duro com estrela e prodígio (o pedido alto), mas vende quem chega ao pedido. Oferta de 85% ou mais vira contraproposta.
  - **Intransferível só com os três fatores juntos:** o jogador é peça-chave (craque, ou prodígio titular), o clube briga pelo título (entre os 3 primeiros da 1ª divisão com 5 jogos ou mais; antes disso, a elite de nível 85 ou mais) e não precisa de dinheiro (menos de 30%). Mesmo assim, uma proposta absurda, de 3 vezes o valor, abre a conversa.
  - Até as finanças da Fase 14, "precisa de dinheiro" é uma estimativa: um aperto sorteado por clube e temporada (crise em 18% dos clubes pequenos, 10% dos médios e 5% dos grandes) menos o saldo das vendas e compras do clube na temporada. Na Fase 14, entra o caixa de verdade.
- **Mercado aquecido entre os clubes da CPU:**
  - Nas janelas do país, cada clube vai ao mercado de vez em quando: 1,2% por dia os grandes, 0,8% os médios e 0,4% os pequenos. Isso dá umas 1.500 transferências por ano no mundo.
  - O clube acha a posição mais fraca para o nível dele (o titular de um 4-4-2) e só às vezes compra sem buraco.
  - Separa um orçamento de 15% do valor do elenco, menos o quanto precisa de dinheiro.
  - Procura um jogador de até 31 anos, pelo menos 3 pontos melhor que o titular e no máximo 6 acima do nível do clube, que aceite o clube (não desce muito de nível) e que o vendedor libere pela regra acima dentro do orçamento. Um livre que resolve vem de graça.
  - O vendedor não fica com menos de 18 no elenco.
  - Grandes transferências (estrela ou 40 milhões ou mais) viram notícia, até 4 por dia.
- **Elencos:** na janela, quem passa de 30 dispensa os mais fracos (e mais velhos), que viram livres. Lendas que sobem e garotos da base não incham mais os elencos.
- **Salvamento:** no 1º de julho, a lista de transferências fica só com a última de cada jogador, o histórico do clube do técnico e as da temporada.
- **Desempenho:**
  - O índice do mundo por posição é refeito uma vez por semana, ordenado pela força, e os candidatos são sorteados na faixa.
  - A posição nas ligas e o saldo de compras e vendas dos clubes são calculados uma vez por dia.
- **Goleiros:** o clube não vende goleiro se ficar com menos de 2. Quem fica sem o mínimo numa posição (2 goleiros, os titulares do 4-4-2) vai ao mercado na certa até achar alguém.
- **Teste de 10 temporadas só com a CPU** (`npx tsx scripts/simular-temporadas.ts 10`; o técnico só escala o automático e renova os contratos):
  - Elencos entre 18 e 30 jogadores (média 25,8) o tempo todo, e nenhum clube sem goleiro.
  - Os 11 melhores dos 20 clubes mais fortes passam de 86,6 para 89,4 e se estabilizam a partir de 2033.
  - Cerca de 1.200 a 1.600 transferências por ano, com 5 a 45 livres por vez.
  - A lista guardada passa de 11.800 transferências, e o salvamento vai de 5,3 para 8,5 MB.
  - A simulação leva uns 57 segundos por temporada. Fica a anotação para otimizar (simulação num worker e o resto) no polimento da Fase 16.

## Pré-contrato, empréstimos, trocas e leilões (etapa 13c, 27/11/2026)

- **Contrato da CPU que renova sozinho:** quando o contrato do banco acaba, o clube renova por 2 a 4 anos (sempre o mesmo número para o mesmo jogador, sem sorteio), e assim por diante. Sem isso, a partir de 2027 o mundo inteiro ficaria com contrato vencido (o valor caía a 30%) e o pré-contrato não teria sentido. Só o pré-contrato tira o jogador na hora da renovação.
- **Pré-contrato:**
  - Com jogador de outro clube nos últimos 6 meses do contrato dele, a qualquer hora (sem janela) e sem pagar nada ao clube. Ele chega no dia seguinte ao fim do contrato, com 3 anos de contrato novo e o salário combinado.
  - O reserva assina pelo salário que pede. O titular do clube dele quer 25% a mais, a não ser que vá para um clube maior (3 pontos de nível ou mais). O jogador também não desce muito de nível, como na compra.
  - A CPU faz o mesmo com o técnico, mas nunca de surpresa (pedido do dono, 27/11, como no PES e no FIFA). No último ano de contrato (9 meses ou menos), um clube interessado primeiro **sonda** o jogador:
    1. A diretoria avisa ("o clube X está sondando fulano; renove para segurá-lo"). Se a janela do clube estiver aberta, ele também faz uma proposta para levar agora, pagando 85% do valor.
    2. Uma semana depois, o próprio jogador vem conversar: tem a proposta e quer saber se o clube conta com ele. Dá um prazo para a renovação, de pelo menos 3 semanas e nunca antes de entrar nos 6 meses finais. O avanço até o próximo jogo para nesse dia e 7 dias antes do prazo, com um lembrete.
    3. Um painel no topo da carreira mostra a conversa até o técnico decidir: renovar ali mesmo (com a proposta na mão, ele pede 15% a mais de salário) ou liberar o jogador para acertar com o outro clube. Insatisfeito (moral abaixo de 25), ele não renova, e o caminho é vender ou deixar sair.
    4. Sem renovação até o prazo, ele assina o pré-contrato e sai de graça no fim do contrato.
  - Quem está contente (moral 45 ou mais) só é sondado por clube do mesmo tamanho ou maior. A chance de sondagem segue o peso no elenco (craque 1,5 vez, reserva metade).
- **Empréstimos nos dois sentidos:**
  - **Pegar emprestado:** o dono cede reservas e jovens titulares (até 23 anos, se não estiver brigando pelo título), nunca o craque, e não empresta com o elenco curto. O técnico vê as condições e fecha:
    - prazo: até o fim da temporada do clube ou até o fim da próxima;
    - taxa: de 4% a 12% do valor por temporada, mais alta quando o dono precisa de dinheiro;
    - parte do salário paga pelo técnico: de 60% a 100% (o dono rico ou apertado quer tudo);
    - opção de compra: o valor com 25% de folga (no prodígio, 30% a mais, e só se o dono precisar de dinheiro). O técnico escolhe levar ou não, e exerce com a janela aberta.
  - O emprestado não renova contrato, não vai à venda, não é dispensado e volta ao dono no dia seguinte ao fim do empréstimo.
  - **Emprestar:** o técnico oferece o jogador pela ficha. Na janela, clubes onde ele jogaria (nível de 8 pontos abaixo a 3 acima da força dele) mandam propostas com taxa, parte do salário, prazo e às vezes opção de compra. O passe e o contrato continuam do técnico. No fim, o clube exerce a opção (60% de chance) se o jogador se firmou lá; senão ele volta.
  - **A CPU empresta os garotos:** clubes de nível 70 ou mais cedem, na janela, jovens de até 21 anos que não jogam (força 8 abaixo do nível do clube, com margem de crescer) a clubes do nível deles, até o fim da temporada. Dá uns 100 empréstimos por ano.
- **Trocas:**
  - Até 3 jogadores do técnico pelo alvo, com diferença em dinheiro para qualquer lado (o clube só paga a diferença com dinheiro que tem). Precisa das janelas dos dois clubes abertas e de vaga nos dois elencos.
  - O clube decide pela mesma regra da venda (situação, peso do jogador, intransferível), contando o que recebe pelo valor que tem para ele: quem serve ao nível do clube vale 100%, quem fica um pouco abaixo 70%, o fraco 35%, e o de 32 anos ou mais vale 30% a menos. Quem chega conta no tamanho do elenco e nos goleiros.
  - A tela mostra quanto o clube vê na oferta, quanto pede e quanto falta em dinheiro. O alvo e cada jogador oferecido precisam aceitar o clube novo.
- **Leilões:**
  - O técnico leiloa um jogador com a janela aberta, com o lance mínimo que escolher. O leilão fica aberto 4 dias e o maior lance válido leva.
  - Clubes da CPU em crise (precisam muito de dinheiro) leiloam um titular, com mínimo de 60% do valor; até 4 leilões da CPU abertos por vez. O técnico dá lances na aba Mercado (5% acima do maior, no mínimo).
  - Cada clube da CPU vai até um teto fixo por leilão (de 1 a 1,4 vez o valor) e dentro do orçamento. Quando cobrem o lance do técnico, vira notícia.
  - No fechamento, o lance do técnico só vale com janela aberta, caixa e vaga no elenco; senão passa para o seguinte. O clube da CPU que ficou com o elenco curto desiste.
- **Fora do mercado comum:** emprestados, com pré-contrato e em leilão não são comprados nem dispensados pela CPU nem comprados pelo técnico.
- **Teste de 10 temporadas só com a CPU** (o técnico automático agora renova antes dos 6 meses finais, como pede o aviso):
  - Elencos entre 18 e 31 em janeiro (17 no começo de julho, depois das aposentadorias e antes da janela; quem passa de 30 dispensa na janela seguinte), média 25,8, e nenhum clube sem goleiro.
  - Uns 100 empréstimos e 50 a 70 leilões por ano no mundo, com 70 a 110 empréstimos em andamento por vez; o total passa a 1.500 a 1.900 transferências por ano.
  - Os 11 melhores dos 20 clubes mais fortes vão de 86,6 a 89,5 e se estabilizam.
  - O salvamento termina com 8,7 a 9,3 MB, e a simulação leva uns 55 segundos por temporada.

## Finanças de verdade (etapa 14a, 27/11/2026)

- **Escala real dos salários:** 2 milhões por mês na força 90, uns 4,2 vezes menos a cada 10 pontos (476 mil na 80, 113 mil na 70, 27 mil na 60, 6 mil na 50). Antes a escala era uns 6 vezes mais baixa que a dos valores de mercado. A mudança vale para os contratos do banco, as renovações, o pré-contrato e a rescisão.
- **Receita anual pelo nível econômico e pelo país:** o nível econômico é metade o nível do clube (tamanho, torcida, história) e metade a força média dos 11 melhores do elenco, então time que melhora ganha mais (prêmios, público, patrocínio) e o que se desmancha perde. A receita é de 750 milhões no nível econômico 90, uns 3 vezes menos a cada 10 pontos, vezes a economia do país: Premier League 1,3; Arábia Saudita 1,2; Espanha e Alemanha 1,1; Itália 1; França e EUA 0,9; Portugal, Holanda, México e Turquia 0,8; Brasil 0,75 (era 0,65 na 14a; com a receita pelo elenco, o Flamengo ficava abaixo da realidade); Argentina 0,55; o resto 0,65. A folha fica perto de metade da receita em todos os níveis (mais folgada na Inglaterra e na Arábia, mais apertada na Argentina).
- **Clube do técnico, todo dia 1:**
  - Entram cotas de TV (30% da receita anual, divididos por 12), patrocínio (22%) e comercial (6%).
  - Saem salários (os contratos do elenco; o emprestado a outro clube custa só a parte que o técnico paga), estrutura e funcionários (20%), manutenção do estádio (meio jogo de casa cheia) e olheiros.
  - Uma notícia fecha o mês com os salários, as receitas e o saldo fixo.
- **Bilheteria em cada jogo em casa:**
  - O público vem da reputação do clube (35% da capacidade na reputação 1, 85% na 5), e a moral do time soma ou tira até 20 pontos.
  - O ingresso médio sobe com o nível (80 no nível 90, 35 no Flamengo) e com a economia do país. O amistoso leva metade do público pela metade do preço.
  - Preço por setor, sócio-torcedor e obras ficam para a etapa do estádio.
- **Premiações:** título e vice pagam parte da receita anual, com o vice levando a metade: liga 10%, continental 12%, mundial 8%, copa nacional 4% e estadual 2%.
- **Aba Finanças (tecla 0):** caixa, receita anual estimada, folha, o que entra e sai todo mês, estádio (público esperado e renda por jogo), extrato dos últimos 12 meses (com bilheteria, premiações, vendas e compras) e os maiores salários.
- **Caixa de cada clube da CPU:**
  - Começa sorteado em parte da receita anual. A maioria tem folga; 5% a 18% (mais nos pequenos) começam no vermelho.
  - Todo dia 1 recebe 78% da receita do mês (10% a mais para os 3 primeiros da 1ª divisão, 8% a menos da 15ª posição para baixo) e paga a folha pela força atual e a estrutura (20%; no vermelho, o clube corta gastos e cai a 8%). Compras e vendas mexem no caixa no dia.
  - O teto é 60% da receita anual: acima disso, o dono investe ou retira.
- **"Precisa de dinheiro" vem do caixa:** com 4 meses de receita ou mais de folga, nada; no zero, 0,6; com 2,7 meses no vermelho, 1. A estimativa da etapa 13b (aperto sorteado por temporada menos o saldo de vendas) saiu. O orçamento de compra da CPU agora também respeita o caixa (até 80% dele, sem passar de 15% do valor do elenco).
- **Fica para as próximas etapas:** dívida, salários atrasados e o efeito cascata, punições e empréstimo bancário com juros para o técnico e para a CPU (14b); ingressos por setor, sócio-torcedor, obras, naming rights e o resto do estádio (14c).
- **Teste de 4 temporadas só com a CPU:** clubes da CPU no vermelho caem de 18% (sorteio inicial) para 9% a 11% e ficam estáveis. Com o tempo, uns 70% têm folga de 4 meses de receita ou mais. Elencos de 18 a 30, nenhum clube sem goleiro, e uns 45 segundos por temporada.

## Conversas com os jogadores e cobranças da diretoria (pedido do dono, 27/11/2026)

Antecipado da Fase 15, no estilo do PES e do FIFA: o vestiário e a diretoria falam com o técnico, e cada resposta mexe na moral e no humor dos jogadores e na confiança da diretoria.

- **Conversas dos jogadores** (depois de cada jogo, no máximo uma nova por jogo, até 3 esperando e o mesmo jogador só volta depois de 40 dias):
  - **Quer sair:** o insatisfeito (moral abaixo de 25) pede para ser negociado. "Vou te negociar" põe na lista de venda (moral +10) e vira promessa: tirar da lista depois é traição (moral −15). "Você fica" derruba a moral (−10).
  - **Quer jogar:** a promessa da base (até 22 anos, com 6 pontos de potencial a crescer) depois de 4 jogos fora, ou o reserva quase titular depois de 6, pede chances. As respostas:
    - "Prometo mais minutos" (moral +8): ele precisa jogar 2 dos 5 jogos oficiais seguintes. Cumprida, moral +10; quebrada, −20 e humor em baixa.
    - "Espere a sua vez": moral −8.
    - "Vamos te emprestar": oferece por empréstimo, moral +4.
  - **Cansado:** quem joga 60 minutos ou mais com condição abaixo de 70% reclama. "Vou te poupar" (moral +4) promete no máximo 45 minutos no jogo oficial seguinte (cumprida +4, quebrada −12). "Preciso de você em campo" custa −6.
  - Cada conversa espera 7 dias. Sem resposta, o jogador se sente ignorado (moral −10).
- **Diretoria:**
  - **Metas da temporada:** quando a liga começa, a diretoria define a meta pela força do clube entre os participantes, e também pede contas no azul:
    - os 2 mais fortes: brigar pelo título (até o 2º);
    - o primeiro quarto: vaga (até a posição de um quarto da tabela);
    - até dois terços: campanha tranquila (até a metade + 1);
    - o resto: não cair (até 4 posições do fim).
  - **Confiança (0 a 100, começa em 60):**
    - Vitória +2, derrota −2,5. Vencer um clube bem mais forte vale +2 a mais; perder para um bem mais fraco, −2 a mais.
    - Todo mês, com 8 jogos ou mais, estar dentro da meta dá +3 e estar mais de 3 posições abaixo dá −4. Caixa negativo, −3.
    - No fim da liga, meta cumprida dá +15; não cumprida, −20.
  - **Cobranças:** abaixo de 40, a diretoria cobra reação (com a posição e a meta); abaixo de 25, dá um ultimato. A partir de 80, elogia. Cada aviso vem no máximo uma vez a cada 30 dias.
  - A demissão fica para a Fase 15, junto com os convites de outros clubes.
- **Na tela:** as conversas ficam num painel no topo da carreira, com as respostas e uma dica do efeito de cada uma. O avanço até o próximo jogo para quando a diretoria fala. A aba Início ganhou o quadro da diretoria, com a barra de confiança, a meta, a posição atual e as promessas em andamento.

## Pedidos do dono em 27/11/2026 (tarde): ingressos sem abuso e o ritmo das fases

- **Regra de trabalho:** quando o dono pede algo que já está planejado para outra fase, não é para antecipar. O pedido é anotado no item da fase, somado ao que já estava planejado, e feito na fase prevista. As conversas com os jogadores e a diretoria já tinham sido feitas antes do tempo; elas ficam como estão, e a ampliação vai para a Fase 15 (abaixo). A regra está no `CLAUDE.md`.
- **Ingressos sem dinheiro infinito (etapa do estádio, 14c):** hoje o preço do ingresso é fixo, calculado pelo jogo, então ainda não há como abusar. Quando o técnico puder mexer no preço (setores e sócio-torcedor), entram as travas:
  - **Preço justo:** cada clube tem um preço que a torcida aceita, pelo nível, pela economia do país, pela reputação, pela fase do time (vitórias, posição) e pela importância do jogo (clássico e final valem mais; amistoso, menos).
  - **A torcida recusa o preço alto:** acima do justo, o público cai cada vez mais rápido (elástico), então a renda tem um máximo perto do preço justo e cai depois dele. Cobrar o dobro esvazia o estádio e rende menos.
  - **Abuso tem custo:** preço muito acima do justo por várias rodadas gera protesto. A moral do time em casa cai (menos apoio), a reputação com a torcida baixa, o sócio-torcedor cancela e a diretoria reclama.
  - **Reajuste com limite:** o preço sobe no máximo uns 20% por mês (o clube não dobra o ingresso de uma rodada para outra), e o sócio-torcedor paga um valor fixo por temporada, com desconto.
  - **Preço baixo:** enche o estádio e anima a torcida (mais moral em casa), com renda menor. A escolha passa a ser estratégia, não uma fonte de dinheiro sem fim.
- **Conversas ampliadas (Fase 15, com a carreira):** pedido de aumento de salário, reclamação da posição em campo, conflitos no vestiário, líderes do elenco, jogador pedindo para ser capitão, imprensa (entrevistas antes e depois dos jogos, com respostas que mexem na moral e na torcida) e a demissão e os convites de outros clubes, que já estavam planejados.

## Crise do clube mal administrado e empréstimo bancário (etapa 14b, 27/11/2026)

- **Salários com prioridade:** todo dia 1, depois das receitas e despesas fixas, o clube paga os salários; depois, as parcelas do banco. Sem caixa para a folha inteira, os salários do mês atrasam (nada é pago e a dívida com o elenco acumula).
- **O efeito cascata, mês a mês com salário atrasado:**
  - A moral de todo o elenco cai 8 pontos. Insatisfeitos pedem para sair (as conversas), rendem menos e o público cai junto com a moral do time.
  - Ninguém renova contrato enquanto houver atraso.
  - Os patrocinadores desconfiam: o patrocínio cai 15% enquanto houver atraso ou caixa negativo.
  - A diretoria perde 5 pontos de confiança por mês (além dos 3 do caixa negativo).
  - Com 2 meses, a liga proíbe contratar (compras, livres, empréstimos, trocas, leilões, pré-contrato e opção de compra). A dívida grave (caixa negativo de mais de metade da receita anual) também proíbe.
  - Com 3 meses, cada um dos 5 melhores do elenco tem 30% de chance por mês de rescindir na Justiça e sair de graça (nunca deixando o elenco abaixo de 18).
  - A partir de 4 meses, a liga tira 3 pontos por mês, até 12 na temporada. A punição entra na tabela de verdade.
  - Pagar todos os atrasados acaba com a crise. Isso acontece sozinho, no dia em que houver caixa, e a moral sobe 5.
- **Empréstimo bancário (aba Finanças):**
  - Limite de metade da receita anual, menos o que já se deve ao banco.
  - Juros pelo risco: 0,8% ao mês para o clube saudável, subindo 2 pontos para cada receita anual de dívida (bancária mais caixa negativo), até uns 3,8%.
  - Prazos de 12, 24, 36 ou 60 meses, com parcela fixa (tabela Price) e a simulação da parcela e do total antes de fechar. A parcela sai todo dia 1, depois dos salários.
  - Parcela sem caixa atrasa, com multa de 2% e juros sobre o saldo. Com 3 atrasos, o crédito acaba. Crédito também é negado com caixa negativo maior que a receita de um ano.
  - Dá para quitar antes, pagando o saldo. O extrato mostra o crédito que entrou e as parcelas.
  - A recuperação vem de pagar em dia, vender, cortar a folha e voltar a ganhar (a receita acompanha a força do elenco e a moral do time). Atrasando, a dívida cresce até afundar de vez.
- **Clubes da CPU, de forma simplificada:**
  - Com o caixa negativo em mais de 30% da receita, o clube pega 35% da receita no banco, em 36 parcelas a 1,5% ao mês, e paga a parcela todo mês.
  - Se afundar mais de 60% mesmo assim, atrasa salários e cada um dos 2 melhores tem 30% de chance por mês de rescindir e sair de graça, sem deixar o elenco abaixo de 20. Vira jogador livre no mercado, e o clube perde força, receita e folha, até se reequilibrar ou cair.
  - A perda de pontos da CPU fica para depois.
- **Teste de 4 temporadas só com a CPU:**
  - De 75 a 290 clubes com dívida no banco ao mesmo tempo, e de 5 a 30 rescisões por ano.
  - O vermelho estável em 9% a 12%.
  - Elencos de 18 a 31. Na primeira versão, sem o piso, as rescisões deixavam elencos com 9 jogadores; daí o piso de 20.

## Pedidos do dono em 27/11/2026 (fim da tarde)

- **Demissão e convites (anotado para a Fase 15, já estava planejado):** a confiança da diretoria, as metas e o ultimato que existem agora são a base. Na Fase 15:
  - **Demissão:** quando tudo dá errado (confiança no fundo depois do ultimato, meta muito longe, crise financeira), o técnico é demitido. Ele vira técnico sem clube e espera convites, como no PES e no FIFA.
  - **Convites:** técnico com temporadas muito boas (metas batidas, títulos, confiança alta, reputação subindo) recebe propostas de outros clubes e de seleções, de nível compatível com a reputação dele. Ele aceita (troca de clube no meio da carreira) ou recusa. O demitido recebe convites de clubes menores.
  - Entra junto com o que já estava planejado na fase: reputação do técnico, rankings, prêmios, clube e seleção ao mesmo tempo, as conversas ampliadas e a imprensa.
- **Aposta na base na crise (corrige a 14b, feito agora):** o mínimo de 20 jogadores nas rescisões da CPU era um remendo. Agora a CPU faz o que um clube quebrado faz de verdade:
  - Na crise (caixa negativo de mais de 30% da receita, mesmo depois do banco), o clube corta a folha. Rescinde com o salário fora da realidade dele (mais de 6% da receita do mês), um por mês, e aposta na base, subindo garotos de 17 a 19 anos (fracos e baratos) até ter 22 jogadores, no máximo 3 por mês. A folha cai bem abaixo da de antes.
  - Afundando (mais de 60% no vermelho), os melhores que sobraram ainda podem rescindir na Justiça (30% cada, os 2 seguintes por mês).
  - Qualquer clube da CPU com menos de 18 jogadores sobe garotos da base até completar. Por isso a saída em massa (rescisões, vendas) não deixa mais ninguém desfalcado.
  - Os garotos são do país do clube, na posição que mais falta, com potencial pelo nível do clube. Crescem pela idade, como os da base do técnico, e param aos 36. Vivem no salvamento em `garotosCpu` e podem ser comprados e vendidos como qualquer jogador.
  - O clube do técnico já podia fazer o mesmo: promover a base pela aba Base e dispensar ou vender quem pesa na folha. A rescisão na Justiça do clube do técnico continua sem deixar o elenco abaixo de 18.
  - **Teste de 4 temporadas só com a CPU:** elencos de 20 a 31 (antes chegavam a 9). De 28 a 120 rescisões por ano viram jogadores livres que o mercado recoloca. O vermelho continua estável em 8% a 10%.

## Estádio (etapa 14c, 27/11/2026)

- **Ingressos por setor:**
  - Três setores com parte fixa da capacidade: popular (50%), central (38%) e camarote (12%).
  - O preço justo de cada setor parte do ingresso médio (0,6 vez no popular, 1 no central, 3 no camarote). Ele sobe com a fase do time (a moral) e com o peso do jogo: amistoso vale metade; jogo continental ou mundial, 20% a mais; fase final de copa, 30% a mais.
  - Os preços começam no justo, e o técnico escolhe os seus com a previsão de público e renda na tela.
- **As travas pedidas pelo dono:**
  - Acima do justo, o público cai com elasticidade 2,2 (o dobro do preço leva uns 22% do público). Abaixo, sobe até 60% a mais, limitado aos lugares. A renda máxima fica no preço justo, então não há dinheiro infinito.
  - O preço sobe no máximo 20% por mês, sobre o do começo do mês. Baixar é livre.
  - Cobrar mais de 40% acima do justo em três jogos oficiais seguidos gera protesto, que se repete enquanto durar: a moral do time e a confiança da diretoria caem 2, e 5% dos sócios cancelam. Um jogo com preço normal alivia.
- **Sócio-torcedor:**
  - O número de sócios vem da capacidade e da reputação (de 8% a 24% da capacidade), da moral do time e da mensalidade escolhida. A mensalidade justa vale duas entradas no popular, e acima dela os sócios somem com a mesma elasticidade.
  - A mensalidade também sobe no máximo 20% de cada vez. O número de sócios anda 30% por mês em direção ao esperado.
  - Os sócios pagam todo dia 1 e entram de graça: 70% vão ao jogo e ocupam lugares do popular e do central, no máximo 60% do estádio. Exemplo: Flamengo com uns 19 mil sócios a 44 por mês.
- **Obras de ampliação:**
  - Mais 5, 10 ou 20 mil lugares, até 100 mil. O lugar custa 4 mil, ajustado pelo preço do ingresso do país.
  - O prazo vai de 6 a 12 meses. A entrada é de 30%, e o resto vai em parcelas mensais até a entrega.
  - Durante a obra, 10% do estádio fica fechado. A manutenção acompanha a capacidade nova.
- **Exigência por competição:** jogo continental exige 20 mil lugares; o Mundial, 30 mil. Sem isso, o jogo vai para um estádio alugado e a renda cai 40%.
- **Nome do estádio:**
  - De vez em quando (15% por mês, sem contrato em vigor), uma marca fictícia (nunca uma marca real) oferece de 2% a 5% da receita anual por ano, conforme a reputação, por 3 a 5 anos.
  - Aceitando, o estádio passa a se chamar "Marca Arena" e a parcela entra todo mês. No fim do contrato, volta o nome original.
- **Eventos:** de vez em quando (25% por mês) chega uma proposta de show, festival ou jogo beneficente, para dali a 2 a 6 semanas, com renda pela capacidade e pelo preço. Aceitando, a renda entra no dia do evento.
- **Na tela:** tudo fica no painel do estádio da aba Finanças. O extrato ganhou as linhas de sócios, nome do estádio, eventos e obras.
- **Correção da 14a:** a premiação de título continental pagava como copa nacional (4% em vez de 12%), porque comparava o escopo "continental", que não existe (o certo é "confederacao").
- **Fica para depois:** arena nova (estádio novo com financiamento) e aluguel do estádio a outros clubes.

## Arena nova, aluguel e o dinheiro dos amistosos (etapa 14d, 27/11/2026)

- **Arena nova (painel do estádio):**
  - Capacidade de 30, 45, 60 ou 80 mil lugares. O lugar custa 1,6 vez o da ampliação. O prazo vai de 24 a 36 meses. Exemplo: Flamengo, 45 mil lugares por uns 370 milhões em 31 meses, ao lado do estádio velho.
  - **Ao lado** do estádio velho: 25% mais cara, mas o time segue jogando em casa.
  - **No lugar** do estádio velho: mais barata, mas até a entrega o time joga em estádio alugado, com renda 40% menor.
  - **Financiamento próprio:** até 80% do custo, a 0,6% ao mês, em 60 ou 120 meses. Entra como empréstimo de longo prazo, com parcelas, atrasos e quitação como os do banco. A entrada é de 20% do custo (menos, se quase tudo for financiado), e o resto sem financiamento vai em parcelas mensais da obra.
  - Na inauguração: capacidade nova, nome escolhido pelo técnico (ou "Arena" mais o nome do clube) e arena moderna, que enche 5 pontos a mais e aceita ingresso 15% mais caro. Um nome vendido a patrocinador continua valendo por cima.
- **Aluguel do estádio:** entre as propostas de eventos, um clube do mesmo país com estádio bem menor (menos da metade) pode querer mandar um jogo grande no estádio do técnico. Paga 20% de uma casa cheia. Durante a obra da arena no lugar não há eventos nem aluguel.
- **O dinheiro dos amistosos** (os amistosos já eram marcados pelo técnico desde a Fase 7):
  - **Cachê:** o clube bem maior (3 pontos de nível ou mais) cobra para jogar, de 0,1% a 0,6% da receita anual dele, conforme a diferença. O técnico recebe quando visita um clube menor e paga quando recebe um clube bem maior em casa; a bilheteria do jogo em casa continua dele. A tela de marcar amistoso mostra o cachê antes de confirmar, e a agenda mostra o de cada amistoso.
  - **Convites de excursão:** de vez em quando (30% por mês, até 2 abertos), um clube de outro país, de nível parecido, convida para um amistoso em campo neutro dali a 2 a 6 semanas, com cachê de 0,3% a 0,8% da receita anual. Aceitando pela aba Jogos, o jogo entra na agenda; sem bilheteria, só o cachê.
  - O extrato ganhou a linha "Cachês de amistosos".
- **Fase 14 concluída.** Salários e receitas reais, crise e banco, conversas e diretoria, estádio completo e amistosos. A perda de pontos da CPU fica para depois.

## Carreira do técnico: reputação, demissão e convites (etapa 15a, 27/11/2026)

- **Plano da Fase 15**, juntando o que estava planejado com os pedidos do dono:
  - 15a: reputação, demissão e convites de clubes, com a troca de clube no meio da carreira (esta etapa).
  - 15b: seleção, com convites para técnico de seleção, clube e seleção ao mesmo tempo, convocação escolhida à mão e os jogos da seleção.
  - 15c: rankings de técnicos e clubes, prêmios da temporada e notícias.
  - 15d: conversas ampliadas (aumento, posição em campo, vestiário, capitão) e imprensa.
- **Reputação de 0 a 100:**
  - Faixas: municipal (até 19), estadual (20), nacional (40), continental (60), mundial (80) e lenda (95).
  - Começa pelo tamanho do clube assumido: nível menos 25, entre 10 e 75.
  - Sobe com títulos (estadual 2, copa 5, liga 8, continental 12, mundial 15), meta cumprida (4) e vitória oficial (0,15).
  - Cai com meta perdida (3), derrota oficial (0,1), demissão (6) e o esquecimento: todo 1º de janeiro, 1 ponto acima de 30.
- **Demissão:**
  - Acontece com a confiança da diretoria abaixo de 10 (o ultimato abaixo de 25 já avisava) ou com 6 meses de salários atrasados.
  - O técnico recebe na hora de 2 a 4 convites de clubes menores, metade do próprio país quando dá, abaixo do nível do clube e do que a reputação alcança.
  - O tempo não anda até ele escolher um. Um período sem clube, esperando convites melhores, fica para depois: hoje todo o jogo gira em torno do clube do técnico.
- **Convites de quem vai bem:**
  - Todo dia 1, com a confiança em 70 ou mais: 12% de chance, ou 30% nos 60 dias depois de um título ou meta cumprida.
  - Vêm de clubes 2 pontos de nível acima ou mais, até o nível que a reputação alcança (45 mais metade da reputação), metade das vezes do próprio país. Valem por 14 dias, até 2 abertos.
  - Aceitar troca de clube na hora (com confirmação); recusar não custa nada.
- **Troca de clube no meio da carreira:**
  - O clube antigo vira da CPU. Os garotos que o técnico promoveu ficam lá, como garotos da CPU. O caixa, menos a dívida no banco, vira o caixa da CPU dele. Empréstimos e leilões seguem como da CPU, e quem saiu no fim do contrato vira transferência.
  - No clube novo, o técnico começa com o caixa do clube e zera diretoria, metas, estádio, finanças, conversas, promessas, vendas, propostas, contratos negociados e amistosos marcados.
  - Os garotos que a CPU já tinha subido da base no clube novo ficam (herdados).
  - A reputação e o histórico de passagens (jogos, vitórias, empates, derrotas, títulos e motivo da saída) acompanham o técnico.
- **Na tela:**
  - O painel no topo mostra os convites (aceitar ou recusar) e, na demissão, a escolha obrigatória.
  - A aba Início ganhou o quadro do técnico: reputação, faixa, até que nível chegam os convites e as passagens.
- **Teste numa carreira real:** Arsenal com a confiança forçada a 5. Veio a demissão e dois convites (Botev Vratsa e Sporting San Miguelito); o tempo ficou parado até a escolha. Depois veio a troca para o Botev e 90 dias de jogos sem erro, com o Arsenal seguindo na CPU com o elenco inteiro.

## Correções pedidas pelo dono: troca de funções e jogadores indisponíveis (27/11/2026)

- **Trocar dois jogadores de lugar:**
  - Soltar um jogador em cima de outro no campo troca os dois de vaga, e cada um assume a posição e a função da vaga do outro. Vale no pré-jogo, no amistoso e no meio da partida, sem gastar substituição.
  - Durante o arraste, o jogador que vai ser trocado ganha um anel tracejado amarelo. Soltar longe de todos continua só mudando o lugar.
- **Funções do meio central:** volante, meio-campista e meia agora se trocam entre si em qualquer vaga do meio central. Antes, quem estava na faixa do volante não podia virar meia, e quem estava na faixa do meia não podia virar volante. A CPU não muda: ela escolhe a melhor função da posição da vaga.
- **Lesionado, suspenso ou convocado escalado:**
  - O botão "Começar o jogo" fica bloqueado e um alerta lista quem não pode jogar, dizendo se está entre os titulares ou no banco.
  - O alerta tem um botão que coloca os melhores disponíveis no lugar deles.
  - A escalação automática da carreira também pula quem não pode jogar.
  - Antes, o jogo começava normalmente e o motor trocava esses jogadores sozinho na hora.
- **Lesão e expulsão no meio do jogo** (pedido feito durante esta correção):
  - Na partida ao vivo, o motor não troca mais sozinho o lesionado do time do técnico. O jogo para com um aviso.
  - O jogador continua em campo, no sacrifício, rendendo 60% (atributos e passada) e marcado com uma cruz vermelha no campo e na lista de trocas. Fica até o técnico substituí-lo ou decidir seguir com ele.
  - Na expulsão de um jogador do técnico, o jogo também para, para ele reorganizar a formação, as instruções ou as trocas.
  - "Pular para o fim" devolve a decisão ao motor: quem está machucado é trocado como antes. A simulação dos outros jogos e o time da CPU seguem como estavam.

## Correções pedidas pelo dono: campo, escalação automática, lesões e banco (27/11/2026)

- **Seleção do jogador sem o quadrado:**
  - Clicar num jogador desenhava o contorno quadrado do navegador, em branco e preto.
  - Agora só aparece o anel do jogo. O foco pelo teclado ganhou um anel azul próprio.
- **Meio-campo e ataque:**
  - A linha fixa dos 62 m deu lugar a uma faixa de transição de 58 a 80 m, que aparece mais clara no campo.
  - Dentro da faixa, o jogador mantém o setor de onde veio: o meia sobe até perto da área (que começa a 88,5 m) sem virar atacante, e o atacante recua até o meio sem virar meia.
  - Antes de 58 m é sempre meio-campo e depois de 80 m é sempre ataque. Formações prontas e salvas não mudam.
- **Escalação automática:**
  - Era gulosa, preenchendo vaga por vaga: o craque do meio podia acabar na lateral só porque rendia ali mais que o lateral.
  - Agora escolhe o conjunto que soma mais (atribuição ótima, pelo método húngaro). Quem joga fora do setor dele perde 10% nessa conta, e quem joga fora das posições em que atua de verdade perde mais 8%.
  - Vale para a CPU e para o botão do técnico. `ENGINE_VERSION` 0.40.0.
- **Lesões, cerca de 20% menos frequentes:**
  - No jogo, por minuto: 0,0001 → 0,00008. Por falta: 1% → 0,8%. No treino: 0,001 → 0,0008 por dia.
  - Medido em 400 jogos: 0,235 → 0,19 lesão por time por jogo.
- **Banco no campo:**
  - Os reservas aparecem numa faixa abaixo do campo, com a força e o nome.
  - Arrastar um jogador do campo para cima de um reserva, ou um reserva para cima de quem sai, faz a troca.
  - Vale no pré-jogo, no amistoso e no meio da partida. No meio da partida conta como substituição; sem trocas disponíveis, o banco fica apagado e explica o motivo.
- **Efeitos na CPU:**
  - A reorganização da CPU ao mudar de formação no meio do jogo usa a mesma atribuição ótima da escalação automática. Antes também era gulosa.
  - Com a escalação melhor, a CPU que vencia por um gol passou a segurar menos do que se não mexesse em nada.
  - Agora, na frente por um gol, ela cadencia o jogo a partir dos 75 minutos e só fecha a defesa (4-5-1) a partir dos 85, em vez de recuar no contra-ataque desde os 75.
  - O teste dessa reação passou de 250 para 750 jogos, porque com menos jogos a oscilação era maior que a margem.

## Técnico de seleção (etapa 15b, 28/11/2026)

- **Convites das seleções:**
  - Chegam no dia 1 de cada mês, para quem tem reputação de 50 ou mais e ainda não comanda uma seleção. A chance é de 6%, ou 18% nos 90 dias depois de um título ou de uma meta cumprida.
  - Vêm de seleções da força que a reputação alcança: a média dos 11 melhores da convocação fica de 12 pontos abaixo até 1 acima de "45 + metade da reputação". A seleção do país do clube tem mais chance.
  - Valem por 21 dias e aparecem no painel do topo e nas notícias.
- **Clube e seleção ao mesmo tempo:**
  - Aceitar não tira o técnico do clube. Ele continua com o clube e passa a comandar também a seleção.
  - Os jogos da seleção (oficiais e amistosos nas datas FIFA) entram na agenda e são jogados como os do clube: o pré-jogo tem a escalação própria da seleção (separada da do clube), o bloqueio de lesionados e a partida ao vivo.
  - A tática é a mesma do clube.
  - Um amistoso da seleção é marcado na véspera, então só aparece na agenda um dia antes.
  - Num torneio de junho e julho com a liga em andamento, os dois jogos do mesmo dia são jogados um depois do outro.
- **Convocação à mão:**
  - Na aba Seleções, o técnico escolhe de 20 a 26 jogadores do país, com pelo menos 2 goleiros, entre os 30 mais fortes de cada posição, em qualquer clube do mundo.
  - A lista vale em todo o jogo: nos jogos da seleção, na liberação dos convocados do clube e na convocação mostrada na aba.
  - "Voltar à automática" devolve a lista dos 26 melhores. Quem sai do país ou se aposenta cai da lista sozinho.
- **Confiança da federação:**
  - Começa em 60. Vitória oficial dá +6 e amistoso +3. Derrota oficial tira 9 e amistoso 4. Empate em amistoso dá +1.
  - Título dá +25 e reputação (+18 no mundial, +12 nos continentais).
  - Abaixo de 15, a federação demite o técnico da seleção, com −3 de reputação; o clube não muda. O técnico também pode deixar a seleção quando quiser.
  - A reputação ainda ganha 0,3 por vitória oficial e perde 0,2 por derrota.
- **Lesões na seleção:** quem é do clube do técnico e se machuca jogando pela seleção volta lesionado. O desgaste e os jogos pela seleção seguem a regra da etapa 11e.
- **Na tela:**
  - O botão "Jogo da seleção" aparece no dia do jogo.
  - A aba Seleções ganhou o quadro "Sua seleção": campanha, confiança, próximos jogos, convocação e os botões de escolher a lista, voltar à automática e deixar a seleção.
  - O quadro do técnico mostra a seleção atual e as anteriores.
  - Seleções aparecem com escudo nas cores do país nas listas de jogos, no calendário e na partida.
- **Teste numa carreira real:** Flamengo e Brasil. A convocação à mão bloqueou abaixo do mínimo e passou com 22. No amistoso Argentina x Brasil, o lesionado de um clube da CPU travou o início até a troca; depois veio a vitória por 2 a 1, lançada na campanha.
- **Para depois:** cartões e suspensões em jogos de seleção, o técnico só de seleção (sem clube) e o período sem emprego.

## Pedidos do dono em 28/11/2026: escalação mais limpa, avanço dia a dia, animações e sons

- **Correções feitas agora:**
  - **Banco que não abria:** clicar num reserva não fazia nada, porque o clique começava um arraste. Agora clicar e soltar abre o cartão do jogador; clicar e segurar arrasta.
  - **Elenco todo abaixo do campo no pré-jogo:**
    - Os reservas ficam na primeira fileira e quem fica fora da partida nas de baixo, até 12 por fileira.
    - Arrastar entre campo, banco e fora faz a troca, e um ponto laranja marca quem tem aviso (lesionado, suspenso, poupar).
    - A lista em tabelas continua disponível, recolhida em "Lista do elenco".
    - Na partida ao vivo, só o banco aparece, porque quem está fora não pode entrar.
  - **Cartão flutuante no lugar das listas:**
    - Clicar e soltar num jogador abre um cartão ao lado dele, com força, posições, fôlego, humor e aviso. Em campo, o cartão traz também a posição e a função, com a nota de cada uma.
    - A lista "Quem joga aqui" saiu, porque a troca agora é arrastando.
    - Esc ou o × fecha o cartão. Vale no pré-jogo, no amistoso e ao vivo.
- **Avanço dia a dia (feito agora, não estava previsto em fase nenhuma):**
  - "Ir até o próximo jogo" vira o calendário uma folha por dia, com as notícias chegando na hora num painel, em três velocidades.
  - "Parar aqui" interrompe o avanço na data para o técnico agir. Ele para sozinho no dia do jogo, numa decisão e quando chega algo que pede resposta (proposta, conversa, sondagem, convite).
  - "Pular tudo até o jogo" pede confirmação, avisando que as notícias e as respostas do caminho passam sem parar.
- **Para a Fase 16 (já prevista: revisão do visual e sons), juntando com o que estava planejado:**
  - **Transições e animações nos momentos importantes:** título (tela de campeão), jogo importante (final, decisão, clássico), troca entre o clube e a seleção, acesso e rebaixamento. A ideia é tirar o jogo do estático, como nos jogos grandes.
  - **Efeitos sonoros na partida:** apito de início, intervalo e fim, apito de cartão, comemoração e grito de gol, torcida reagindo ao perigo, como no Brasfoot. Com volume e opção de desligar.
  - A folha do calendário e a chegada das notícias já ganharam uma animação curta, que respeita a preferência do sistema por menos movimento. Ficam como base para a revisão visual.

## Banco de reservas por competição (pedido do dono, 28/11/2026)

- **O que mudou:** o banco era fixo em 9 em todo jogo. Agora cada competição tem o banco do regulamento dela, pesquisado para a temporada 2026/27.
- **Ligas e copas nacionais** (a regra do país vale para liga, copas e estaduais):

  | País           | Banco          | Fonte                                                               |
  | -------------- | -------------- | ------------------------------------------------------------------- |
  | Inglaterra     | 9              | Premier League                                                      |
  | Alemanha       | 9              | Bundesliga                                                          |
  | França         | 9 (Ligue 2: 7) | LFP: 20 na súmula da Ligue 1, 18 na Ligue 2                         |
  | Estados Unidos | 9              | MLS                                                                 |
  | Arábia Saudita | 9              | súmulas da Saudi Pro League                                         |
  | Espanha        | 12             | LaLiga                                                              |
  | Portugal       | 12             | Liga Portugal, de 9 para 12 a partir de 2026/27                     |
  | Holanda        | 12             | KNVB: 23 na súmula                                                  |
  | Brasil         | 12             | CBF                                                                 |
  | Argentina      | 12             | Liga Profesional: 11 titulares e 12 suplentes                       |
  | Itália         | 15             | Serie A: 15 linhas de reservas na súmula; Coppa e Supercoppa iguais |

- **Competições de clubes de confederação e mundiais:** 12 (Champions, Europa e Conference: 23 na súmula; Libertadores e Sul-Americana: 12 suplentes; Mundial de Clubes: 12). As outras confederações seguem o mesmo número.
- **Seleções:**
  - Fase final de torneio com listas de 26 (Copa do Mundo, Euro, Copa América, Copa Africana, Copa da Ásia, Copa Ouro): 15, todos os que não começam.
  - Eliminatórias, Nations League e repescagem: 12.
- **Amistosos:** 12. Não há regulamento, e nos amistosos de verdade o banco costuma ser cheio.
- **A conferir:** os países sem dado confirmado usam 9, o banco mais comum entre as grandes ligas. Entram aqui Turquia, México, Japão, Coreia e as divisões de baixo da Itália, entre outros. Quando um regulamento for confirmado, basta pôr o número na tabela de `reservas.ts` ou o campo `reservas` na competição (vale também no editor e nos patches).
- **No jogo:**
  - O banco do próximo jogo aparece na escalação ("banco de até 12 reservas: é a regra da LaLiga"), e a escalação automática enche até esse número.
  - O banco salvo pelo técnico é completado com os melhores disponíveis quando a competição permite mais.
  - A CPU também escala com o banco da competição.
  - O limite de 5 substituições, em até 3 paradas, não mudou.
- `ENGINE_VERSION` 0.42.0.

## Prêmios da temporada e rankings (etapa 15c, 28/11/2026)

- **Prêmios de cada liga principal** (as 207 ligas de 1ª divisão do mundo), quando a temporada do país termina:
  - **Bola de Ouro:** o craque da temporada, a maior nota.
  - **Bola de Prata:** a seleção da temporada num 4-3-3 (1 goleiro, 2 laterais, um de cada lado quando dá, 2 zagueiros, 3 do meio e 3 atacantes).
  - **Artilheiro** da liga, **revelação** (o melhor com até 21 anos) e **técnico da temporada**: quem terminou mais acima do que o elenco prometia (posição esperada pela força menos a posição final; o campeão ganha 3). O técnico humano premiado ganha 3 de reputação.
- **A nota da temporada:**
  - Força do jogador, mais gols e assistências nas competições do país (atacante 0,3 por gol e 0,15 por assistência, até 10; meio 0,35 e 0,25; defensor 0,5 e 0,3, até 6).
  - Campanha do clube: até 3,5 pela posição, mais 1 do campeão.
  - Goleiros e defensores (e um pouco o meio): gols sofridos do clube abaixo da média da liga, de −2 a +4.
  - Um sorteio de ±1,5 para a votação não ser sempre igual.
- **Só concorre quem jogou:** no clube do técnico, quem esteve em 40% dos jogos da liga (contando os jogos desde o último prêmio). Na CPU, os titulares pela força: 1 goleiro, 3 laterais, 3 zagueiros, 5 do meio e 4 atacantes de cada clube. O goleiro reserva não leva prêmio.
- **Melhor do mundo:** todo 1º de janeiro, entre os premiados das ligas no ano, pela nota, a força da liga (cada ponto acima de 70 vale 0,6), a Bola de Ouro (+2), títulos de clube no ano (Champions, Libertadores e Mundial +4; outras continentais +1,5) e da seleção (Copa do Mundo +6; Euro, Copa América e as outras +3). Sai a lista dos 10. O ano em que a carreira começou no meio fica sem prêmio, porque as ligas não foram jogadas inteiras.
- **Ranking de clubes:**
  - Pontos das últimas 5 temporadas, a mais recente com peso 1 e a mais antiga 0,2.
  - Liga: 12, 10, 8, 7, 6, 5, 4, 3, 2 e 1 do 1º ao 10º, vezes o peso da liga pela força (de 0,3 a 1,5; a Premier League perto do topo). País com Apertura e Clausura divide os pontos entre as duas.
  - Títulos (campeão e vice): Champions e Libertadores 20 e 10; outras continentais 12 e 6; Mundial de Clubes 15 e 7; Intercontinental 8 e 4; copa nacional 10 e 5; estadual 5; supercopas 3 a 4.
  - Os anos antes da carreira valem o estimado pelo nível do clube (0,6 por ponto acima de 50), até a temporada de verdade do país entrar.
- **Ranking de técnicos:**
  - Pela reputação (0 a 100), com as mesmas faixas do técnico humano.
  - Clube grande tem técnico consagrado: o da CPU parte do nível do clube menos 15 (até 82). Soma os títulos do clube na carreira (os mesmos pesos da reputação do humano), que se apagam 15% por ano, e 3 por técnico da temporada.
  - Os técnicos da CPU têm nome gerado pelo país do clube, o mesmo durante toda a carreira (o do banco, se o clube tiver).
- **Notícias:** Bola de Ouro, revelação e técnico da temporada das ligas do país do técnico. Para os jogadores do técnico: a Bola de Prata e o top 10 do mundo, e os premiados ganham 8 de moral. O melhor do mundo e a posição do técnico no ranking mundial (subiu ou caiu) saem no 1º de janeiro.
- `ENGINE_VERSION` 0.43.0 (a moral dos premiados e a reputação do técnico da temporada mudam a carreira).
- **Na tela:** aba Prêmios (tecla P), com o ranking mundial ou de um país, de técnicos ou de clubes (os 30 primeiros e a linha do técnico), os prêmios de cada liga das últimas 5 temporadas e o melhor do mundo de cada ano.

## Pedidos do dono em 28/11/2026 (madrugada)

- **Avanço do calendário mais lento:** cada dia fica na tela 5 segundos na velocidade lenta, 3 na normal e 1 na rápida (eram 0,9, 0,45 e 0,15). Uma barra abaixo da folha do calendário mostra o tempo do dia passando.
- **Avisos nas abas:** a aba responsável ganha uma bolinha com o número do que chegou desde a última visita ou espera uma ação. Abrir a aba, e sair dela, marca o que ela tinha como visto (a data fica na carreira).
  - Amarela (novidade): relatório novo do olheiro (Base), notícias do elenco (Plantel), pré-contrato assinado com um jogador do técnico (Mercado), convites de excursão (Jogos), eventos e oferta de nome do estádio (Finanças), prêmios das ligas do país e o melhor do mundo (Prêmios).
  - Vermelha (espera uma ação): propostas pelos jogadores (Mercado), escalado lesionado, suspenso ou convocado para o próximo jogo (Escalação), convocação da seleção fora das regras (Seleções) e salários atrasados (Finanças).
  - Conversas, sondagens e convites de emprego já aparecem acima das abas, em qualquer uma delas.
- **Banco e fora do jogo com posição e força:** a bolinha de quem está no banco ou fora do jogo mostra a melhor posição de campo dele (a sigla, como em campo) e a força num selo em cima, no lugar de só a força.
- **Lesionado sabe da condição dele** (correção): o jogador lesionado reclamava de não jogar como se estivesse bem.
  - Lesionado não conta jogo sem jogar: a conta zera na lesão e recomeça quando ele volta. Suspenso e convocado também não contam (a conta fica parada).
  - Não abre conversa pedindo para jogar nem reclamando de cansaço, e a conversa desse tipo aberta antes da lesão sai da lista.
  - A promessa de minutos e a de descanso esperam a volta dele: o jogo em que ele não podia jogar não conta.
  - Sem a conta de jogos parados, o lesionado também não fica de mau humor por falta de jogo.
  - `ENGINE_VERSION` 0.44.0.
