import os
from dotenv import load_dotenv

load_dotenv()

ORIGINS = ["http://localhost:3000"]

# LLM API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:1234")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# BioMistral (local: Ollama / LM Studio). Default: Ollama at localhost:11434
BIOMISTRAL_BASE_URL = os.getenv("BIOMISTRAL_BASE_URL", "http://localhost:11434/v1")
BIOMISTRAL_MODEL = os.getenv("BIOMISTRAL_MODEL", "biomistral")

# BioMistral via Hugging Face Inference API (optional – set HF_TOKEN to use)
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")
BIOMISTRAL_HF_MODEL = os.getenv("BIOMISTRAL_HF_MODEL", "BioMistral/BioMistral-7B")

# LLM Models
OPENAI_MODEL = "gpt-4o-mini"
GEMINI_MODEL = "gemini-1.5-flash"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")  # Default OpenRouter model

# Cohere API Key for Embeddings
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

# Supabase Configuration for database
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_ADMIN = os.getenv("SUPABASE_ADMIN")
