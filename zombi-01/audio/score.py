# /// script
# dependencies = ["numpy", "soundfile"]
# ///
# Ya Olursa - Gün 1: tense pulse bed, crowd, running, heartbeat + VO edit. 1 beat = 1 s, so u == seconds.
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf

F = Path(__file__).resolve().parent.parent
A = F / "audio"
SR = 48000
VO_A, VO_TEYZE, VO_B = 0.4, 31.0, 37.4
DUR = float(json.loads((F / "film.json").read_text())["duration"])
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(5)

def env(a, b, fi=1.0, fo=1.0):
    return np.clip((t - a) / max(fi, 1e-3), 0, 1) * np.clip((b - t) / max(fo, 1e-3), 0, 1)
def lpf(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x))
def bpf(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)); return np.fft.irfft(X, len(x))

L = np.zeros(N); R = np.zeros(N)
def add(x, g=1.0):
    global L, R
    L += x * g; R += x * g

# low drone + a detuned pad; swells under the run and the knocks
d = sum(np.sin(2 * np.pi * f * t + 0.4 * np.sin(2 * np.pi * 0.05 * t * (k + 1))) / (k + 1) for k, f in enumerate([41.2, 82.4, 87.3, 123.5]))
sw = 0.5 + 0.35 * env(7.0, 13.7, 0.3, 1.0) + 0.3 * env(27, 31, 1.5, 0.3)
sw *= 1 - 0.75 * env(31.0, 36.9, 0.2, 0.5)
add(d * sw * env(0, DUR - 0.3, 1.5, 0.3), 0.2)

# pulsing ticks while running (8.4..13.7), 150 bpm
for k in range(40):
    tk = 8.4 + k * 0.4
    if tk > 13.6: break
    i = int(tk * SR); n = int(0.08 * SR); tt = np.arange(n) / SR
    b = np.sin(2 * np.pi * 60 * tt) * np.exp(-tt * 30)
    L[i:i + n] += b * 0.6; R[i:i + n] += b * 0.6

# crowd murmur at the market, screams after the bite
mur = bpf(rng.standard_normal(N), 300, 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
add(mur * env(0, 8.6, 0.8, 0.3), 0.05)
scr = bpf(rng.standard_normal(N), 900, 3200) * (np.sin(2 * np.pi * 6 * t) ** 2)
add(scr * env(7.0, 13.0, 0.1, 1.5), 0.06)

# heartbeat from the knocks to the end card
for k in range(20):
    tb = 29.9 + k * 0.62
    if tb > VO_B + 3.3: break
    for d2, g in ((0, 1), (0.15, 0.7)):
        i = int((tb + d2) * SR); n = int(0.18 * SR); tt = np.arange(n) / SR
        b = np.sin(2 * np.pi * (55 - 20 * tt / 0.18) * tt) * np.exp(-tt * 22)
        L[i:i + n] += b * 0.5 * g; R[i:i + n] += b * 0.5 * g

mus = np.stack([L, R], 1); mus /= max(1e-6, np.abs(mus).max()) / 0.7
sf.write(A / "music.wav", mus.astype(np.float32), SR)

def load(name):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(A / "vo" / name), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).astype(np.float64)
vo = np.zeros(N)
def place(x, at):
    i = int(at * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n]
place(load("anlatici_a.mp3"), VO_A)
ty = lpf(load("teyze.mp3"), 3000)        # through the door
place(ty, VO_TEYZE)
if (A / "vo" / "anlatici_b.mp3").exists(): place(load("anlatici_b.mp3"), VO_B)
else: print("no anlatici_b yet", file=sys.stderr)
sf.write(A / "vo.wav", np.stack([vo, vo], 1).astype(np.float32), SR)
beats = [float(i) for i in range(int(DUR) + 1)]
(F / "beats.json").write_text(json.dumps({"bpm": 60, "period": 1.0, "offset": 0.0, "beats": beats, "downbeats": beats[::4], "sections": [], "energy": []}))
print("ok", DUR)
