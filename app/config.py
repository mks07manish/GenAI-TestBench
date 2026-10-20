import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:3b")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "embeddinggemma")
CHROMA_PATH = os.getenv("CHROMA_PATH", str(ROOT / "data" / "chroma"))
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "rag_testbench")
DOCUMENTS_PATH = ROOT / "test-data" / "documents"
