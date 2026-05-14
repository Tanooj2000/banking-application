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

# --- Document Processing ---
def process_all_texts(text_directory):
    all_documents = []
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
        except Exception as e:
            continue
    return all_documents

# --- Text Splitting ---
def split_documents(documents, chunk_size=800, chunk_overlap=100):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    split_docs = text_splitter.split_documents(documents)
    return split_docs

# --- Embedding Manager ---
class EmbeddingManager:
    def __init__(
        self,
        ollama_url: str = "http://localhost:11434/api/embeddings",
        model: str = "all-minilm",
        max_input_chars: int = 1200,
        min_input_chars: int = 120
    ):
        self.ollama_url = ollama_url
        self.model = model
        self.max_input_chars = max_input_chars
        self.min_input_chars = min_input_chars

    def _split_for_embedding(self, text: str, max_chars: int | None = None) -> list[str]:
        normalized_text = (text or "").strip()
        if not normalized_text:
            return [" "]

        chunk_limit = max_chars or self.max_input_chars
        if len(normalized_text) <= chunk_limit:
            return [normalized_text]

        parts = []
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
        if response.status_code != 500:
            return False
        text = (response.text or "").lower()
        return "context length" in text or "input length exceeds" in text

    def _request_embedding(self, text: str) -> list[float]:
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

# --- Vector Store ---
class VectorStore:
    def __init__(self, collection_name: str = "all_text_documents", persist_directory: str = "./data/vector_store"):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.client = None
        self.collection = None
        self._initialize_store()
    def _initialize_store(self):
        os.makedirs(self.persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Text document embeddings for RAG"}
        )
    def add_documents(self, documents: List[Any], embeddings: np.ndarray):
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

# --- RAG Retriever ---
class RAGRetriever:
    def __init__(self, vector_store: VectorStore, embedding_manager: EmbeddingManager):
        self.vector_store = vector_store
        self.embedding_manager = embedding_manager
    def retrieve(self, query: str, top_k: int = 5, score_threshold: float = 0.0) -> List[Dict[str, Any]]:
        query_embedding = self.embedding_manager.generate_embeddings([query])[0]
        results = self.vector_store.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k
        )
        retrieved_docs = []
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

# --- Ollama RAG Response ---

# --- Unified LLM Response (API + RAG Context) ---
def ollama_unified_response(query, rag_retriever, api_context=None, ollama_url="http://localhost:11434/api/generate", model_name="llama3.2:3b", top_k=5):
    """
    Compose a unified prompt for the LLM using both API and RAG context.
    api_context: str or None - formatted API response (if available)
    """
    retrieved_docs = rag_retriever.retrieve(query, top_k=top_k)
    context = "\n\n".join([doc['content'] for doc in retrieved_docs]) if retrieved_docs else ""
    prompt = ""
    prompt = (
        "You are a banking assistant. Answer ONLY using the provided context below. "
        "Do NOT make up information. If the context does not contain enough information to answer the question, "
        "respond with: 'I'm sorry, I don't have enough information to answer that. Please contact support or ask a banking-related question.'\n\n"
    )
    if api_context:
        prompt += f"API Context:\n{api_context}\n\n"
    if context:
        prompt += f"Context:\n{context}\n\n"
    prompt += f"Question: {query}\nAnswer:"
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False
    }
    response = requests.post(ollama_url, json=payload)
    response.raise_for_status()
    data = response.json()
    return data.get("response", "").strip() or "No response from LLM."

# --- Original RAG-only LLM Response (kept for backward compatibility) ---
def ollama_rag_response(query, rag_retriever, ollama_url="http://localhost:11434/api/generate", model_name="llama3.2:3b", top_k=5):
    return ollama_unified_response(query, rag_retriever, api_context=None, ollama_url=ollama_url, model_name=model_name, top_k=top_k)

# --- Pipeline Initialization ---
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
