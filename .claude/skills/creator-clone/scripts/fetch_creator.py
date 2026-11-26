#!/usr/bin/env python3
"""Download a YouTuber's videos (metadata + subtitles, optionally top comments)
and turn them into clean transcript files the creator-clone skill can learn from.

Examples
  python fetch_creator.py "https://www.youtube.com/@SomeCreator" --lang en
  python fetch_creator.py URL1 URL2 URL3 --lang bs --comments 100
  python fetch_creator.py --from-dir path/to/raw          # rebuild offline

Writes (next to this script, unless --out is given):
  creator/raw/           raw .info.json + .vtt files from yt-dlp (git-ignored)
  creator/transcripts/   one cleaned markdown file per video
  creator/catalogue.md   table of every video with views vs channel median
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import statistics
import sys

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(SKILL_DIR, "creator")
CHANNEL_RE = re.compile(r"youtube\.com/(@[^/?#]+|channel/[^/?#]+|c/[^/?#]+|user/[^/?#]+)/?$")
PARAGRAPH_SECONDS = 30


# --------------------------------------------------------------------------- download

def expand_urls(urls: list[str], shorts: bool) -> list[str]:
    out = []
    for url in urls:
        url = url.strip()
        if CHANNEL_RE.search(url):
            base = url.rstrip("/")
            out.append(base + "/videos")
            if shorts:
                out.append(base + "/shorts")
        else:
            out.append(url)
    return out


def download(urls: list[str], raw_dir: str, lang: str, comments: int, browser: str | None = None) -> None:
    try:
        import yt_dlp  # type: ignore
    except ImportError:
        sys.exit("yt-dlp is not installed. Run:  pip install -U yt-dlp")

    opts = {
        "skip_download": True,
        "writeinfojson": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": [f"{lang}.*", lang],
        "subtitlesformat": "vtt",
        "outtmpl": os.path.join(raw_dir, "%(upload_date)s_%(id)s.%(ext)s"),
        "ignoreerrors": True,
        "sleep_interval_subtitles": 1,
        "quiet": False,
    }
    if browser:
        # Use the browser's YouTube login if YouTube asks "confirm you're not a bot".
        opts["cookiesfrombrowser"] = (browser,)
    if comments > 0:
        opts["getcomments"] = True
        opts["extractor_args"] = {
            "youtube": {"max_comments": [str(comments), str(comments), "0"], "comment_sort": ["top"]}
        }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download(urls)


# --------------------------------------------------------------------------- parsing

TS_RE = re.compile(r"(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{3})\s+-->")
TAG_RE = re.compile(r"<[^>]+>")


def parse_vtt(path: str) -> list[tuple[float, str]]:
    """Return [(start_seconds, line)] with YouTube's rolling-caption duplicates removed."""
    with open(path, encoding="utf-8", errors="replace") as fh:
        lines = fh.read().splitlines()

    out: list[tuple[float, str]] = []
    last = ""
    start = None
    for raw in lines:
        m = TS_RE.match(raw)
        if m:
            h, mnt, s, ms = m.groups()
            start = int(h or 0) * 3600 + int(mnt) * 60 + int(s) + int(ms) / 1000
            continue
        if start is None or not raw.strip() or raw.startswith(("NOTE", "STYLE", "Kind:", "Language:")):
            continue
        text = TAG_RE.sub("", raw).replace("&nbsp;", " ").replace("&amp;", "&").strip()
        text = re.sub(r"\s+", " ", text)
        if not text or text == last:
            continue
        # Auto-captions sometimes repeat the previous line plus new words.
        if last and text.startswith(last):
            text = text[len(last):].strip()
            if not text:
                continue
        out.append((start, text))
        last = TAG_RE.sub("", raw).strip()
        last = re.sub(r"\s+", " ", last)
    return out


def paragraphs(cues: list[tuple[float, str]], every: int = PARAGRAPH_SECONDS) -> list[tuple[float, str]]:
    paras: list[tuple[float, str]] = []
    bucket: list[str] = []
    bucket_start = 0.0
    for start, text in cues:
        if bucket and start - bucket_start >= every:
            paras.append((bucket_start, " ".join(bucket)))
            bucket = []
        if not bucket:
            bucket_start = start
        bucket.append(text)
    if bucket:
        paras.append((bucket_start, " ".join(bucket)))
    return paras


def fmt_time(seconds: float) -> str:
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def pick_subtitle(stem: str, info: dict, lang: str) -> tuple[str | None, str]:
    files = sorted(glob.glob(glob.escape(stem) + ".*.vtt"))
    if not files:
        return None, "none"
    by_code = {os.path.basename(f)[len(os.path.basename(stem)) + 1:-4]: f for f in files}
    manual = set((info.get("subtitles") or {}).keys())

    def rank(code: str) -> tuple[int, int]:
        is_manual = code in manual
        exact = code == lang or code == f"{lang}-orig"
        return (0 if is_manual else 1, 0 if exact else 1)

    code = sorted(by_code, key=rank)[0]
    kind = "manual" if code in manual else "auto"
    return by_code[code], f"{kind}-{code}"


# --------------------------------------------------------------------------- writing

def slug(text: str, n: int = 40) -> str:
    s = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE).strip().lower()
    return re.sub(r"[\s_-]+", "-", s)[:n].strip("-") or "video"


def yaml_str(value) -> str:
    return json.dumps(value if value is not None else "", ensure_ascii=False)


