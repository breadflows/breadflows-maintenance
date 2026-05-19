from __future__ import annotations

import json
import re
from datetime import datetime
from html import escape
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from fastapi import FastAPI, Query, Request as FastAPIRequest
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles


BASE_DIR = Path(__file__).resolve().parent

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BreadFlows")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
app.mount("/images", StaticFiles(directory=BASE_DIR / "images"), name="images")
app.mount("/gallery", StaticFiles(directory=BASE_DIR / "gallery"), name="gallery")
app.mount("/video", StaticFiles(directory=BASE_DIR / "video"), name="video")


PROJECT = {
    "title": "Building AXIOMORT.",
    "subtitle": "A cinematic film.",
    "description": (
        "A cosmic lion infected by a black ink parasite. Civilizations trapped inside a living universe. "
        "A pilgrimage toward a mountain to heal what's been corrupted. The soundtrack tells the story."
    ),
    "stats": [
        ("Status", "In Production"),
        ("Stage", "Storyboard / Development"),
        ("Format", "~57 min est."),
    ],
}

TIMELINE = [
    ("2016", "Gaming Era", "The origin. Recording clips, learning to edit by doing it wrong a hundred times.", "PLln60eLGTlYE-io6rmclBPYi3FyawC43G"),
    ("2017 - 2019", "Sh*tpost Era", "Memes, random edits, late-night timing experiments, and accidental lessons in rhythm.", "PLln60eLGTlYENFAnQnpR1bWiGfbMMjfZW"),
    ("2020+", "Idk Man", "Experiments, one-offs, and everything that did not fit anywhere else.", "PLln60eLGTlYF7bQHJsRDAWdcBz-HocUBl"),
    ("2021", "Wannabe Gaming Tuber", "The return. Trying harder, learning faster, still building the voice.", "PLln60eLGTlYEkaxaCFwSL_vuk-GOmaFD4"),
    ("2022", "Psychonaut Era", "Inner experience translated into visual language. Weirder, more honest, more alive.", "PLln60eLGTlYHNsw5etNBUcG8CS4HOO16R"),
    ("2022 - 2024", "AMVs & Edits", "Studying how stories move by cutting through other worlds and syncing to a pulse.", "PLln60eLGTlYESdY2URWQztq2B3gVQDDHT"),
    ("2025", "SIGNAL_404 // DIMENSIONAL EXTRACTS", "Fragmented transmissions from a collapsing signal. Origin unknown.", "PLln60eLGTlYGmX5hnFW4AdtP9Zn22EmN1"),
    ("2026 - Present", "AXIOMORT // THE FILM", "A cosmic lion infected by a black ink parasite. Civilizations trapped inside a living universe. A pilgrimage toward a mountain to heal what's been corrupted. The soundtrack tells the story.", "OLAK5uy_kiKDg22GWozeichkwirezck_z8oc3fiq8"),
]

TOOLS = {
    "Find Me On": [
        {"name": "Midjourney", "href": "https://www.midjourney.com/@breadflows", "icon": "midjourney", "initials": "MJ"},
        {"name": "Leonardo AI", "href": "https://app.leonardo.ai/profile/breadflows", "icon": "leonardoai", "initials": "LA"},
        {"name": "Suno", "href": "https://suno.com/@breadflows", "icon": "suno", "initials": "SU"},
        {"name": "Kling AI", "href": "https://kling.ai/app/user-home/20317929/all", "icon": "klingai", "initials": "KA"},
    ],
    "Production Stack": [
        {"name": "Flux / Playground", "href": "https://playground.bfl.ai/image/generate", "icon": "weightsandbiases", "initials": "FL"},
        {"name": "Google AI Studio", "href": "https://aistudio.google.com", "icon": "googlegemini", "initials": "AI"},
        {"name": "Runway", "href": "https://runwayml.com", "icon": "runway", "initials": "RW"},
        {"name": "DaVinci Resolve", "href": "https://www.blackmagicdesign.com/products/davinciresolve", "icon": "davinciresolve", "initials": "DR"},
        {"name": "ElevenLabs", "href": "https://elevenlabs.io", "icon": "elevenlabs", "initials": "11"},
        {"name": "Topaz Video AI", "href": "https://topazlabs.com", "icon": "topazlabs", "initials": "TZ"},
    ],
    "On the Radar": [
        {"name": "Pika", "href": "https://pika.art/login", "icon": "pika", "initials": "PK"},
        {"name": "MiniMax / Hailuo", "href": "https://www.minimax.io/", "icon": "minimax", "initials": "MM"},
    ],
}

SOCIALS = [
    {"name": "YouTube", "href": "https://youtube.com/@breadflows", "icon": "youtube", "initials": "YT"},
    {"name": "Instagram", "href": "https://instagram.com/breadflows", "icon": "instagram", "initials": "IG"},
    {"name": "TikTok", "href": "https://tiktok.com/@breadflows", "icon": "tiktok", "initials": "TT"},
    {"name": "Spotify", "href": "https://open.spotify.com/artist/3yobavZLdSYOHnAqCPN8AD", "icon": "spotify", "initials": "SP"},
    {"name": "GitHub", "href": "https://github.com/breadflows", "icon": "github", "initials": "GH"},
    {"name": "X", "href": "https://x.com/breadflows", "icon": "x", "initials": "X"},
]

