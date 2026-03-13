from typing import Literal
from llm import open_ai, gemini, local, groq, biomistral, openrouter

def choose_llm(llm_choice: Literal["openai", "gemini", "local", "groq", "biomistral", "openrouter"]):
    if llm_choice == "openai":
        return open_ai.nl_to_sql_openai
    elif llm_choice == "gemini":
        return gemini.nl_to_sql_gemini
    elif llm_choice == "local":
        return local.nl_to_sql_local
    elif llm_choice == "groq":
        return groq.nl_to_sql_groq
    elif llm_choice == "biomistral":
        return biomistral.nl_to_sql_biomistral
    elif llm_choice == "openrouter":
        return openrouter.nl_to_sql_openrouter
    else:
        raise ValueError("Invalid LLM choice")