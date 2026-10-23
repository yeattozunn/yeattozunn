"""Synthesize the PİVOT reel score: tension drone, pulse, riser, impacts.

Cue times (seconds) mirror the scene timeline in src/timeline.ts.
Usage: python3 scripts/score.py public/score.wav [cues.json]
A cues file overrides DUR, CUTS, REVEAL, LOGO and TICKS (TICKS may be null).
"""
import json
import sys
import wave

import numpy as np

SR = 48000
DUR = 36.5
CUTS = [3.55, 8.1, 13.1, 20.75, 24.95, 28.55]
REVEAL = 10.33  # score 2–4 lands on "Lille iki"
TICKS = (20.75, 24.95)  # goal timeline playhead
LOGO = 33.98
if len(sys.argv) > 2:
    cues = json.load(open(sys.argv[2]))
    DUR, CUTS, REVEAL, LOGO, TICKS = cues["dur"], cues["cuts"], cues["reveal"], cues["logo"], cues.get("ticks")
HITS = cues.get("hits", []) if len(sys.argv) > 2 else []

N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def env(start, attack, decay):
    x = t - start
    e = np.where(x < 0, 0.0, np.where(x < attack, x / attack, np.exp(-np.maximum(x - attack, 0) / decay)))
    return e


def lowpass(x, cutoff):
    """One-pole lowpass; a cutoff array is applied in 256-sample blocks."""
    from scipy.signal import lfilter
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    y = np.empty_like(x)
    zi = np.zeros(1)
    for i in range(0, len(x), 256):
        a = np.exp(-2 * np.pi * c[i] / SR)
        y[i:i + 256], zi = lfilter([1 - a], [1, -a], x[i:i + 256], zi=zi)
    return y


def saw(f):
    ph = np.cumsum(np.ones(N) * f / SR) % 1.0
    return 2 * ph - 1


out = np.zeros(N)

# drone: D minor, detuned saws, slow filter breathing
drone = sum(saw(f * d) for f in (73.42, 110.0, 146.83) for d in (0.997, 1.003))
breath = 380 + 260 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 8.0))
drone = lowpass(drone / 6, breath)
fade = np.clip(t / 1.5, 0, 1) * np.clip((DUR - t) / 2.5, 0, 1)
# drop the drone out briefly before the reveal for contrast
duck = 1 - 0.85 * env(REVEAL - 1.2, 0.6, 0.5) * (t < REVEAL)
out += 0.22 * drone * fade * duck

# sub pulse on every beat (120 bpm) after the reveal, heartbeat-like before
beat = 0.5
for k in np.arange(0, DUR, beat):
    if k < 0.3 or k > DUR - 1.0:
        continue
    amp = 0.18 if k < REVEAL else 0.32
    e = env(k, 0.004, 0.11)
    out += amp * e * np.sin(2 * np.pi * (48 + 60 * np.exp(-(t - k).clip(0) * 30)) * (t - k).clip(0))

# hats: filtered noise ticks on off-beats after reveal
noise = rng.standard_normal(N)
hp = noise - lowpass(noise, 6000)
for k in np.arange(REVEAL + 0.25, DUR - 1.5, beat):
    out += 0.05 * env(k, 0.001, 0.025) * hp

# riser into the reveal
r0, r1 = REVEAL - 2.6, REVEAL
ramp = np.clip((t - r0) / (r1 - r0), 0, 1) * (t < r1)
riser = lowpass(noise, 300 + 9000 * ramp**2) * ramp**2
out += 0.35 * riser

# impacts at cuts and the reveal
def impact(at, big=False):
    global out
    e = env(at, 0.002, 0.45 if big else 0.22)
    sub = np.sin(2 * np.pi * (38 + 90 * np.exp(-(t - at).clip(0) * 18)) * (t - at).clip(0))
    crack = lowpass(noise, 2500) * env(at, 0.001, 0.05)
    out += (0.9 if big else 0.45) * e * sub + (0.5 if big else 0.25) * crack


for c in CUTS:
    impact(c)
impact(REVEAL, big=True)
for h in HITS:  # goal moments
    impact(h, big=True)
impact(LOGO, big=True)

# whoosh into each cut
for c in CUTS:
    w0 = c - 0.35
    ramp = np.clip((t - w0) / 0.35, 0, 1) * (t < c)
    out += 0.12 * lowpass(noise, 400 + 5000 * ramp) * ramp

# goal timeline clicks (one per goal marker)
for frac in (2, 7, 39, 44, 52, 61) if TICKS else ():
    at = TICKS[0] + 0.4 + 3.2 * frac / 90
    out += 0.25 * env(at, 0.001, 0.04) * np.sin(2 * np.pi * 1760 * t)

# tail
out *= np.clip((DUR - t) / 0.8, 0, 1)

# simple stereo widening + normalise to -1 dBFS peak
left = out + 0.02 * np.roll(hp, 300)
right = out + 0.02 * np.roll(hp, 900)
st = np.stack([left, right], axis=1)
st = np.tanh(st * 1.2)
st /= np.max(np.abs(st)) / 0.89
pcm = (st * 32767).astype(np.int16)

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1])
