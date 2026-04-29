from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import uvicorn
import sys
import os

# Ensure the notebook directory is in sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'notebook'))

# Import your actual RAG pipeline objects from the notebook
from pdf_loader import rag_retriever, ollama_rag_response

app = FastAPI()

class QueryRequest(BaseModel):
    question: str
    top_k: Optional[int] = 5
    model_name: Optional[str] = "llama3.2:3b"

@app.post("/rag/ask")
def ask_rag(request: QueryRequest):
    question = request.question
    top_k = request.top_k
    model_name = request.model_name
    response = ollama_rag_response(question, rag_retriever, model_name=model_name, top_k=top_k)
    return {"question": question, "response": response}

if __name__ == "__main__":
    uvicorn.run("rag_api:app", host="0.0.0.0", port=8000, reload=True)
