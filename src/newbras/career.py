from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import List

from newbras.engine import League


@dataclass
class SeasonRecord:
    season: int
    champion: str
    points: int
    top_scorer: str
    top_scorer_goals: int


class CareerStore:
    def __init__(self, db_path: str = "newbras_career.db") -> None:
        self.db_path = Path(db_path)

    def init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS seasons (
                    season INTEGER PRIMARY KEY,
                    champion TEXT NOT NULL,
                    points INTEGER NOT NULL,
                    top_scorer TEXT NOT NULL,
                    top_scorer_goals INTEGER NOT NULL
                )
                """
            )
            conn.commit()

    def next_season_number(self) -> int:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute("SELECT COALESCE(MAX(season), 0) + 1 FROM seasons").fetchone()
            return int(row[0])

    def save_season(self, league: League) -> SeasonRecord:
        table = league.standings()
        scorers = league.top_scorers(top_n=1)
        if not table or not scorers:
            raise ValueError("Não é possível salvar temporada sem simulação")

        season_number = self.next_season_number()
        champion = table[0]
        top = scorers[0]

        record = SeasonRecord(
            season=season_number,
            champion=champion.name,
            points=champion.points,
            top_scorer=top.name,
            top_scorer_goals=top.goals,
        )

        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO seasons (season, champion, points, top_scorer, top_scorer_goals)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    record.season,
                    record.champion,
                    record.points,
                    record.top_scorer,
                    record.top_scorer_goals,
                ),
            )
            conn.commit()

        return record

    def history(self) -> List[SeasonRecord]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT season, champion, points, top_scorer, top_scorer_goals FROM seasons ORDER BY season"
            ).fetchall()

        return [SeasonRecord(*row) for row in rows]
