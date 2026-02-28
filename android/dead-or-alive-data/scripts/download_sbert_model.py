from __future__ import annotations
from pathlib import Path
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "models" / "sbert"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main"
FILES = {
    "model.db": f"{BASE}/onnx/model.onnx",
    "vocab.txt": f"{BASE}/vocab.txt",
    "tokenizer.json": f"{BASE}/tokenizer.json",
    "tokenizer_config.json": f"{BASE}/tokenizer_config.json",
    "special_tokens_map.json": f"{BASE}/special_tokens_map.json",
    "config.json": f"{BASE}/config.json",
}


def download(url: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 0:
        print(f"skip: {dest.name} ({dest.stat().st_size} bytes)")
        return
    print(f"downloading: {dest.name}")
    urllib.request.urlretrieve(url, dest)
    print(f"saved: {dest}")


def main() -> None:
    for name, url in FILES.items():
        download(url, OUT_DIR / name)


    vocab_txt = OUT_DIR / "vocab.txt"
    if vocab_txt.exists():
        tokens = [t for t in vocab_txt.read_text(encoding="utf-8").splitlines() if t]
        (OUT_DIR / "vocab.json").write_text(
            json.dumps(tokens, ensure_ascii=False), encoding="utf-8"
        )
        vocab_txt.unlink()


if __name__ == "__main__":
    main()
