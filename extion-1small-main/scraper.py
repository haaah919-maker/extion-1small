"""
Scraper / API Client
────────────────────
Fetches manga metadata, chapter lists, and images from the utoon.net API.
Includes helpers for building ZIP and PDF files from downloaded images.
"""

from __future__ import annotations

import io
import re
import time
import asyncio
import zipfile
from collections import defaultdict
from typing import Any

import aiohttp
import img2pdf
from bs4 import BeautifulSoup

from config import logger, BASE_URL
from database import (
    db_pool, upsert_manga_index, save_manga_genres,
    get_manga_slug, save_manga_queue,
)

# ═══════════════════════════════════════════════════════════════════════
# IN-MEMORY CACHES
# ═══════════════════════════════════════════════════════════════════════
_chapter_cache: dict[str, list[dict]] = {}
_rate_limit: dict[int, list[float]] = defaultdict(list)

_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


def is_rate_limited(user_id: int, limit: int = 5, window: int = 10) -> bool:
    """Return True if *user_id* has made >= *limit* requests in the last *window* seconds."""
    now = time.time()
    _rate_limit[user_id] = [t for t in _rate_limit[user_id] if now - t < window]
    if len(_rate_limit[user_id]) >= limit:
        return True
    _rate_limit[user_id].append(now)
    return False


# ═══════════════════════════════════════════════════════════════════════
# MANGA & CHAPTER API
# ═══════════════════════════════════════════════════════════════════════
async def get_manga_chapters_api(url: str) -> list[dict]:
    """
    Fetch chapter list for a manga URL.  Results are cached in-memory and
    the manga & genres are indexed in the database.
    """
    slug = url.strip().rstrip("/").split("/")[-1]

    # Fast path: cached + genres already saved
    genres_cached = False
    if db_pool:
        from database import _conn
        with _conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT 1 FROM manga_genres WHERE manga_slug = %s LIMIT 1",
                (slug,),
            )
            genres_cached = cur.fetchone() is not None

    if url in _chapter_cache and genres_cached:
        return _chapter_cache[url]

    api_url = f"{BASE_URL}/wp-json/icmadara/v1/mangas/slug/{slug}/"
    try:
        async with aiohttp.ClientSession(headers=_DEFAULT_HEADERS) as session:
            async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status != 200:
                    logger.error(f"API {resp.status} for {api_url}")
                    return []

                data = await resp.json()
                mangas = data.get("mangas", [])
                if not mangas:
                    return []

                manga = mangas[0]
                chapters_raw = manga.get("capitulos", [])
                chapters = [
                    {
                        "id": str(c.get("id_capitulo")),
                        "title": c.get("nombre", "Unknown Chapter"),
                        "slug": c.get("slug", ""),
                    }
                    for c in chapters_raw
                ]

                if chapters:
                    _chapter_cache[url] = chapters

                # Index manga for search
                title = manga.get("post_title") or manga.get("title") or slug
                thumb = manga.get("thumbnail") or manga.get("imagen") or ""
                upsert_manga_index(slug, title, url, thumb)

                # Save genres
                genres = manga.get("generos") or manga.get("genres") or []
                if genres:
                    logger.info(f"🔍 {slug}: {len(genres)} genres found")
                    save_manga_genres(slug, genres)
                else:
                    logger.debug(f"⚠️ No genres for {slug}")

                return chapters

    except Exception as exc:
        logger.error(f"Scraper exception: {exc}")
        return []


