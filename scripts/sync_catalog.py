"""Refresh public release metadata; never overwrite curated credits or remove releases."""
import base64
import copy
import datetime as dt
import json
import os
from pathlib import Path
import re
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ARTIST = "3yobavZLdSYOHnAqCPN8AD"
CHANNEL = "UCtS7qR3YEjSgU6tEQCKmt2Q"
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015", "m": "http://search.yahoo.com/mrss/"}


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "BreadFlows-Catalog/1.0 (+https://breadflows.com)"})
    with urllib.request.urlopen(request, timeout=25) as response:
        raw = response.read(8_000_001)
        if len(raw) > 8_000_000:
            raise ValueError("Provider response exceeds size limit")
        return raw.decode("utf-8")


def script_json(page, script_id, encoded=False):
    match = re.search(r'<script\b[^>]*\bid=["\']' + re.escape(script_id) + r'["\'][^>]*>(.*?)</script>', page, re.S)
    if not match:
        raise ValueError("Public metadata format changed: " + script_id)
    raw = base64.b64decode(match[1]) if encoded else match[1]
    return json.loads(raw)


def clean(value, limit=5000):
    return str(value or "").strip()[:limit]


def date(value):
    value = clean(value, 10)
    dt.date.fromisoformat(value)
    return value


def parse_youtube(xml):
    root = ET.fromstring(xml)
    if root.findtext("yt:channelId", namespaces=NS) not in (CHANNEL, CHANNEL[2:]):
        raise ValueError("Unexpected YouTube channel")
    entries = []
    for entry in root.findall("a:entry", NS):
        video_id = entry.findtext("yt:videoId", namespaces=NS)
        if not video_id or not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
            raise ValueError("Invalid YouTube video identifier")
        title = clean(entry.findtext("a:title", namespaces=NS), 300)
        if not title:
            raise ValueError("Empty YouTube title")
        published = date(entry.findtext("a:published", namespaces=NS))
        item = {
            "id": "youtube-" + video_id, "title": title, "kind": "video",
            "creator": "BreadFlows", "collection": "Latest videos",
            "youtubeId": video_id, "art": "https://i.ytimg.com/vi/" + video_id + "/hqdefault.jpg",
            "description": clean(entry.findtext("m:group/m:description", namespaces=NS), 420) or "A video from BreadFlows.",
            "releaseDate": published, "year": published[:4], "importedFrom": "youtube",
            "genres": ["Video"],
        }
        # Only explicit labels are inferred. Series membership and episode numbers stay curated.
        if re.search(r"\bteaser\b", title, re.I):
            item["extraType"] = "Teaser"
        elif re.search(r"studio.*intro", title, re.I):
            item["extraType"] = "Studio intro"
        entries.append(item)
    if not entries:
        raise ValueError("YouTube returned no entries; retaining the previous catalogue")
    return entries


def spotify_releases(page):
    state = script_json(page, "initialState", encoded=True)
    artist = state["entities"]["items"]["spotify:artist:" + ARTIST]
    if artist.get("uri") != "spotify:artist:" + ARTIST:
        raise ValueError("Unexpected Spotify artist")
    releases = {}
    def visit(value):
        if isinstance(value, dict):
            uri = value.get("uri", "")
            if re.fullmatch(r"spotify:album:[A-Za-z0-9]{22}", uri) and value.get("name"):
                releases[uri.split(":")[-1]] = value["name"]
            for nested in value.values():
                visit(nested)
        elif isinstance(value, list):
            for nested in value:
                visit(nested)
    # Excludes recommendations and other artists' catalogues.
    discography = artist["discography"]
    for key in ("latest", "albums", "singles", "compilations", "popularReleasesAlbums"):
        visit(discography.get(key))
    if not releases:
        raise ValueError("Spotify returned no releases; retaining the previous catalogue")
    return releases


