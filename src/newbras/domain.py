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
    age: int = 20
    goals: int = 0
    created_by_user: bool = False

    def evolve(self, rng: Random) -> None:
        """Evolução com curva de idade: sobe jovem, estabiliza no auge e cai com idade."""
        if self.age <= 23:
            if self.rating < self.potential and rng.random() < 0.65:
                self.rating += 1
        elif self.age <= 29:
            if self.rating < self.potential and rng.random() < 0.35:
                self.rating += 1
        elif self.age <= 33:
            if rng.random() < 0.30:
                self.rating = max(40, self.rating - 1)
        else:
            if rng.random() < 0.55:
                self.rating = max(35, self.rating - 1)

        self.age += 1


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

    def add_custom_player(
        self,
        name: str,
        position: str,
        rating: int,
        potential: int,
        age: int,
        value: float,
        wage: float,
    ) -> Player:
        player = Player(
            name=name,
            position=position,
            rating=rating,
            potential=potential,
            value=value,
            wage=wage,
            age=age,
            created_by_user=True,
        )
        self.squad.append(player)
        return player

    def _create_youth_player(self, rng: Random, slot: int) -> Player:
        positions = ["GOL", "ZAG", "LAT", "MEI", "ATA"]
        pos = positions[slot % len(positions)]
        base = 52 + int(rng.random() * 8)
        return Player(
            name=f"{self.name[:3].upper()} Base {slot}",
            position=pos,
            rating=base,
            potential=base + 10,
            value=1.2,
            wage=0.08,
            age=17,
        )

    def refresh_squad(self, rng: Random, min_size: int = 8, retirement_age: int = 37) -> int:
        """Aposenta veteranos e sobe jogadores da base para manter elenco mínimo."""
        before = len(self.squad)
        self.squad = [p for p in self.squad if p.age < retirement_age]
        retired = before - len(self.squad)

        slot = 1
        while len(self.squad) < min_size:
            self.squad.append(self._create_youth_player(rng, slot))
            slot += 1

        return retired

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
