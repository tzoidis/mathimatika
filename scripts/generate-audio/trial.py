"""Makes a few trial takes of one clip into audio-trials/ (git-ignored), so the parent can
pick one by ear before it replaces the real clip. Same voice and model as generate.py.

    python scripts/generate-audio/trial.py --dry-run
    python scripts/generate-audio/trial.py
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "audio-trials"

VOICE = "aTP4J5SJLQl74WTSRXKW"
MODEL = "eleven_multilingual_v2"
FORMAT = "mp3_24000_48"

# name: (text, voice settings or None for the voice's own)
TAKES = {
    "1-a-teleia": ("ένα.", None),
    "1-b-kefalaio": ("Ένα.", None),
    "1-c-apostasi": ("ένα…", None),
    "1-d-thaumastiko": ("ένα!", None),
    "1-e-argo": ("ένα.", {"stability": 0.5, "similarity_boost": 0.75, "speed": 0.85}),
}


def api_key():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            name, _, value = line.partition("=")
            if name.strip() == "ELEVENLABS_API_KEY" and value.strip():
                return value.strip().strip("\"'")
    return (Path.home() / ".elevenlabs-key").read_text(encoding="utf-8").strip()


def request(text, settings, key):
    body = {"text": text, "model_id": MODEL}
    if settings:
        body["voice_settings"] = settings
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?{urllib.parse.urlencode({'output_format': FORMAT})}",
        data=json.dumps(body).encode("utf-8"),
        headers={"xi-api-key": key, "Content-Type": "application/json", "User-Agent": "mathimatika-audio/1"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    chars = sum(len(t) for t, _ in TAKES.values())
    if args.dry_run:
        for name, (text, settings) in TAKES.items():
            print(f"would make {name}  {text}  {settings or ''}")
        print(f"TOTAL {len(TAKES)} clips, {chars} characters")
        return
    OUT.mkdir(exist_ok=True)
    key = api_key()
    for name, (text, settings) in TAKES.items():
        (OUT / f"{name}.mp3").write_bytes(request(text, settings, key))
        print(f"{name}.mp3  {text}")


main()
