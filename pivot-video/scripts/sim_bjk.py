"""Beşiktaş 2–2 Crystal Palace (UEL MD3, 22 Oct 2026): 50,000 Poisson sims from match xG.

xG differs by provider (BJK 0.67–0.73, Palace 0.40–0.46); the midpoints are used.
"""
import numpy as np

rng = np.random.default_rng(2210)
N = 50000
b = rng.poisson(0.70, N)
p = rng.poisson(0.43, N)
t = b + p
print(f"BJK win {(b > p).mean():.3f} draw {(b == p).mean():.3f} CPFC win {(p > b).mean():.3f}")
print(f"exact 2-2 {int(((b == 2) & (p == 2)).sum())} ({((b == 2) & (p == 2)).mean():.4f})")
print(f"4+ goals {int((t >= 4).sum())} ({(t >= 4).mean():.4f})  0-0 {((t == 0)).mean():.3f}  1-0 {((b == 1) & (p == 0)).mean():.3f}")
