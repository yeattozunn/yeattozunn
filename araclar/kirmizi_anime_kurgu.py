"""Frame-level editor for the samurai red anime edit, rebuilding the transitions of the "Bandit" reference."""
import subprocess, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

FPS = 20
W, H = 960, 540
RED = np.array([200, 0, 0], np.float32)
DARK = np.array([17, 17, 17], np.float32)
END = 13.35
OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/user/yeattozunn/samuray_kirmizi_anime_v3.mp4"

SRC = {
    "hilt": "samr2/out/01_hilt.mp4", "eye": "samr2/out/02_eye.mp4", "brim": "samr2/out/03_brim.mp4",
    "legs": "samr2/out/04_legs.mp4", "horse": "samr2/out/05_horse.mp4", "torii": "samr2/out/06_torii.mp4",
    "kamon": "samr2/out/07_kamon.mp4", "bounty": "samr2/out/08_bounty.mp4", "stars": "samr2/out/09_stars.mp4",
    "edge": "samr2/out/10_edge.mp4", "slash": "samr2/out/11_slash.mp4", "oni": "samr2/out/12_oni.mp4",
    "moon": "samr/out/4_moon.mp4",
}


def load(path, vertical_crop=False):
    vf = f"fps={FPS},"
    vf += "crop=480:270:0:95," if vertical_crop else ""
    vf += f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)


CLIPS = {k: load(v, k == "moon") for k, v in SRC.items()}


def frame(clip, t):
    f = CLIPS[clip]
    return f[min(len(f) - 1, max(0, int(round(t * FPS))))].copy()


# ---------- effects ----------
def lum(img):
    return img @ np.array([0.299, 0.587, 0.114], np.float32)


def thr(img, cut=70, white_bg=False):
    m = (lum(img) > cut)[..., None]
    if white_bg:
        return np.where(m, 255.0, 0.0) * np.ones(3, np.float32)
    return np.where(m, RED, DARK)


def neg(img, cut=35):
    m = (lum(img) > cut)[..., None]
    return np.where(m, 0.0, 255.0) * np.ones(3, np.float32)


def duo(img, col=(150, 40, 25), keep_white=False):
    l = lum(img)[..., None] / 255
    out = DARK + (np.array(col, np.float32) - DARK) * l ** 1.3
    if keep_white:
        out = np.where(l > 0.85, img, out)
    return out


def duo_lv(img, col=(210, 10, 5)):
    l = lum(img)
    lo, hi = np.percentile(l, 5), np.percentile(l, 95)
    l = np.clip((l - lo) / (hi - lo + 1e-6), 0, 1)[..., None]
    return DARK + (np.array(col, np.float32) - DARK) * l ** 0.6


def moonize(img):
    return np.where(lum(img)[..., None] > 180, img, img * 0.3)


def desat(img, b=0.0):
    g = lum(img)[..., None] * np.ones(3, np.float32)
    return np.clip(g + b * 255, 0, 255)


