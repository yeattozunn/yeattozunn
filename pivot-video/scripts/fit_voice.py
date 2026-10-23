"""Fit a new narration take onto the existing derby timeline, phrase by phrase.

Each caption phrase keeps its on-screen start time from scripts/derby_words.json (+ VO offset).
The new take is cut at its own phrase boundaries (from a Scribe word list) and every phrase is
placed at the old start. A phrase longer than its slot is sped up (atempo, max 1.18x); anything
still too long pushes the following phrases later rather than overlapping.

Usage: python3 -I scripts/fit_voice.py new.mp3 new_words.json out.wav
new_words.json: [[text, start, end], ...] for the new take. Phrases are matched by the
first spoken word of each old phrase (NEW_STARTS), searched in order.
"""
import json
import subprocess
import sys
import wave

import numpy as np

SR = 48000
OFF = 0.4
MAX_TEMPO = 1.18

src, new_words_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
old = json.load(open("scripts/derby_words.json"))
new = json.load(open(new_words_path))

# spoken first word of each old phrase, in order (old captions show digits, the take says words)
NEW_STARTS = ["pazartesi", "rams", "derbiyi", "sonuç", "galatasaray", "fenerbahçe", "ama", "rakamlara",
              "galatasaray", "fenerbahçe", "sadece", "okan", "fenerbahçe'de", "stoper", "osimhen'in",
              "fenerbahçe'nin", "kerem", "eski", "hocasından", "elli", "fenerbahçe", "galatasaray", "beraberlik",
              "en", "bir-bir", "peki", "maçta", "yüzde", "lider", "istatistik", "pazartesi"]
norm = lambda x: x.lower().strip(".,;:?!")

# old phrase boundaries: sentence-final punctuation
bounds = []
start = 0
for i, (t, _, _) in enumerate(old):
    if t[-1] in ".?:" and t != "50.000":
        bounds.append((start, i))
        start = i + 1
if start < len(old):
    bounds.append((start, len(old) - 1))
assert len(bounds) == len(NEW_STARTS), (len(bounds), len(NEW_STARTS))

nb = []
j = 0
for tok in NEW_STARTS:
    while norm(new[j][0]) != tok:
        j += 1
    nb.append(j)
    j += 1
new_bounds = [(nb[k], (nb[k + 1] - 1) if k + 1 < len(nb) else len(new) - 1) for k in range(len(nb))]

pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
    capture_output=True, check=True,
).stdout
audio = np.frombuffer(pcm, dtype=np.float32)


def tempo(x, factor):
    if abs(factor - 1) < 1e-3:
        return x
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-i", "-",
         "-af", f"atempo={factor:.4f}", "-f", "f32le", "-"],
        input=x.astype(np.float32).tobytes(), capture_output=True, check=True,
    ).stdout
    return np.frombuffer(r, dtype=np.float32)


total = int(SR * (old[-1][2] + OFF + 3))
mix = np.zeros(total, dtype=np.float32)
cursor = 0.0
for k, (a, b) in enumerate(bounds):
    pad = 0.06
    na, nb_ = new_bounds[k]
    s = max(0.0, new[na][1] - pad)
    e = new[nb_][2] + pad
    seg = audio[int(s * SR):int(e * SR)].copy()
    fade = int(0.012 * SR)
    seg[:fade] *= np.linspace(0, 1, fade)
    seg[-fade:] *= np.linspace(1, 0, fade)
    slot_start = old[a][1] + OFF - pad
    nxt = old[bounds[k + 1][0]][1] + OFF - pad if k + 1 < len(bounds) else slot_start + 99
    place = max(slot_start, cursor)
    room = nxt - place - 0.04
    dur = len(seg) / SR
    factor = 1.0
    if dur > room > 0:
        factor = min(MAX_TEMPO, dur / room)
        seg = tempo(seg, factor)
    i0 = int(place * SR)
    mix[i0:i0 + len(seg)] += seg[: max(0, total - i0)]
    cursor = place + len(seg) / SR
    print(f"{k:2d} {place:6.2f}s  len {len(seg) / SR:4.2f}s  tempo {factor:.2f}  {' '.join(w[0] for w in old[a:b + 1])}")

peak = np.max(np.abs(mix)) or 1.0
mix = mix / peak * 0.95
with wave.open(out, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("wrote", out, f"{len(mix) / SR:.2f}s")