async def fetch_chapter_images_api(chapter_id: str) -> list[str]:
    """Return a list of image URLs for a chapter."""
    api_url = f"{BASE_URL}/wp-json/icmadara/v1/capitulo/{chapter_id}/"
    try:
        async with aiohttp.ClientSession(headers=_DEFAULT_HEADERS) as session:
            async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                if resp.status != 200:
                    return []

                data = await resp.json()
                images: list[str] = []
                raw = data.get("imagenes") or data.get("images") or []

                if isinstance(raw, list):
                    for item in raw:
                        if isinstance(item, dict) and "src" in item:
                            images.append(item["src"])
                        elif isinstance(item, str):
                            images.append(item)

                # Fallback: regex extraction
                if not images:
                    text = await resp.text()
                    found = re.findall(
                        r'https?://[^\s"\'<>]+?\.(?:jpg|jpeg|png|webp)(?:[^\s"\'<>]*?)',
                        text,
                        re.IGNORECASE,
                    )
                    images = list(dict.fromkeys(
                        img.replace("\\/", "/") for img in found
                    ))

                # Filter out logos/icons, prefer manga content
                filtered = [
                    img for img in images
                    if "logo" not in img.lower()
                    and "icon" not in img.lower()
                    and "wp-content/uploads" in img.lower()
                ]
                return filtered if filtered else images

    except Exception as exc:
        logger.error(f"Image fetch error: {exc}")
        return []


# ═══════════════════════════════════════════════════════════════════════
# IMAGE DOWNLOAD & FILE BUILDERS
# ═══════════════════════════════════════════════════════════════════════
async def _download_image(
    session: aiohttp.ClientSession, url: str, index: int
) -> tuple[int, str, bytes] | None:
    """Download a single image.  Returns (index, filename, content) or None."""
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
            if resp.status != 200:
                return None
            content = await resp.read()
            ext = url.split(".")[-1].split("?")[0]
            if len(ext) > 4:
                ext = "jpg"
            return (index, f"{index:03d}.{ext}", content)
    except Exception as exc:
        logger.warning(f"Image download failed {url}: {exc}")
        return None


def _images_to_pdf(images_bytes: list[bytes]) -> bytes:
    """Build a PDF from raw image bytes without re-compression."""
    return img2pdf.convert(images_bytes)


async def download_images_as_zip_async(
    images: list[str], slug: str, ch_id: str
) -> bytes:
    """Download all images and pack them into a ZIP archive."""
    async with aiohttp.ClientSession(headers={"User-Agent": _DEFAULT_HEADERS["User-Agent"]}) as session:
        tasks = [_download_image(session, url, i) for i, url in enumerate(images, 1)]
        results = await asyncio.gather(*tasks)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for res in sorted((r for r in results if r), key=lambda x: x[0]):
            zf.writestr(res[1], res[2])
    buf.seek(0)
    return buf.read()


async def download_images_as_pdf_async(
    images: list[str], slug: str, ch_id: str
) -> bytes:
    """Download all images and merge them into a single PDF."""
    async with aiohttp.ClientSession(headers={"User-Agent": _DEFAULT_HEADERS["User-Agent"]}) as session:
        tasks = [_download_image(session, url, i) for i, url in enumerate(images, 1)]
        results = await asyncio.gather(*tasks)

    image_bytes = [r[2] for r in sorted((r for r in results if r), key=lambda x: x[0])]
    if not image_bytes:
        raise RuntimeError("No images downloaded")
    return _images_to_pdf(image_bytes)


