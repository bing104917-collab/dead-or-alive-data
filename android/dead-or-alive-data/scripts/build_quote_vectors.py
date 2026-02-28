"""
Generate offline embeddings for quotes.db using Sentence-BERT and save as JSON.

Outputs:
  - components/data/quote_texts.json : list[str]      (quote_text, same order as vectors)
  - components/data/quote_vectors.json : list[list[float]] (float16 embeddings, debug)
  - components/data/quote_vectors.db : float32 binary vectors (native runtime)
  - components/data/quote_vectors_meta.json : {count, dim}

Run locally (一次即可):
  python scripts/build_quote_vectors.py
"""

from __future__ import annotations
import json
import re
import sqlite3
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "components" / "data" / "quotes.db"
TEXT_OUT = ROOT / "components" / "data" / "quote_texts.json"
VEC_OUT = ROOT / "components" / "data" / "quote_vectors.json"
VEC_BIN_OUT = ROOT / "components" / "data" / "quote_vectors.db"
VEC_META_OUT = ROOT / "components" / "data" / "quote_vectors_meta.json"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"  # 384 维（英文表现最好）
# 控制输出条目数，避免生成超大文件（GitHub 单文件 100MB 限制）；None = 全量
MAX_QUOTES = 10_000
# 中英文配比
ZH_RATIO = 0.7


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(f"找不到数据库: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT rowid, lang, quote_text FROM quotes WHERE quote_text IS NOT NULL AND quote_text != ''"
    ).fetchall()
    conn.close()

    # 过滤掉无意义或过短文本
    bad_pattern = re.compile(r"^[\W_]+$", re.UNICODE)
    rows = [
        (rid, lang, t.strip())
        for rid, lang, t in rows
        if t
        and t.strip()
        and len(t.strip()) > 3
        and not bad_pattern.match(t.strip())
    ]

    if MAX_QUOTES:
        zh_target = int(MAX_QUOTES * ZH_RATIO)
        en_target = MAX_QUOTES - zh_target
        zh_rows = [r for r in rows if r[1] == "zh"]
        en_rows = [r for r in rows if r[1] == "en"]
        rows = zh_rows[:zh_target] + en_rows[:en_target]

    ids, langs, texts = zip(*rows)
    print(f"载入 {len(texts)} 条名言，开始编码……")

    model = SentenceTransformer(MODEL_NAME)
    emb = model.encode(
        list(texts), batch_size=128, show_progress_bar=True, normalize_embeddings=True
    )

    # JSON 保留 float16（调试/验证用）
    emb_f16 = emb.astype(np.float16)

    TEXT_OUT.write_text(json.dumps(list(texts), ensure_ascii=False), encoding="utf-8")
    VEC_OUT.write_text(json.dumps(emb_f16.tolist()), encoding="utf-8")

    # 原生运行时使用 float32 二进制（显著降低内存/解析开销）
    emb_f32 = emb.astype(np.float32)
    emb_f32.tofile(VEC_BIN_OUT)

    VEC_META_OUT.write_text(
        json.dumps({"count": int(emb_f32.shape[0]), "dim": int(emb_f32.shape[1])}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"已写入 {TEXT_OUT} / {VEC_OUT} / {VEC_BIN_OUT} / {VEC_META_OUT}")


if __name__ == "__main__":
    main()
