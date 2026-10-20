import hashlib
from app.config import DOCUMENTS_PATH
from app.ollama_client import embed_texts
from app.store import get_collection

def chunks(text: str, size: int = 700, overlap: int = 100) -> list[str]:
    text = " ".join(text.split())
    output, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        output.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return output

def main():
    paths = sorted(DOCUMENTS_PATH.glob("*.txt"))
    if not paths:
        raise SystemExit(f"No .txt documents found under {DOCUMENTS_PATH}")
    rows = []
    for path in paths:
        for idx, chunk in enumerate(chunks(path.read_text(encoding="utf-8"))):
            chunk_id = hashlib.sha1(f"{path.name}:{idx}:{chunk}".encode()).hexdigest()[:16]
            rows.append((chunk_id, chunk, {"source": path.name, "chunk_index": idx}))
    vectors = embed_texts([r[1] for r in rows])
    collection = get_collection()
    collection.upsert(ids=[r[0] for r in rows],
                      documents=[r[1] for r in rows],
                      metadatas=[r[2] for r in rows],
                      embeddings=vectors)
    print(f"Ingested {len(rows)} chunks; collection count={collection.count()}")

if __name__ == "__main__":
    main()
