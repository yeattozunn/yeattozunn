"""Galatasaray – Fenerbahçe, Süper Lig week 9 (26 Oct 2026, RAMS Park): 50,000 Poisson simulations.

Team strengths come from this season's 8 league games (goals for/against), shrunk 50% toward the
league average because 8 games is a small sample, with a standard home/away factor.
"""
from collections import Counter

import numpy as np

LEAGUE = 1.40  # goals per team per match, Süper Lig typical
GS = dict(gf=17, ga=11, n=8)
FB = dict(gf=22, ga=6, n=8)
SHRINK = 0.5
HOME, AWAY = 1.12, 0.89


def strength(x):
    return 1 + SHRINK * (x / LEAGUE - 1)


gs_att, gs_def = strength(GS["gf"] / GS["n"]), strength(GS["ga"] / GS["n"])
fb_att, fb_def = strength(FB["gf"] / FB["n"]), strength(FB["ga"] / FB["n"])
lam_gs = LEAGUE * gs_att * fb_def * HOME
lam_fb = LEAGUE * fb_att * gs_def * AWAY

rng = np.random.default_rng(2610)
N = 50000
g = rng.poisson(lam_gs, N)
f = rng.poisson(lam_fb, N)
print(f"lambda GS {lam_gs:.2f}  FB {lam_fb:.2f}")
print(f"GS win {(g > f).mean():.3f}  draw {(g == f).mean():.3f}  FB win {(f > g).mean():.3f}")
print(f"BTTS {((g > 0) & (f > 0)).mean():.3f}  over2.5 {((g + f) > 2).mean():.3f}  over1.5 {((g + f) > 1).mean():.3f}")
print(f"GS scores {(g > 0).mean():.3f}  FB scores {(f > 0).mean():.3f}  GS or draw {(g >= f).mean():.3f}  FB or draw {(f >= g).mean():.3f}")
for (a, b), c in Counter(zip(g.tolist(), f.tolist())).most_common(6):
    print(f"  {a}-{b}: {c} ({c / N:.3f})")
