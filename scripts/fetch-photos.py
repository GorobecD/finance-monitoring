#!/usr/bin/env python3
"""Download picked Commons photos -> public/bg/<theme>.webp (1920w) + src/photo-credits.json.
Usage: python3 scripts/fetch-photos.py CANDIDATES_JSON 'theme=index,theme=index,...'
"""
import html
import io
import json
import pathlib
import re
import sys
import time
import urllib.request

from PIL import Image

UA = "NeonFinThemeBuilder/1.0 (open-source personal finance app; theme backgrounds)"
ROOT = pathlib.Path(__file__).resolve().parent.parent


def fix(url):
    """thumb.wikimedia.org serves the same paths as upload.wikimedia.org."""
    return url.split("?")[0].replace("//thumb.wikimedia.org/", "//upload.wikimedia.org/")


def get(url):
    """curl with polite pacing + retry on 429 (more reliable than urllib through the proxy)."""
    import subprocess
    for i in range(6):
        time.sleep(1.5)
        r = subprocess.run(["curl", "-s", "-m", "120", "-A", UA, "-w", "\\n%{http_code}", fix(url)], capture_output=True)
        body, _, code = r.stdout.rpartition(b"\n")
        if code == b"200":
            return body
        if code == b"429":
            time.sleep(8 * (i + 1))
            continue
        raise RuntimeError(f"HTTP {code.decode()} for {url}")
    raise RuntimeError("too many 429")


def plain(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def main():
    cands = json.loads(pathlib.Path(sys.argv[1]).read_text())
    picks = dict(p.split("=") for p in sys.argv[2].split(","))
    out = ROOT / "public" / "bg"
    out.mkdir(parents=True, exist_ok=True)
    cred_path = ROOT / "src" / "photo-credits.json"
    credits = json.loads(cred_path.read_text()) if cred_path.exists() else {}
    for theme, idx in picks.items():
        c = cands[theme][int(idx)]
        # ask Commons for a 2400px rendition instead of the (often huge) original
        # standard Commons thumbnail size (non-standard sizes are rejected with HTTP 400)
        url = re.sub(r"/\d+px-", "/1920px-", c["thumb"]) if c["w"] > 1920 else c["url"]
        try:
            im = Image.open(io.BytesIO(get(url))).convert("RGB")
        except Exception as e:  # noqa: BLE001
            print(theme, "FAILED", e)
            continue
        if im.width > 1920:
            im = im.resize((1920, round(im.height * 1920 / im.width)), Image.LANCZOS)
        dst = out / f"{theme}.webp"
        im.save(dst, "WEBP", quality=74, method=6)
        credits[theme] = {
            "title": c["title"].removeprefix("File:"),
            "author": plain(c["artist"])[:120] or "невідомо",
            "license": c["license"],
            "source": c["page"],
        }
        print(theme, dst.stat().st_size // 1024, "KB", c["license"])
    cred_path.write_text(json.dumps(credits, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
