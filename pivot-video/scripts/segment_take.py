"""Find sentence timings in a narration take from its pauses (no transcription) and write captions.

Usage: python3 -I scripts/segment_take.py take.wav spoken.txt display.txt out.ts EXPORT OFFSET
spoken.txt is the exact TTS text; display.txt has the same sentences one per line, as shown on screen.
"""
import json
import re
import subprocess
import sys

import numpy as np

src, spoken_p, disp_p, out_ts, export, OFF = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], float(sys.argv[6])
spoken = [x.strip() for x in re.split(r"(?<=[.?!])\s+", open(spoken_p).read().strip()) if x.strip()]
disp = [x.strip() for x in open(disp_p).read().splitlines() if x.strip()]
N = len(spoken)
assert len(disp) == N, (len(disp), N)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
log = subprocess.run(["ffmpeg", "-v", "info", "-i", src, "-af", "silencedetect=n=-40dB:d=0.1", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
on = en[0] if st and st[0] < 0.05 else 0.0
off = st[-1] if len(st) > len(en) or (en and en[-1] >= dur - 0.05) else dur
inner = [g for g in zip(st, en) if g[0] > on + 0.05 and g[1] < off - 0.05]
syl = np.array([max(1, len(re.findall(r"[aeıioöuüAEIİOÖUÜ]", x))) for x in spoken], float)
G = len(inner)
ps = [on] + [g[1] for g in inner]
pe = [g[0] for g in inner] + [off]
rate = sum(e - s for s, e in zip(ps, pe)) / syl.sum()
INF = 1e18
best = np.full((N, G + 1), INF)
back = np.zeros((N, G + 1), int)
for j in range(G + 1):
    best[0][j] = (pe[j] - on - syl[0] * rate) ** 2 / (syl[0] * rate)
for k in range(1, N):
    for j in range(k, G + 1):
        for i in range(k - 1, j):
            if best[k - 1][i] >= INF:
                continue
            c = best[k - 1][i] + (pe[j] - ps[i + 1] - syl[k] * rate) ** 2 / (syl[k] * rate)
            if c < best[k][j]:
                best[k][j] = c
                back[k][j] = i
idx = [G]
for k in range(N - 1, 0, -1):
    idx.append(back[k][idx[-1]])
idx = idx[::-1]
bounds = []
prev = -1
for j in idx:
    bounds.append((ps[prev + 1], pe[j]))
    prev = j
caps = []
for k, ((s, e), t) in enumerate(zip(bounds, disp)):
    s += OFF
    e += OFF
    ws = t.split()
    w = np.array([len(x) + 2 for x in ws], float)
    ed = s + (e - s) * np.concatenate([[0], np.cumsum(w) / w.sum()])
    caps.append({"words": [{"t": x, "s": round(float(ed[i]), 2), "e": round(float(ed[i + 1]) - 0.03, 2)} for i, x in enumerate(ws)]})
    print(f"{k:2d} {s:6.2f} {e:6.2f} {t}")
open(out_ts, "w").write(
    f"// Sentence timings found from pauses in the take (scripts/segment_take.py), +{OFF} s offset.\n"
    f"export const {export}: {{ words: {{ t: string; s: number; e: number }}[] }}[] = {json.dumps(caps, ensure_ascii=False)};\n"
)
print("take", round(dur, 2))
