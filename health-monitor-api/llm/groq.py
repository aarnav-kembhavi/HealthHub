import requests
from config import GROQ_API_KEY, GROQ_MODEL

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _groq_completion(messages: list, temperature: float = 0.7, stream: bool = False):
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set")
    resp = requests.post(
        GROQ_URL,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": GROQ_MODEL,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        },
        stream=stream,
        timeout=60,
    )
    resp.raise_for_status()
    return resp


def nl_to_sql_groq(question: str, table_info: str) -> str:
    prompt = f"""
    The sql code should not have ``` in beginning or end and sql word in output
    Given the following tables in a PostgreSQL database:

    {table_info}

    Convert the following natural language question to a SQL query:

    {question}

    Return only the SQL query, without any additional explanation.
    """
    resp = _groq_completion(
        [
            {"role": "system", "content": "You are a SQL expert. Convert natural language questions to SQL queries."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def format_response_groq(prompt: str) -> str:
    resp = _groq_completion(
        [
            {"role": "system", "content": "You are a data analyst providing insights on query results. Use markdown formatting in your responses."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def format_rag_response_groq(prompt: str) -> str:
    resp = _groq_completion(
        [
            {"role": "system", "content": "You are an AI assistant providing information based on given context. Use markdown formatting in your responses."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def chat_completion_groq(messages: list, temperature: float = 0) -> str:
    """Call Groq API with a list of message dicts (role, content). Returns assistant content."""
    resp = _groq_completion(messages, temperature=temperature)
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()