def spotify_album(album_id, embed_page, album_page):
    entity = script_json(embed_page, "__NEXT_DATA__")["props"]["pageProps"]["state"]["data"]["entity"]
    if entity.get("id") != album_id or entity.get("type") != "album":
        raise ValueError("Unexpected Spotify album")
    tracks = entity.get("trackList", [])
    if not tracks or not all("BreadFlows" in t.get("subtitle", "") for t in tracks):
        raise ValueError("Album track list or artist credit could not be verified")
    metadata = re.search(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', album_page, re.S)
    if not metadata:
        raise ValueError("Spotify release date metadata unavailable")
    published = date(json.loads(metadata[1])["datePublished"])
    images = entity["visualIdentity"]["image"]
    cover = max(images, key=lambda x: x.get("maxWidth", 0))["url"]
    if not re.fullmatch(r"https://(?:[a-z0-9-]+\.)?(?:spotifycdn\.com|scdn\.co)/image/[A-Za-z0-9]+", cover):
        raise ValueError("Unexpected Spotify artwork URL")
    title = clean(entity["name"], 300)
    parent_id = "spotify-album-" + album_id
    common = {"art": cover, "releaseDate": published, "year": published[:4], "importedFrom": "spotify", "spotifyAlbumId": album_id}
    items = []
    if len(tracks) > 1:
        items.append({**common, "id": parent_id, "kind": "album", "title": title,
                      "creator": clean(entity.get("subtitle"), 300), "collection": "Albums & EPs",
                      "description": f"{title} — {len(tracks)} tracks.", "spotifyUrl": "https://open.spotify.com/album/" + album_id})
    for number, track in enumerate(tracks, 1):
        uri = track.get("uri", "")
        if not re.fullmatch(r"spotify:track:[A-Za-z0-9]{22}", uri):
            raise ValueError("Invalid Spotify track identifier")
        track_id = uri.split(":")[-1]
        item = {**common, "id": "spotify-track-" + track_id, "kind": "track", "title": clean(track["title"], 300),
                "creator": clean(track["subtitle"].replace("\u00a0", " "), 300),
                "collection": title if len(tracks) > 1 else "Singles",
                "description": f"Track {number} from {title}." if len(tracks) > 1 else "A single by " + clean(track["subtitle"], 300) + ".",
                "spotifyUrl": "https://open.spotify.com/track/" + track_id, "durationMs": int(track["duration"])}
        if len(tracks) > 1:
            item.update(albumId=parent_id, trackNumber=number)
        items.append(item)
    return items


def normalized(value):
    return re.sub(r"[^\w]", "", value.casefold())


def merge(existing, incoming, excluded=()):
    result = copy.deepcopy(existing)
    parent_ids = {}
    added = []
    for new in incoming:
        identity = new.get("youtubeId") or new.get("spotifyUrl")
        if new["id"] in excluded or identity in excluded or new.get("albumId") in excluded or ("https://open.spotify.com/album/" + new.get("spotifyAlbumId", "")) in excluded:
            continue
        if new.get("albumId") in parent_ids:
            new = {**new, "albumId": parent_ids[new["albumId"]]}
        match = None
        for old in result:
            if new.get("youtubeId") and old.get("youtubeId") == new["youtubeId"]:
                match = old
                break
            if old["kind"] != new["kind"]:
                continue
            if (new.get("youtubeId") and old.get("youtubeId") == new["youtubeId"]) or (new.get("spotifyUrl") and old.get("spotifyUrl") == new["spotifyUrl"]):
                match = old
                break
            if new.get("importedFrom") == "spotify" and not new.get("albumId") and not old.get("albumId") and normalized(old["title"]) == normalized(new["title"]) and "breadflows" in old["creator"].casefold():
                match = old
                break
        if match:
            if new["kind"] == "album":
                parent_ids[new["id"]] = match["id"]
            # Fill missing provider facts; leave edited names, credits, artwork, episodes and links untouched.
            for field in ("releaseDate", "year", "spotifyUrl", "durationMs", "spotifyAlbumId"):
                if not match.get(field) and new.get(field):
                    match[field] = new[field]
        else:
            if any(x["id"] == new["id"] for x in result):
                raise ValueError("Release identifier collision")
            result.append(copy.deepcopy(new))
            added.append(new["title"])
    return result, added


def save(path, data):
    encoded = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == encoded:
        return
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(encoded, encoding="utf-8")
    temporary.replace(path)


def sync(root=ROOT):
    catalog_path = root / "pages-app/src/lib/catalog.json"
    state_path = root / "scripts/catalog-sync-state.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    config = json.loads((root / "scripts/catalog-sync-config.json").read_text(encoding="utf-8"))
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    errors = []
    added = []
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    try:
        videos = parse_youtube(fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + CHANNEL))
        catalog, new = merge(catalog, videos, config["excluded"])
        added.extend(new)
        state["youtubeLastSuccess"] = today
    except Exception as error:
        errors.append("YouTube: " + str(error))
    try:
        albums = spotify_releases(fetch("https://open.spotify.com/artist/" + ARTIST))
        done = set(state.get("spotifyAlbums", []))
        for album_id in albums:
            if album_id in done:
                continue
            releases = spotify_album(album_id, fetch("https://open.spotify.com/embed/album/" + album_id), fetch("https://open.spotify.com/album/" + album_id))
            catalog, new = merge(catalog, releases, config["excluded"])
            added.extend(new)
            done.add(album_id)
            state["spotifyAlbums"] = sorted(done)
        state["spotifyLastSuccess"] = today
    except Exception as error:
        errors.append("Spotify: " + str(error))
    state["lastCheck"] = today
    state["errors"] = errors
    save(catalog_path, catalog)
    save(state_path, state)
    print(json.dumps({"added": added, "total": len(catalog), "errors": errors}, ensure_ascii=True))
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
            output.write("provider_errors=" + str(bool(errors)).lower() + "\n")
    # A failed provider never empties the catalogue or discards the other provider's valid additions.
    return errors


if __name__ == "__main__":
    sync()
