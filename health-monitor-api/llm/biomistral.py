"""BioMistral: local (Ollama/LM Studio) or Hugging Face Inference API."""
import requests
from config import (
    BIOMISTRAL_BASE_URL,
    BIOMISTRAL_MODEL,
    HUGGINGFACE_TOKEN,
    BIOMISTRAL_HF_MODEL,
)

# Ollama/LM Studio use OpenAI-compatible chat completions endpoint
BIOMISTRAL_URL = f"{BIOMISTRAL_BASE_URL.rstrip('/')}/chat/completions"
HF_INFERENCE_URL = "https://api-inference.huggingface.co/models"


def _messages_to_prompt(messages: list) -> str:
    """Convert chat messages to a single prompt for HF text-generation API."""
    parts = []
    for m in messages:
        role = (m.get("role") or "user").lower()
        content = (m.get("content") or "").strip()
        if role == "system":
            parts.append(f"System: {content}")
        elif role == "user":
            parts.append(f"User: {content}")
        elif role == "assistant":
            parts.append(f"Assistant: {content}")
    parts.append("Assistant:")
    return "\n\n".join(parts)


def _biomistral_completion_hf(messages: list, temperature: float = 0.7) -> dict:
    """Call Hugging Face Inference API (serverless). Returns parsed JSON."""
    if not HUGGINGFACE_TOKEN:
        raise ValueError("HUGGINGFACE_TOKEN or HF_TOKEN is not set")
    prompt = _messages_to_prompt(messages)
    url = f"{HF_INFERENCE_URL}/{BIOMISTRAL_HF_MODEL}"
    resp = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
            "Content-Type": "application/json",
        },
        json={
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 1024,
                "temperature": min(max(temperature, 0.01), 1.0),
                "return_full_text": False,
            },
        },
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    # HF returns list of {"generated_text": "..."} or single object or raw string
    if isinstance(data, list) and len(data) > 0:
        text = data[0].get("generated_text", "") if isinstance(data[0], dict) else str(data[0])
        return text.strip() if text else ""
    if isinstance(data, dict):
        return (data.get("generated_text") or "").strip()
    if isinstance(data, str):
        return data.strip()
    return ""


def _biomistral_completion(messages: list, temperature: float = 0.7, stream: bool = False):
    """Use Hugging Face if token set, else local Ollama/LM Studio."""
    if HUGGINGFACE_TOKEN:
        text = _biomistral_completion_hf(messages, temperature=temperature)
        # Return a minimal response-like object so existing code can .json() or use content
        class HFResponse:
            def json(self):
                return {"choices": [{"message": {"content": text}}]}
        return HFResponse()

    resp = requests.post(
        BIOMISTRAL_URL,
        headers={"Content-Type": "application/json"},
        json={
            "model": BIOMISTRAL_MODEL,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        },
        stream=stream,
        timeout=120,
    )
    resp.raise_for_status()
    return resp


def nl_to_sql_biomistral(question: str, table_info: str) -> str:
    prompt = f"""
    The sql code should not have ``` in beginning or end and sql word in output
    Given the following tables in a PostgreSQL database:

    {table_info}

    Convert the following natural language question to a SQL query:

    {question}

    Return only the SQL query, without any additional explanation.
    """
    resp = _biomistral_completion(
        [
            {"role": "system", "content": "You are a SQL expert. Convert natural language questions to SQL queries."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def format_response_biomistral(prompt: str) -> str:
    resp = _biomistral_completion(
        [
            {"role": "system", "content": "You are a data analyst providing insights on query results. Use markdown formatting in your responses."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def format_rag_response_biomistral(prompt: str) -> str:
    resp = _biomistral_completion(
        [
            {"role": "system", "content": "You are an AI assistant providing information based on given context. Use markdown formatting in your responses."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def chat_completion_biomistral(messages: list, temperature: float = 0) -> str:
    """Call BioMistral (local) API with a list of message dicts (role, content). Returns assistant content."""
    resp = _biomistral_completion(messages, temperature=temperature)
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()