# ═══════════════════════════════════════════════════════════════════════
# PAGE-LEVEL LINK COLLECTOR
# ═══════════════════════════════════════════════════════════════════════
async def collect_manga_links(
    start_page: int = 1,
    end_page: int = 71,
    stop_flag: dict | None = None,
    progress_cb=None,
) -> list[str]:
    """Scrape manga listing pages and return unique links."""
    all_links: list[str] = []
    async with aiohttp.ClientSession() as session:
        for page in range(start_page, end_page + 1):
            if stop_flag and stop_flag.get("stop_requested"):
                break
            url = f"{BASE_URL}/manga/page/{page}/"
            try:
                async with session.get(
                    url, headers=_DEFAULT_HEADERS, timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        html = await resp.text()
                        soup = BeautifulSoup(html, "html.parser")
                        for h3 in soup.find_all("h3", class_=["h4", "h5"]):
                            a = h3.find("a")
                            if a and a.get("href"):
                                all_links.append(a["href"])
                await asyncio.sleep(1)
            except Exception as exc:
                logger.error(f"Link fetch page {page}: {exc}")

            if progress_cb and page % 10 == 0:
                await progress_cb(page, len(set(all_links)))

    return list(set(all_links))


# ═══════════════════════════════════════════════════════════════════════
# GENRE CATALOGUE (Hardcoded fallback for browsing UI)
# ═══════════════════════════════════════════════════════════════════════
GENRES_LIST: list[dict[str, Any]] = [
    {"id": 12,  "slug": "fantasy",       "nombre": "Fantasy",       "total": 1220},
    {"id": 10,  "slug": "drama",         "nombre": "Drama",         "total": 1194},
    {"id": 4,   "slug": "adventure",     "nombre": "Adventure",     "total": 1165},
    {"id": 2,   "slug": "action",        "nombre": "Action",        "total": 1048},
    {"id": 6,   "slug": "comedy",        "nombre": "Comedy",        "total": 932},
    {"id": 34,  "slug": "shounen",       "nombre": "Shounen",       "total": 930},
    {"id": 7,   "slug": "comic",         "nombre": "Comic",         "total": 700},
    {"id": 636, "slug": "fight",         "nombre": "Fight",         "total": 678},
    {"id": 21,  "slug": "manhwa",        "nombre": "Manhwa",        "total": 632},
    {"id": 615, "slug": "magic",         "nombre": "Magic",         "total": 607},
    {"id": 41,  "slug": "supernatural",  "nombre": "Supernatural",  "total": 583},
    {"id": 19,  "slug": "manga",         "nombre": "Manga",         "total": 470},
    {"id": 640, "slug": "crime",         "nombre": "Crime",         "total": 332},
    {"id": 22,  "slug": "martial-arts",  "nombre": "Martial Arts",  "total": 331},
    {"id": 628, "slug": "hunters",       "nombre": "Hunters",       "total": 310},
    {"id": 28,  "slug": "romance",       "nombre": "Romance",       "total": 253},
    {"id": 25,  "slug": "mystery",       "nombre": "Mystery",       "total": 245},
    {"id": 629, "slug": "isekai",        "nombre": "Isekai",        "total": 223},
    {"id": 15,  "slug": "historical",    "nombre": "Historical",    "total": 208},
    {"id": 614, "slug": "reincarnation", "nombre": "Reincarnation", "total": 174},
    {"id": 572, "slug": "shoujo",        "nombre": "Shoujo",        "total": 153},
    {"id": 639, "slug": "mangatoon",     "nombre": "Mangatoon",     "total": 136},
    {"id": 43,  "slug": "webtoon",       "nombre": "Webtoon",       "total": 125},
    {"id": 20,  "slug": "manhua",        "nombre": "Manhua",        "total": 104},
    {"id": 36,  "slug": "slice-of-life", "nombre": "Slice of Life", "total": 99},
    {"id": 633, "slug": "system",        "nombre": "System",        "total": 77},
    {"id": 29,  "slug": "school-life",   "nombre": "School Life",   "total": 68},
    {"id": 31,  "slug": "seinen",        "nombre": "Seinen",        "total": 56},
    {"id": 581, "slug": "horror",        "nombre": "Horror",        "total": 54},
    {"id": 630, "slug": "business",      "nombre": "Business",      "total": 53},
    {"id": 486, "slug": "tragedy",       "nombre": "Tragedy",       "total": 48},
    {"id": 40,  "slug": "sports",        "nombre": "Sports",        "total": 37},
    {"id": 8,   "slug": "cooking",       "nombre": "Cooking",       "total": 35},
    {"id": 637, "slug": "bully",         "nombre": "Bully",         "total": 32},
    {"id": 30,  "slug": "sci-fi",        "nombre": "Sci-fi",        "total": 23},
    {"id": 526, "slug": "psychological", "nombre": "Psychological", "total": 20},
    {"id": 631, "slug": "zombies",       "nombre": "Zombies",       "total": 17},
]


def get_genres_list() -> list[dict]:
    """Return genres sorted by total count (descending)."""
    return sorted(GENRES_LIST, key=lambda g: g["total"], reverse=True)