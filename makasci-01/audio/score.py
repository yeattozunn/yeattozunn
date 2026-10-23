# /// script
# dependencies = ["numpy", "soundfile"]
# ///
# Makasçı - Gece 1: horror bed (drone, wind, train, heartbeat) + VO edit. 1 beat = 1 s, so u == seconds.
import json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf

F = Path(__file__).resolve().parent.parent
A = F / "audio"
SR, DUR = 48000, 46.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def env(a, b, fade_in=1.0, fade_out=1.0):
    e = np.clip((t - a) / max(fade_in, 1e-3), 0, 1) * np.clip((b - t) / max(fade_out, 1e-3), 0, 1)
    return e


def lpf(x, cutoff):  # fast FFT brickwall-ish lowpass
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x))

def bpf(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)); return np.fft.irfft(X, len(x))

L = np.zeros(N); R = np.zeros(N)
def add(x, g=1.0, pan=0.0):
    global L, R
    L += x * g * (1 - max(pan, 0)); R += x * g * (1 + min(pan, 0))

# drone: low D + minor second rub, slow beating, swells into the train and the father's line
d = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.07 * t * k)) / (k + 1) for k, f in enumerate([36.7, 73.4, 77.8, 110.0]))
swell = 0.55 + 0.25 * env(17, 46, 6, 0.1) + 0.3 * env(24, 32.2, 2, 0.3)
swell *= 1 - 0.85 * env(32.2, 36.4, 0.15, 0.6)          # drop out under "ben babanım"
swell *= np.where(t > 41.2, np.exp(-(t - 41.2) * 0.4), 1)
add(d * swell * env(0, 45.7, 2.0, 0.3), 0.22)

# wind: band-passed noise with slow gusts, wide
wn = rng.standard_normal(N)
gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.037 * t + 1)
wl = bpf(wn, 250, 1400) * gust; wr = bpf(np.roll(wn, 9000), 250, 1400) * gust
we = env(0, 45.8, 1.5, 0.3) * (1 - 0.6 * env(7.4, 21, 0.5, 0.5))
L += wl * we * 0.09; R += wr * we * 0.09

# radio static under the rules (7.4..21)
st = bpf(rng.standard_normal(N), 1500, 5000) * (0.5 + 0.5 * (rng.random(N) > 0.3))
add(st * env(7.4, 21.0, 0.05, 0.4) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t) ** 2), 0.035)

# train: distant whistle 21.3, rumble growing 21..28, rail clacks, brake squeal 26.2
def whistle(t0, dur, g):
    e = env(t0, t0 + dur, 0.25, 0.8)
    x = sum(np.sin(2 * np.pi * f * t * (1 - 0.01 * np.clip(t - t0, 0, dur))) for f in [370, 440, 554])
    return lpf(x * e, 2500) * g
add(whistle(21.3, 2.2, 0.05), 1, 0.2)
rum = lpf(rng.standard_normal(N), 120)
rum_e = np.clip((t - 21) / 5, 0, 1) ** 2 * np.where(t < 27, 1, np.exp(-(t - 27) * 0.8))
add(rum * rum_e, 1.6)
for k in range(14):  # clacks slow down as it brakes
    tc = 22.5 + 3.6 * (1 - np.exp(-k / 7)) * 1.6
    if tc > 27: break
    for d2 in (0, 0.11):
        i = int((tc + d2) * SR); n = int(0.06 * SR)
        if i + n < N:
            c = bpf(rng.standard_normal(n), 300, 3000) * np.exp(-np.arange(n) / (0.012 * SR))
            L[i:i + n] += c * 0.25 * min(1, (tc - 22) / 3); R[i:i + n] += c * 0.25 * min(1, (tc - 22) / 3)
sq = np.sin(2 * np.pi * (2900 + 200 * np.sin(2 * np.pi * 7 * t)) * t) * env(26.0, 27.6, 0.3, 0.6)
add(sq, 0.025, 0.3)

# heartbeat from the knock to the newspaper
for k in range(12):
    tb = 32.6 + k * 0.82
    if tb > 41: break
    for d2, g in ((0, 1), (0.16, 0.7)):
        i = int((tb + d2) * SR); n = int(0.18 * SR); tt = np.arange(n) / SR
        b = np.sin(2 * np.pi * (55 - 20 * tt / 0.18) * tt) * np.exp(-tt * 22)
        L[i:i + n] += b * 0.5 * g; R[i:i + n] += b * 0.5 * g

mus = np.stack([L, R], 1)
mus /= max(1e-6, np.abs(mus).max()) / 0.7
sf.write(A / "music.wav", mus.astype(np.float32), SR)

# ---------------------------------------------------------------- VO edit
def load(name):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(A / "vo" / name), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).astype(np.float64)
vo = np.zeros(N)
def place(x, at, g=1.0):
    i = int(at * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n] * g
VO_A, VO_BABA, VO_B = 0.4, 32.2, 37.0
place(load("anlatici_a.mp3"), VO_A)
baba = load("baba.mp3")
wet = np.zeros(len(baba) + SR * 2)       # simple multi-tap echo/reverb for the ghost voice
wet[:len(baba)] += baba
for dly, g in ((0.09, 0.45), (0.17, 0.33), (0.29, 0.25), (0.43, 0.17), (0.61, 0.11), (0.83, 0.07)):
    i = int(dly * SR); wet[i:i + len(baba)] += baba * g
wet = lpf(wet, 4200)
place(wet / np.abs(wet).max() * np.abs(baba).max(), VO_BABA, 1.0)
place(load("anlatici_b.mp3"), VO_B)
sf.write(A / "vo.wav", np.stack([vo, vo], 1).astype(np.float32), SR)

beats = [float(i) for i in range(int(DUR) + 1)]
(F / "beats.json").write_text(json.dumps({"bpm": 60, "period": 1.0, "offset": 0.0, "beats": beats,
    "downbeats": beats[::4], "sections": [], "energy": []}, indent=1))
print("ok", DUR)
