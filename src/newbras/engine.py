from __future__ import annotations

from dataclasses import dataclass, field
from random import Random
from typing import List

from newbras.domain import Player, Team


@dataclass
class MatchResult:
    round_no: int
    home: Team
    away: Team
    goals_home: int
    goals_away: int


@dataclass
class TransferMarket:
    rng: Random

    def try_window_moves(self, teams: List[Team], max_deals: int = 4) -> List[str]:
        logs: List[str] = []
        deals = 0
        for buyer in sorted(teams, key=lambda t: t.budget, reverse=True):
            if deals >= max_deals:
                break
            if buyer.budget < 3.0:
                continue

            sellers = [t for t in teams if t is not buyer and t.squad]
            if not sellers:
                continue

            seller = min(sellers, key=lambda t: t.budget)
            candidate = max(seller.squad, key=lambda p: p.rating)
            fee = round(candidate.value * 1.1, 2)
            if fee > buyer.budget:
                continue

            seller.squad.remove(candidate)
            buyer.squad.append(candidate)
            buyer.budget -= fee
            seller.budget += fee
            deals += 1
            logs.append(
                f"{buyer.name} contratou {candidate.name} ({candidate.rating}) de {seller.name} por {fee:.2f}M"
            )
        return logs


@dataclass
class League:
    name: str
    teams: List[Team]
    rng: Random = field(default_factory=lambda: Random(42))

    def _expected_goals(self, attack: float, defense: float, home_advantage: float = 0.0) -> float:
        base = 1.2
        return max(0.2, base + (attack - 50) * 0.022 - (defense - 50) * 0.016 + home_advantage)

    def _sample_goals(self, xg: float) -> int:
        buckets = 8
        prob = min(0.95, xg / buckets)
        goals = 0
        for _ in range(buckets):
            if self.rng.random() < prob:
                goals += 1
        return goals

    def _apply_result(self, home: Team, away: Team, g_home: int, g_away: int) -> None:
        home.gf += g_home
        home.ga += g_away
        away.gf += g_away
        away.ga += g_home

        if g_home > g_away:
            home.points += 3
            home.budget += 0.30
        elif g_away > g_home:
            away.points += 3
            away.budget += 0.30
        else:
            home.points += 1
            away.points += 1
            home.budget += 0.08
            away.budget += 0.08

    def _distribute_goals(self, team: Team, goals: int) -> None:
        attackers = [p for p in team.squad if p.position in {"ATA", "MEI"}]
        pool = attackers or team.squad
        for _ in range(goals):
            pool[self.rng.randrange(len(pool))].goals += 1

    def play_match(self, round_no: int, home: Team, away: Team) -> MatchResult:
        g_home = self._sample_goals(
            self._expected_goals(home.attack_strength(), away.defense_strength(), home_advantage=0.22)
        )
        g_away = self._sample_goals(self._expected_goals(away.attack_strength(), home.defense_strength()))

        self._apply_result(home, away, g_home, g_away)
        self._distribute_goals(home, g_home)
        self._distribute_goals(away, g_away)
        return MatchResult(round_no, home, away, g_home, g_away)

    def _schedule(self) -> List[List[tuple[Team, Team]]]:
        teams = self.teams[:]
        if len(teams) % 2 != 0:
            raise ValueError("Liga deve ter número par de times")

        rounds: List[List[tuple[Team, Team]]] = []
        arr = teams[:]
        for _ in range(len(arr) - 1):
            pairings: List[tuple[Team, Team]] = []
            for i in range(len(arr) // 2):
                pairings.append((arr[i], arr[-(i + 1)]))
            rounds.append(pairings)
            arr = [arr[0]] + [arr[-1]] + arr[1:-1]

        return rounds + [[(b, a) for (a, b) in pairings] for pairings in rounds]

    def play_season(self) -> tuple[List[MatchResult], List[str]]:
        for team in self.teams:
            team.reset_season_stats()

        all_results: List[MatchResult] = []
        transfer_logs: List[str] = []
        calendar = self._schedule()
        market = TransferMarket(self.rng)

        mid = len(calendar) // 2
        for idx, pairings in enumerate(calendar, start=1):
            for home, away in pairings:
                all_results.append(self.play_match(idx, home, away))
            if idx == mid:
                transfer_logs.extend(market.try_window_moves(self.teams))

        for team in self.teams:
            team.budget = round(team.budget - team.payroll * 0.2, 2)
            for player in team.squad:
                player.evolve(self.rng)

        return all_results, transfer_logs

    def standings(self) -> List[Team]:
        return sorted(self.teams, key=lambda t: (t.points, t.gd, t.gf, t.budget), reverse=True)

    def top_scorers(self, top_n: int = 5) -> List[Player]:
        players = [p for team in self.teams for p in team.squad]
        return sorted(players, key=lambda p: (p.goals, p.rating), reverse=True)[:top_n]
