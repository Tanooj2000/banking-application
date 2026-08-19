# Banking Chatbot System - Architecture & Configuration Guide

## 🏗️ Architecture Overview (3-Tier System)

Your chatbot consists of **three interconnected services**:

| Component | Tech | Purpose | Port |
|-----------|------|---------|------|
| **Frontend (bankingapplication)** | React 19 + Vite | User chat UI | Dev: 5173 |
| **Java Bridge (rag-chatbot-service)** | Spring Boot 4.0.6 + Java 17 | Message routing & API calls | 8086 |
| **Python RAG Engine (rag-chatbot)** | FastAPI + Ollama | Knowledge retrieval & LLM responses | 8000 |

Plus: **Account Service** (Port 8085) - provides user account/bank data

---

## 📡 How Messages Flow (Step-by-Step)

### 1️⃣ User Types Question (Frontend)
```
Frontend (React) → POST http://localhost:8086/chat
Payload: { message: "What's my account status?", user_id, auth_token, ... }
```

### 2️⃣ Java Service Receives & Routes
```
Spring Boot Controller → ChatbotService → Calls Python FastAPI
POST http://localhost:8000/rag/ask
```

### 3️⃣ Python RAG Engine Processes
- **Retrieves**: Searches knowledge base (vector database) for relevant banking docs
- **Orchestrates**: Detects if question needs live account data (e.g., "my account status")
- **Calls**: Account Service API (`http://localhost:8085/api/accounts/*`) if needed
- **Generates**: Uses Ollama LLM (`llama3.2:3b` model) to generate response

### 4️⃣ Response Returns
```
Python → Java Bridge → Frontend
Response: { response: "...", responseType: "final_answer|selection_required", sessionId, ... }
```

---

## ⚙️ Key Configurations Required

### Python RAG Service (`rag_api.py`)
```python
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"  # Ollama server location
OLLAMA_TIMEOUT_SECONDS = 120  # Wait time for LLM response
```

### Java Service (`application.properties`)
```properties
chatbot.fastapi.url=http://localhost:8000/rag/ask         # Python API
chatbot.fastapi.connect-timeout-ms=10000                  # Connection timeout
chatbot.fastapi.read-timeout-ms=180000                    # Read timeout (3 mins)
server.port=8086                                          # Java server port
```

### Frontend (`rag_chatbotApi.js`)
```javascript
const CHATBOT_URL = 'http://localhost:8086/chat';  // Java Bridge endpoint
```

---

## 🔧 External Resources/Fundamentals You MUST Have Running

