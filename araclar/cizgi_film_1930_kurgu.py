"""1930s rubber-hose cartoon edit: 4:3 black-and-white, animation on twos, film damage, iris in/out."""
import subprocess, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

FPS = 24
W, H = 720, 540          # 4:3
END = 10.10
OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/user/yeattozunn/fincan_duellosu.mp4"
SONG = "bandit/song.wav"

# clip: (path, crop center x as fraction of the 16:9 source)
SRC = {"cup": ("toon/out/t2_cup.mp4", 0.5),
       "toaster": ("toon/out/t3_toaster.mp4", 0.5), "clock": ("toon/out/t4_clock.mp4", 0.5),
       "eyes": ("toon/out/t5_eyes.mp4", 0.5), "shoot": ("toon/out/t6_shoot.mp4", 0.5),
       "sugar": ("toon/out/t7_sugar.mp4", 0.55)}


def load(path, cx):
    # 854x480 source -> 640x480 4:3 window -> 720x540
    x = int(max(0, min(854 - 640, cx * 854 - 320)))
    vf = f"fps={FPS},crop=640:480:{x}:0,scale={W}:{H}"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)


CLIPS = {k: load(p, cx) for k, (p, cx) in SRC.items()}

def frame(clip, t, twos=True):
    f = CLIPS[clip]
    i = int(t * FPS)
    if twos:
        i -= i % 2       # animation "on twos"
    return f[min(len(f) - 1, max(0, i))].copy()


def gray(img):
    g = img @ np.array([0.299, 0.587, 0.114], np.float32)
    g = np.clip((g - 18) * 1.12, 0, 255)          # deeper blacks, old print contrast
    return np.repeat(g[..., None], 3, 2)


def zoom(img, z, cx=0.5, cy=0.5, dx=0, dy=0):
    if z == 1 and not dx and not dy:
        return img
    im = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    cw, ch = W / z, H / z
    x0 = min(max(cx * W - cw / 2 + dx, 0), W - cw)
    y0 = min(max(cy * H - ch / 2 + dy, 0), H - ch)
    return np.asarray(im.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.BILINEAR), np.float32)


def iris(img, r, cx=0.5, cy=0.5):
    """r: 0 = closed (black), 1 = fully open."""
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt((xx - W * cx) ** 2 + (yy - H * cy) ** 2) / math.hypot(W / 2, H / 2)
    m = (d <= r)[..., None]
    return np.where(m, img, 8.0)


