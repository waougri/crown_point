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

@app.get("/health")
def health():
    return {"status": "ok"}
app.add_middleware(CORSMiddleware, allow_origins="*", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(gatekeeper_router)