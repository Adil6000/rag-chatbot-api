# RAG API - Kubernetes Knowledge Base Chatbot

A Retrieval-Augmented Generation (RAG) API built with FastAPI, ChromaDB, and Ollama. This application provides a conversational AI Chatbot interface for querying a Kubernetes knowledge base with session-based conversation memory.

## Features

- 🤖 **RAG-powered Q&A**: Query a knowledge base using semantic search
- 💬 **Session-based Memory**: Maintains conversation context across multiple turns
- 🎨 **Web Interface**: Chat interface for user interaction
- 🔍 **Semantic Search**: Uses ChromaDB for vector similarity search
- 🧠 **Local LLM**: Uses Ollama with Mistral model

## Prerequisites

Before running this project, ensure you have:

1. **Python 3.10** installed
2. **Ollama** installed and running
   - Download from: https://ollama.ai
   - Install the Mistral model: `ollama pull mistral`

## Installation

### 1. Clone or Navigate to the Project

```bash
cd rag-api
```

### 2. Create and Activate Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install fastapi uvicorn chromadb ollama
```

## Setup

### 1. Ensure Ollama is Running

Make sure Ollama is installed and the Mistral model is available:

```bash
# Check if Ollama is running
ollama list

# If mistral is not installed, pull it:
ollama pull mistral
```

### 2. Embed the Knowledge Base

Run the embedding script to index the `k8s.txt` file into ChromaDB:

```bash
python embed.py
```

This will:
- Create a ChromaDB collection named "docs"
- Embed the content from `k8s.txt`
- Store it in the `./db` directory

**Note:** If you see "Embedding stored in Chroma", the setup is complete. If the database already exists, you can skip this step.

## Running the Application

### Start the FastAPI Server

```bash
uvicorn app:app --reload
```

The `--reload` flag enables auto-reload on code changes (useful for development).

### Access the Application

Once the server is running, open your browser and navigate to:

- **Web UI**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs (ReDoc)**: http://localhost:8000/redoc

## Usage

### Web Interface

1. Open http://localhost:8000 in your browser
2. Type your question about Kubernetes in the input field
3. Click "Send" or press Enter
4. The AI will respond based on the knowledge base content
5. Ask follow-up questions - the chatbot maintains conversation context!

### API Endpoint

You can also query the API directly:

```bash
curl -X POST "http://localhost:8000/query" \
     -H "Content-Type: application/json" \
     -d '{"q": "What is Kubernetes?", "session_id": "test-session-123"}'
```

**Response:**
```json
{
  "answer": "Kubernetes (K8s) is an open-source container orchestration platform..."
}
```

## Project Structure

```
rag-api/
├── app.py              # FastAPI application with RAG logic
├── embed.py            # Script to embed documents into ChromaDB
├── k8s.txt             # Knowledge base file (Kubernetes documentation)
├── requirements.txt    # Python dependencies
├── db/                 # ChromaDB database directory (created after embedding)
├── static/             # Frontend files
│   ├── index.html      # Main HTML file
│   ├── style.css       # Stylesheet
│   └── script.js       # JavaScript for UI and API calls
└── venv/               # Python virtual environment (not included in repo)
```

## How It Works

1. **Embedding Phase** (`embed.py`):
   - Reads the `k8s.txt` file
   - Creates embeddings using ChromaDB's default embedding function
   - Stores embeddings in a persistent ChromaDB collection

2. **Query Phase** (`app.py`):
   - User sends a question via the web UI or API
   - The question is embedded and searched against the knowledge base
   - Most relevant context is retrieved from ChromaDB
   - Conversation history (if session_id provided) is included
   - Ollama generates a response using the context and history
   - Response is returned to the user

3. **Session Memory**:
   - Each browser session generates a unique `session_id`
   - Last 5 messages are stored per session
   - Conversation history is injected into prompts for context-aware responses

## API Reference

### POST /query

Query the knowledge base with a question.

**Request Body:**
```json
{
  "q": "What is Kubernetes?",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "answer": "Kubernetes is..."
}
```

**Parameters:**
- `q` (required): The question to ask
- `session_id` (optional): Session ID for conversation memory

## Troubleshooting

### Ollama Connection Error

If you see errors related to Ollama:
- Ensure Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`
- Check if the model name matches in `app.py` (default: "mistral:latest")

### ChromaDB Issues

If embeddings aren't working:
- Delete the `./db` directory and run `embed.py` again
- Ensure ChromaDB is properly installed: `pip install chromadb`

### Port Already in Use

If port 8000 is already in use:
```bash
uvicorn app:app --reload --port 8001
```

### Module Not Found Errors

If you get import errors:
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

## Development

### Making Changes

- The server auto-reloads when you modify `app.py` (with `--reload` flag)
- For frontend changes, refresh your browser
- Check the terminal for any error messages

### Testing the API

Visit http://localhost:8000/docs to use the Swagger UI for testing the API endpoints.

### Adding New Knowledge Base Content

1. Update or replace `k8s.txt` with your content
2. Delete the `./db` directory
3. Run `python embed.py` again to re-index

## Technologies Used

- **FastAPI**: Web framework for building APIs
- **ChromaDB**: Open-source embedding database
- **Ollama**: Local LLM runtime
- **Mistral**: Large language model for text generation
- **HTML/CSS/JavaScript**: Frontend interface