def damage(img, t, i):
    rng = random.Random(i * 7919)
    # gate weave
    dx, dy = rng.randint(-3, 3), rng.randint(-2, 2)
    img = np.roll(np.roll(img, dy, 0), dx, 1)
    # flicker
    img = img * (0.90 + 0.14 * rng.random())
    # vertical scratches
    for _ in range(rng.choice([0, 1, 1, 2])):
        x = rng.randint(0, W - 2)
        val = 235 if rng.random() < 0.6 else 20
        img[:, x:x + rng.choice([1, 2])] = img[:, x:x + 1] * 0.3 + val * 0.7
    # dust specks and hairs
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    for _ in range(rng.randint(3, 9)):
        x, y, r = rng.randint(0, W), rng.randint(0, H), rng.uniform(1, 4)
        d.ellipse((x - r, y - r, x + r, y + r), fill=255)
    if rng.random() < 0.15:
        x, y = rng.randint(0, W), rng.randint(0, H)
        d.arc((x, y, x + rng.randint(20, 60), y + rng.randint(10, 40)), 0, rng.randint(90, 250), fill=255, width=2)
    a = np.asarray(layer, np.float32)[..., None] / 255
    dark = rng.random() < 0.5
    img = img * (1 - a) + (15 if dark else 240) * a
    # grain
    g = np.random.default_rng(i).normal(0, 10, (H // 2, W // 2)).astype(np.float32)
    g = np.asarray(Image.fromarray(np.clip(g + 128, 0, 255).astype(np.uint8)).resize((W, H)), np.float32) - 128
    img = img + g[..., None]
    # vignette
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.28 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 2.0
    return np.clip(img * v[..., None], 0, 255)


def shake(t, amp):
    return amp * math.sin(t * 61), amp * math.cos(t * 47)


def sweat(img, p):
    """white teardrop with black outline sliding down the cup's side; p 0..1"""
    im = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    x = W * 0.62
    y = H * (0.18 + 0.27 * (int(p * 12) / 12))      # steps down every couple of frames
    d.polygon([(x, y - 22), (x - 11, y + 2), (x + 11, y + 2)], fill=(250, 250, 250), outline=(10, 10, 10))
    d.ellipse((x - 11, y - 8, x + 11, y + 14), fill=(250, 250, 250), outline=(10, 10, 10), width=3)
    d.ellipse((x - 4, y - 2, x + 1, y + 4), fill=(255, 255, 255))
    return np.asarray(im, np.float32)


def cup_src(t):
    """piecewise map that skips the morphing frames of the cup clip"""
    if t < 0.25:
        return 0.20 + t
    return 0.78 + (t - 0.25) * 0.95


def render(t):
    def at(a, b): return a <= t < b
    # A 0.00–1.33 iris in on the cuckoo bird peeking out at noon
    if t < 1.33:
        img = gray(zoom(frame("clock", 0.6 + t * 0.7), 1.5, cy=0.22))
        return iris(img, min(1, t / 0.6) ** 0.8)
    # B 1.33–2.20 the cowboy cup hops in and twirls his spoon
    if at(1.33, 2.20):
        img = gray(frame("cup", cup_src(t - 1.33)))
        return img * 1.25 if t < 1.38 else img
    # C 2.20–3.06 the mustached toaster stomps in, camera bumps per step
    if at(2.20, 3.06):
        dx, dy = shake(t, 5 if (t * 4) % 1 < 0.25 else 0)
        return gray(zoom(frame("toaster", (t - 2.20) * 1.4), 1.05, dx=dx, dy=dy))
    # D 3.06–3.73 the cup's eyes narrow
    if at(3.06, 3.73):
        return gray(zoom(frame("eyes", 0.4 + (t - 3.06) * 1.6), 1.0 + (t - 3.06) * 0.22))
    # E 3.73–4.24 snap zoom on the toaster's mustache
    if at(3.73, 4.24):
        z = 1.9 + 0.3 * math.exp(-(t - 3.73) * 20)
        return gray(zoom(frame("toaster", 1.6), z, cy=0.42))
    # F 4.24–4.86 tighter on the cup, a sweat drop rolls down
    if at(4.24, 4.86):
        z = 1.45 + 0.25 * math.exp(-(t - 4.24) * 20)
        return sweat(gray(zoom(frame("eyes", 1.5 + (t - 4.24) * 0.8), z, cy=0.42)), (t - 4.24) / 0.62)
    # G 4.86–5.38 the toaster huffs steam: he is about to fire
    if at(4.86, 5.38):
        return gray(zoom(frame("toaster", 1.5 + (t - 4.86)), 1.4, cy=0.4))
    # H 5.38–5.86 toast bullets fly (tight crop: only the flying toast), flash + jolt
    if at(5.38, 5.86):
        s = 0.50 + (t - 5.38) * 0.6
        amp = 9 * math.exp(-(t - 5.38) * 8)
        dx, dy = shake(t, amp)
        img = gray(zoom(frame("shoot", s), 1.7, cx=0.72, cy=0.28, dx=dx, dy=dy))
        return img * 1.35 if t < 5.43 else img
    # I 5.86–6.54 close on the gloved hand flicking a sugar cube with the spoon
    if at(5.86, 6.54):
        s = 0.35 + (t - 5.86) * 0.6
        return gray(zoom(frame("sugar", s), 1.6, cx=0.62, cy=0.3))
    # J 6.54–7.05 the cube bounces off the pan toward the lever
    if at(6.54, 7.05):
        return gray(zoom(frame("sugar", 0.76 + (t - 6.54) * 0.6), 1.1, cx=0.65))
    # K 7.05–8.01 the toaster launches, spins and crashes (big jolt on impact)
    if at(7.05, 8.01):
        s = 1.05 + (t - 7.05) * 0.9
        amp = 14 * math.exp(-(s - 1.42) * 7) if s > 1.42 else 0
        dx, dy = shake(t, amp)
        img = gray(zoom(frame("sugar", s), 1.15, cx=0.66, dx=dx, dy=dy))
        return img * 1.3 if 1.42 <= s < 1.47 else img
    # L 8.01–8.56 dizzy stars
    if at(8.01, 8.56):
        return gray(zoom(frame("sugar", 1.9 + (t - 8.01) * 0.18), 1.3, cx=0.66, cy=0.45))
    # M 8.56–9.42 victory: the cup holsters his spoon, slow push-in, flash on the holster beat
    if at(8.56, 9.42):
        u = (t - 8.56) / 0.86
        img = gray(zoom(frame("cup", 1.58 + (t - 8.56) * 0.12), 1.0 + 0.15 * u, cy=0.4))
        return img * 1.25 if at(8.83, 8.88) else img
    # N 9.42–10.10 iris out on the cup's face
    img = gray(zoom(frame("cup", 1.70), 1.15, cy=0.4))
    r = max(0.0, 1 - (t - 9.42) / 0.55)
    return iris(img, r ** 1.2, cx=0.47, cy=0.33)


def main():
    n = int(END * FPS)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-i", SONG, "-filter_complex",
         "[0:v]scale=1080:810:flags=lanczos,pad=1080:1920:0:(oh-ih)/2:black,format=yuv420p[v];"
         f"[1:a]atrim=0:{END},afade=t=out:st={END - 0.5}:d=0.5,loudnorm=I=-14:TP=-1[a]",
         "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-c:a", "aac", "-b:a", "192k",
         "-shortest", OUT], stdin=subprocess.PIPE)
    for i in range(n):
        t = i / FPS
        img = damage(render(t), t, i // 2)   # damage also changes on twos
        enc.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close()
    enc.wait()
    print("done", OUT)


if __name__ == "__main__":
    main()
