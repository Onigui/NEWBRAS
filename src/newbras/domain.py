from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import List


@dataclass
class Player:
    name: str
    position: str
    rating: int
    potential: int
    value: float
    wage: float
    goals: int = 0

    def evolve(self, rng: Random) -> None:
        if self.rating >= self.potential:
            return
        self.rating = min(self.potential, self.rating + (1 if rng.random() < 0.55 else 0))


@dataclass
class Team:
    name: str
    budget: float
    squad: List[Player]
    points: int = 0
    gf: int = 0
    ga: int = 0

    @property
    def gd(self) -> int:
        return self.gf - self.ga

    @property
    def payroll(self) -> float:
        return sum(player.wage for player in self.squad)

    def reset_season_stats(self) -> None:
        self.points = 0
        self.gf = 0
        self.ga = 0
        for player in self.squad:
            player.goals = 0

    def attack_strength(self) -> float:
        attackers = [p.rating for p in self.squad if p.position in {"ATA", "MEI"}]
        if not attackers:
            return 45.0
        return sum(attackers[:6]) / min(len(attackers), 6)

    def defense_strength(self) -> float:
        defenders = [p.rating for p in self.squad if p.position in {"ZAG", "LAT", "GOL"}]
        if not defenders:
            return 45.0
        return sum(defenders[:6]) / min(len(defenders), 6)
