# /// script
# dependencies = ["numpy"]
# ///
# Place each take so its speech onset lands on a beat; write vo.wav, words + 100 Hz mouth envelope.
import json, subprocess, wave, pathlib
import numpy as np
here = pathlib.Path(__file__).parent
B = json.load(open(here.parent / "beats.json")); P, O = B["period"], B["offset"]
SR = 44100
PLACE = [0, 6, 11, 15, 21, 27.5]            # beat where each sentence's speech starts
def load(i):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(here / f"vo/take{i}.mp3"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)
total = int(24.0 * SR); vo = np.zeros(total, np.float32); words = []
for i, beat in enumerate(PLACE):
    x = load(i); a = json.load(open(here / f"vo/take{i}.json"))["alignment"]
    win = int(0.01 * SR); env = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))
    onset = int(np.argmax(env > 10 ** (-35 / 20)))          # first sound above -35 dB
    start = int((O + beat * P) * SR) - onset
    seg = x[max(0, -start):]; s0 = max(0, start)
    n = min(len(seg), total - s0); vo[s0:s0 + n] = seg[:n]
    ch, st, en = a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]
    w, ws, we = "", None, None
    for c, s, e in zip(ch, st, en):
        if c == " ":
            if w: words.append({"w": w, "t0": ws + start / SR, "t1": we + start / SR, "line": i}); w = ""
            continue
        if not w: ws = s
        w += c; we = e
    if w: words.append({"w": w, "t0": ws + start / SR, "t1": we + start / SR, "line": i})
    print(i, "onset", round((O + beat * P), 2), "end", round(start / SR + len(x) / SR, 2))
vo = (vo / max(1e-6, np.abs(vo).max()) * 0.9).astype(np.float32)
with wave.open(str(here / "vo.wav"), "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((vo * 32767).astype(np.int16).tobytes())
hop = SR // 100; env100 = np.sqrt(np.add.reduceat(vo[:len(vo) // hop * hop] ** 2, np.arange(0, len(vo) // hop * hop, hop)) / hop)
env100 = np.clip(env100 / (np.percentile(env100, 95) + 1e-6), 0, 1)
json.dump({"words": words, "env": [round(float(v), 3) for v in env100]}, open(here.parent / "voice.json", "w"))
print(len(words), "words")
