# Calibração do motor de partida

Gerado por `pnpm calibrar` (motor 0.9.0, 10.000 jogos, 237 s). Metade dos jogos é entre times de força igual (sorteada de 55 a 82); a outra metade tem um favorito com 10 de força a mais, metade das vezes em casa. Os times usam atributos gerados pela força, como os do banco.

| Medida                        | Motor | Meta          | Situação |
| ----------------------------- | ----- | ------------- | -------- |
| Gols por jogo                 | 2.54  | 2.4 a 2.85    | dentro   |
| Vitórias do mandante          | 45.4% | 41.0% a 50.0% | dentro   |
| Empates                       | 29.4% | 23.0% a 31.0% | dentro   |
| Vitórias do visitante         | 25.3% | 23.0% a 33.0% | dentro   |
| Jogos 0 x 0                   | 6.7%  | 5.0% a 11.0%  | dentro   |
| Chutes por time               | 15.18 | 10 a 16       | dentro   |
| Chutes no gol por time        | 4.76  | 3.8 a 5.8     | dentro   |
| Escanteios por jogo           | 10.23 | 7.5 a 11.5    | dentro   |
| Faltas por jogo               | 19.76 | 19 a 29       | dentro   |
| Amarelos por jogo             | 2.95  | 2.8 a 5.5     | dentro   |
| Vermelhos por jogo            | 0.15  | 0.08 a 0.3    | dentro   |
| Pênaltis por jogo             | 0.36  | 0.18 a 0.4    | dentro   |
| Impedimentos por jogo         | 4.28  | 2.8 a 5.5     | dentro   |
| Gols de atacantes             | 77.2% | 50.0% a 78.0% | dentro   |
| Jogos com hat-trick           | 3.1%  | 0.0% a 3.5%   | dentro   |
| Favorito (+10 de força) vence | 71.0% | 55.0% a 72.0% | dentro   |

Todas as medidas dentro das metas.

As metas vêm de médias de primeiras divisões (Brasileirão e grandes ligas europeias) e ficam em `packages/engine/src/partida/calibracao.ts`.
