from fastapi import FastAPI, HTTPException
import uvicorn
import requests
import asyncio
import logging
import traceback

logger = logging.getLogger(__name__)

app = FastAPI()

# Import the RAG pipeline objects.
from pdf_loader import rag_retriever, ollama_unified_response
from services.schemas import QueryRequest
from services.chat_orchestrator import orchestrate_query


@app.post("/rag/ask")
async def ask_rag(request: QueryRequest):
    """Unified endpoint for RAG and account-status conversation orchestration."""
    question = request.question
    top_k = request.top_k or 5
    model_name = request.model_name or "llama3.2:3b"

    try:
        result = await asyncio.to_thread(
            orchestrate_query,
            question,
            top_k,
            model_name,
            request.user_id,
            request.auth_token,
            request.session_id,
            request.selected_account_id,
            rag_retriever,
            ollama_unified_response,
            request.user_type,
        )
        return {"question": question, **result}
    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Account/LLM upstream error: {e}")
    except Exception as e:
        logger.error("500 error in /rag/ask:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("rag_api:app", host="0.0.0.0", port=8000, reload=True)
