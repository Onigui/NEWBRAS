"""Compat layer.

Mantém imports antigos funcionando enquanto o código é modularizado.
"""

from __future__ import annotations

import pathlib
import sys

if __package__ in {None, ""}:
    # Suporte a execução direta: `python3 src/newbras/simulate.py`
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from newbras.demo import build_demo_league, run_demo
from newbras.domain import Player, Team
from newbras.engine import League, MatchResult, TransferMarket

__all__ = [
    "Player",
    "Team",
    "MatchResult",
    "TransferMarket",
    "League",
    "build_demo_league",
    "run_demo",
]


if __name__ == "__main__":
    run_demo()
