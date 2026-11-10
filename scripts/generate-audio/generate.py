"""Creates the instruction, praise and hint clips from src/content/audio.json and
the number clips (src/audio/numberClips.ts) into src/audio/files/<kind>/<key>.mp3,
with the same ElevenLabs voice and settings as Glossa, so the two apps sound the same.

Runs only on the PC at build time, never in the app. The key comes from
ELEVENLABS_API_KEY in .env, or else from ~/.elevenlabs-key; it is never printed.

src/content/audio-catalog.json records what each file was made from. A clip is
requested, and paid for, only if it is missing or its text or settings changed.

    python scripts/generate-audio/generate.py              # only what is needed
    python scripts/generate-audio/generate.py --dry-run    # lists it, spends nothing
    python scripts/generate-audio/generate.py --only welcome,1
    python scripts/generate-audio/generate.py --adopt      # catalogs existing files, spends nothing
"""

import argparse
import json
import subprocess
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / "src" / "content" / "audio.json"
GOLDEN = ROOT / "src" / "content" / "word-problems.golden.json"
CATALOG = ROOT / "src" / "content" / "audio-catalog.json"
OUT = ROOT / "src" / "audio" / "files"
NUMBER_LIST = Path(__file__).resolve().parent / "number-list.ts"

# «Eleni», chosen by the parent for Glossa
VOICE = "aTP4J5SJLQl74WTSRXKW"
MODEL = "eleven_multilingual_v2"
# 24 kHz, 48 kbps keeps the whole app small
FORMAT = "mp3_24000_48"


def api_key():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            name, _, value = line.partition("=")
            if name.strip() == "ELEVENLABS_API_KEY" and value.strip():
                return value.strip().strip("\"'")
    return (Path.home() / ".elevenlabs-key").read_text(encoding="utf-8").strip()


def clips():
    data = json.loads(AUDIO.read_text(encoding="utf-8"))
    for key, text in data["instructions"].items():
        yield f"instruction/{key}", text
    for i, text in enumerate(data["praise"], start=1):
        yield f"praise/{i}", text
    for key, text in data["strategyPraise"].items():
        yield f"praise/{key}", text
    for key, text in data["hints"].items():
        yield f"hint/{key}", text
    listed = subprocess.run(["node", str(NUMBER_LIST)], capture_output=True, encoding="utf-8", check=True)
    for clip in json.loads(listed.stdout):
        yield f"number/{clip['key']}", clip["text"]
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    for problem in golden["problems"]:
        yield f"problem/{problem['id']}", problem["speech"]


def request_clip(text, key):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?{urllib.parse.urlencode({'output_format': FORMAT})}",
        data=json.dumps({"text": text, "model_id": MODEL}).encode("utf-8"),
        headers={"xi-api-key": key, "Content-Type": "application/json", "User-Agent": "mathimatika-audio/1"},
        method="POST",
    )
    for _ in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            print(f"  {e.code} {e.read()[:200]!r}", flush=True)
            if e.code not in (429, 500, 502, 503):
                return None
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", default="", help="comma-separated keys")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--adopt", action="store_true", help="catalog files that already exist")
    args = parser.parse_args()
    only = {k for k in args.only.split(",") if k}
    catalog = json.loads(CATALOG.read_text(encoding="utf-8")) if CATALOG.exists() else {}
    wanted = dict(clips())
    key = None
    failed = False

    def save():
        CATALOG.write_text(json.dumps(dict(sorted(catalog.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

    to_make = chars = 0
    for clip, raw in wanted.items():
        if only and clip.split("/", 1)[1] not in only:
            continue
        text = unicodedata.normalize("NFC", raw)
        entry = {"text": text, "voice": VOICE, "model": MODEL, "format": FORMAT}
        path = OUT / f"{clip}.mp3"
        if args.adopt:
            if path.exists() and clip not in catalog:
                catalog[clip] = entry
                print(f"adopted {clip}  {text}", flush=True)
            continue
        if path.exists() and catalog.get(clip) == entry:
            continue
        if args.dry_run:
            print(f"would make {clip}  {text}", flush=True)
            to_make += 1
            chars += len(text)
            continue
        key = key or api_key()
        audio = request_clip(text, key)
        if not audio:
            print(f"FAILED {clip}", flush=True)
            failed = True
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(audio)
        catalog[clip] = entry
        print(f"{clip}.mp3  {text}", flush=True)

    # a phrase removed from audio.json leaves the catalog too
    for clip in [c for c in catalog if c not in wanted]:
        del catalog[clip]
    if args.dry_run:
        print(f"TOTAL {to_make} clips, {chars} characters", flush=True)
    else:
        save()
    sys.exit(1 if failed else 0)


main()
