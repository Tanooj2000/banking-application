from fastapi import FastAPI, HTTPException
import re
import uvicorn
import sys
import os

app = FastAPI()
from pydantic import BaseModel
from typing import Optional
import uvicorn
import sys
import os

# Import the Account Service client
from account_service_client import (
    get_accounts_by_user,
    get_accounts_by_status,
    get_account_by_number,
    get_application_status
)

# --- Intent Detection and Routing ---
def format_chatbot_response(intent_type: str, result: any) -> str:
    """
    Format the API result into a user-friendly chatbot message.
    """
    if intent_type == "account_by_number":
        acc = result
        return (
            f"Account Number: {acc.get('accountNumber')}\n"
            f"Application ID: {acc.get('applicationId')}\n"
            f"User ID: {acc.get('userId')}\n"
            f"Status: {acc.get('status')}\n"
            f"Country: {acc.get('country')}\n"
            f"Created Date: {acc.get('createdDate', '')[:10]}"
        )
    elif intent_type == "application_status":
        app = result
        msg = f"Application ID: {app.get('applicationId')}\nStatus: {app.get('status')}"
        if app.get('requiredDocuments'):
            msg += f"\nRequired Documents: {', '.join(app['requiredDocuments'])}"
        if app.get('message'):
            msg += f"\nMessage: {app['message']}"
        return msg
    elif intent_type == "accounts_by_user":
        accounts = result
        if not accounts:
            return "No accounts found for this user."
        msg = "Accounts for user:\n"
        for acc in accounts:
            msg += (
                f"- Account Number: {acc.get('accountNumber')}, Status: {acc.get('status')}, Country: {acc.get('country', '')}\n"
            )
        return msg.strip()
    elif intent_type == "accounts_by_status":
        accounts = result
        if not accounts:
            return "No accounts found with this status."
        msg = f"Accounts with status {accounts[0].get('status', '')}:\n"
        for acc in accounts:
            msg += (
                f"- Account Number: {acc.get('accountNumber')}, Application ID: {acc.get('applicationId')}\n"
            )
        return msg.strip()
    return "Here is the information you requested."

def detect_intent_and_route(user_query: str):
    """
    Analyze user_query and call the correct account service API.
    Returns a dict with the result or error message.
    """
    # Patterns for entity extraction
    account_number_pattern = r"ACC\d{6,}"
    application_id_pattern = r"APP\d{6,}"
    user_id_pattern = r"USR\w+"
    status_pattern = r"\b(PENDING|APPROVED|REJECTED)\b"

    # Lowercase for intent detection
    query_lower = user_query.lower()

    # 1. Query Account by Account Number
    account_number_match = re.search(account_number_pattern, user_query)
    if "account" in query_lower and account_number_match:
        account_number = account_number_match.group(0)
        result = get_account_by_number(account_number)
        if result:
            return {
                "type": "account_by_number",
                "result": result,
                "chatbot_response": format_chatbot_response("account_by_number", result)
            }
        else:
            return {"error": f"Account {account_number} not found."}

    # 2. Get Application Status
    application_id_match = re.search(application_id_pattern, user_query)
    if ("application status" in query_lower or "status of application" in query_lower) and application_id_match:
        application_id = application_id_match.group(0)
        result = get_application_status(application_id)
        if result:
            return {
                "type": "application_status",
                "result": result,
                "chatbot_response": format_chatbot_response("application_status", result)
            }
        else:
            return {"error": f"Application {application_id} not found."}

    # 3. Query Accounts by User
    user_id_match = re.search(user_id_pattern, user_query)
    if ("my accounts" in query_lower or "accounts for user" in query_lower or "show accounts" in query_lower) and user_id_match:
        user_id = user_id_match.group(0)
        result = get_accounts_by_user(user_id)
        return {
            "type": "accounts_by_user",
            "result": result,
            "chatbot_response": format_chatbot_response("accounts_by_user", result)
        }

    # 4. Query Accounts by Status
    status_match = re.search(status_pattern, user_query, re.IGNORECASE)
    if ("accounts with status" in query_lower or "accounts in" in query_lower) and status_match:
        status = status_match.group(0).upper()
        result = get_accounts_by_status(status)
        return {
            "type": "accounts_by_status",
            "result": result,
            "chatbot_response": format_chatbot_response("accounts_by_status", result)
        }

    # Fallback: Try to infer intent
    if account_number_match:
        account_number = account_number_match.group(0)
        result = get_account_by_number(account_number)
        if result:
            return {
                "type": "account_by_number",
                "result": result,
                "chatbot_response": format_chatbot_response("account_by_number", result)
            }
        else:
            return {"error": f"Account {account_number} not found."}
    if application_id_match:
        application_id = application_id_match.group(0)
        result = get_application_status(application_id)
        if result:
            return {
                "type": "application_status",
                "result": result,
                "chatbot_response": format_chatbot_response("application_status", result)
            }
        else:
            return {"error": f"Application {application_id} not found."}
    if user_id_match:
        user_id = user_id_match.group(0)
        result = get_accounts_by_user(user_id)
        return {
            "type": "accounts_by_user",
            "result": result,
            "chatbot_response": format_chatbot_response("accounts_by_user", result)
        }
    if status_match:
        status = status_match.group(0).upper()
        result = get_accounts_by_status(status)
        return {
            "type": "accounts_by_status",
            "result": result,
            "chatbot_response": format_chatbot_response("accounts_by_status", result)
        }

    return {"error": "Sorry, I could not understand your request. Please specify account number, application ID, user ID, or status."}
