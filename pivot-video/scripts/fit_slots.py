"""Fit a narration take onto planned phrase slots without paying for transcription.

Speech is split at pauses chosen so each piece's length best matches its phrase's syllable count
(dynamic programming over detected pauses; Turkish syllables = vowels), each phrase is
placed at its slot start (sped up to at most 1.15x if it would run into the next slot), and the
caption file is rewritten with word timings spread over each phrase's real duration.

Usage: python3 -I scripts/fit_slots.py voice.mp3 slots.json spoken.txt out.wav captions.ts EXPORT_NAME
spoken.txt: the exact text sent to TTS, one phrase per sentence (. ? ! ends a phrase)
slots.json: [{"words": [{"t", "s", "e"}, ...]}, ...]  (as written by the phrase planner)
"""
import json
import re
import subprocess
import sys
import wave

import numpy as np

SR = 48000
MAX_TEMPO = 1.15
src, slots_path, spoken_path, out_wav, out_ts, export = sys.argv[1:7]
slots = json.load(open(slots_path))
N = len(slots)

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, dtype=np.float32).copy()
dur = len(audio) / SR

log = subprocess.run(["ffmpeg", "-v", "info", "-i", src, "-af", "silencedetect=n=-40dB:d=0.12", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
gaps = list(zip(starts, ends))
speech_on = ends[0] if gaps and starts[0] < 0.05 else 0.0
speech_off = starts[-1] if gaps and ends[-1] >= dur - 0.05 else dur
inner = [g for g in gaps if g[0] > speech_on + 0.05 and g[1] < speech_off - 0.05]
spoken = [x.strip() for x in re.split(r"(?<=[.?!])\s+", open(spoken_path).read().strip()) if x.strip()]
assert len(spoken) == N, (len(spoken), N)
syl = np.array([max(1, len(re.findall(r"[aeıioöuüAEIİOÖUÜ]", x))) for x in spoken], dtype=float)
G = len(inner)
# candidate cut points: index j means "cut at gap j"; piece k runs from cut k-1 end to cut k start
pos_start = [speech_on] + [g[1] for g in inner]
pos_end = [g[0] for g in inner] + [speech_off]
speech_total = sum(e - s for s, e in zip(pos_start, pos_end))
rate = speech_total / syl.sum()
INF = 1e18
# best[k][j]: phrases 0..k assigned, phrase k ends at boundary j (0..G, G = end of speech)
best = np.full((N, G + 1), INF)
back = np.zeros((N, G + 1), dtype=int)
for j in range(G + 1):
    d = pos_end[j] - speech_on
    best[0][j] = (d - syl[0] * rate) ** 2 / (syl[0] * rate)
for k in range(1, N):
    for j in range(k, G + 1):
        for i in range(k - 1, j):
            if best[k - 1][i] >= INF:
                continue
            d = pos_end[j] - pos_start[i + 1]
            c = best[k - 1][i] + (d - syl[k] * rate) ** 2 / (syl[k] * rate)
            if c < best[k][j]:
                best[k][j] = c
                back[k][j] = i
ends_idx = [G]
for k in range(N - 1, 0, -1):
    ends_idx.append(back[k][ends_idx[-1]])
ends_idx = ends_idx[::-1]
bounds = []
prev = -1
for j in ends_idx:
    bounds.append((pos_start[prev + 1], pos_end[j]))
    prev = j


def tempo(x, factor):
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-i", "-",
                        "-af", f"atempo={factor:.4f}", "-f", "f32le", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(r, dtype=np.float32)


total = int(SR * (slots[-1]["words"][-1]["e"] + 4))
mix = np.zeros(total, dtype=np.float32)
cursor = 0.0
captions = []
for k, ((s, e), slot) in enumerate(zip(bounds, slots)):
    pad = 0.05
    seg = audio[int(max(0, s - pad) * SR):int(min(dur, e + pad) * SR)].copy()
    f = int(0.012 * SR)
    seg[:f] *= np.linspace(0, 1, f)
    seg[-f:] *= np.linspace(1, 0, f)
    place = max(slot["words"][0]["s"] - pad, cursor)
    nxt = slots[k + 1]["words"][0]["s"] - pad if k + 1 < N else place + 99
    room = nxt - place - 0.05
    factor = 1.0
    if len(seg) / SR > room > 0:
        factor = min(MAX_TEMPO, (len(seg) / SR) / room)
        seg = tempo(seg, factor)
    i0 = int(place * SR)
    mix[i0:i0 + len(seg)] += seg[: max(0, total - i0)]
    cursor = place + len(seg) / SR
    # words spread by character length over the spoken part of the segment
    words = [w["t"] for w in slot["words"]]
    w0, w1 = place + pad, place + len(seg) / SR - pad
    weights = np.array([len(w) + 2 for w in words], dtype=float)
    edges = w0 + (w1 - w0) * np.concatenate([[0], np.cumsum(weights) / weights.sum()])
    captions.append({"words": [{"t": w, "s": round(float(edges[i]), 2), "e": round(float(edges[i + 1]) - 0.03, 2)} for i, w in enumerate(words)]})
    print(f"{k:2d} slot {slot['words'][0]['s']:6.2f} placed {place:6.2f}  len {len(seg) / SR:4.2f}  tempo {factor:.2f}  {' '.join(words)}")

peak = np.max(np.abs(mix)) or 1.0
mix = mix / peak * 0.95
with wave.open(out_wav, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
open(out_ts, "w").write(
    "// Phrase timings of the fitted narration (scripts/fit_slots.py).\n"
    f"export const {export}: {{ words: {{ t: string; s: number; e: number }}[] }}[] = {json.dumps(captions, ensure_ascii=False)};\n"
)
print("wrote", out_wav, out_ts)
