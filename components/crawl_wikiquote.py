import os
import re
import time
import json
import sqlite3
import hashlib
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import requests
from tqdm import tqdm


# -------------------------
# Config
# -------------------------

@dataclass
class Site:
    lang: str
    key: str
    api: str
    base: str

EN = Site("en", "enwikiquote", "https://en.wikiquote.org/w/api.php", "https://en.wikiquote.org/wiki/")
ZH = Site("zh", "zhwikiquote", "https://zh.wikiquote.org/w/api.php", "https://zh.wikiquote.org/wiki/")

USER_AGENT = "QuoteCollector/1.0 (contact: your_email@example.com)"  
SLEEP = 0.25  # 限速，别太小

DB_PATH = os.path.join("data", "quotes.db")

TOTAL_TARGET = 10000
# 中文 70%，英文 30%
EN_RATIO = 0.3


# -------------------------
# SQLite
# -------------------------

def connect_db(path: str) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA journal_mode=WAL;")  # 更稳
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA temp_store=MEMORY;")
    return conn

def init_db(conn: sqlite3.Connection):
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lang TEXT NOT NULL,
        site_key TEXT NOT NULL,
        page_id INTEGER NOT NULL,
        page_title TEXT NOT NULL,
        quote_text TEXT NOT NULL,
        quote_hash TEXT NOT NULL,
        source_url TEXT NOT NULL,
        fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_quote ON quotes(lang, quote_hash);
    CREATE INDEX IF NOT EXISTS idx_page ON quotes(lang, page_id);

    CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

def get_meta(conn: sqlite3.Connection, key: str) -> Optional[str]:
    cur = conn.execute("SELECT value FROM meta WHERE key=?", (key,))
    row = cur.fetchone()
    return row[0] if row else None

def set_meta(conn: sqlite3.Connection, key: str, value: str):
    conn.execute("""
    INSERT INTO meta(key, value) VALUES(?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
    """, (key, value))

def count_quotes(conn: sqlite3.Connection, lang: Optional[str] = None) -> int:
    if lang:
        cur = conn.execute("SELECT COUNT(*) FROM quotes WHERE lang=?", (lang,))
    else:
        cur = conn.execute("SELECT COUNT(*) FROM quotes")
    return int(cur.fetchone()[0])


# -------------------------
# Helpers
# -------------------------

def md5_hex(s: str) -> str:
    return hashlib.md5(s.encode("utf-8")).hexdigest()

def normalize(text: str) -> str:
    t = text.strip()
    t = re.sub(r"\s+", " ", t)
    t = t.strip("“”\"'「」『』")
    return t.strip()

# wikitext list item
BULLET_RE = re.compile(r"^\*+\s*(.+)$")
REF_RE = re.compile(r"<ref[^>]*>.*?</ref>", flags=re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"</?[^>]+>")
TEMPLATE_RE = re.compile(r"\{\{.*?\}\}")

def clean_wikitext_line(line: str) -> str:
    s = REF_RE.sub("", line)
    s = TAG_RE.sub("", s)
    s = TEMPLATE_RE.sub("", s)
    s = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", s)
    s = re.sub(r"\[\[([^\]]+)\]\]", r"\1", s)
    s = re.sub(r"\[https?://[^\s]+\s+([^\]]+)\]", r"\1", s)
    s = s.replace("''", "")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def extract_quotes(wikitext: str) -> List[str]:
    out = []
    seen = set()
    for raw in wikitext.splitlines():
        m = BULLET_RE.match(raw.strip())
        if not m:
            continue
        line = normalize(clean_wikitext_line(m.group(1)))
        if not (12 <= len(line) <= 240):
            continue
        low = line.lower()
        if low.startswith(("see also", "external links", "references", "notes")):
            continue
        if line not in seen:
            seen.add(line)
            out.append(line)
    return out


# -------------------------
# MediaWiki API
# -------------------------

def api_get(site: Site, params: Dict, timeout: int = 30) -> Dict:
    headers = {"User-Agent": USER_AGENT}
    r = requests.get(site.api, params=params, headers=headers, timeout=timeout)
    r.raise_for_status()
    return r.json()

