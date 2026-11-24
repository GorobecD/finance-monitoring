#!/usr/bin/env python3
"""Search Wikimedia Commons (official API) for freely-licensed background photos.
Writes candidates.json + thumbnail contact sheets for manual picking.
Usage: python3 scripts/find-photos.py OUT_DIR
"""
import json
import pathlib
import sys
import urllib.parse
import urllib.request
import urllib.error
import io

from PIL import Image, ImageDraw

UA = "NeonFinThemeBuilder/1.0 (open-source personal finance app; theme backgrounds)"
API = "https://commons.wikimedia.org/w/api.php"
OK_LIC = ("cc0", "public domain", "pd", "cc by 2", "cc by 3", "cc by 4", "cc by-sa 2", "cc by-sa 3", "cc by-sa 4")

QUERIES = {
    "neon": ["neon signs night street Tokyo", "Shinjuku night neon"],
    "minimal": ["morning fog lake minimal", "white sand dunes minimal"],
    "miami": ["Miami Beach sunset palm trees", "palm trees sunset silhouette pink sky"],
    "psycamp": ["campfire night forest stars", "camping tent night milky way"],
    "family": ["New York street night 1930s", "rainy night street lights city"],
    "abyss": ["kelp forest underwater", "giant kelp sunlight"],
    "quarantine": ["city skyline sunset rooftops", "abandoned city rooftops sunset"],
    "testlab": ["white futuristic corridor", "laboratory interior white"],
    "factory": ["factory interior industrial machinery", "steel mill sparks"],
    "pantheon": ["Parthenon sunset", "Temple of Poseidon Sounion sunset"],
    "galaxy": ["desert night milky way", "sand dunes night stars"],
    "sewer": ["sewer tunnel underground", "storm drain tunnel"],
    "lofi": ["rain drops window night bokeh", "city night bokeh lights", "twilight city purple sky"],
    "ocean": ["coral reef underwater", "underwater photography sunlight surface", "ocean wave underwater"],
}


def fix(url):
    """thumb.wikimedia.org serves the same paths as upload.wikimedia.org."""
    return url.split("?")[0].replace("//thumb.wikimedia.org/", "//upload.wikimedia.org/")


def get(url, tries=5):
    """Polite fetch: 1 req/sec, backoff on 429 (Wikimedia API etiquette)."""
    import time
    for i in range(tries):
        time.sleep(1.0)
        try:
            req = urllib.request.Request(fix(url), headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tries - 1:
                time.sleep(5 * (i + 1))
                continue
            raise


def search(q, limit=14):
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": "6",
        "gsrsearch": f"{q} filetype:bitmap", "gsrlimit": str(limit),
        "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": "480",
    }
    d = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    out = []
    for p in (d.get("query", {}).get("pages", {}) or {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        lic = (md.get("LicenseShortName", {}).get("value") or "").strip()
        if ii.get("width", 0) < 1800 or ii.get("width", 0) < ii.get("height", 1):
            continue
        if not any(lic.lower().startswith(x) for x in OK_LIC):
            continue
        out.append({
            "title": p["title"], "w": ii["width"], "h": ii["height"], "url": ii["url"],
            "thumb": ii.get("thumburl"), "page": ii.get("descriptionurl"), "license": lic,
            "artist": md.get("Artist", {}).get("value", ""),
        })
    return out


def main():
    out = pathlib.Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[2:])
    prev = out / "candidates.json"
    allc = json.loads(prev.read_text()) if prev.exists() else {}
    for theme, qs in QUERIES.items():
        if only and theme not in only:
            continue
        seen, cands = set(), []
        for q in qs:
            try:
                for c in search(q):
                    if c["title"] not in seen:
                        seen.add(c["title"])
                        cands.append(c)
            except Exception as e:  # noqa: BLE001
                print(theme, q, "ERR", e)
        cands = cands[:12]
        allc[theme] = cands
        # contact sheet
        W, H = 480, 300
        sheet = Image.new("RGB", (W * 4, H * 3), "black")
        dr = ImageDraw.Draw(sheet)
        for i, c in enumerate(cands):
            try:
                im = Image.open(io.BytesIO(get(c["thumb"]))).convert("RGB")
                im.thumbnail((W, H))
                x, y = (i % 4) * W, (i // 4) * H
                sheet.paste(im, (x, y))
                dr.rectangle([x, y, x + 34, y + 22], fill="black")
                dr.text((x + 6, y + 5), str(i), fill="white")
            except Exception as e:  # noqa: BLE001
                print(theme, i, "thumb ERR", e)
        sheet.save(out / f"{theme}.jpg", quality=80)
        print(theme, len(cands))
    (out / "candidates.json").write_text(json.dumps(allc, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
