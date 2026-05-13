import os
from dotenv import load_dotenv

load_dotenv()

vars_to_check = [
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "SUPABASE_ADMIN",
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "COHERE_API_KEY",
    "TAVILY_API_KEY"
]

for var in vars_to_check:
    val = os.getenv(var)
    print(f"{var}: {'Set' if val else 'NOT SET'}")
