from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict
import chromadb
import ollama

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

chroma = chromadb.PersistentClient(path="./db")
collection = chroma.get_or_create_collection("docs")

# ============================================================================
# SESSION-BASED CONVERSATION MEMORY
# ============================================================================
# In-memory dictionary to store chat history for each session.
# Format: {session_id: [{"role": "user"|"assistant", "content": "text"}, ...]}
# We keep only the last 5 messages per session to prevent memory overflow.
# ============================================================================
chat_history: Dict[str, List[Dict[str, str]]] = {}

# Maximum number of messages to keep per session (last 5 = 2.5 conversation turns)
MAX_HISTORY_MESSAGES = 5

class QueryRequest(BaseModel):
    q: str
    session_id: Optional[str] = None  # Optional for backward compatibility with Swagger UI

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/query")
def query(request: QueryRequest):
    q = request.q
    session_id = request.session_id
    
    # Retrieve relevant context from ChromaDB
    results = collection.query(query_texts=[q], n_results=1)
    context = results["documents"][0][0] if results["documents"] else ""
    
    # ========================================================================
    # CONVERSATION HISTORY HANDLING
    # ========================================================================
    # Build conversation history string if session_id is provided.
    # History is injected BEFORE the retrieved documents in the prompt.
    # ========================================================================
    conversation_history = ""
    
    if session_id:
        # Initialize session if it doesn't exist
        if session_id not in chat_history:
            chat_history[session_id] = []
        
        # Build conversation history string from EXISTING stored messages
        # (before adding the current question to avoid duplication)
        if chat_history[session_id]:
            history_lines = []
            for msg in chat_history[session_id]:
                role_label = "User" if msg["role"] == "user" else "Assistant"
                history_lines.append(f"{role_label}: {msg['content']}")
            conversation_history = "Previous conversation:\n" + "\n".join(history_lines) + "\n\n"
        
        # Add current user message to history (after building history string)
        chat_history[session_id].append({"role": "user", "content": q})
        
        # Keep only the last MAX_HISTORY_MESSAGES messages
        if len(chat_history[session_id]) > MAX_HISTORY_MESSAGES:
            chat_history[session_id] = chat_history[session_id][-MAX_HISTORY_MESSAGES:]
    
    # Build the prompt with conversation history (if any) and retrieved context
    prompt_parts = []
    if conversation_history:
        prompt_parts.append(conversation_history)
    prompt_parts.append(f"Context from knowledge base:\n{context}\n\n")
    prompt_parts.append(f"Question: {q}\n\n")
    prompt_parts.append("Answer clearly and concisely:")
    
    full_prompt = "".join(prompt_parts)
    
    # Generate answer using Ollama
    answer = ollama.generate(
        model="mistral:latest",
        prompt=full_prompt
    )
    
    answer_text = answer["response"]
    
    # Store assistant's response in conversation history
    if session_id and session_id in chat_history:
        chat_history[session_id].append({"role": "assistant", "content": answer_text})
        # Keep only the last MAX_HISTORY_MESSAGES messages
        if len(chat_history[session_id]) > MAX_HISTORY_MESSAGES:
            chat_history[session_id] = chat_history[session_id][-MAX_HISTORY_MESSAGES:]

    return {"answer": answer_text}
