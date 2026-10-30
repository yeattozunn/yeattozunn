# Per-sentence ElevenLabs takes with character timing. Key comes from the environment only.
import os, sys, json, base64, urllib.request, pathlib
KEY = os.environ["ELEVENLABS_API_KEY"]
VOICE = sys.argv[1] if len(sys.argv) > 1 else "pNInz6obpgDQGcFmaJgB"
out = pathlib.Path(__file__).parent / "vo"; out.mkdir(exist_ok=True)
lines = [l.strip() for l in (pathlib.Path(__file__).parent / "script.txt").read_text().splitlines() if l.strip()]
for i, text in enumerate(lines):
    p = out / f"take{i}.json"
    if p.exists(): continue   # cached: never pay twice for the same line
    body = json.dumps({"text": text, "model_id": "eleven_flash_v2_5", "language_code": "tr",
                       "voice_settings": {"stability": 0.45, "similarity_boost": 0.75, "style": 0.15, "speed": 1.0}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_96",
                                 body, {"xi-api-key": KEY, "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=60))
    (out / f"take{i}.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
    p.write_text(json.dumps({"text": text, "alignment": d.get("alignment")}))
    print(i, len(text), "chars ok")
