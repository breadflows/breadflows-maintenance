from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen

from fastapi import FastAPI, Request as FastAPIRequest
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent

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
        # Fallback video details
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
        
        # Prepend custom videos
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
                if not re.match(r"^[a-zA-Z0-9_-]+$", video_id):
                    continue
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
        # Sort descending
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
    if not re.match(r"^[a-zA-Z0-9_-]+$", playlist_id):
        return JSONResponse({"error": "Invalid playlist ID format"}, status_code=400)
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
        print(f"Error fetching thumbnail for playlist {list_id}: {e}")
        return JSONResponse({"error": "Failed to fetch playlist thumbnail"}, status_code=500)
