import base64
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import sync_catalog as sync

def youtube(channel=sync.CHANNEL):
    return f'<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015"><yt:channelId>{channel}</yt:channelId><entry><yt:videoId>abcdefghijk</yt:videoId><title>A new teaser</title><published>2026-09-08T12:00:00Z</published></entry></feed>'

def album_pages(count=1):
    tracks = [{"uri": "spotify:track:" + letter * 22, "title": "Track " + letter, "subtitle": "BreadFlows, Hollow Idolz", "duration": 120000} for letter in "BC"[:count]]
    entity = {"id": "A" * 22, "type": "album", "name": "New release", "subtitle": "BreadFlows, Hollow Idolz", "trackList": tracks, "visualIdentity": {"image": [{"maxWidth": 640, "url": "https://i.scdn.co/image/cover"}]}}
    embed = '<script id="__NEXT_DATA__">' + json.dumps({"props": {"pageProps": {"state": {"data": {"entity": entity}}}}}) + '</script>'
    return embed, '<script type="application/ld+json">{"datePublished":"2026-09-08"}</script>'

class CatalogSyncTests(unittest.TestCase):
    def test_channel_validation_and_no_guessed_episodes(self):
        for channel in (sync.CHANNEL, sync.CHANNEL[2:]):
            item = sync.parse_youtube(youtube(channel))[0]
            self.assertEqual(item["extraType"], "Teaser")
            self.assertNotIn("episode", item)
        with self.assertRaises(ValueError): sync.parse_youtube(youtube("wrong"))

    def test_spotify_only_discovers_own_releases(self):
        uri = "spotify:artist:" + sync.ARTIST
        artist = {"uri": uri, "discography": {"latest": {"uri": "spotify:album:" + "A" * 22, "name": "New"}}, "relatedContent": {"uri": "spotify:album:" + "Z" * 22, "name": "Other artist"}}
        encoded = base64.b64encode(json.dumps({"entities": {"items": {uri: artist}}}).encode()).decode()
        self.assertEqual(sync.spotify_releases('<script id="initialState">' + encoded + '</script>'), {"A" * 22: "New"})
        with self.assertRaises(ValueError): sync.spotify_releases("Unavailable")

    def test_complete_album_credits_and_no_audio_ripping(self):
        entries = sync.spotify_album("A" * 22, *album_pages(2))
        self.assertEqual(len(entries), 3)
        self.assertEqual([x["trackNumber"] for x in entries[1:]], [1, 2])
        self.assertTrue(all(x["albumId"] == entries[0]["id"] for x in entries[1:]))
        self.assertTrue(all("Hollow Idolz" in x["creator"] and "audio" not in x for x in entries))

    def test_curated_film_deduplication_and_idempotency(self):
        old = {"id": "our-film", "kind": "film", "title": "Edited title", "creator": "BreadFlows & Hollow Idolz", "youtubeId": "abcdefghijk", "collection": "AXIOMORT", "art": "/ours.jpg"}
        merged, added = sync.merge([old], sync.parse_youtube(youtube()))
        self.assertFalse(added)
        for k, v in old.items(): self.assertEqual(merged[0][k], v)
        self.assertNotIn("releaseDate", old)
        self.assertEqual(sync.merge(merged, sync.parse_youtube(youtube())), (merged, []))

    def test_existing_music_and_album_ids_are_preserved(self):
        incoming = sync.spotify_album("A" * 22, *album_pages(2))
        old = {**incoming[0], "id": "our-album", "creator": "BreadFlows & Hollow Idolz"}
        merged, added = sync.merge([old], incoming)
        self.assertEqual(merged[0]["creator"], old["creator"])
        self.assertTrue(all(x["albumId"] == "our-album" for x in merged[1:]))
        self.assertEqual(sync.merge([], incoming, [incoming[0]["spotifyUrl"]]), ([], []))

    def test_outage_preserves_catalogue_and_other_provider_updates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "pages-app/src/lib").mkdir(parents=True)
            (root / "scripts").mkdir()
            old = {"id": "old", "kind": "track", "title": "Original", "creator": "BreadFlows"}
            sync.save(root / "pages-app/src/lib/catalog.json", [old])
            sync.save(root / "scripts/catalog-sync-config.json", {"excluded": []})
            def fetch(url):
                if "youtube" in url: return youtube()
                raise RuntimeError("Provider unavailable")
            with patch.object(sync, "fetch", fetch): errors = sync.sync(root)
            data = json.loads((root / "pages-app/src/lib/catalog.json").read_text())
            self.assertIn(old, data)
            self.assertEqual(len(data), 2)
            self.assertTrue(errors)
