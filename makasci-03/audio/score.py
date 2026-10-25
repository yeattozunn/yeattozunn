# /// script
# dependencies = ["numpy", "soundfile"]
# ///
# Makasçı - episode bed: drone, wind, static, heartbeat + VO edit, from audio/edit.json. 1 beat = 1 s.
import json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf

F = Path(__file__).resolve().parent.parent
A = F / "audio"
cfg = json.loads((A / "edit.json").read_text())
SR = 48000
DUR = float(json.loads((F / "film.json").read_text())["duration"])
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(cfg.get("seed", 3))

def env(a, b, fi=1.0, fo=1.0):
    return np.clip((t - a) / max(fi, 1e-3), 0, 1) * np.clip((b - t) / max(fo, 1e-3), 0, 1)
def lpf(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x))
def bpf(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)); return np.fft.irfft(X, len(x))

L = np.zeros(N); R = np.zeros(N)
root = cfg.get("root", 36.7)
d = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.06 * t * (k + 1))) / (k + 1) for k, f in enumerate([root, root * 2, root * 2.12, root * 3]))
sw = 0.55 + 0.0 * t
for a, b in cfg.get("swells", []): sw += 0.35 * env(a, b, 2, 0.3)
for a, b in cfg.get("silences", []): sw *= 1 - 0.9 * env(a, b, 0.05, 0.6)
dr = d * sw * env(0, DUR - 0.3, 1.0, 0.3) * 0.22
L += dr; R += dr
wn = rng.standard_normal(N)
gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.037 * t + 1)
we = env(0, DUR - 0.2, 1.0, 0.3)
for a, b in cfg.get("windless", []): we *= 1 - env(a, b, 0.05, 0.4)
L += bpf(wn, 250, 1400) * gust * we * 0.08; R += bpf(np.roll(wn, 9000), 250, 1400) * gust * we * 0.08
st = bpf(rng.standard_normal(N), 1500, 5000) * (0.5 + 0.5 * (rng.random(N) > 0.3))
for a, b in cfg.get("static", []): L += st * env(a, b, 0.05, 0.4) * 0.035; R += st * env(a, b, 0.05, 0.4) * 0.035
for a, b in cfg.get("heart", []):
    tb = a
    while tb < b:
        for d2, g in ((0, 1), (0.16, 0.7)):
            i = int((tb + d2) * SR); n = int(0.18 * SR); tt = np.arange(n) / SR
            if i + n < N:
                x = np.sin(2 * np.pi * (55 - 20 * tt / 0.18) * tt) * np.exp(-tt * 22); L[i:i + n] += x * 0.5 * g; R[i:i + n] += x * 0.5 * g
        tb += 0.75
mus = np.stack([L, R], 1); mus /= max(1e-6, np.abs(mus).max()) / 0.7
sf.write(A / "music.wav", mus.astype(np.float32), SR)

def load(name):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(A / "vo" / name), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).astype(np.float64)
vo = np.zeros(N)
for c in cfg["clips"]:
    x = load(c["file"])
    if c.get("lpf"): x = lpf(x, c["lpf"])
    if c.get("echo"):
        w = np.zeros(len(x) + SR); w[:len(x)] += x
        for dly, g in ((0.09, 0.4), (0.17, 0.3), (0.29, 0.22), (0.45, 0.14)):
            i = int(dly * SR); w[i:i + len(x)] += x * g
        x = w / np.abs(w).max() * np.abs(x).max()
    i = int(c["at"] * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n] * c.get("gain", 1.0)
sf.write(A / "vo.wav", np.stack([vo, vo], 1).astype(np.float32), SR)
beats = [float(i) for i in range(int(DUR) + 1)]
(F / "beats.json").write_text(json.dumps({"bpm": 60, "period": 1.0, "offset": 0.0, "beats": beats, "downbeats": beats[::4], "sections": [], "energy": []}))
print("ok", DUR)