def get_allpages_batch(site: Site, gapcontinue: Optional[str]) -> Tuple[List[Tuple[int, str]], Optional[str]]:
    params = {
        "action": "query",
        "format": "json",
        "generator": "allpages",
        "gapnamespace": 0,
        "gaplimit": 100,
    }
    if gapcontinue:
        params["gapcontinue"] = gapcontinue
    data = api_get(site, params)
    pages = data.get("query", {}).get("pages", {})
    batch = []
    for p in pages.values():
        batch.append((int(p["pageid"]), p["title"]))
    next_continue = data.get("continue", {}).get("gapcontinue")
    return batch, next_continue

def fetch_wikitext(site: Site, pageid: int) -> str:
    params = {
        "action": "query",
        "format": "json",
        "prop": "revisions",
        "pageids": str(pageid),
        "rvprop": "content",
        "rvslots": "main"
    }
    data = api_get(site, params)
    p = data.get("query", {}).get("pages", {}).get(str(pageid), {})
    revs = p.get("revisions", [])
    if not revs:
        return ""
    rev0 = revs[0]
    slots = rev0.get("slots", {})
    if slots and "main" in slots:
        return slots["main"].get("*", "") or slots["main"].get("content", "") or ""
    return rev0.get("*", "") or ""


# -------------------------
# Crawl
# -------------------------

def insert_quotes(conn: sqlite3.Connection, site: Site, page_id: int, title: str, quotes: List[str]) -> int:
    source_url = site.base + requests.utils.quote(title.replace(" ", "_"))
    rows = []
    for q in quotes:
        h = md5_hex(f"{site.lang}|{q}")
        rows.append((site.lang, site.key, page_id, title, q, h, source_url))
    cur = conn.executemany("""
        INSERT OR IGNORE INTO quotes(lang, site_key, page_id, page_title, quote_text, quote_hash, source_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, rows)
    # sqlite3 的 rowcount 在 executemany 不总是准确，但一般够用
    return conn.total_changes  # 变化是累计的，下面用差值算

def crawl_site(conn: sqlite3.Connection, site: Site, target_insert: int):
    inserted_start = count_quotes(conn, site.lang)
    meta_key = f"gapcontinue_{site.key}"
    gapcontinue = get_meta(conn, meta_key)

    pbar = tqdm(total=target_insert, desc=f"{site.key} inserted", unit="q")
    already = 0

    while True:
        # 达到目标
        current = count_quotes(conn, site.lang)
        new_inserted = current - inserted_start
        if new_inserted >= target_insert:
            break

        try:
            batch, next_continue = get_allpages_batch(site, gapcontinue)
        except Exception:
            time.sleep(2.0)
            continue

        if not batch:
            break

        for page_id, title in batch:
            current = count_quotes(conn, site.lang)
            if current - inserted_start >= target_insert:
                break

            try:
                wikitext = fetch_wikitext(site, page_id)
            except Exception:
                continue

            if not wikitext:
                continue

            quotes = extract_quotes(wikitext)
            if not quotes:
                continue

            before = conn.total_changes
            conn.execute("BEGIN;")
            try:
                conn.executemany("""
                    INSERT OR IGNORE INTO quotes(lang, site_key, page_id, page_title, quote_text, quote_hash, source_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, [
                    (site.lang, site.key, page_id, title, q, md5_hex(f"{site.lang}|{q}"),
                     site.base + requests.utils.quote(title.replace(" ", "_")))
                    for q in quotes
                ])
                conn.execute("COMMIT;")
            except Exception:
                conn.execute("ROLLBACK;")
                continue

            after = conn.total_changes
            added = max(0, after - before)
            if added:
                # 只推进到目标上限
                remaining = target_insert - (count_quotes(conn, site.lang) - inserted_start)
                step = min(added, remaining)
                pbar.update(step)

            time.sleep(SLEEP)

        # 保存断点
        gapcontinue = next_continue
        if gapcontinue:
            set_meta(conn, meta_key, gapcontinue)
            conn.commit()
        else:
            break

    pbar.close()

def main():
    conn = connect_db(DB_PATH)
    init_db(conn)

    total_target = TOTAL_TARGET
    en_target = int(total_target * EN_RATIO)
    zh_target = total_target - en_target

    print("Current counts:", count_quotes(conn, "en"), count_quotes(conn, "zh"), "total", count_quotes(conn))
    print("Target:", en_target, zh_target)

    crawl_site(conn, EN, en_target)
    crawl_site(conn, ZH, zh_target)

    print("Done. Counts:", count_quotes(conn, "en"), count_quotes(conn, "zh"), "total", count_quotes(conn))
    conn.close()

if __name__ == "__main__":
    main()