class UserQueryRequest(BaseModel):
    query: str

# Main endpoint for user queries (Optimized: API, RAG, or both as needed)
@app.post("/account/query")
def account_query_router(request: UserQueryRequest):
    """
    Accepts a user query and routes to the correct pipeline(s):
    - If intent is account-related and API returns a result, return API answer only.
    - If intent is not account-related, call RAG only.
    - If API intent but no result, fallback to RAG.
    """
    try:
        result = detect_intent_and_route(request.query)
        # If API intent and successful result, return API answer only
        if isinstance(result, dict) and "chatbot_response" in result and result.get("type"):
            return {"response": result["chatbot_response"]}
        # If API intent but no result, fallback to RAG
        if isinstance(result, dict) and "error" in result:
            rag_answer = ollama_unified_response(request.query, rag_retriever, api_context=None)
            return {"response": rag_answer}
        # If not an API intent (no type), treat as general query and call RAG only
        rag_answer = ollama_unified_response(request.query, rag_retriever, api_context=None)
        return {"response": rag_answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Ensure the notebook directory is in sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'notebook'))

# Import your actual RAG pipeline objects from the notebook
from pdf_loader import rag_retriever, ollama_unified_response



# Request model for RAG endpoint. Only 'question' is required from the frontend.
class QueryRequest(BaseModel):
    question: str
    top_k: Optional[int] = 5
    model_name: Optional[str] = "llama3.2:3b"


@app.post("/rag/ask")
def ask_rag(request: QueryRequest):
    """
    Accepts JSON body with at least 'question'.
    Example minimal request: {"question": "What is RAG?"}
    """
    question = request.question
    top_k = request.top_k
    model_name = request.model_name
    response = ollama_unified_response(question, rag_retriever, api_context=None, model_name=model_name, top_k=top_k)
    return {"question": question, "response": response}

if __name__ == "__main__":
    uvicorn.run("rag_api:app", host="0.0.0.0", port=8000, reload=True)


# --- Account Service API Integration Endpoints ---

from typing import List

class UserIdRequest(BaseModel):
    user_id: str

class StatusRequest(BaseModel):
    status: str

class AccountNumberRequest(BaseModel):
    account_number: str

class ApplicationIdRequest(BaseModel):
    application_id: str

@app.post("/account/user")
def accounts_by_user(request: UserIdRequest):
    try:
        accounts = get_accounts_by_user(request.user_id)
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/account/status")
def accounts_by_status(request: StatusRequest):
    try:
        accounts = get_accounts_by_status(request.status)
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/account/number")
def account_by_number(request: AccountNumberRequest):
    try:
        account = get_account_by_number(request.account_number)
        if account:
            return account
        else:
            raise HTTPException(status_code=404, detail="Account not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/account/application-status")
def application_status(request: ApplicationIdRequest):
    try:
        status = get_application_status(request.application_id)
        if status:
            return status
        else:
            raise HTTPException(status_code=404, detail="Application not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
