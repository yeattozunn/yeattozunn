# /// script
# dependencies = ["numpy", "soundfile"]
# ///
# Makasçı - Gece 2: horror bed (drone, wind, receding train, heartbeat) + VO edit. 1 beat = 1 s, so u == seconds.
import json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf

F = Path(__file__).resolve().parent.parent
A = F / "audio"
SR, DUR = 48000, 45.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)

def env(a, b, fade_in=1.0, fade_out=1.0):
    return np.clip((t - a) / max(fade_in, 1e-3), 0, 1) * np.clip((b - t) / max(fade_out, 1e-3), 0, 1)

def lpf(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x))

def bpf(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)); return np.fft.irfft(X, len(x))

L = np.zeros(N); R = np.zeros(N)
def add(x, g=1.0, pan=0.0):
    global L, R
    L += x * g * (1 - max(pan, 0)); R += x * g * (1 + min(pan, 0))

# drone, a half step lower than Gece 1; drops out under the mother's voice
d = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.06 * t * k)) / (k + 1) for k, f in enumerate([34.6, 69.3, 73.4, 103.8]))
swell = 0.55 + 0.3 * env(22.6, 31, 4, 0.3)
swell *= 1 - 0.8 * env(31.0, 36.8, 0.2, 0.6)
swell *= np.where(t > 41.0, np.exp(-(t - 41.0) * 0.4), 1)
add(d * swell * env(0, 44.7, 2.0, 0.3), 0.22)

# wind; quieter in the morning and inside the cabin
wn = rng.standard_normal(N)
gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.037 * t + 1)
wl = bpf(wn, 250, 1400) * gust; wr = bpf(np.roll(wn, 9000), 250, 1400) * gust
we = env(0, 44.8, 1.5, 0.3) * (1 - 0.6 * env(13.4, 22.6, 0.5, 0.5))
L += wl * we * 0.09; R += wr * we * 0.09

# radio static under the rule
st = bpf(rng.standard_normal(N), 1500, 5000) * (0.5 + 0.5 * (rng.random(N) > 0.3))
add(st * env(13.4, 22.6, 0.05, 0.4), 0.035)

# train backing away 3.4..7
rum = lpf(rng.standard_normal(N), 120)
add(rum * env(3.4, 7.2, 0.2, 2.5), 1.4)

# heartbeat from the knocks to the photo
for k in range(14):
    tb = 28.4 + k * 0.78
    if tb > 40.6: break
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
VO_A, VO_ANNE, VO_B = 0.4, 31.0, 37.2
place(load("anlatici_a.mp3"), VO_A)
anne = lpf(load("anne.mp3"), 2800)       # muffled: heard through the door
wet = np.zeros(len(anne) + SR * 2); wet[:len(anne)] += anne
for dly, g in ((0.07, 0.4), (0.15, 0.3), (0.26, 0.2), (0.41, 0.12)):
    i = int(dly * SR); wet[i:i + len(anne)] += anne * g
place(wet / np.abs(wet).max() * np.abs(anne).max() * 1.15, VO_ANNE)
place(load("anlatici_b.mp3"), VO_B)
sf.write(A / "vo.wav", np.stack([vo, vo], 1).astype(np.float32), SR)

beats = [float(i) for i in range(int(DUR) + 1)]
(F / "beats.json").write_text(json.dumps({"bpm": 60, "period": 1.0, "offset": 0.0, "beats": beats,
    "downbeats": beats[::4], "sections": [], "energy": []}, indent=1))
print("ok", DUR)
