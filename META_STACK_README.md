# BreadFlows Meta Stack

This is the server-first rewrite using:

- FastAPI for backend routes
- Jinja templates for server-rendered HTML
- HTMX for fragment swaps
- Tailwind CSS for styling
- Alpine.js for the PeerTube player state

Run locally:

```powershell
cd C:\Users\CtrlAltElite4\Desktop\websites\dfbgvgb\breadflows-maintenance-main
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 4180
```

Open:

```text
http://127.0.0.1:4180
```

The site is served from `index.html` via `app.py`. PeerTube calls go through `/api/peertube/videos` (avoids browser CORS).

To show your own uploads, set `PEERTUBE_PROFILE` in `app.py`:

```python
PEERTUBE_PROFILE = {
    "instance": "https://peertube.tv",
    "kind": "account",  # or "channel"
    "handle": "your_handle",
}
```

The page has two feeds: **Your uploads** (profile) and **Discover** (public search, topic chips, instance picker).
