# Kazan: render on your own computer (GPU)

Needs: Node 20+, ffmpeg, git.

```bash
git clone https://github.com/yeattozunn/yeattozunn && cd yeattozunn
git checkout claude/kazan-reel
npm install
npm i -D playwright && npx playwright install chromium
node tools/motion-reel/render.mjs --film kazan --format 9x16 --video-only --fps 30 --gpu
node tools/motion-reel/mix.mjs kazan --music-db -3
```

Result: `out/kazan/final_9x16.mp4`  (24 s, 1080x1920, voice + music + sfx, -14 LUFS).
Add `--fps 60` for smoother motion (twice as long).