def build(raw_dir: str, out_dir: str, lang: str) -> None:
    tdir = os.path.join(out_dir, "transcripts")
    os.makedirs(tdir, exist_ok=True)

    videos = []
    for info_path in sorted(glob.glob(os.path.join(raw_dir, "*.info.json"))):
        with open(info_path, encoding="utf-8") as fh:
            info = json.load(fh)
        if info.get("_type") == "playlist" or not info.get("id"):
            continue
        stem = info_path[: -len(".info.json")]
        sub_path, sub_kind = pick_subtitle(stem, info, lang)
        cues = parse_vtt(sub_path) if sub_path else []
        words = sum(len(t.split()) for _, t in cues)
        dur = info.get("duration") or 0
        d = info.get("upload_date") or "00000000"
        videos.append({
            "info": info, "cues": cues, "words": words, "sub_kind": sub_kind,
            "date": f"{d[:4]}-{d[4:6]}-{d[6:]}", "duration": dur,
            "wpm": round(words / (dur / 60)) if dur and words else 0,
            "file": f"{d}_{slug(info.get('title', ''))}.md",
        })

    if not videos:
        sys.exit(f"No .info.json files found in {raw_dir}")

    videos.sort(key=lambda v: (v["date"], v["info"]["id"]))
    views = [v["info"].get("view_count") or 0 for v in videos]
    median = statistics.median(views) if views else 0

    for i, v in enumerate(videos, 1):
        info = v["info"]
        v["n"] = f"V{i:02d}"
        v["ratio"] = round((info.get("view_count") or 0) / median, 2) if median else 0
        lines = [
            "---",
            f"v: {v['n']}",
            f"id: {info['id']}",
            f"title: {yaml_str(info.get('title'))}",
            f"url: https://www.youtube.com/watch?v={info['id']}",
            f"upload_date: {v['date']}",
            f"duration: \"{fmt_time(v['duration'])}\"",
            f"duration_seconds: {v['duration']}",
            f"views: {info.get('view_count') or 0}",
            f"views_vs_median: {v['ratio']}",
            f"likes: {info.get('like_count') or 0}",
            f"comments: {info.get('comment_count') or 0}",
            f"words: {v['words']}",
            f"words_per_minute: {v['wpm']}",
            f"subtitles: {v['sub_kind']}",
            f"is_short: {str((info.get('height') or 0) > (info.get('width') or 0) > 0 or '/shorts/' in (info.get('original_url') or '')).lower()}",
            "---",
            "",
            "## Description",
            (info.get("description") or "").strip() or "(none)",
            "",
        ]
        if info.get("chapters"):
            lines += ["## Chapters"] + [f"- {fmt_time(c.get('start_time', 0))} {c.get('title', '')}" for c in info["chapters"]] + [""]
        if info.get("tags"):
            lines += ["## Tags", ", ".join(info["tags"]), ""]
        lines.append("## Transcript")
        if v["cues"]:
            lines += [f"[{fmt_time(t)}] {p}" for t, p in paragraphs(v["cues"])]
        else:
            lines.append("(no subtitles found — paste the transcript here by hand)")
        lines.append("")
        comments = [c for c in (info.get("comments") or []) if c.get("parent", "root") == "root"]
        if comments:
            comments.sort(key=lambda c: c.get("like_count") or 0, reverse=True)
            lines.append("## Top comments")
            for c in comments:
                text = re.sub(r"\s+", " ", c.get("text") or "").strip()
                creator = " [CREATOR]" if c.get("author_is_uploader") else ""
                lines.append(f"- ({c.get('like_count') or 0} likes){creator} {text}")
            lines.append("")
        with open(os.path.join(tdir, v["file"]), "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines))

    cat = [
        "# Catalogue",
        "",
        f"{len(videos)} videos · median views {int(median):,} · V-numbers follow upload order "
        "(they shift if an older video is added later — re-check breakdown file names then).",
        "",
        "| V | Date | Title | Length | Views | × median | Words | WPM | Subs | Transcript |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for v in videos:
        info = v["info"]
        title = (info.get("title") or "").replace("|", "/")
        cat.append(
            f"| {v['n']} | {v['date']} | [{title}](https://www.youtube.com/watch?v={info['id']}) | "
            f"{fmt_time(v['duration'])} | {(info.get('view_count') or 0):,} | {v['ratio']} | {v['words']} | "
            f"{v['wpm']} | {v['sub_kind']} | transcripts/{v['file']} |"
        )
    cat.append("")
    with open(os.path.join(out_dir, "catalogue.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(cat))

    missing = [v["n"] for v in videos if not v["cues"]]
    print(f"\nWrote {len(videos)} transcripts to {tdir}")
    print(f"Wrote catalogue to {os.path.join(out_dir, 'catalogue.md')}")
    if missing:
        print(f"No subtitles for: {', '.join(missing)} — paste those transcripts by hand or try another --lang.")


# --------------------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("urls", nargs="*", help="channel, playlist or video URLs")
    ap.add_argument("--lang", default="en", help="subtitle language code (default: en)")
    ap.add_argument("--comments", type=int, default=0, help="save top N comments per video (default: 0)")
    ap.add_argument("--shorts", action="store_true", help="also fetch the channel's Shorts")
    ap.add_argument("--cookies-from-browser", metavar="BROWSER",
                    help="chrome, firefox, edge, safari … — only if YouTube blocks you with a bot check")
    ap.add_argument("--from-dir", help="skip downloading; build from an existing raw directory")
    ap.add_argument("--out", default=DEFAULT_OUT, help="output folder (default: the skill's creator/ folder)")
    args = ap.parse_args()

    raw_dir = args.from_dir or os.path.join(args.out, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    if not args.from_dir:
        if not args.urls:
            ap.error("give at least one URL, or --from-dir")
        download(expand_urls(args.urls, args.shorts), raw_dir, args.lang, args.comments, args.cookies_from_browser)
    build(raw_dir, args.out, args.lang)


if __name__ == "__main__":
    main()
