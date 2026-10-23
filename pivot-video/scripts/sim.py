"""50,000 Poisson simulations of Lille–Galatasaray from the match xG (1.88 – 1.64)."""
from collections import Counter

import numpy as np

rng = np.random.default_rng(2026)
N = 50000
lille = rng.poisson(1.88, N)
gs = rng.poisson(1.64, N)
print("GS win", (gs > lille).mean(), "draw", (gs == lille).mean(), "Lille win", (lille > gs).mean())
print("exact 2-4", int(((lille == 2) & (gs == 4)).sum()))
print(Counter(zip(lille.tolist(), gs.tolist())).most_common(6))
