"""
Vector-based semantic retrieval for the RAG chatbot.

Uses ChromaDB as the vector index/store, paired with our OWN embedding
function built from TF-IDF + Truncated SVD (a form of Latent Semantic
Analysis). This is a deliberate choice over ChromaDB's default embedding
model: that default requires downloading a ~90MB ONNX model from an external
CDN at runtime, which is a fragile extra network dependency for something
this small. LSA embeddings are computed entirely locally from our own
knowledge base, with no external downloads, while still giving real
semantic (not just exact-keyword) similarity — e.g. "shed fat" can match
documents about "calorie deficit" even without shared words.
"""
from typing import List

import numpy as np
import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD

from app.rag.knowledge_base import KNOWLEDGE_BASE

_CORPUS = [doc["text"] for doc in KNOWLEDGE_BASE]

_vectorizer = TfidfVectorizer(stop_words="english")
_tfidf_matrix = _vectorizer.fit_transform(_CORPUS)

# Latent Semantic Analysis: project sparse TF-IDF vectors into a dense
# lower-dimensional "topic" space, which is what lets semantically related
# but differently-worded text match each other.
_n_components = min(50, _tfidf_matrix.shape[0] - 1, _tfidf_matrix.shape[1] - 1)
_svd = TruncatedSVD(n_components=_n_components, random_state=42)
_svd.fit(_tfidf_matrix)


class LocalLSAEmbeddingFunction(EmbeddingFunction):
    """Chroma-compatible embedding function with zero external downloads."""

    def __call__(self, input: Documents) -> Embeddings:
        tfidf = _vectorizer.transform(input)
        dense = _svd.transform(tfidf)
        return dense.tolist()


_client = chromadb.PersistentClient(
    path="./chroma_data",
    settings=chromadb.Settings(anonymized_telemetry=False),
)
_collection = _client.get_or_create_collection(
    name="fitness_knowledge",
    embedding_function=LocalLSAEmbeddingFunction(),
)


def _ensure_seeded():
    """Populate the collection once; safe to call on every startup."""
    existing = _collection.get(ids=[doc["id"] for doc in KNOWLEDGE_BASE])
    existing_ids = set(existing["ids"])
    missing = [doc for doc in KNOWLEDGE_BASE if doc["id"] not in existing_ids]
    if not missing:
        return
    _collection.add(
        ids=[doc["id"] for doc in missing],
        documents=[doc["text"] for doc in missing],
        metadatas=[{"topic": doc["topic"]} for doc in missing],
    )


_ensure_seeded()


def retrieve(query: str, top_k: int = 3):
    """Returns list of (doc_id, text, distance) for the top_k semantically
    closest chunks. Lower distance = more similar."""
    results = _collection.query(query_texts=[query], n_results=top_k)
    ids = results["ids"][0]
    docs = results["documents"][0]
    distances = results["distances"][0]
    return list(zip(ids, docs, distances))