GALLERY = [
    "01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.png", "06.png", "07.jpg",
    "08.jpg", "09.jpg", "10.jpg", "11.jpg", "12.jpg", "13.png",
]


@app.get("/", response_class=HTMLResponse)
def home(request: FastAPIRequest) -> HTMLResponse:
    return HTMLResponse((BASE_DIR / "index.html").read_text(encoding="utf-8"))


def fetch_youtube_video_details(video_id: str) -> dict | None:
    precise_date = "Recent"
    if video_id == "gOlBsgPE7s8":
        precise_date = "07 Jan 2026"
    elif video_id == "gquEew9RZuc":
        precise_date = "06 Feb 2026"

    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    try:
        req = Request(url, headers={"User-Agent": "BreadFlows/2026"})
        with urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            return {
                "id": video_id,
                "title": data.get("title", "Untitled video"),
                "published": precise_date,
                "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                "watch_url": f"https://www.youtube.com/watch?v={video_id}",
                "embed_url": f"https://www.youtube.com/embed/{video_id}"
            }
    except Exception as e:
        print(f"Error fetching details for {video_id}: {e}")
        # Static fallbacks if API/Network is slow/fails
        if video_id == "gOlBsgPE7s8":
            return {
                "id": "gOlBsgPE7s8",
                "title": "Sovereign Zero: The Vesuvius Error",
                "published": "07 Jan 2026",
                "thumbnail": "https://img.youtube.com/vi/gOlBsgPE7s8/mqdefault.jpg",
                "watch_url": "https://www.youtube.com/watch?v=gOlBsgPE7s8",
                "embed_url": "https://www.youtube.com/embed/gOlBsgPE7s8"
            }
        elif video_id == "gquEew9RZuc":
            return {
                "id": "gquEew9RZuc",
                "title": "The Orbital Frequency from the Phantom Glide | AI Anime Pilot Concept",
                "published": "06 Feb 2026",
                "thumbnail": "https://img.youtube.com/vi/gquEew9RZuc/mqdefault.jpg",
                "watch_url": "https://www.youtube.com/watch?v=gquEew9RZuc",
                "embed_url": "https://www.youtube.com/embed/gquEew9RZuc"
            }
        return None


def fetch_youtube_playlist_videos(playlist_id: str) -> list[dict]:
    url = f"https://www.youtube.com/feeds/videos.xml?playlist_id={playlist_id}"
    try:
        req = Request(url, headers={"User-Agent": "BreadFlows/2026"})
        with urlopen(req, timeout=10) as response:
            xml_data = response.read().decode("utf-8")
            
        entries = re.findall(r"<entry>(.*?)</entry>", xml_data, re.DOTALL)
        videos = []
        
        # Prepend new videos
        custom_ids = ["gOlBsgPE7s8", "gquEew9RZuc"]
        for cid in custom_ids:
            details = fetch_youtube_video_details(cid)
            if details:
                videos.append(details)

        for entry in entries:
            video_id_match = re.search(r"<yt:videoId>(.*?)</yt:videoId>", entry)
            title_match = re.search(r"<title>(.*?)</title>", entry)
            published_match = re.search(r"<published>(.*?)</published>", entry)
            
            if video_id_match and title_match:
                video_id = video_id_match.group(1)
                title = title_match.group(1)
                title = title.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'").replace("&lt;", "<").replace("&gt;", ">")
                published = published_match.group(1) if published_match else ""
                
                # Check blacklist
                title_lower = title.lower()
                if (
                    "studio signal intro" in title_lower or 
                    "ink of infinity" in title_lower or 
                    ("project the rift" in title_lower and "teaser" in title_lower) or 
                    "nobody" in title_lower
                ):
                    continue
                
                videos.append({
                    "id": video_id,
                    "title": title,
                    "published": format_date(published),
                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                    "watch_url": f"https://www.youtube.com/watch?v={video_id}",
                    "embed_url": f"https://www.youtube.com/embed/{video_id}"
                })
        # Sort descending (latest first)
        months_map = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }
        def parse_date_key(v):
            try:
                parts = v["published"].split()
                if len(parts) == 3:
                    day = int(parts[0])
                    month = months_map.get(parts[1].lower(), 1)
                    year = int(parts[2])
                    return datetime(year, month, day)
            except Exception:
                pass
            return datetime.min
        videos.sort(key=parse_date_key, reverse=True)
        return videos
    except Exception as e:
        print(f"Error fetching playlist videos: {e}")
        return []


@app.get("/api/youtube/playlist-videos")
def youtube_playlist_videos(playlist_id: str = "PLln60eLGTlYGmX5hnFW4AdtP9Zn22EmN1") -> JSONResponse:
    videos = fetch_youtube_playlist_videos(playlist_id)
    return JSONResponse({"data": videos})


def format_date(value: str | None) -> str:
    if not value:
        return "Recent"
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%d %b %Y")
    except Exception:
        return "Recent"


@app.get("/api/youtube/playlist-thumbnail")
def youtube_playlist_thumbnail(list_id: str) -> JSONResponse:
    if not re.match(r"^[a-zA-Z0-9_-]+$", list_id):
        return JSONResponse({"error": "Invalid playlist ID format"}, status_code=400)
    
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list={list_id}&format=json"
    try:
        req = Request(url, headers={"User-Agent": "BreadFlows/2026"})
        with urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            return JSONResponse({"thumbnail_url": data.get("thumbnail_url")})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
