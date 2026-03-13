import requests
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _openrouter_completion(messages: list, temperature: float = 0.7, stream: bool = False, model: str = None):
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not set")
    
    model_to_use = model or OPENROUTER_MODEL
    
    resp = requests.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/health-monitor",  # Optional: for tracking
            "X-Title": "Health Monitor",  # Optional: for tracking
        },
        json={
            "model": model_to_use,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        },
        stream=stream,
        timeout=60,
    )
    resp.raise_for_status()
    return resp


def nl_to_sql_openrouter(question: str, table_info: str) -> str:
    prompt = f"""
    The sql code should not have ``` in beginning or end and sql word in output
    Given the following tables in a PostgreSQL database:

    {table_info}

    Convert the following natural language question to a SQL query:

    {question}

    Return only the SQL query, without any additional explanation.
    """
    resp = _openrouter_completion(
        [
            {"role": "system", "content": "You are a SQL expert. Convert natural language questions to SQL queries."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def format_response_openrouter(prompt: str) -> str:
    resp = _openrouter_completion(
        [
            {"role": "system", "content": "You are a data analyst providing insights on query results. Use markdown formatting in your responses."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def format_rag_response_openrouter(prompt: str) -> str:
    resp = _openrouter_completion(
        [
            {"role": "system", "content": "You are an AI assistant providing information based on given context. Use markdown formatting in your responses."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def chat_completion_openrouter(messages: list, temperature: float = 0, model: str = None) -> str:
    """Call OpenRouter API with a list of message dicts (role, content). Returns assistant content."""
    resp = _openrouter_completion(messages, temperature=temperature, model=model)
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()
