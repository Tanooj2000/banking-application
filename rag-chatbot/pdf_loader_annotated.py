"""
Annotated walkthrough of the original `pdf_loader.py` used in the RAG chatbot.

Purpose:
- Keep the original code behavior intact.
- Add concise, presentation-friendly explanations above each component so you can
  open this file and explain sections directly to an audience.
- Provide a small `walkthrough()` helper that prints talking points for each
  section so you can read them aloud during a demo.

How to use:
- Open this file in your editor and step through sections. Run the helper:

  ```powershell
  python rag-chatbot\pdf_loader_annotated.py
  ```

Notes for presenters:
- Each section below has a short "Talking points" list you can read verbatim.
"""

import os
from pathlib import Path
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import numpy as np
import chromadb
from chromadb.config import Settings
import uuid
from typing import List, Dict, Any, Tuple
from sklearn.metrics.pairwise import cosine_similarity
import requests
import json

# -------------------------
# Talking points helper
# -------------------------
def walkthrough() -> None:
    """Print concise talking points to guide a live explanation."""
    points = [
        "Overview: This module ingests text files, splits them into chunks, embeds them, and stores embeddings in a local vector store (ChromaDB) for retrieval.",
        "Document processing: `process_all_texts()` loads all .txt files under `./data` and produces `Document` objects with metadata.",
        "Text splitting: `split_documents()` uses a recursive splitter to create chunks suitable for embedding (configurable chunk size/overlap).",
        "Embedding manager: `EmbeddingManager` calls a local Ollama embedding API, handles long inputs by splitting, and averages sub-embeddings.",
        "Vector store: `VectorStore` wraps ChromaDB — creates/loads a collection and can add documents + embeddings.",
        "Retriever: `RAGRetriever` turns a query into an embedding and queries the vector store for the top-k relevant chunks.",
        "LLM response helpers: `ollama_unified_response()` composes a safe, context-limited prompt combining API context and RAG results, then calls Ollama generate API.",
        "Startup pipeline: The bottom of the file shows a small init sequence that loads data, optionally generates embeddings, and creates the retriever.",
        "Demo tip: In a live demo, highlight how a query flows from input → embedding → vector search → LLM prompt → final response."
    ]
    for i, p in enumerate(points, 1):
        print(f"{i}. {p}")


# -------------------------
# Document Processing
# -------------------------
# Talking points:
# - Look for user content under `./data` (text files). Each file becomes a `Document`.
# - `metadata` includes `source_file` and `file_type` to track provenance.
def process_all_texts(text_directory: str) -> List[Document]:
    """Load all .txt files beneath `text_directory` into `Document` objects.

    Returns a list of `Document` instances with `page_content` and `metadata`.
    """
    all_documents: List[Document] = []
    text_dir = Path(text_directory)
    text_files = list(text_dir.glob("**/*.txt"))
    for text_file in text_files:
        try:
            with open(text_file, 'r', encoding='utf-8') as f:
                content = f.read()
            doc = Document(
                page_content=content,
                metadata={
                    'source_file': text_file.name,
                    'file_type': 'txt'
                }
            )
            all_documents.append(doc)
        except Exception:
            # In a demo you can mention file I/O errors but skip on failure.
            continue
    return all_documents


