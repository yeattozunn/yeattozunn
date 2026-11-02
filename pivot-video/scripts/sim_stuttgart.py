"""GS – Stuttgart (UCL MD4, 3 Nov 2026): 50,000 Poisson runs from league-phase goals per game (ESPN, 3 games each)."""
from collections import Counter
import numpy as np

AVG = 1.5  # goals per team per game, UCL league phase (approx.)
gs_f, gs_a, vfb_f, vfb_a = 6 / 3, 9 / 3, 7 / 3, 2 / 3
# shrink 3-game samples halfway toward the average
sh = lambda x: (x + AVG) / 2
lh = sh(gs_f) * sh(vfb_a) / AVG * 1.12
la = sh(vfb_f) * sh(gs_a) / AVG / 1.12
r = np.random.default_rng(3)
h, a = r.poisson(lh, 50_000), r.poisson(la, 50_000)
print("xg", round(lh, 2), round(la, 2))
print("gs", (h > a).mean(), "draw", (h == a).mean(), "vfb", (h < a).mean())
print("btts", ((h > 0) & (a > 0)).mean(), "over2.5", ((h + a) > 2).mean())
print([(k, round(v / 50_000, 3)) for k, v in Counter(zip(h.tolist(), a.tolist())).most_common(3)])
