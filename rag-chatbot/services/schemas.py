from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    question: str
    top_k: Optional[int] = 5
    model_name: Optional[str] = "llama3.2:3b"
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    selected_account_id: Optional[str] = None
