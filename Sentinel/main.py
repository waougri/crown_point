from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.gatekeeper.gatekeeper import gatekeeper_router
load_dotenv()
app = FastAPI()

ORIGINS = [
"http://localhost:5500",  # your frontend origin
    "http://127.0.0.1:5500",
]

@app.get("/health", status_code=200)
def health():
    return {"status": "ok"}
app.include_router(gatekeeper_router)