# -------------------------
# Text Splitting
# -------------------------
# Talking points:
# - Splitting long documents into smaller chunks improves embedding quality and
#   retrieval granularity.
# - `chunk_size` and `chunk_overlap` are adjustable — common sizes: 500-1000 tokens.
def split_documents(documents: List[Document], chunk_size: int = 800, chunk_overlap: int = 100) -> List[Document]:
    """Split Document list into smaller chunks using the RecursiveCharacterTextSplitter."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    split_docs = text_splitter.split_documents(documents)
    return split_docs


# -------------------------
# Embedding Manager
# -------------------------
# Talking points:
# - Encapsulates logic for calling a local Ollama embedding API.
# - Handles inputs longer than the model's limit by splitting and averaging sub-embeddings.
class EmbeddingManager:
    def __init__(
        self,
        ollama_url: str = "http://localhost:11434/api/embeddings",
        model: str = "all-minilm",
        max_input_chars: int = 1200,
        min_input_chars: int = 120
    ) -> None:
        self.ollama_url = ollama_url
        self.model = model
        self.max_input_chars = max_input_chars
        self.min_input_chars = min_input_chars

    def _split_for_embedding(self, text: str, max_chars: int | None = None) -> list[str]:
        """Split a text into pieces that fit under `max_chars`.

        This uses a simple sliding window with a small overlap to avoid chopping
        sentences at arbitrary locations.
        """
        normalized_text = (text or "").strip()
        if not normalized_text:
            return [" "]

        chunk_limit = max_chars or self.max_input_chars
        if len(normalized_text) <= chunk_limit:
            return [normalized_text]

        parts: list[str] = []
        start = 0
        overlap = min(100, max(0, chunk_limit // 10))
        step = max(1, chunk_limit - overlap)

        while start < len(normalized_text):
            end = min(start + chunk_limit, len(normalized_text))
            parts.append(normalized_text[start:end])
            if end >= len(normalized_text):
                break
            start += step

        return parts

    def _is_context_length_error(self, response: requests.Response) -> bool:
        """Detect if Ollama returned a context-length related 500 error.

        This is heuristic: check response text for phrases.
        """
        if response.status_code != 500:
            return False
        text = (response.text or "").lower()
        return "context length" in text or "input length exceeds" in text

    def _request_embedding(self, text: str) -> list[float]:
        """Call Ollama embedding API for a single text chunk.

        If the server responds with a context-length error, this method may
        split the text further and average sub-embeddings.
        """
        payload = {
            "model": self.model,
            "prompt": text
        }
        response = requests.post(self.ollama_url, json=payload, timeout=60)
        try:
            response.raise_for_status()
        except requests.HTTPError:
            if self._is_context_length_error(response) and len(text) > self.min_input_chars:
                tighter_limit = max(self.min_input_chars, len(text) // 2)
                sub_parts = self._split_for_embedding(text, max_chars=tighter_limit)
                sub_embeddings = [self._request_embedding(part) for part in sub_parts]
                if len(sub_embeddings) == 1:
                    return sub_embeddings[0]
                return np.mean(np.array(sub_embeddings), axis=0).tolist()
            raise

        data = response.json()
        if "embedding" not in data:
            raise ValueError("No embedding returned from Ollama")
        return data["embedding"]

    def generate_embeddings(self, texts: list) -> np.ndarray:
        """Generate embeddings for a list of texts and return a numpy array.

        The method splits long texts, requests embeddings for each part, and
        averages parts when necessary to produce one embedding per input text.
        """
        embeddings = []
        for text in texts:
            text_parts = self._split_for_embedding(text)
            part_embeddings = [self._request_embedding(part) for part in text_parts]
            if len(part_embeddings) == 1:
                embeddings.append(part_embeddings[0])
            else:
                mean_embedding = np.mean(np.array(part_embeddings), axis=0)
                embeddings.append(mean_embedding.tolist())
        embeddings = np.array(embeddings, dtype=np.float32)
        return embeddings


# -------------------------
# Vector Store (ChromaDB) wrapper
# -------------------------
# Talking points:
# - Initializes a persistent ChromaDB collection (local file-based DB).
# - Adds documents in bulk: assigns stable metadata + unique ids.
class VectorStore:
    def __init__(self, collection_name: str = "all_text_documents", persist_directory: str = "./data/vector_store") -> None:
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.client = None
        self.collection = None
        self._initialize_store()

    def _initialize_store(self) -> None:
        os.makedirs(self.persist_directory, exist_ok=True)
        # Use ChromaDB's persistent client to store vectors on disk.
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Text document embeddings for RAG"}
        )

    def add_documents(self, documents: List[Any], embeddings: np.ndarray) -> None:
        """Add documents and their embeddings to the ChromaDB collection.

        Each document receives a generated id and small metadata useful for
        debugging and provenance during a demo.
        """
        if len(documents) != len(embeddings):
            raise ValueError("Number of documents must match number of embeddings")
        ids = []
        metadatas = []
        documents_text = []
        embeddings_list = []
        for i, (doc, embedding) in enumerate(zip(documents, embeddings)):
            doc_id = f"doc_{uuid.uuid4().hex[:8]}_{i}"
            ids.append(doc_id)
            metadata = dict(doc.metadata)
            metadata['doc_index'] = i
            metadata['content_length'] = len(doc.page_content)
            metadatas.append(metadata)
            documents_text.append(doc.page_content)
            embeddings_list.append(embedding.tolist())
        self.collection.add(
            ids=ids,
            embeddings=embeddings_list,
            metadatas=metadatas,
            documents=documents_text
        )


# -------------------------
# Retriever
# -------------------------
# Talking points:
# - Converts a query to an embedding and queries ChromaDB for the nearest chunks.
# - Converts Chroma's distance metric into a similarity score shown in results.
class RAGRetriever:
    def __init__(self, vector_store: VectorStore, embedding_manager: EmbeddingManager) -> None:
        self.vector_store = vector_store
        self.embedding_manager = embedding_manager

    def retrieve(self, query: str, top_k: int = 5, score_threshold: float = 0.0) -> List[Dict[str, Any]]:
        """Return the top-k retrieved chunks for `query` as a list of dicts.

        Each dict contains `id`, `content`, `metadata`, `similarity_score`, and `distance`.
        """
        query_embedding = self.embedding_manager.generate_embeddings([query])[0]
        results = self.vector_store.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k
        )
        retrieved_docs: List[Dict[str, Any]] = []
        if results['documents'] and results['documents'][0]:
            documents = results['documents'][0]
            metadatas = results['metadatas'][0]
            distances = results['distances'][0]
            ids = results['ids'][0]
            for i, (doc_id, document, metadata, distance) in enumerate(zip(ids, documents, metadatas, distances)):
                similarity_score = 1 - distance
                if similarity_score >= score_threshold:
                    retrieved_docs.append({
                        'id': doc_id,
                        'content': document,
                        'metadata': metadata,
                        'similarity_score': similarity_score,
                        'distance': distance,
                        'rank': i + 1
                    })
        return retrieved_docs


# -------------------------
# Ollama / LLM Response Helpers
# -------------------------
# Talking points:
# - `ollama_unified_response()` builds a safe prompt: instruct the model to use only
#   the provided context and to avoid hallucinations (important for banking domain).
# - The function combines RAG context and any external API context, then calls
#   the Ollama /generate endpoint.
def ollama_unified_response(query: str, rag_retriever: RAGRetriever, api_context: str | None = None, ollama_url: str = "http://localhost:11434/api/generate", model_name: str = "llama3.2:3b", top_k: int = 5) -> str:
    """Compose prompt from RAG context + optional API context and call Ollama generate.

    The prompt includes strict formatting rules to make LLM output predictable
    and safe for a banking assistant demo.
    """
    retrieved_docs = rag_retriever.retrieve(query, top_k=top_k)
    context = "\n\n".join([doc['content'] for doc in retrieved_docs]) if retrieved_docs else ""
    prompt = (
        "You are a professional banking assistant. Answer ONLY using the provided context below. "
        "Do NOT make up information. If the context does not contain enough information to answer the question, "
        "respond with: 'I'm sorry, I don't have enough information to answer that. Please contact support or ask a banking-related question.'\n\n"
        "FORMATTING RULES — follow these strictly:\n"
        "1. For procedural / how-to questions: use a short one-line introduction, then numbered steps (1. 2. 3. …). "
        "   Use **bold** for section names, button labels, or field names. "
        "   Use sub-bullets (   - item) for lists of options within a step.\n"
        "2. For factual / explanatory questions: use short paragraphs or a simple bullet list.\n"
        "3. Always end with a concise closing sentence (e.g. 'If you need further help, please contact support.').\n"
        "4. Never output placeholder text such as [Customer Name] or [Field].\n"
        "5. Keep the answer concise — avoid unnecessary repetition.\n\n"
    )
    if api_context:
        prompt += f"API Context:\n{api_context}\n\n"
    if context:
        prompt += f"Context:\n{context}\n\n"
    prompt += f"Question: {query}\nAnswer:"
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "num_predict": 320,
        "temperature": 0,
    }
    response = requests.post(ollama_url, json=payload)
    response.raise_for_status()
    data = response.json()
    return data.get("response", "").strip() or "No response from LLM."


def ollama_rag_response(query: str, rag_retriever: RAGRetriever, ollama_url: str = "http://localhost:11434/api/generate", model_name: str = "llama3.2:3b", top_k: int = 5) -> str:
    """Backward-compatible wrapper: RAG-only response using the unified helper."""
    return ollama_unified_response(query, rag_retriever, api_context=None, ollama_url=ollama_url, model_name=model_name, top_k=top_k)


# -------------------------
# Initialization / Small demo pipeline
# -------------------------
# Talking points:
# - At module import / run time this code loads `./data`, splits, and ensures a
#   ChromaDB collection exists. To avoid long startup delays, the script checks
#   whether embeddings are already present and skips re-embedding if so.
all_text_documents = process_all_texts("./data")
chunks = split_documents(all_text_documents)
embedding_manager = EmbeddingManager()
vectorstore = VectorStore()

# Skip re-embedding if documents are already stored in ChromaDB
if vectorstore.collection.count() == 0:
    print(f"[startup] Embedding {len(chunks)} chunks into ChromaDB...")
    texts = [doc.page_content for doc in chunks]
    embeddings = embedding_manager.generate_embeddings(texts)
    vectorstore.add_documents(chunks, embeddings)
    print("[startup] Embedding complete.")
else:
    print(f"[startup] ChromaDB already has {vectorstore.collection.count()} chunks. Skipping re-embedding.")

rag_retriever = RAGRetriever(vectorstore, embedding_manager)


if __name__ == '__main__':
    print("Annotated pdf_loader walkthrough - talking points:\n")
    walkthrough()
