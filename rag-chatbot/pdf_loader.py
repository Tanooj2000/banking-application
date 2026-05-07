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
    def __init__(self, ollama_url: str = "http://localhost:11434/api/embeddings", model: str = "all-minilm"):
        self.ollama_url = ollama_url
        self.model = model
    def generate_embeddings(self, texts: list) -> np.ndarray:
        embeddings = []
        for text in texts:
            payload = {
                "model": self.model,
                "prompt": text
            }
            response = requests.post(self.ollama_url, json=payload)
            response.raise_for_status()
            data = response.json()
            if "embedding" not in data:
                raise ValueError(f"No embedding returned for text: {text}")
            embeddings.append(data["embedding"])
        embeddings = np.array(embeddings)
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
    rag_context = "\n\n".join([doc['content'] for doc in retrieved_docs]) if retrieved_docs else ""
    # Compose prompt
    prompt = ""
    if api_context:
        prompt += f"API Context:\n{api_context}\n\n"
    if rag_context:
        prompt += f"Document Context:\n{rag_context}\n\n"
    prompt += f"User Question:\n{query}\n\nAnswer:"
    payload = {
        "model": model_name,
        "prompt": prompt
    }
    response = requests.post(ollama_url, json=payload, stream=True)
    response.raise_for_status()
    answer = ""
    for line in response.iter_lines():
        if line:
            try:
                data = json.loads(line.decode("utf-8"))
                answer += data.get("response", "")
            except Exception:
                continue
    return answer if answer else "No response from LLM."

# --- Original RAG-only LLM Response (kept for backward compatibility) ---
def ollama_rag_response(query, rag_retriever, ollama_url="http://localhost:11434/api/generate", model_name="llama3.2:3b", top_k=5):
    return ollama_unified_response(query, rag_retriever, api_context=None, ollama_url=ollama_url, model_name=model_name, top_k=top_k)

# --- Pipeline Initialization ---
all_text_documents = process_all_texts("./data")
chunks = split_documents(all_text_documents)
embedding_manager = EmbeddingManager()
vectorstore = VectorStore()
texts = [doc.page_content for doc in chunks]
embeddings = embedding_manager.generate_embeddings(texts)
vectorstore.add_documents(chunks, embeddings)
rag_retriever = RAGRetriever(vectorstore, embedding_manager)