def blur(img, r):
    return np.asarray(Image.fromarray(img.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32)


def bloom(img, k=0.6):
    return np.clip(img * 1.25 + blur(img, 18) * k, 0, 255)


def hblur(img, size=80):
    c = np.cumsum(np.pad(img, ((0, 0), (size, size), (0, 0)), mode="edge"), axis=1)
    return (c[:, 2 * size:] - c[:, :-2 * size])[:, :W] / (2 * size)


def zoom(img, z, cx=0.5, cy=0.5, dx=0, dy=0, angle=0.0, bg=DARK, scene=False):
    im = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    if angle:
        im = im.rotate(angle, resample=Image.BILINEAR, fillcolor=tuple(int(v) for v in bg))
    if z >= 1:
        cw, ch = W / z, H / z
        x0 = min(max(cx * W - cw / 2 + dx, 0), W - cw)
        y0 = min(max(cy * H - ch / 2 + dy, 0), H - ch)
        im = im.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.BILINEAR)
        return np.asarray(im, np.float32)
    small = im.resize((int(W * z), int(H * z)), Image.BILINEAR)
    if scene:
        # extend the scene: red sky on top, dark ground below, figure sits lower (horizon rises)
        arr = np.zeros((H, W, 3), np.uint8); arr[:int(H * 0.55)] = RED.astype(np.uint8); arr[int(H * 0.55):] = DARK.astype(np.uint8)
        canvas = Image.fromarray(arr)
        mask = Image.fromarray((lum(np.asarray(small, np.float32)) < 35).astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(1))
        canvas.paste(small, ((W - small.width) // 2 + int(dx), (H - small.height) // 2 + int(H * 0.1) + int(dy)), mask)
        return np.asarray(canvas, np.float32)
    canvas = im.filter(ImageFilter.GaussianBlur(30)).point(lambda v: int(v * 0.55))
    canvas.paste(small, ((W - small.width) // 2 + int(dx), (H - small.height) // 2 + int(dy)))
    return np.asarray(canvas, np.float32)


def radial(img, n=16, step=0.015):
    acc = img.copy()
    for k in range(1, n):
        acc += zoom(img, 1 + k * step)
    return acc / n


def slice_glitch(img, seed):
    rng = random.Random(seed)
    out = img.copy()
    y = 0
    while y < H:
        h = rng.randint(8, 40)
        s = rng.randint(-60, 60)
        out[y:y + h] = np.roll(img[y:y + h], s, axis=1)
        y += h
    out[..., 0] = np.roll(out[..., 0], 6, axis=1)
    return out


def fire(img, k):
    l = lum(img)[..., None] / 255
    k = k * np.clip((lum(img)[..., None] - 70) / 80, 0, 1)
    hot = img * (1 - k) + np.clip(np.concatenate([255 * np.ones_like(l), 90 * l + 40 * k, 0 * l], 2), 0, 255) * k
    return np.clip(hot + blur(hot, 20) * 0.5 * k, 0, 255)


def birds(img, t, t0, t1, seed, n=3, dark=True):
    if not (t0 <= t <= t1):
        return img
    rng = random.Random(seed)
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    p = (t - t0) / max(1e-6, t1 - t0)
    for i in range(n):
        size = rng.uniform(90, 200)
        y = rng.uniform(0.3, 0.95) * H
        speed = rng.uniform(1.2, 2.0)
        x = -150 + p * speed * (W + 300) + rng.uniform(-200, 200)
        flap = math.sin((t * 18 + i) * 1.0)
        wing = size * (0.35 + 0.35 * flap)
        # curved wings: two arcs + small body
        lift = size * 0.45 * flap
        pts = [(x - size, y - lift), (x - size * 0.45, y - lift * 0.3 - size * 0.08), (x - size * 0.08, y), (x, y - size * 0.06),
               (x + size * 0.08, y), (x + size * 0.45, y - lift * 0.3 - size * 0.08), (x + size, y - lift),
               (x + size * 0.4, y + size * 0.10), (x, y + size * 0.16), (x - size * 0.4, y + size * 0.10)]
        d.polygon(pts, fill=255)
    a = np.asarray(layer.filter(ImageFilter.GaussianBlur(5)), np.float32)[..., None] / 255 * 0.95
    col = DARK if dark else np.array([60, 0, 0], np.float32)
    return img * (1 - a) + col * a


def flare(img, x, y, size, strength, color=(255, 255, 255), vert=0.6):
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    d.ellipse((x - size, y - size * 0.06, x + size, y + size * 0.06), fill=255)
    d.ellipse((x - size * 0.06, y - size * vert, x + size * 0.06, y + size * vert), fill=255)
    d.ellipse((x - size * 0.12, y - size * 0.12, x + size * 0.12, y + size * 0.12), fill=255)
    a = np.asarray(layer.filter(ImageFilter.GaussianBlur(4)), np.float32)[..., None] / 255
    glow = np.asarray(layer.filter(ImageFilter.GaussianBlur(25)), np.float32)[..., None] / 255
    a = np.clip(a + glow * 0.8, 0, 1) * strength
    return np.clip(img + np.array(color, np.float32) * a, 0, 255)


def smoke(img, p, seed=3):
    rng = np.random.default_rng(seed)
    noise = rng.random((H // 90 + 2, W // 90 + 2)).astype(np.float32)
    n = Image.fromarray((noise * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(40))
    n = np.asarray(n, np.float32) / 255
    a = np.clip((n * 1.2 + np.linspace(0, 1, W)[None, :] * 0.3 + p * 0.8 - 0.9) * 2.2, 0, 0.8)[..., None]
    return img * (1 - a) + 45 * a


def split(a_img, b_img, mode):
    out = np.zeros((H, W, 3), np.float32) + DARK
    if mode == "h_a":   # top half black, bottom = old shot
        out[H // 2:] = a_img[H // 2:]
    elif mode == "h_b":  # top half = new shot, bottom black
        out[:H // 2] = b_img[:H // 2]
    elif mode == "v_a":  # left half black, right = old shot
        out[:, W // 2:] = a_img[:, W // 2:]
    elif mode == "v_b":  # left half = new shot, right black
        out[:, :W // 2] = b_img[:, :W // 2]
    return out


def streaks(img, t, seed=31):
    rng = random.Random(seed + int(t * 4))
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    for i in range(3):
        x = rng.uniform(0.1, 0.9) * W + t * rng.uniform(-60, 60)
        y0 = rng.uniform(-0.2, 0.4) * H
        L = rng.uniform(0.4, 0.9) * H
        sl = rng.choice([rng.uniform(-0.6, -0.25), rng.uniform(0.25, 0.6), rng.uniform(-0.05, 0.05)])
        if (int(t * 20) + i) % 4 == 0:
            continue
        d.line((x, y0, x + L * sl, y0 + L), fill=255, width=2)
    yh = rng.uniform(0.1, 0.5) * H
    d.line((0, yh, W, yh + rng.uniform(-20, 20)), fill=70, width=1)
    a = np.asarray(layer.filter(ImageFilter.GaussianBlur(1.5)), np.float32)[..., None] / 255
    g = np.asarray(layer.filter(ImageFilter.GaussianBlur(10)), np.float32)[..., None] / 255
    return np.clip(img + np.array([190, 20, 12], np.float32) * np.clip(0.55 * a + 0.3 * g, 0, 1), 0, 255)


def shake(t, amp=6):
    return amp * math.sin(t * 70), amp * math.cos(t * 53)


# ---------- timeline ----------
def render(t):
    T = round(t, 3)
    def at(a, b): return a <= T < b

    # S1 wide hilt 0.00–1.15 with glitch burst 0.35–0.50
    if T < 1.20:
        base = zoom(frame("hilt", T * 0.9), 1.0 + 0.7 * max(0, T - 0.5) ** 1.5, cy=0.6)
        if at(0.35, 0.40): return duo(hblur(zoom(base, 1.3, dx=120), 160), (200, 0, 0)) * 1.2
        if at(0.40, 0.45): return neg(base)
        if at(0.45, 0.50): return duo(hblur(zoom(base, 1.3, dx=-120), 160), (200, 0, 0)) * 1.2
        if at(0.50, 0.55): return thr(base, 60)
        if at(0.70, 0.78): return base * 0.75
        return base
    if at(1.20, 1.25): return thr(frame("torii", 1.0), 80)
    # S2 eye 1.25–1.60, star glint at 1.25
    if at(1.25, 1.60):
        img = duo(zoom(frame("eye", 0.4 + (T - 1.25)), 1.05, dx=(T - 1.25) * 40), (210, 10, 5), keep_white=True)
        s = max(0, 1 - (T - 1.25) * 20)
        return flare(img, W * 0.56, H * 0.42, 90 * s + 15, min(1, s + 0.2), (255, 200, 150))
    if at(1.60, 1.65): return slice_glitch(frame("eye", 0.8), 2)
    if at(1.65, 1.75): return hblur(frame("horse", 0.2), 120)
    # S3 horse 1.75–2.45, pull back + tilt 2.35–2.45
    if at(1.75, 2.35):
        dx, dy = shake(T, 4)
        return zoom(frame("horse", 0.3 + (T - 1.75)), 1.6, dx=dx, dy=dy)
    if at(2.35, 2.50):
        p = min(1, (T - 2.33) / 0.12)
        return zoom(frame("horse", 0.9 + (T - 2.35)), 1.6 - 0.95 * p, angle=-8 * p, bg=RED, scene=True)
    # S4 oni 2.50–2.85 (eyes switch on at 2.60), split wipe 2.90–3.05
    if at(2.50, 2.90):
        img = zoom(frame("oni", 0.05 + (T - 2.5) * 0.5), 1.15 + (T - 2.5) * 0.3)
        if T < 2.60:
            img = np.where(lum(img)[..., None] > 170, DARK, img)
        if T > 2.82: img = blur(img, 6)
        return img
    if at(2.90, 2.95): return split(zoom(frame("oni", 0.3), 1.25), None, "h_a")
    if at(2.95, 3.00): return split(frame("brim", 0.0), None, "h_a")
    if at(3.00, 3.05): return split(None, frame("brim", 0.0), "h_b")
    # S5 brim 3.05–3.75, sliding red flare 3.05–3.30, THR 3.35, punch 3.45
    if at(3.05, 3.80):
        z = 1.0 if T < 3.45 else 1.3 + (T - 3.45) * 0.2
        img = zoom(frame("brim", (T - 3.05) * 1.2), z)
        if at(3.35, 3.40): return thr(img, 80)
        if T < 3.30:
            img = flare(img, W * (0.3 + (T - 3.05) * 2.4), H * (0.25 + (T - 3.05) * 0.6), 260, 0.8 * (1 - (T - 3.05) * 3.5), (255, 40, 30), vert=0.12)
        return img
    # S6 legs 3.80–4.65 (2 THR frames, birds 4.35–4.60, radial 4.60)
    if at(3.80, 4.65):
        dx, dy = shake(T, 8)
        raw = zoom(frame("legs", 0.3 + (T - 3.8) * 1.4), 1.1, dx=dx, dy=dy)
        if T < 3.88: return thr(raw, 45)
        img = birds(duo_lv(raw), T, 4.30, 4.62, 7, n=4)
        if T >= 4.60: img = 0.35 * img + 0.65 * radial(img, 14, 0.03)
        return img
    # T8 moon THR -> desat -> bloom 4.65–4.80, S7 moon 4.80–4.95, smoke out 4.95–5.15
    if at(4.65, 4.70): return slice_glitch(thr(frame("moon", 0.4), 120, white_bg=True), 4)
    if at(4.70, 4.75): return desat(frame("moon", 0.5), -0.15)
    if at(4.75, 4.80): return bloom(frame("moon", 0.6), 1.0)
    if at(4.80, 4.95): return birds(moonize(bloom(frame("moon", 0.7 + (T - 4.8)), 0.4)), T, 4.80, 4.98, 9)
    if at(4.95, 5.15):
        p = (T - 4.95) / 0.2
        img = smoke(moonize(bloom(frame("moon", 0.9), 0.4)), p)
        g = desat(img) * (1 - 0.45 * p)
        w = min(1, max(0, (p - 0.25) * 2.5))
        out = img * (1 - w) + g * w
        return out * (1 - 0.85 * max(0, (p - 0.6) / 0.4))
    # S8 torii 5.15–5.55 with birds, vertical split 5.55–5.70
    if at(5.15, 5.55):
        img = zoom(frame("torii", 0.2 + (T - 5.15)), 1.08, dx=(T - 5.15) * 60)
        return birds(img, T, 5.15, 5.55, 11, n=4)
    if at(5.55, 5.60): return split(zoom(frame("torii", 0.6), 1.08, dx=24), None, "v_a")
    if at(5.60, 5.70): return split(None, frame("slash", 0.1), "v_b")
    # S9 slash silhouette 5.70–5.90, DESAT -> NEG -> THR(next) 5.90–6.05
    if at(5.70, 5.90): return birds(frame("slash", 0.15 + (T - 5.7)), T, 5.70, 5.92, 13, n=3)
    if at(5.90, 5.95): return desat(frame("slash", 0.4))
    if at(5.95, 6.00): return neg(frame("slash", 0.4))
    if at(6.00, 6.05): return 255 - thr(frame("kamon", 0.0), 35, white_bg=True)
    # S10 kamon 6.05–6.35, crush 6.30, black + eye slit 6.35
    if at(6.05, 6.35):
        img = zoom(frame("kamon", 0.1 + (T - 6.05)), 1.1)
        if T >= 6.30: img = np.clip((img - 60) * 2, 0, 255)
        return img
    if at(6.35, 6.40):
        img = np.zeros((H, W, 3), np.float32) + 5
        return flare(img, W * 0.5, H * 0.5, 60, 0.9, (255, 60, 20))
    # S11 stars 6.40–7.15, shatter / zoom blur through negative 7.15–7.40
    if at(6.40, 7.15):
        dx, dy = shake(T, 3)
        img = zoom(frame("stars", 0.2 + (T - 6.4) * 2.2), 1.15, dx=dx, dy=dy)
        if T < 6.50: img = np.where(lum(img)[..., None] > 200, img, img * (T - 6.40) / 0.1)
        if T >= 7.00:
            low = np.zeros((H, W, 1), bool); low[2 * H // 3:] = True
            img = np.where(low & (lum(img)[..., None] > 200), RED * 1.2, img)
        return img
    if at(7.15, 7.22):
        img = radial(zoom(frame("stars", 1.9), 1.1, dy=-60), 16, 0.025)
        img[int(H * .8):] = DARK
        return img
    if at(7.22, 7.30): return radial(255 - neg(frame("edge", 0.5), 60), 20, 0.02)
    if at(7.30, 7.35): return radial(thr(frame("edge", 0.5), 60), 12, 0.03)
    if at(7.35, 7.40): return 0.5 * radial(thr(frame("edge", 0.5), 60), 12, 0.03) + 0.5 * duo_lv(zoom(frame("torii", 0.8), 1.6, cy=0.3))
    # S12 bounty wide 7.40–7.85, THR 7.85, poster hold 7.95–9.25 with fire burst 8.50–8.85, zoom out 9.25
    if at(7.40, 7.85): return streaks(duo_lv(zoom(frame("torii", 0.8 + (T - 7.4)), 1.6, cy=0.3)), T)
    if at(7.85, 7.90): return thr(frame("bounty", 0.5), 90)
    if at(7.90, 7.95): return neg(desat(frame("bounty", 0.6)), 90)
    if at(7.95, 9.25):
        raw = zoom(frame("bounty", 0.6 + (T - 7.95) * 0.9), (1.25 + 0.2 * math.exp(-(T - 7.95) * 20)) + (T - 7.95) * 0.06)
        img = streaks(duo(raw), T)
        if at(8.50, 8.55): return np.where(lum(raw)[..., None] > 110, np.array([230, 120, 0], np.float32), np.array([25, 12, 0], np.float32))
        if at(8.55, 8.60): return thr(raw, 110)
        if at(8.60, 8.90):
            k = max(0, 1 - (T - 8.60) / 0.3)
            m = blur((lum(raw) > 100).astype(np.float32)[..., None].repeat(3, 2) * 255, 8) / 255
            burst = fire(duo(raw, (255, 170, 60)), 1.0)
            return img * (1 - k * m) + burst * (k * m)
        return img
    if at(9.25, 9.35):
        p = (T - 9.25) / 0.1
        return streaks(radial(duo(zoom(frame("bounty", 1.9), 1.7 - 0.7 * p)), 10, 0.03), T)
    # abstract red blur bridge 9.35–9.85
    if at(9.35, 9.85):
        src = frame("edge", 0.3 + (T - 9.35) * 4)
        if at(9.55, 9.60): return split(hblur(src, 100) * 0.45, None, "v_a")
        if at(9.60, 9.65): return radial(src * 0.6, 16, 0.03)
        if at(9.70, 9.75): return np.zeros((H, W, 3), np.float32) + np.array([74, 77, 82], np.float32)
        if T >= 9.75: return src * 0.1
        return np.clip(hblur(src, 60) * 0.7 - 35, 0, 255)
    # S14 slash 9.85–10.55 revealed from dark, THR 10.35, DESAT 10.40
    if at(9.85, 10.55):
        img = duo(zoom(frame("eye", 1.0 + (T - 9.85) * 1.4), 1.3), (210, 10, 5), keep_white=True)
        if T < 9.95: img = img * ((T - 9.85) / 0.1)
        if at(10.35, 10.40): return thr(img, 70)
        if at(10.40, 10.45): return desat(img, 0.1)
        return zoom(img, 1.05)
    # whip -> legs THR 10.55–10.75
    if at(10.55, 10.65):
        p = (T - 10.55) / 0.1
        src = zoom(frame("eye", 1.9), 1.3, dx=-400 + 800 * p)
        m = (lum(src) > 40)[..., None]
        return hblur(np.where(m, DARK, RED), 140)
    if at(10.65, 10.75): return thr(frame("legs", 1.0), 45)
    # chorus repeat 10.75–12.85
    if at(10.75, 11.50):
        dx, dy = shake(T, 8)
        img = duo_lv(zoom(frame("legs", 0.9 + (T - 10.75) * 1.3), 1.15, dx=dx, dy=dy))
        img = birds(img, T, 11.20, 11.50, 17, n=4)
        if T >= 11.45: img = 0.35 * img + 0.65 * radial(img, 14, 0.03)
        return img
    if at(11.50, 11.55): return slice_glitch(thr(frame("moon", 1.2), 120, white_bg=True), 5)
    if at(11.55, 11.60): return desat(frame("moon", 1.3), -0.15)
    if at(11.60, 11.80): return birds(moonize(bloom(frame("moon", 1.4 + (T - 11.6)), 0.4)), T, 11.60, 11.82, 19)
    if at(11.80, 12.00):
        p = (T - 11.80) / 0.2
        img = smoke(moonize(bloom(frame("moon", 1.7), 0.4)), p)
        g = desat(img) * (1 - 0.45 * p)
        w = min(1, max(0, (p - 0.25) * 2.5))
        out = img * (1 - w) + g * w
        return out * (1 - 0.85 * max(0, (p - 0.6) / 0.4))
    if at(12.00, 12.35):
        img = zoom(frame("torii", 1.2 + (T - 12.0)), 1.2, dx=(T - 12.0) * 80)
        return birds(img, T, 12.00, 12.35, 23, n=4)
    if at(12.35, 12.45): return split(zoom(frame("torii", 1.6), 1.2), None, "v_a")
    if at(12.45, 12.55): return split(None, frame("slash", 0.15), "v_b")
    if at(12.55, 12.75): return birds(frame("slash", 0.15 + (T - 12.55)), T, 12.55, 12.77, 29)
    if at(12.75, 12.80): return desat(frame("slash", 0.4))
    if at(12.80, 12.85): return neg(frame("slash", 0.4))
    # S15 final oni katana at camera 12.85–13.30, dark -> overexposed flash -> punch, hard out
    if at(12.85, 12.90): return frame("oni", 1.0) * 0.15
    if at(12.90, 12.95): return bloom(fire(frame("oni", 1.05), 0.35), 0.6)
    if at(12.95, 13.30):
        dx, dy = shake(T, 5)
        z = 1.1 if T < 13.10 else 1.35
        return zoom(frame("oni", 1.1 + (T - 12.95) * 1.5), z, dx=dx, dy=dy)
    return thr(frame("oni", 1.9), 40)


def main():
    n = int(END * FPS)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-i", "bandit/song.wav", "-filter_complex",
         "[0:v]scale=1080:608:flags=lanczos,noise=c0s=6:c0f=t+u,pad=1080:1920:0:(oh-ih)/2:black,format=yuv420p[v];"
         f"[1:a]atrim=0:{END},loudnorm=I=-14:TP=-1[a]",
         "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-c:a", "aac", "-b:a", "192k",
         "-shortest", OUT], stdin=subprocess.PIPE)
    for i in range(n):
        img = render(i / FPS)
        enc.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close()
    enc.wait()
    print("done", OUT)


if __name__ == "__main__":
    main()