| Resource | What It Is | Why Needed | How to Get |
|----------|-----------|-----------|-----------|
| **Ollama** | Local LLM inference server | Runs the `llama3.2:3b` language model | Download from [ollama.com](https://ollama.com) |
| **Chroma DB** | Vector database | Stores banking knowledge base embeddings for fast retrieval | Python package (`pip install chromadb`) |
| **Sentence-Transformers** | Embedding model | Converts text → numbers for similarity search | Python package (`pip install sentence-transformers`) |
| **Langchain** | Framework | Orchestrates LLM + document retrieval | Python package (`pip install langchain`) |

---

## 📚 What Each Layer Does (Simplified)

### RAG Pipeline (Python - "RAG" = Retrieval-Augmented Generation)
1. **Load Docs**: Reads `.txt` files from `data/text_files/` (banking knowledge base)
2. **Split**: Chunks documents (800 chars each, 100 char overlap)
3. **Embed**: Converts text → numerical vectors using `sentence-transformers`
4. **Store**: Saves embeddings in Chroma vector database
5. **Retrieve**: When user asks, finds top-K similar docs from vector store
6. **Augment Prompt**: Adds retrieved context + live API data to LLM prompt
7. **Generate**: Ollama LLM reads enriched prompt → generates response

### Orchestration (Python - `chat_orchestrator.py`)
- Detects query type: "account status" → calls Account Service
- Multi-turn flow: Session ID maintains context between messages
- Response type: `final_answer` (text) or `selection_required` (shows options)

### Java Bridge (Spring Boot)
- Simple proxy: receives frontend request → forwards to Python → returns response
- CORS enabled: allows cross-origin calls from frontend
- Timeout management: 10s connection, 180s read timeout

---

## 🚀 Setup Checklist

```
1. ✅ Ollama Running?
   → Download & run: ollama serve llama3.2:3b

2. ✅ Python Env Active?
   → cd rag-chatbot && source chatbot_venv/Scripts/activate (Windows: .ps1)

3. ✅ FastAPI Started?
   → uvicorn rag_api:app --reload (port 8000)

4. ✅ Java Service Started?
   → mvn spring-boot:run (or IDE "Run" button) (port 8086)

5. ✅ Frontend Running?
   → npm run dev (port 5173)

6. ✅ Account Service Running?
   → (Must be running on port 8085 for account queries)
```

---

## 💡 Key Insight: Why This 3-Tier Design?

- **Frontend**: Provides polished UI
- **Java Bridge**: Centralized routing, timeout management, CORS
- **Python RAG**: Specialized for AI + document retrieval (easier than Java for ML)

The **Ollama server** is THE critical external dependency—without it, the LLM can't generate responses.

---

## 🔍 Core File Locations

### Frontend Components
- `bankingapplication/src/components/rag_chatbot_modern.jsx` - Modern chatbot UI
- `bankingapplication/src/api/rag_chatbotApi.js` - API integration layer

### Python RAG Engine
- `rag-chatbot/rag_api.py` - FastAPI entry point
- `rag-chatbot/pdf_loader.py` - RAG pipeline (embedding, retrieval, storage)
- `rag-chatbot/services/chat_orchestrator.py` - Query routing logic
- `rag-chatbot/data/text_files/` - Knowledge base documents
- `rag-chatbot/data/vector_store/` - Persisted embeddings (Chroma DB)

### Java Bridge Service
- `rag-chatbot-service/src/main/java/.../controller/ChatbotController.java` - REST endpoint
- `rag-chatbot-service/src/main/resources/application.properties` - Configuration

---

## 📦 Dependencies Summary

### Python (`requirements.txt`)
- `langchain` - LLM orchestration
- `langchain-community` - Additional integrations
- `chromadb` - Vector database
- `sentence-transformers` - Embedding model
- `pymupdf` / `pypdf` - PDF processing (for knowledge base)
- `faiss-cpu` - Additional similarity search support

### Java (`pom.xml`)
- Spring Boot 4.0.6
- Spring RestClient & WebClient for HTTP calls
- Spring DevTools for development

### Frontend (`package.json`)
- React 19.1.1
- Vite 7.1.7 (build tool)
- React Router for navigation
- Axios for HTTP requests

---

## 🎯 Response Types

The chatbot can return three types of responses:

### 1. `final_answer`
Regular text response from the LLM, displayed directly in chat.

### 2. `selection_required`
Backend provides numbered options (e.g., "Which account?"), frontend displays buttons for user to select.

### 3. `auth_required`
User must be logged in to proceed; prompts authentication.

---

## 🔐 Authentication Flow

- **User ID**: Extracted from `localStorage`/`sessionStorage` or auth context
- **Auth Token**: JWT passed in request headers to Account Service
- **User Type**: 'user' or 'admin' - determines which APIs are called
- **Session ID**: Maintains multi-turn conversation state

---

## ⚠️ Common Issues & Solutions

### Issue: Java Service Won't Start (Exit Code 1)
- Check if Python FastAPI is running on port 8000
- Verify firewall allows localhost connections
- Check `application.properties` for correct URLs

### Issue: No LLM Response (Timeout)
- Ensure Ollama is running: `ollama serve`
- Check Ollama is listening on `http://localhost:11434`
- May need to pull the model: `ollama pull llama3.2:3b`

### Issue: Account Data Not Showing
- Verify Account Service running on port 8085
- Check user is authenticated (auth token present)
- Verify user_id is correctly passed from frontend

### Issue: Frontend Can't Reach Java Bridge
- Ensure Java service running on port 8086
- Check CORS is enabled (it is in `RagChatbotServiceApplication.java`)
- Verify `CHATBOT_URL` in `rag_chatbotApi.js` is correct
