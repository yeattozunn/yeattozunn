"""Week 10 Poisson sims from season goals per game (ESPN standings after week 9), 50,000 runs each."""
import json
import numpy as np

T = {"GS": (19, 12, 22), "AMED": (20, 10, 20), "TS": (22, 8, 19), "BJK": (18, 10, 18), "FB": (23, 8, 16),
     "KONYA": (6, 9, 8), "GOZ": (19, 16, 12), "EYUP": (2, 23, 3), "ANTEP": (9, 15, 8), "KASIM": (13, 9, 16)}
GP, HOME = 9, 1.12
lg = sum(v[0] for v in T.values()) / (len(T) * GP)  # rough league average
lg = 15.2 / 9  # whole-league goals per team per game (275 goals / 18 teams / 9)
att = {k: v[0] / GP / lg for k, v in T.items()}
dfn = {k: v[1] / GP / lg for k, v in T.items()}
rng = np.random.default_rng(10)
N = 50_000
out = {}
games = [("KONYA", "GS"), ("FB", "GOZ"), ("AMED", "EYUP"), ("TS", "ANTEP"), ("KASIM", "BJK")]
res = {}
for h, a in games:
    lh = lg * att[h] * dfn[a] * HOME
    la = lg * att[a] * dfn[h] / HOME
    gh, ga = rng.poisson(lh, N), rng.poisson(la, N)
    res[(h, a)] = (gh, ga)
    out[f"{h}-{a}"] = {"home": round(float((gh > ga).mean()), 3), "draw": round(float((gh == ga).mean()), 3), "away": round(float((gh < ga).mean()), 3), "xh": round(lh, 2), "xa": round(la, 2)}
# leader after the week (same random draws, tie-break on points only)
pts = {k: np.full(N, T[k][2]) for k in T}
for (h, a), (gh, ga) in res.items():
    pts[h] = pts[h] + 3 * (gh > ga) + (gh == ga)
    pts[a] = pts[a] + 3 * (ga > gh) + (gh == ga)
top = ["GS", "AMED", "TS", "BJK", "FB"]
P = np.stack([pts[k] for k in top])
out["gs_alone_top"] = round(float((P[0] > P[1:].max(0)).mean()), 3)
out["gs_caught"] = round(float((P[0] <= P[1:].max(0)).mean()), 3)
print(json.dumps(out, indent=1))
